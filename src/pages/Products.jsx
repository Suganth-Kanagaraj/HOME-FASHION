import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Package, Edit2, Trash2, Filter, MoreHorizontal, Tag, TrendingUp, AlertTriangle, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUploader from "../components/products/ImageUploader";

export default function Products() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setShowDialog(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setShowDialog(false); setEditingProduct(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); },
  });

  const emptyForm = {
    name: "", sku: "", category_id: "", description: "",
    purchase_price: "", selling_price: "", gst_rate: "5",
    hsn_code: "", stock_quantity: "0", low_stock_threshold: "10",
    color: "", size: "", brand: "", image_url: "",
  };
  const [formData, setFormData] = useState(emptyForm);
  const f = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category_id === categoryFilter;
    const matchStock = stockFilter === "all"
      || (stockFilter === "low" && p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 10))
      || (stockFilter === "out" && p.stock_quantity === 0)
      || (stockFilter === "ok" && p.stock_quantity > (p.low_stock_threshold || 10));
    return matchSearch && matchCat && matchStock;
  });

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "", sku: product.sku || "", category_id: product.category_id || "",
      description: product.description || "", purchase_price: product.purchase_price?.toString() || "",
      selling_price: product.selling_price?.toString() || "", gst_rate: product.gst_rate?.toString() || "5",
      hsn_code: product.hsn_code || "", stock_quantity: product.stock_quantity?.toString() || "0",
      low_stock_threshold: product.low_stock_threshold?.toString() || "10",
      color: product.color || "", size: product.size || "", brand: product.brand || "", image_url: product.image_url || "",
    });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, purchase_price: parseFloat(formData.purchase_price) || 0, selling_price: parseFloat(formData.selling_price) || 0, gst_rate: parseFloat(formData.gst_rate) || 5, stock_quantity: parseInt(formData.stock_quantity) || 0, low_stock_threshold: parseInt(formData.low_stock_threshold) || 10 };
    if (editingProduct) updateMutation.mutate({ id: editingProduct.id, data });
    else createMutation.mutate(data);
  };

  const resetForm = () => { setFormData(emptyForm); setEditingProduct(null); };
  const getCategoryName = (id) => categories.find(c => c.id === id)?.name || "—";

  const totalValue = products.reduce((sum, p) => sum + (p.selling_price || 0) * (p.stock_quantity || 0), 0);
  const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 10)).length;
  const outOfStock = products.filter(p => p.stock_quantity === 0).length;

  const getStockBadge = (product) => {
    if (product.stock_quantity === 0) return <Badge className="bg-rose-100 text-rose-700 border-0">Out of Stock</Badge>;
    if (product.stock_quantity <= (product.low_stock_threshold || 10)) return <Badge className="bg-amber-100 text-amber-700 border-0">{product.stock_quantity} — Low</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700 border-0">{product.stock_quantity}</Badge>;
  };

  const margin = (p) => p.purchase_price > 0 ? (((p.selling_price - p.purchase_price) / p.selling_price) * 100).toFixed(0) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 mt-1">{products.length} products · ₹{totalValue.toLocaleString()} inventory value</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] shadow-lg">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 py-2">
              <Tabs defaultValue="basic">
                <TabsList className="w-full">
                  <TabsTrigger value="basic" className="flex-1">Basic Info</TabsTrigger>
                  <TabsTrigger value="pricing" className="flex-1">Pricing & Tax</TabsTrigger>
                  <TabsTrigger value="stock" className="flex-1">Stock</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Product Name *</Label>
                      <Input value={formData.name} onChange={e => f('name', e.target.value)} required placeholder="e.g. Banarasi Silk Saree" />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU / Barcode *</Label>
                      <Input value={formData.sku} onChange={e => f('sku', e.target.value)} required placeholder="e.g. SAR-001" />
                    </div>
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input value={formData.brand} onChange={e => f('brand', e.target.value)} placeholder="Brand name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={formData.category_id} onValueChange={v => f('category_id', v)}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input value={formData.color} onChange={e => f('color', e.target.value)} placeholder="e.g. Red, Blue" />
                    </div>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Input value={formData.size} onChange={e => f('size', e.target.value)} placeholder="e.g. S, M, L, Free" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Description</Label>
                      <Textarea value={formData.description} onChange={e => f('description', e.target.value)} rows={2} placeholder="Product description..." />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Product Image</Label>
                      <ImageUploader value={formData.image_url} onChange={v => f('image_url', v)} />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="pricing" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Purchase Price (₹)</Label>
                      <Input type="number" value={formData.purchase_price} onChange={e => f('purchase_price', e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Selling Price (₹) *</Label>
                      <Input type="number" value={formData.selling_price} onChange={e => f('selling_price', e.target.value)} required placeholder="0.00" />
                    </div>
                    {formData.purchase_price && formData.selling_price && (
                      <div className="col-span-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <p className="text-sm text-emerald-700">
                          Margin: <strong>₹{(parseFloat(formData.selling_price) - parseFloat(formData.purchase_price)).toFixed(2)}</strong>
                          {' '}({(((parseFloat(formData.selling_price) - parseFloat(formData.purchase_price)) / parseFloat(formData.selling_price)) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>GST Rate (%)</Label>
                      <Select value={formData.gst_rate} onValueChange={v => f('gst_rate', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["0","5","12","18","28"].map(r => <SelectItem key={r} value={r}>{r}% GST</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>HSN Code</Label>
                      <Input value={formData.hsn_code} onChange={e => f('hsn_code', e.target.value)} placeholder="e.g. 5007" />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="stock" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Current Stock</Label>
                      <Input type="number" value={formData.stock_quantity} onChange={e => f('stock_quantity', e.target.value)} min="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Low Stock Alert (units)</Label>
                      <Input type="number" value={formData.low_stock_threshold} onChange={e => f('low_stock_threshold', e.target.value)} min="0" />
                    </div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    You'll receive a low stock alert when inventory drops to {formData.low_stock_threshold || 10} units.
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f]" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingProduct ? "Update Product" : "Create Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Products", value: products.length, color: "bg-[#1e3a5f]/10 text-[#1e3a5f]", icon: Package },
          { label: "Inventory Value", value: `₹${totalValue.toLocaleString()}`, color: "bg-amber-100 text-amber-700", icon: TrendingUp },
          { label: "Low Stock", value: lowStock, color: "bg-amber-100 text-amber-700", icon: AlertTriangle },
          { label: "Out of Stock", value: outOfStock, color: "bg-rose-100 text-rose-700", icon: Box },
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className={`p-2 rounded-lg ${stat.color.split(' ')[0]}`}>
              <stat.icon className={`w-4 h-4 ${stat.color.split(' ')[1]}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search by name, SKU, brand..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Tag className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="ok">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-semibold text-slate-700">Product</TableHead>
              <TableHead className="font-semibold text-slate-700">Category</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Cost</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Price</TableHead>
              <TableHead className="text-center font-semibold text-slate-700">Margin</TableHead>
              <TableHead className="text-center font-semibold text-slate-700">Stock</TableHead>
              <TableHead className="text-center font-semibold text-slate-700">GST</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400">Loading products...</TableCell></TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16">
                  <Package className="w-14 h-14 mx-auto mb-3 text-slate-200" />
                  <p className="text-slate-500 font-medium">No products found</p>
                  <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map(product => (
                <TableRow key={product.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.sku}{product.brand ? ` · ${product.brand}` : ''}{product.color ? ` · ${product.color}` : ''}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{getCategoryName(product.category_id)}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-500 text-sm">
                    {product.purchase_price ? `₹${product.purchase_price.toLocaleString()}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900">₹{product.selling_price?.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    {margin(product) ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">{margin(product)}%</Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-center">{getStockBadge(product)}</TableCell>
                  <TableCell className="text-center text-slate-500 text-sm">{product.gst_rate || 5}%</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          <Edit2 className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteMutation.mutate(product.id)} className="text-rose-600">
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
        {filteredProducts.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-sm text-slate-500">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        )}
      </Card>
    </div>
  );
}