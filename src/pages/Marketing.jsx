import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, TrendingUp, Users, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomerSegmentCard from "../components/crm/CustomerSegmentCard";
import CampaignCard from "../components/crm/CampaignCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Marketing() {
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    campaign_type: "discount",
    target_segment: "",
    channel: "whatsapp",
    message: "",
    discount_percent: 0,
    start_date: "",
    end_date: "",
  });
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.MarketingCampaign.list('-created_date'),
    initialData: [],
  });

  const { data: segments = [] } = useQuery({
    queryKey: ['segments'],
    queryFn: () => base44.entities.CustomerSegment.list(),
    initialData: [],
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data) => base44.entities.MarketingCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowCampaignDialog(false);
      resetForm();
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id) => base44.entities.MarketingCampaign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  // Calculate customer segments
  const vipCustomers = customers.filter(c => c.total_purchases >= 50000 && c.loyalty_points >= 200);
  const regularCustomers = customers.filter(c => c.total_purchases >= 5000 && c.total_purchases < 50000);
  const newCustomers = customers.filter(c => (c.total_purchases || 0) < 5000);
  
  // Calculate CLV
  const calculateCLV = () => {
    return customers.map(customer => {
      const customerSales = sales.filter(s => s.customer_phone === customer.phone || s.customer_name === customer.name);
      const avgOrderValue = customerSales.length > 0 
        ? customerSales.reduce((sum, s) => sum + (s.grand_total || 0), 0) / customerSales.length 
        : 0;
      const purchaseFrequency = customerSales.length;
      const clv = avgOrderValue * purchaseFrequency * 2; // Simplified CLV
      return { ...customer, clv, purchaseCount: purchaseFrequency, avgOrderValue };
    }).sort((a, b) => b.clv - a.clv);
  };

  const topCustomers = calculateCLV().slice(0, 10);
  const totalCLV = topCustomers.reduce((sum, c) => sum + c.clv, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetCustomers = formData.target_segment === "vip" ? vipCustomers.length :
                           formData.target_segment === "regular" ? regularCustomers.length :
                           formData.target_segment === "new" ? newCustomers.length : customers.length;
    
    createCampaignMutation.mutate({
      ...formData,
      target_count: targetCustomers,
      status: "draft",
    });
  };

  const resetForm = () => {
    setFormData({
      name: "", description: "", campaign_type: "discount",
      target_segment: "", channel: "whatsapp", message: "",
      discount_percent: 0, start_date: "", end_date: "",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing & CRM</h1>
          <p className="text-slate-500 mt-1">Customer segmentation and targeted campaigns</p>
        </div>
        <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f]">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Marketing Campaign</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Campaign Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Campaign Type</Label>
                  <Select value={formData.campaign_type} onValueChange={(v) => setFormData({...formData, campaign_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Discount Offer</SelectItem>
                      <SelectItem value="loyalty_bonus">Loyalty Bonus</SelectItem>
                      <SelectItem value="new_arrival">New Arrival</SelectItem>
                      <SelectItem value="clearance">Clearance Sale</SelectItem>
                      <SelectItem value="festival">Festival Offer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Segment</Label>
                  <Select value={formData.target_segment} onValueChange={(v) => setFormData({...formData, target_segment: v})}>
                    <SelectTrigger><SelectValue placeholder="Select segment" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers ({customers.length})</SelectItem>
                      <SelectItem value="vip">VIP ({vipCustomers.length})</SelectItem>
                      <SelectItem value="regular">Regular ({regularCustomers.length})</SelectItem>
                      <SelectItem value="new">New ({newCustomers.length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select value={formData.channel} onValueChange={(v) => setFormData({...formData, channel: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="all">All Channels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <Input type="number" value={formData.discount_percent} onChange={(e) => setFormData({...formData, discount_percent: parseFloat(e.target.value) || 0})} min="0" max="100" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Message Template</Label>
                  <Textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} rows={3} placeholder="Hi {name}, Special offer just for you..." />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCampaignDialog(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#1e3a5f]" disabled={createCampaignMutation.isPending}>
                  Create Campaign
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Customers</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{customers.length}</p>
              </div>
              <Users className="w-8 h-8 text-[#1e3a5f]" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">VIP Customers</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{vipCustomers.length}</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Campaigns</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{campaigns.filter(c => c.status === "active").length}</p>
              </div>
              <Zap className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg CLV</p>
                <p className="text-2xl font-bold text-[#d4a574] mt-1">₹{Math.round(totalCLV / (topCustomers.length || 1)).toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#d4a574]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="segments" className="space-y-6">
        <TabsList className="bg-white shadow-sm border">
          <TabsTrigger value="segments">Customer Segments</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="clv">Customer Lifetime Value</TabsTrigger>
        </TabsList>

        <TabsContent value="segments">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CustomerSegmentCard
              segment={{ name: "VIP Customers", description: "High-value customers with ₹50k+ purchases" }}
              customerCount={vipCustomers.length}
              totalValue={vipCustomers.reduce((sum, c) => sum + (c.total_purchases || 0), 0)}
            />
            <CustomerSegmentCard
              segment={{ name: "Regular Customers", description: "Active customers with ₹5k-50k purchases" }}
              customerCount={regularCustomers.length}
              totalValue={regularCustomers.reduce((sum, c) => sum + (c.total_purchases || 0), 0)}
            />
            <CustomerSegmentCard
              segment={{ name: "New Customers", description: "Recent customers with <₹5k purchases" }}
              customerCount={newCustomers.length}
              totalValue={newCustomers.reduce((sum, c) => sum + (c.total_purchases || 0), 0)}
            />
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          {campaigns.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 mb-4">No campaigns yet</p>
                <Button onClick={() => setShowCampaignDialog(true)}>Create Your First Campaign</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaigns.map(campaign => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onEdit={() => {}}
                  onDelete={deleteCampaignMutation.mutate}
                  onActivate={() => {}}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clv">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Top Customers by Lifetime Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{customer.name}</p>
                        <p className="text-sm text-slate-500">{customer.purchaseCount} purchases • Avg: ₹{customer.avgOrderValue.toFixed(0)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#1e3a5f]">₹{customer.clv.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Lifetime Value</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}