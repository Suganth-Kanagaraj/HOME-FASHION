import React from "react";
import { Button } from "@/components/ui/button";
import { History, User, Package, Tag } from "lucide-react";

export default function QuickActions({ onViewHistory, onAddCustomer, onQuickStock }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onViewHistory}
        className="flex items-center gap-2 bg-white hover:bg-slate-50"
      >
        <History className="w-4 h-4" />
        Recent
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onAddCustomer}
        className="flex items-center gap-2 bg-white hover:bg-slate-50"
      >
        <User className="w-4 h-4" />
        Customer
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onQuickStock}
        className="flex items-center gap-2 bg-white hover:bg-slate-50"
      >
        <Package className="w-4 h-4" />
        Stock
      </Button>
    </div>
  );
}