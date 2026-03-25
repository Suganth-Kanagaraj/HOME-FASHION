import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CustomerSegmentCard({ segment, customerCount, totalValue, onClick }) {
  const colorMap = {
    vip: "from-purple-500 to-purple-600",
    regular: "from-blue-500 to-blue-600",
    inactive: "from-slate-400 to-slate-500",
    new: "from-emerald-500 to-emerald-600",
  };

  const gradient = segment.color || colorMap[segment.name?.toLowerCase()] || "from-[#1e3a5f] to-[#2d4a6f]";

  return (
    <Card 
      className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg text-slate-900">{segment.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{segment.description}</p>
          </div>
          <Badge className={`bg-gradient-to-r ${gradient} text-white border-0`}>
            {customerCount}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{customerCount}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <IndianRupee className="w-4 h-4" />
              <span>Total Value</span>
            </div>
            <p className="text-xl font-bold text-slate-900">₹{totalValue?.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}