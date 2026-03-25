import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Button } from "@/components/ui/button";

export default function LowStockAlert({ products }) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold text-slate-900">Low Stock</CardTitle>
          {products.length > 0 && (
            <Badge className="bg-rose-100 text-rose-700 border-0">{products.length}</Badge>
          )}
        </div>
        <Link to={createPageUrl("Products")}>
          <Button variant="ghost" size="sm" className="text-[#1e3a5f] h-7 text-xs hover:bg-[#1e3a5f]/5">
            Manage <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {products.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400 opacity-70" />
            <p className="text-sm font-medium text-emerald-600">All well stocked!</p>
          </div>
        ) : (
          products.slice(0, 5).map((product) => (
            <div key={product.id} className="flex items-center justify-between p-2.5 bg-rose-50 rounded-xl border border-rose-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-xs">{product.name}</p>
                  <p className="text-xs text-slate-400">{product.sku}</p>
                </div>
              </div>
              <Badge className={`text-xs ${product.stock_quantity === 0 ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                {product.stock_quantity === 0 ? 'Out' : `${product.stock_quantity} left`}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}