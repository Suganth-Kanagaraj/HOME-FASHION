import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  return (
    <div className="bg-white rounded-lg lg:rounded-xl border border-slate-200 p-2 lg:p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 text-sm lg:text-base truncate">{item.product_name}</p>
          <p className="text-xs text-slate-500 hidden sm:block">{item.sku}</p>
          <p className="text-xs lg:text-sm text-[#1e3a5f] font-medium mt-0.5">₹{item.unit_price?.toLocaleString()} × {item.quantity}</p>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 lg:h-8 lg:w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
          onClick={() => onRemove(item.product_id)}
        >
          <Trash2 className="w-3 lg:w-4 h-3 lg:h-4" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 lg:h-8 lg:w-8"
            onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="w-3 lg:w-4 h-3 lg:h-4" />
          </Button>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdateQuantity(item.product_id, parseInt(e.target.value) || 1)}
            className="w-12 lg:w-14 h-7 lg:h-8 text-center text-sm"
            min="1"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 lg:h-8 lg:w-8"
            onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
          >
            <Plus className="w-3 lg:w-4 h-3 lg:h-4" />
          </Button>
        </div>
        
        <div className="text-right">
          <p className="font-semibold text-slate-900 text-sm lg:text-base">₹{item.total?.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}