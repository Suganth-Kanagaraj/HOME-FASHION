import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Users, Edit2, Trash2, Phone, Mail, MapPin, MoreHorizontal, Star, History, UserPlus, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CustomerHistory from "../components/customers/CustomerHistory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); setShowDialog(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Customer.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); setShowDialog(false); setEditingCustomer(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Customer.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); },
  });

  const emptyForm = { name: "", phone: "", email: "", address: "", city: "", pincode: "", gstin: "", notes: "" };
  const [formData, setFormData] = useState(emptyForm);
  const f = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const filteredCustomers = customers
    .filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "spend") return (b.total_purchases || 0) - (a.total_purchases || 0);
      if (sortBy === "points") return (b.loyalty_points || 0) - (a.loyalty_points || 0);
      return new Date(b.created_date) - new Date(a.created_date);
    });

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({ name: customer.name || "", phone: customer.phone || "", email: customer.email || "", address: customer.address || "", city: customer.city || "", pincode: customer.pincode || "", gstin: customer.gstin || "", notes: customer.notes || "" });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCustomer) updateMutation.mutate({ id: editingCustomer.id, data: formData });
    else createMutation.mutate(formData);
  };

  const resetForm = () => { setFormData(emptyForm); setEditingCustomer(null); };

  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_purchases || 0), 0);
  const topCustomers = customers.filter(c => (c.total_purchases || 0) > 0).sort((a, b) => (b.total_purchases || 0) - (a.total_purchases || 0)).slice(0, 3);
  const vipThreshold = topCustomers[2]?.total_purchases || 5000;

  const getCustomerTier = (customer) => {
    const spend = customer.total_purchases || 0;
    if (spend >= vipThreshold * 2) return { label: "VIP", class: "bg-amber-100 text-amber-700 border-amber-200" };
    if (spend >= vipThreshold) return { label: "Gold", class: "bg-yellow-100 text-yellow-700 border-yellow-200" };
    if (spend > 0) return { label: "Regular", class: "bg-blue-100 text-blue-700 border-blue-200" };
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">{customers.length} customers · ₹{totalRevenue.toLocaleString()} total revenue</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] shadow-lg">
              <UserPlus className="w-4 h-4 mr-2" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={formData.name} onChange={e => f('name', e.target.value)} required placeholder="Customer name" />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={formData.phone} onChange={e => f('phone', e.target.value)} required placeholder="10-digit mobile" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={e => f('email', e.target.value)} placeholder="email@example.com" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Textarea value={formData.address} onChange={e => f('address', e.target.value)} rows={2} placeholder="Street address" />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={formData.city} onChange={e => f('city', e.target.value)} placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input value={formData.pincode} onChange={e => f('pincode', e.target.value)} placeholder="6-digit pincode" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>GSTIN <span className="text-slate-400 text-xs font-normal">(for B2B)</span></Label>
                  <Input value={formData.gstin} onChange={e => f('gstin', e.target.value)} placeholder="22AAAAA0000A1Z5" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={formData.notes} onChange={e => f('notes', e.target.value)} rows={2} placeholder="Any special notes..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f]" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCustomer ? "Update Customer" : "Add Customer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Customers", value: customers.length, icon: Users, color: "text-[#1e3a5f] bg-[#1e3a5f]/10" },
          { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-100" },
          { label: "Loyalty Points", value: customers.reduce((s, c) => s + (c.loyalty_points || 0), 0).toLocaleString(), icon: Star, color: "text-amber-600 bg-amber-100" },
          { label: "VIP Customers", value: customers.filter(c => (c.total_purchases || 0) >= vipThreshold * 2).length, icon: Award, color: "text-violet-600 bg-violet-100" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className={`p-2 rounded-lg ${s.color.split(' ')[1]}`}>
              <s.icon className={`w-4 h-4 ${s.color.split(' ')[0]}`} />
            </div>
            <div>
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="font-bold text-slate-900 text-sm">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by name, phone, email or city..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white shadow-sm" />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-44 bg-white shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="spend">Top Spenders</SelectItem>
            <SelectItem value="points">Most Points</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-2xl shadow-sm animate-pulse" />
          ))
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-400">
            <Users className="w-14 h-14 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-slate-500">No customers found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          filteredCustomers.map(customer => {
            const tier = getCustomerTier(customer);
            return (
              <Card key={customer.id} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {customer.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">{customer.name}</h3>
                          {tier && <Badge className={`text-xs py-0 border ${tier.class}`}>{tier.label}</Badge>}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setHistoryCustomer(customer)}>
                          <History className="w-4 h-4 mr-2" /> Purchase History
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(customer)}>
                          <Edit2 className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteMutation.mutate(customer.id)} className="text-rose-600">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {(customer.email || customer.city) && (
                    <div className="space-y-1.5 mb-4">
                      {customer.email && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                          <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          {customer.email}
                        </div>
                      )}
                      {customer.city && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          {customer.city}{customer.pincode ? ` – ${customer.pincode}` : ''}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-amber-500" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{(customer.loyalty_points || 0).toLocaleString()} pts</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Total Spent</p>
                      <p className="font-bold text-[#1e3a5f]">₹{(customer.total_purchases || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <CustomerHistory customer={historyCustomer} open={!!historyCustomer} onClose={() => setHistoryCustomer(null)} />
    </div>
  );
}