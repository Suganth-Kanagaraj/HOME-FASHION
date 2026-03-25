
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, ShoppingCart, Users, Package, TrendingUp, TrendingDown, Calendar, ArrowRight, AlertTriangle, Zap, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import SalesChart from "../components/dashboard/SalesChart";
import LowStockAlert from "../components/dashboard/LowStockAlert";
import { format, subDays, startOfMonth, startOfWeek } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Dashboard() {
  const { data: sales = [], isLoading: salesLoading, refetch } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 200),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-created_date', 50),
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');

  const todaySales = sales.filter(s => (s.sale_date || s.created_date)?.startsWith(today));
  const yesterdaySales = sales.filter(s => (s.sale_date || s.created_date)?.startsWith(yesterday));
  const monthSales = sales.filter(s => (s.sale_date || s.created_date) >= monthStart);
  const weekSales = sales.filter(s => (s.sale_date || s.created_date) >= weekStart);

  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.grand_total || 0), 0);
  const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + (s.grand_total || 0), 0);
  const monthRevenue = monthSales.reduce((sum, s) => sum + (s.grand_total || 0), 0);
  const monthExpenses = expenses.filter(e => (e.expense_date || e.created_date) >= monthStart).reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = monthRevenue - monthExpenses;

  const todayGrowth = yesterdayRevenue > 0 ? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1) : null;

  const lowStockProducts = products.filter(p => p.is_active !== false && p.stock_quantity <= (p.low_stock_threshold || 10));
  const outOfStock = products.filter(p => p.is_active !== false && p.stock_quantity === 0);

  // 7-day chart
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const daySales = sales.filter(s => (s.sale_date || s.created_date)?.startsWith(dateStr));
    return {
      name: format(date, 'EEE'),
      sales: daySales.reduce((sum, s) => sum + (s.grand_total || 0), 0),
      orders: daySales.length,
    };
  });

  // Payment breakdown
  const paymentBreakdown = {};
  monthSales.forEach(s => {
    const m = s.payment_method || 'cash';
    paymentBreakdown[m] = (paymentBreakdown[m] || 0) + (s.grand_total || 0);
  });
  const paymentData = Object.entries(paymentBreakdown).map(([name, value]) => ({
    name: name.toUpperCase(), value
  }));
  const COLORS = ['#1e3a5f', '#d4a574', '#10b981', '#f59e0b', '#8b5cf6'];

  // Top products
  const productSales = {};
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      if (!productSales[item.product_name]) productSales[item.product_name] = { name: item.product_name, qty: 0, rev: 0 };
      productSales[item.product_name].qty += item.quantity || 0;
      productSales[item.product_name].rev += item.total || 0;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.rev - a.rev).slice(0, 5);

  // New customers this month
  const newCustomers = customers.filter(c => c.created_date >= monthStart).length;

  const stats = [
    {
      title: "Today's Revenue",
      value: `₹${todayRevenue.toLocaleString()}`,
      sub: `${todaySales.length} orders today`,
      growth: todayGrowth,
      icon: IndianRupee,
      gradient: "from-[#1e3a5f] to-[#2d5a8e]",
      bg: "from-blue-50 to-indigo-50",
      iconBg: "bg-[#1e3a5f]/10",
      iconColor: "text-[#1e3a5f]",
    },
    {
      title: "Monthly Revenue",
      value: `₹${monthRevenue.toLocaleString()}`,
      sub: `${monthSales.length} orders this month`,
      icon: TrendingUp,
      gradient: "from-[#d4a574] to-[#e8b88a]",
      bg: "from-amber-50 to-orange-50",
      iconBg: "bg-[#d4a574]/10",
      iconColor: "text-[#d4a574]",
    },
    {
      title: "Net Profit (Month)",
      value: `₹${netProfit.toLocaleString()}`,
      sub: `Expenses: ₹${monthExpenses.toLocaleString()}`,
      icon: netProfit >= 0 ? TrendingUp : TrendingDown,
      gradient: netProfit >= 0 ? "from-emerald-500 to-emerald-600" : "from-rose-500 to-rose-600",
      bg: netProfit >= 0 ? "from-emerald-50 to-green-50" : "from-rose-50 to-red-50",
      iconBg: netProfit >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10",
      iconColor: netProfit >= 0 ? "text-emerald-600" : "text-rose-600",
    },
    {
      title: "Total Customers",
      value: customers.length,
      sub: `+${newCustomers} new this month`,
      icon: Users,
      gradient: "from-violet-500 to-violet-600",
      bg: "from-violet-50 to-purple-50",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-600",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(new Date(), "EEEE, dd MMMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(outOfStock.length > 0 || lowStockProducts.length > 0) && (
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              {outOfStock.length} out of stock, {lowStockProducts.length} low
            </div>
          )}
          <Link to={createPageUrl("POS")}>
            <Button className="bg-gradient-to-r from-[#d4a574] to-[#c49464] hover:from-[#c49464] hover:to-[#d4a574] text-white shadow-lg">
              <Zap className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className={`relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${stat.bg}`}>
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-2xl ${stat.iconBg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                {stat.growth !== null && stat.growth !== undefined && (
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${parseFloat(stat.growth) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {parseFloat(stat.growth) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(stat.growth)}%
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
            </CardContent>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Sales Overview</CardTitle>
              <p className="text-sm text-slate-400 mt-0.5">Last 7 days performance</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#1e3a5f]">₹{weekSales.reduce((s, x) => s + (x.grand_total || 0), 0).toLocaleString()}</p>
              <p className="text-xs text-slate-400">this week</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4a574" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#d4a574" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    formatter={(v, name) => name === 'sales' ? [`₹${v.toLocaleString()}`, 'Revenue'] : [v, 'Orders']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#1e3a5f" strokeWidth={2.5} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900">Payment Methods</CardTitle>
            <p className="text-sm text-slate-400">This month breakdown</p>
          </CardHeader>
          <CardContent>
            {paymentData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-slate-400">
                <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No sales this month</p>
              </div>
            ) : (
              <>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {paymentData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {paymentData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-800">₹{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Recent Sales */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">Recent Sales</CardTitle>
            <Link to={createPageUrl("Reports")}>
              <Button variant="ghost" size="sm" className="text-[#1e3a5f] hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/5">
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {sales.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No recent sales</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {sales.slice(0, 6).map(sale => (
                  <div key={sale.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors">
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
                        <Badge className={`text-xs py-0 ${sale.payment_method === 'upi' ? 'bg-violet-100 text-violet-700' : sale.payment_method === 'card' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
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

        {/* Right Column */}
        <div className="space-y-4">
          {/* Top Products */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">Top Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topProducts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No data yet</p>
              ) : (
                topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#d4a574]/20 to-[#d4a574]/5 flex items-center justify-center text-xs font-bold text-[#d4a574]">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-gradient-to-r from-[#d4a574] to-[#c49464] h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (p.rev / (topProducts[0]?.rev || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">₹{p.rev >= 1000 ? (p.rev/1000).toFixed(0)+'k' : p.rev}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Low Stock */}
          <LowStockAlert products={lowStockProducts} />
        </div>
      </div>
    </div>
  );
}