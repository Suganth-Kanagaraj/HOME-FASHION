import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Banknote, Smartphone, Wallet, Loader2, Check, Search, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function PaymentModal({ open, onClose, total, onComplete, isProcessing }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState(total);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => base44.entities.Customer.list("-created_date"),
    enabled: open,
  });

  const filteredCustomers = customerSearch.length >= 2
    ? customers.filter(c =>
        c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone?.includes(customerSearch)
      ).slice(0, 5)
    : [];

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerSearch("");
  };

  const change = amountPaid - total;

  const paymentMethods = [
    { value: "cash", label: "Cash", icon: Banknote },
    { value: "upi", label: "UPI", icon: Smartphone },
    { value: "card", label: "Card", icon: CreditCard },
    { value: "wallet", label: "Wallet", icon: Wallet },
  ];

  const handleComplete = () => {
    onComplete({
      payment_method: paymentMethod,
      amount_paid: amountPaid,
      customer_phone: customerPhone,
      customer_name: customerName,
      customer_id: selectedCustomer?.id || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Total */}
          <div className="text-center py-6 bg-gradient-to-br from-[#1e3a5f]/10 to-[#d4a574]/10 rounded-2xl border-2 border-[#d4a574]/20">
            <p className="text-sm text-slate-500 mb-1">Total Amount</p>
            <p className="text-4xl font-bold text-[#1e3a5f]">₹{total.toLocaleString()}</p>
          </div>

          {/* Customer Selection */}
          <div className="space-y-3">
            <Label>Customer (Optional)</Label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm text-slate-800">{selectedCustomer.name}</p>
                    <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-600 h-7 text-xs"
                  onClick={() => { setSelectedCustomer(null); setCustomerName(""); setCustomerPhone(""); }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search customer by name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9"
                />
                {filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    {filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between"
                      >
                        <span className="font-medium text-sm">{c.name}</span>
                        <span className="text-xs text-slate-400">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
                {customerSearch.length >= 2 && filteredCustomers.length === 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm text-slate-500 text-center">
                    No customers found. Enter details manually.
                  </div>
                )}
              </div>
            )}
            {!selectedCustomer && (
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                <Input placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-3">
              {paymentMethods.map(method => (
                <label
                  key={method.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === method.value 
                      ? "border-[#d4a574] bg-gradient-to-br from-[#d4a574]/20 to-[#d4a574]/5 shadow-md" 
                      : "border-slate-200 hover:border-[#d4a574]/50 hover:shadow-sm"
                  }`}
                >
                  <RadioGroupItem value={method.value} className="sr-only" />
                  <method.icon className={`w-5 h-5 ${paymentMethod === method.value ? "text-[#d4a574]" : "text-slate-400"}`} />
                  <span className="font-medium">{method.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Amount Paid */}
          {paymentMethod === "cash" && (
            <div className="space-y-2">
              <Label>Amount Received</Label>
              <Input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                className="text-xl font-semibold h-12"
              />
              {change > 0 && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg text-emerald-700">
                  <span>Change to return:</span>
                  <span className="font-bold">₹{change.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Amount Buttons */}
          {paymentMethod === "cash" && (
            <div className="flex flex-wrap gap-2">
              {[total, Math.ceil(total/100)*100, Math.ceil(total/500)*500, Math.ceil(total/1000)*1000].filter((v, i, a) => a.indexOf(v) === i).map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmountPaid(amount)}
                  className={amountPaid === amount ? "border-[#d4a574] bg-[#d4a574]/10" : ""}
                >
                  ₹{amount.toLocaleString()}
                </Button>
              ))}
            </div>
          )}

          {/* Complete Button */}
          <Button
            onClick={handleComplete}
            disabled={isProcessing || amountPaid < total}
            className="w-full h-14 text-lg bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] hover:from-[#2d4a6f] hover:to-[#1e3a5f]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Complete Sale
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}