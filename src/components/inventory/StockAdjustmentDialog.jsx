import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Plus, Minus } from "lucide-react";

const reasonCodes = {
  damaged: { label: "Damaged", icon: "🔨", color: "text-rose-600" },
  expired: { label: "Expired", icon: "📅", color: "text-orange-600" },
  theft: { label: "Theft/Loss", icon: "⚠️", color: "text-red-600" },
  found: { label: "Found/Surplus", icon: "✨", color: "text-emerald-600" },
  correction: { label: "Stock Correction", icon: "✏️", color: "text-blue-600" },
  return: { label: "Customer Return", icon: "↩️", color: "text-indigo-600" },
  sample: { label: "Sample/Demo", icon: "🎁", color: "text-purple-600" },
  other: { label: "Other", icon: "📝", color: "text-slate-600" }
};

export default function StockAdjustmentDialog({ open, onClose, product, location, onSubmit, isProcessing }) {
  const [adjustmentType, setAdjustmentType] = useState("add");
  const [quantity, setQuantity] = useState("");
  const [reasonCode, setReasonCode] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const adjustmentQty = adjustmentType === "add" ? Math.abs(parseInt(quantity)) : -Math.abs(parseInt(quantity));
    onSubmit({
      adjustment_type: adjustmentType,
      quantity: adjustmentQty,
      reason_code: reasonCode,
      notes,
    });
  };

  const resetForm = () => {
    setAdjustmentType("add");
    setQuantity("");
    setReasonCode("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) { onClose(); resetForm(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Stock Adjustment</DialogTitle>
        </DialogHeader>

        {product && (
          <div className="p-4 bg-slate-50 rounded-xl mb-4">
            <p className="font-semibold text-slate-900">{product.name}</p>
            <p className="text-sm text-slate-500">SKU: {product.sku}</p>
            <p className="text-sm text-slate-500">Current Stock: <span className="font-medium text-slate-900">{product.stock_quantity || 0}</span></p>
            {location && <p className="text-sm text-slate-500">Location: {location.name}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Adjustment Type */}
          <div className="space-y-3">
            <Label>Adjustment Type</Label>
            <RadioGroup value={adjustmentType} onValueChange={setAdjustmentType} className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                adjustmentType === "add" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
              }`}>
                <RadioGroupItem value="add" className="sr-only" />
                <Plus className={`w-5 h-5 ${adjustmentType === "add" ? "text-emerald-600" : "text-slate-400"}`} />
                <span className="font-medium">Add Stock</span>
              </label>
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                adjustmentType === "remove" ? "border-rose-500 bg-rose-50" : "border-slate-200 hover:border-slate-300"
              }`}>
                <RadioGroupItem value="remove" className="sr-only" />
                <Minus className={`w-5 h-5 ${adjustmentType === "remove" ? "text-rose-600" : "text-slate-400"}`} />
                <span className="font-medium">Remove Stock</span>
              </label>
            </RadioGroup>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantity *</Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="h-12 text-lg"
              min="1"
              required
            />
          </div>

          {/* Reason Code */}
          <div className="space-y-2">
            <Label>Reason Code *</Label>
            <Select value={reasonCode} onValueChange={setReasonCode} required>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reasonCodes).map(([code, { label, icon, color }]) => (
                  <SelectItem key={code} value={code}>
                    <span className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span className={color}>{label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          {/* Warning */}
          {adjustmentType === "remove" && parseInt(quantity) > (product?.stock_quantity || 0) && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>This will result in negative stock. Please verify the quantity.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { onClose(); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isProcessing || !quantity || !reasonCode}
              className={adjustmentType === "add" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}
            >
              {isProcessing ? "Processing..." : "Confirm Adjustment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
