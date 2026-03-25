import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ShoppingBag, Calendar, CreditCard, Star } from "lucide-react";

export default function CustomerHistory({ customer, open, onClose }) {
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["customer-sales", customer?.phone],
    queryFn: () => base44.entities.Sale.filter({ customer_phone: customer.phone }, "-sale_date", 50),
    enabled: !!customer?.phone && open,
  });

  if (!customer) return null;

  const totalSpent = sales.filter(s => s.status === "completed").reduce((sum, s) => sum + (s.grand_total || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] rounded-full flex items-center justify-center text-white font-semibold">
              {customer.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-base font-semibold">{customer.name}</p>
              <p className="text-sm text-slate-500 font-normal">{customer.phone}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-[#1e3a5f]">{sales.length}</p>
            <p className="text-xs text-slate-500 mt-1">Total Orders</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-[#c49464]">₹{totalSpent.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">Total Spent</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{customer.loyalty_points || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Loyalty Points</p>
          </div>
        </div>

        {/* Purchase History */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Purchase History</h3>
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : sales.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No purchases yet</p>
            </div>
          ) : (
            sales.map(sale => (
              <div key={sale.id} className="border border-slate-100 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{sale.invoice_number}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {sale.sale_date ? format(new Date(sale.sale_date), "dd MMM yyyy, h:mm a") : "—"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <CreditCard className="w-3 h-3" />
                        {sale.payment_method?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#1e3a5f]">₹{sale.grand_total?.toLocaleString()}</p>
                    <Badge
                      variant="outline"
                      className={`text-xs mt-1 ${sale.status === "completed" ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-rose-600 border-rose-200 bg-rose-50"}`}
                    >
                      {sale.status}
                    </Badge>
                  </div>
                </div>
                {sale.items?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-50">
                    <div className="flex flex-wrap gap-1.5">
                      {sale.items.map((item, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {item.product_name} × {item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}