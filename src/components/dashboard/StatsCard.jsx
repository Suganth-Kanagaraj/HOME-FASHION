import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({ title, value, icon: Icon, trend, trendValue, color = "indigo", subtitle }) {
  const colorClasses = {
    indigo: "from-[#1e3a5f] to-[#2d4a6f]",
    gold: "from-[#d4a574] to-[#c49464]",
    emerald: "from-emerald-500 to-emerald-600",
    rose: "from-rose-500 to-rose-600",
    violet: "from-violet-500 to-violet-600",
  };

  const bgColorClasses = {
    indigo: "bg-[#1e3a5f]/10",
    gold: "bg-[#d4a574]/10",
    emerald: "bg-emerald-500/10",
    rose: "bg-rose-500/10",
    violet: "bg-violet-500/10",
  };

  const textColorClasses = {
    indigo: "text-[#1e3a5f]",
    gold: "text-[#c49464]",
    emerald: "text-emerald-600",
    rose: "text-rose-600",
    violet: "text-violet-600",
  };

  return (
    <Card className="relative overflow-hidden p-5 lg:p-6 bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-2xl ${bgColorClasses[color]}`}>
          <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${textColorClasses[color]}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend === "up" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color]}`} />
    </Card>
  );
}