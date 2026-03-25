import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, MapPin, Plus, Scan, TrendingDown, TrendingUp, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import LocationSelector from "../components/inventory/LocationSelector";
import BarcodeScanner from "../components/inventory/BarcodeScanner";
import StockAdjustmentDialog from "../components/inventory/StockAdjustmentDialog";
import { format } from "date-fns";

export default function Inventory() {
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [showScanner, setShowScanner] = useState(false);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: adjustments = [] } = useQuery({
    queryKey: ['stock-adjustments'],
    queryFn: () => base44.entities.StockAdjustment.list('-created_date', 50),
    initialData: [],
  });

  const adjustmentMutation = useMutation({
    mutationFn: async (data) => {
      const adjustmentNumber = `ADJ-${format(new Date(), 'yyyyMMdd')}-${String(adjustments.length + 1).padStart(4, '0')}`;
      const product = products.find(p => p.id === selectedProduct.id);
      
      const adjustment = await base44.entities.StockAdjustment.create({
        ...data,
        adjustment_number: adjustmentNumber,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        sku: selectedProduct.sku,
        location_id: selectedLocation !== "all" ? selectedLocation : null,
        location_name: locations.find(l => l.id === selectedLocation)?.name || "Main Store",
        previous_quantity: product.stock_quantity || 0,
        new_quantity: (product.stock_quantity || 0) + data.quantity,
        adjustment_date: new Date().toISOString(),
      });

      // Update product stock
      await base44.entities.Product.update(selectedProduct.id, {
        stock_quantity: (product.stock_quantity || 0) + data.quantity,
      });

      return adjustment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      setShowAdjustment(false);
      setSelectedProduct(null);
    },
  });

  const handleBarcodeScan = (barcode) => {
    const product = products.find(p => p.sku === barcode || p.barcode === barcode);
    if (product) {
      setSelectedProduct(product);
      setShowScanner(false);
      setShowAdjustment(true);
    }
  };

  const lowStockProducts = products.filter(p => 
    p.is_active !== false && p.stock_quantity <= (p.low_stock_threshold || 10)
  );

  const totalValue = products.reduce((sum, p) => 
    sum + ((p.stock_quantity || 0) * (p.purchase_price || p.selling_price || 0)), 0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 mt-1">Multi-location stock tracking and adjustments</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowScanner(true)}>
            <Scan className="w-4 h-4 mr-2" />
            Scan Barcode
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Products</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-[#1e3a5f]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Low Stock</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">{lowStockProducts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Stock Value</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">₹{totalValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Locations</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{locations.length || 1}</p>
              </div>
              <MapPin className="w-8 h-8 text-[#d4a574]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white shadow-sm border">
          <TabsTrigger value="overview">Stock Overview</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments History</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Current Stock Levels</CardTitle>
              {locations.length > 0 && (
                <LocationSelector
                  locations={[{ id: "all", name: "All Locations", code: "ALL" }, ...locations]}
                  value={selectedLocation}
                  onChange={setSelectedLocation}
                />
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map(product => {
                      const isLowStock = product.stock_quantity <= (product.low_stock_threshold || 10);
                      return (
                        <TableRow key={product.id} className="hover:bg-slate-50">
                          <TableCell>
                            <p className="font-medium">{product.name}</p>
                            {product.brand && <p className="text-xs text-slate-500">{product.brand}</p>}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={isLowStock ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}>
                              {product.stock_quantity || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{((product.stock_quantity || 0) * (product.purchase_price || product.selling_price || 0)).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            {isLowStock ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-700">In Stock</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowAdjustment(true);
                              }}
                            >
                              Adjust
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Stock Adjustments History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Adj. #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                        No adjustments recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    adjustments.map(adj => (
                      <TableRow key={adj.id}>
                        <TableCell className="font-mono text-sm">{adj.adjustment_number}</TableCell>
                        <TableCell>
                          <p className="font-medium">{adj.product_name}</p>
                          <p className="text-xs text-slate-500">{adj.sku}</p>
                        </TableCell>
                        <TableCell>
                          {adj.adjustment_type === "add" ? (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              <TrendingUp className="w-3 h-3 mr-1" /> Add
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-700">
                              <TrendingDown className="w-3 h-3 mr-1" /> Remove
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {Math.abs(adj.quantity)}
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{adj.reason_code?.replace(/_/g, ' ')}</span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {adj.adjustment_date ? format(new Date(adj.adjustment_date), "dd MMM yyyy, HH:mm") : "-"}
                        </TableCell>
                        <TableCell className="text-sm">{adj.created_by || "System"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.length === 0 ? (
              <Card className="col-span-full border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-4">No locations configured</p>
                  <p className="text-sm text-slate-400">Go to Settings to add store locations</p>
                </CardContent>
              </Card>
            ) : (
              locations.map(location => (
                <Card key={location.id} className="border-0 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{location.name}</h3>
                        <p className="text-sm text-slate-500">{location.code}</p>
                      </div>
                      <Badge className={location.type === "store" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}>
                        {location.type}
                      </Badge>
                    </div>
                    {location.city && (
                      <p className="text-sm text-slate-600 mb-2">{location.city}</p>
                    )}
                    {location.manager && (
                      <p className="text-sm text-slate-500">Manager: {location.manager}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />

      <StockAdjustmentDialog
        open={showAdjustment}
        onClose={() => {
          setShowAdjustment(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        location={locations.find(l => l.id === selectedLocation)}
        onSubmit={(data) => adjustmentMutation.mutate(data)}
        isProcessing={adjustmentMutation.isPending}
      />
    </div>
  );
}