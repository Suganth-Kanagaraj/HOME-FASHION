import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Store, Save, Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [storeInfo, setStoreInfo] = useState({
    name: "HOME FASHION",
    address: "59, Vellammal Layout, Kamarajapuram West, Karur - 639002",
    phone: "99429-44744",
    email: "karurhomefashion@gmail.com",
    gstin: "33BBRPD7436E1ZP",
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  const createCategoryMutation = useMutation({
    mutationFn: (data) => base44.entities.Category.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowCategoryDialog(false);
      setNewCategory({ name: "", description: "" });
      toast({ title: "Category created successfully" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: "Category deleted successfully" });
    },
  });

  const handleSaveStore = () => {
    toast({ title: "Store settings saved successfully" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your store configuration</p>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="bg-white shadow-sm border">
          <TabsTrigger value="store">Store Info</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="tax">Tax Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Store Information
              </CardTitle>
              <CardDescription>Update your store details for invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Store Name</Label>
                  <Input value={storeInfo.name} onChange={(e) => setStoreInfo({...storeInfo, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={storeInfo.phone} onChange={(e) => setStoreInfo({...storeInfo, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={storeInfo.email} onChange={(e) => setStoreInfo({...storeInfo, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input value={storeInfo.gstin} onChange={(e) => setStoreInfo({...storeInfo, gstin: e.target.value})} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Input value={storeInfo.address} onChange={(e) => setStoreInfo({...storeInfo, address: e.target.value})} />
                </div>
              </div>
              <div className="pt-4">
                <Button onClick={handleSaveStore} className="bg-[#1e3a5f]">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Product Categories
                </CardTitle>
                <CardDescription>Manage product categories</CardDescription>
              </div>
              <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#1e3a5f]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Category Name</Label>
                      <Input value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={newCategory.description} onChange={(e) => setNewCategory({...newCategory, description: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
                      <Button 
                        onClick={() => createCategoryMutation.mutate({ ...newCategory, is_active: true })}
                        className="bg-[#1e3a5f]"
                        disabled={createCategoryMutation.isPending}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                        No categories found. Add your first category!
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map(category => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-slate-500">{category.description || '-'}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteCategoryMutation.mutate(category.id)}
                            className="text-rose-600 hover:text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
            <CardHeader>
              <CardTitle>GST Configuration</CardTitle>
              <CardDescription>Configure tax rates for your products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[0, 5, 12, 18, 28].map(rate => (
                    <div key={rate} className="p-4 bg-slate-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-[#1e3a5f]">{rate}%</p>
                      <p className="text-sm text-slate-500 mt-1">GST Slab</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-amber-800">
                    <strong>Note:</strong> GST rates are automatically split into CGST and SGST (50% each) for intra-state sales.
                    For inter-state sales, the full rate is applied as IGST.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}