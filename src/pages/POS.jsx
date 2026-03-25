import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Receipt, Trash2, User, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import ProductSearch from "../components/pos/ProductSearch";
import CartItem from "../components/pos/CartItem";
import PaymentModal from "../components/pos/PaymentModal";
import InvoicePrint from "../components/invoice/InvoicePrint";
import AIRecommendations from "../components/pos/AIRecommendations";
import { format } from "date-fns";

export default function POS() {
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-count'],
    queryFn: () => base44.entities.Sale.list('-created_date', 1),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const filteredProducts = products.filter(p => {
    const inStock = p.is_active !== false && p.stock_quantity > 0;
    const inCat = categoryFilter === "all" || p.category_id === categoryFilter;
    return inStock && inCat;
  });

  const saleMutation = useMutation({
    mutationFn: (saleData) => base44.entities.Sale.create(saleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-count'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) {
      return;
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          return prevCart;
        }
        return prevCart.map(item =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unit_price,
                gst_amount: ((item.quantity + 1) * item.unit_price * item.gst_rate) / 100,
              }
            : item
        );
      }
      
      const gstAmount = (product.selling_price * (product.gst_rate || 5)) / 100;
      return [...prevCart, {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: 1,
        unit_price: product.selling_price,
        gst_rate: product.gst_rate || 5,
        gst_amount: gstAmount,
        discount: 0,
        total: product.selling_price,
      }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock_quantity) {
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.product_id === productId
          ? {
              ...item,
              quantity,
              total: quantity * item.unit_price,
              gst_amount: (quantity * item.unit_price * item.gst_rate) / 100,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const totalGst = cart.reduce((sum, item) => sum + item.gst_amount, 0);
  const discountAmount = (subtotal * discount) / 100;
  const grandTotal = subtotal + totalGst - discountAmount;

  const generateInvoiceNumber = () => {
    const date = format(new Date(), 'yyyyMMdd');
    const count = (sales.length || 0) + 1;
    return `HF-${date}-${String(count).padStart(4, '0')}`;
  };

  const completeSale = async (paymentData) => {
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;

    const saleData = {
      invoice_number: generateInvoiceNumber(),
      customer_id: paymentData.customer_id || null,
      customer_name: paymentData.customer_name || "Walk-in Customer",
      customer_phone: paymentData.customer_phone || "",
      items: cart,
      subtotal,
      discount_percent: discount,
      discount_amount: discountAmount,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: 0,
      total_gst: totalGst,
      grand_total: grandTotal,
      payment_method: paymentData.payment_method,
      payment_status: "paid",
      amount_paid: paymentData.amount_paid,
      balance_due: 0,
      sale_date: new Date().toISOString(),
      status: "completed",
    };

    const createdSale = await saleMutation.mutateAsync(saleData);

    // Update stock
    for (const item of cart) {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        await base44.entities.Product.update(item.product_id, {
          stock_quantity: (product.stock_quantity || 0) - item.quantity,
        });
      }
    }

    setLastSale(createdSale);
    setShowPayment(false);
    setShowInvoice(true);
    clearCart();
  };

  return (
    <div className="h-[calc(100vh-7rem)] animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 h-full">
        {/* Left - Product Search & Categories */}
        <div className="lg:col-span-3 flex flex-col space-y-3">
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] p-3 lg:p-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <h2 className="text-white font-bold text-base lg:text-lg">POS Billing</h2>
              <div className="flex items-center gap-1.5 text-white/60 text-xs">
                <User className="w-3 h-3" />
                {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
              </div>
            </div>
            <ProductSearch products={products} onAddProduct={addToCart} />
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${categoryFilter === "all" ? "bg-[#1e3a5f] text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${categoryFilter === cat.id ? "bg-[#1e3a5f] text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
          
          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-sm p-3 lg:p-4">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <ShoppingCart className="w-16 h-16 mb-3" />
                <p className="text-sm font-medium text-slate-400">No products available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 lg:gap-3">
                {filteredProducts.slice(0, 24).map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-3 bg-white rounded-xl border-2 border-slate-100 hover:border-[#d4a574] hover:shadow-lg transition-all text-left group active:scale-95 relative"
                  >
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-16 lg:h-20 object-cover rounded-lg mb-2" />
                    ) : (
                      <div className="w-full h-16 lg:h-20 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg mb-2 flex items-center justify-center">
                        <ShoppingCart className="w-6 lg:w-8 h-6 lg:h-8 text-slate-200" />
                      </div>
                    )}
                    {product.stock_quantity <= 5 && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400" title="Low stock" />
                    )}
                    <p className="font-semibold text-slate-800 text-xs lg:text-sm truncate group-hover:text-[#1e3a5f] leading-tight">{product.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="font-bold text-[#1e3a5f] text-sm">₹{product.selling_price?.toLocaleString()}</p>
                      <span className="text-xs text-slate-300">{product.stock_quantity}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right - Cart */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Cart Header */}
          <div className="p-3 lg:p-4 flex items-center justify-between bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f]">
            <div className="flex items-center gap-2 text-white">
              <ShoppingCart className="w-4 lg:w-5 h-4 lg:h-5" />
              <span className="font-bold text-sm lg:text-base">Current Sale</span>
              {cart.length > 0 && (
                <span className="bg-white/25 px-2 py-0.5 rounded-full text-xs">{cart.length}</span>
              )}
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-white/70 hover:text-white hover:bg-white/15 h-7 text-xs">
                <Trash2 className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 py-8">
                <ShoppingCart className="w-14 h-14 mb-3" />
                <p className="font-medium text-slate-400 text-sm">Cart is empty</p>
                <p className="text-xs text-slate-300 mt-1">Search or click a product to add</p>
              </div>
            ) : (
              cart.map(item => (
                <CartItem key={item.product_id} item={item} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} />
              ))
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t border-slate-100 p-3 lg:p-4 space-y-3 bg-slate-50">
              <AIRecommendations currentCart={cart} onAddProduct={addToCart} sales={sales} products={products} />

              {/* Discount */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <Input
                  type="number"
                  placeholder="Discount %"
                  value={discount || ""}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 h-8 text-sm bg-white"
                  min="0" max="100"
                />
                {discountAmount > 0 && (
                  <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-lg">-₹{discountAmount.toLocaleString()}</span>
                )}
              </div>

              {/* Totals */}
              <div className="bg-white rounded-xl p-3 space-y-2 border border-slate-100">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>GST</span><span>₹{totalGst.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-medium">
                    <span>Discount ({discount}%)</span><span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Grand Total</span>
                  <span className="text-[#1e3a5f] text-lg">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Pay Button */}
              <Button
                onClick={() => setShowPayment(true)}
                className="w-full h-12 lg:h-14 text-base font-bold bg-gradient-to-r from-[#d4a574] to-[#c49464] hover:opacity-90 text-white shadow-lg active:scale-[0.98]"
              >
                <Receipt className="w-5 h-5 mr-2" />
                Collect ₹{grandTotal.toLocaleString()}
              </Button>
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        total={grandTotal}
        onComplete={completeSale}
        isProcessing={saleMutation.isPending}
      />

      {showInvoice && lastSale && (
        <InvoicePrint
          sale={lastSale}
          onClose={() => {
            setShowInvoice(false);
            setLastSale(null);
          }}
        />
      )}
    </div>
  );
}