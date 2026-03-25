import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Button } from "@/components/ui/button";

export default function RecentSales({ sales }) {
  const methodColor = (m) => {
    if (m === 'upi') return 'bg-violet-100 text-violet-700';
    if (m === 'card') return 'bg-blue-100 text-blue-700';
    if (m === 'wallet') return 'bg-emerald-100 text-emerald-700';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900">Recent Sales</CardTitle>
        <Link to={createPageUrl("Reports")}>
          <Button variant="ghost" size="sm" className="text-[#1e3a5f] hover:bg-[#1e3a5f]/5 text-xs">
            View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {sales.length === 0 ? (
          <div className="text-center py-12 text-slate-400 px-6">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No recent sales</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {sales.slice(0, 6).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#1e3a5f]/10 to-[#1e3a5f]/5 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-4 h-4 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{sale.invoice_number}</p>
                    <p className="text-xs text-slate-400">{sale.customer_name || "Walk-in Customer"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">₹{sale.grand_total?.toLocaleString()}</p>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <Badge className={`text-xs py-0 border-0 ${methodColor(sale.payment_method)}`}>
                      {sale.payment_method || 'cash'}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {sale.sale_date ? format(new Date(sale.sale_date), "HH:mm") : format(new Date(sale.created_date), "HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}