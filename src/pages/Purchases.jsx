import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Store, FileText, Eye, Calendar, Edit, Trash2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function Purchases() {
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: "",
    supplier_invoice_number: "",
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    items: [],
    payment_status: "pending",
  });
  const [newItem, setNewItem] = useState({ product_id: "", quantity: 1, unit_price: 0 });
  const queryClient = useQueryClient();

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => base44.entities.Purchase.list('-created_date'),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (editingPurchase) {
        return await base44.entities.Purchase.update(editingPurchase.id, data);
      } else {
        const purchase = await base44.entities.Purchase.create(data);
        // Update product stock
        for (const item of data.items) {
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            await base44.entities.Product.update(item.product_id, {
              stock_quantity: (product.stock_quantity || 0) + item.quantity,
            });
          }
        }
        return purchase;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowDialog(false);
      setEditingPurchase(null);
      resetForm();

    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Purchase.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });

  const filteredPurchases = purchases.filter(p =>
    p.purchase_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier_invoice_number?.toLowerCase().includes(search.toLowerCase())
  );

  const addItem = () => {
    if (!newItem.product_id) return;
    const product = products.find(p => p.id === newItem.product_id);
    if (!product) return;

    const gstAmount = (newItem.quantity * newItem.unit_price * (product.gst_rate || 5)) / 100;
    const total = newItem.quantity * newItem.unit_price + gstAmount;

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: newItem.product_id,
        product_name: product.name,
        sku: product.sku,
        quantity: newItem.quantity,
        unit_price: newItem.unit_price,
        gst_rate: product.gst_rate || 5,
        gst_amount: gstAmount,
        total,
      }]
    }));
    setNewItem({ product_id: "", quantity: 1, unit_price: 0 });
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalGst = formData.items.reduce((sum, item) => sum + item.gst_amount, 0);
    const grandTotal = subtotal + totalGst;
    return { subtotal, totalGst, grandTotal };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      return;
    }

    const supplier = suppliers.find(s => s.id === formData.supplier_id);
    const { subtotal, totalGst, grandTotal } = calculateTotals();
    const purchaseNumber = editingPurchase?.purchase_number || `PO-${format(new Date(), 'yyyyMMdd')}-${String(purchases.length + 1).padStart(4, '0')}`;

    createMutation.mutate({
      purchase_number: purchaseNumber,
      supplier_id: formData.supplier_id,
      supplier_name: supplier?.name || "",
      supplier_invoice_number: formData.supplier_invoice_number,
      items: formData.items,
      subtotal,
      cgst_amount: totalGst / 2,
      sgst_amount: totalGst / 2,
      igst_amount: 0,
      total_gst: totalGst,
      grand_total: grandTotal,
      payment_status: formData.payment_status,
      amount_paid: formData.payment_status === "paid" ? grandTotal : 0,
      balance_due: formData.payment_status === "paid" ? 0 : grandTotal,
      purchase_date: formData.purchase_date,
      status: "received",
    });
  };

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      supplier_id: purchase.supplier_id,
      supplier_invoice_number: purchase.supplier_invoice_number || "",
      purchase_date: purchase.purchase_date || format(new Date(), 'yyyy-MM-dd'),
      items: purchase.items || [],
      payment_status: purchase.payment_status || "pending",
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingPurchase(null);
    setFormData({
      supplier_id: "",
      supplier_invoice_number: "",
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      items: [],
      payment_status: "pending",
    });
    setNewItem({ product_id: "", quantity: 1, unit_price: 0 });
  };

  const { subtotal, totalGst, grandTotal } = calculateTotals();

  const statusColors = {
    paid: "bg-emerald-100 text-emerald-700",
    partial: "bg-amber-100 text-amber-700",
    pending: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchases</h1>
          <p className="text-slate-500 mt-1">Manage purchase orders and stock inward</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f]">
              <Plus className="w-4 h-4 mr-2" />
              New Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPurchase ? "Edit Purchase" : "Record New Purchase"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              {/* Supplier Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Supplier *</Label>
                  <Select value={formData.supplier_id} onValueChange={(v) => setFormData({...formData, supplier_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Supplier Invoice No.</Label>
                  <Input value={formData.supplier_invoice_number} onChange={(e) => setFormData({...formData, supplier_invoice_number: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Purchase Date</Label>
                  <Input type="date" value={formData.purchase_date} onChange={(e) => setFormData({...formData, purchase_date: e.target.value})} />
                </div>
              </div>

              {/* Add Items */}
              <div className="space-y-4">
                <Label>Add Products</Label>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Select value={newItem.product_id} onValueChange={(v) => {
                      const product = products.find(p => p.id === v);
                      setNewItem({...newItem, product_id: v, unit_price: product?.purchase_price || product?.selling_price || 0});
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input type="number" placeholder="Qty" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})} min="1" />
                  </div>
                  <div className="w-32">
                    <Input type="number" placeholder="Price" value={newItem.unit_price} onChange={(e) => setNewItem({...newItem, unit_price: parseFloat(e.target.value) || 0})} />
                  </div>
                  <Button type="button" onClick={addItem}>Add</Button>
                </div>

                {/* Items Table */}
                {formData.items.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">GST</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.unit_price.toLocaleString()}</TableCell>
                          <TableCell className="text-right">₹{item.gst_amount.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">₹{item.total.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-rose-600">Remove</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Totals */}
              {formData.items.length > 0 && (
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select value={formData.payment_status} onValueChange={(v) => setFormData({...formData, payment_status: v})}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-slate-600">Subtotal: ₹{subtotal.toLocaleString()}</p>
                    <p className="text-slate-600">GST: ₹{totalGst.toLocaleString()}</p>
                    <p className="text-xl font-bold text-slate-900">Total: ₹{grandTotal.toLocaleString()}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" className="bg-[#1e3a5f]" disabled={createMutation.isPending}>
                  Record Purchase
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search purchases..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {/* Purchases Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No purchases found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases.map(purchase => (
                  <TableRow key={purchase.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{purchase.purchase_number}</TableCell>
                    <TableCell>{purchase.supplier_name}</TableCell>
                    <TableCell>{purchase.purchase_date ? format(new Date(purchase.purchase_date), 'dd MMM yyyy') : '-'}</TableCell>
                    <TableCell className="text-right font-medium">₹{purchase.grand_total?.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={statusColors[purchase.payment_status]}>
                        {purchase.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedPurchase(purchase)}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(purchase)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteMutation.mutate(purchase.id)} className="text-rose-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Purchase Dialog */}
      <Dialog open={!!selectedPurchase} onOpenChange={() => setSelectedPurchase(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase Details - {selectedPurchase?.purchase_number}</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Supplier:</span> <span className="font-medium">{selectedPurchase.supplier_name}</span></div>
                <div><span className="text-slate-500">Invoice No:</span> <span className="font-medium">{selectedPurchase.supplier_invoice_number || '-'}</span></div>
                <div><span className="text-slate-500">Date:</span> <span className="font-medium">{selectedPurchase.purchase_date ? format(new Date(selectedPurchase.purchase_date), 'dd MMM yyyy') : '-'}</span></div>
                <div><span className="text-slate-500">Status:</span> <Badge className={statusColors[selectedPurchase.payment_status]}>{selectedPurchase.payment_status}</Badge></div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPurchase.items?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">₹{item.unit_price?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{item.total?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right space-y-1 pt-4 border-t">
                <p>Subtotal: ₹{selectedPurchase.subtotal?.toLocaleString()}</p>
                <p>GST: ₹{selectedPurchase.total_gst?.toLocaleString()}</p>
                <p className="text-xl font-bold">Total: ₹{selectedPurchase.grand_total?.toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}