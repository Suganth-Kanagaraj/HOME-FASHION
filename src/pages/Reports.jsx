import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Package, Users, IndianRupee, Calendar, Download, FileText, FileSpreadsheet, Filter, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, getMonth, getYear } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { useToast } from "@/components/ui/use-toast";

export default function Reports() {
  const [dateRange, setDateRange] = useState("month");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-created_date'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
    initialData: [],
  });

  // Calculate date range
  const getDateRange = () => {
    const today = new Date();
    switch (dateRange) {
      case "week":
        return { start: startOfWeek(today), end: endOfWeek(today) };
      case "month":
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case "quarter":
        return { start: subDays(today, 90), end: today };
      case "year":
        return { start: subDays(today, 365), end: today };
      default:
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  };

  const { start, end } = getDateRange();
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');

  // Filter sales by date range
  const filteredSales = sales.filter(sale => {
    const saleDate = sale.sale_date || sale.created_date;
    return saleDate >= startStr && saleDate <= endStr;
  });

  // Summary Stats
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0);
  const totalOrders = filteredSales.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalGst = filteredSales.reduce((sum, sale) => sum + (sale.total_gst || 0), 0);

  // Daily sales chart
  const dailySalesData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const daySales = sales.filter(sale => {
      const saleDate = sale.sale_date || sale.created_date;
      return saleDate?.startsWith(dateStr);
    });
    return {
      date: format(date, 'dd MMM'),
      sales: daySales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0),
      orders: daySales.length,
    };
  });

  // Monthly trend analysis
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_date);
      return getMonth(saleDate) === i;
    });
    return {
      month: format(new Date(2026, i, 1), 'MMM'),
      revenue: monthSales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0),
      orders: monthSales.length,
    };
  });

  // Seasonal analysis
  const seasonalData = [
    { season: "Winter", months: [11, 0, 1] },
    { season: "Spring", months: [2, 3, 4] },
    { season: "Summer", months: [5, 6, 7] },
    { season: "Autumn", months: [8, 9, 10] },
  ].map(({ season, months }) => {
    const seasonSales = sales.filter(sale => {
      const month = getMonth(new Date(sale.sale_date || sale.created_date));
      return months.includes(month);
    });
    return {
      season,
      revenue: seasonSales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0),
      orders: seasonSales.length,
    };
  });

  // Simple forecasting (linear regression)
  const forecastData = (() => {
    const last90Days = dailySalesData.slice(-90);
    const avgGrowth = last90Days.length > 1 
      ? (last90Days[last90Days.length - 1].sales - last90Days[0].sales) / last90Days.length 
      : 0;
    
    return Array.from({ length: 30 }, (_, i) => {
      const lastValue = dailySalesData[dailySalesData.length - 1]?.sales || 0;
      return {
        date: format(new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000), 'dd MMM'),
        forecast: Math.max(0, lastValue + (avgGrowth * (i + 1))),
      };
    });
  })();

  // Top products
  const productSales = {};
  filteredSales.forEach(sale => {
    sale.items?.forEach(item => {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
      }
      productSales[item.product_name].quantity += item.quantity || 0;
      productSales[item.product_name].revenue += item.total || 0;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Category analysis
  const categoryData = categories.map(cat => {
    const catProducts = products.filter(p => p.category_id === cat.id);
    const catSales = filteredSales.flatMap(sale => 
      (sale.items || []).filter(item => 
        catProducts.some(p => p.id === item.product_id)
      )
    );
    const revenue = catSales.reduce((sum, item) => sum + (item.total || 0), 0);
    return { name: cat.name, revenue, quantity: catSales.reduce((sum, item) => sum + (item.quantity || 0), 0) };
  }).filter(c => c.revenue > 0);

  // Payment methods breakdown
  const paymentMethods = {};
  filteredSales.forEach(sale => {
    const method = sale.payment_method || 'cash';
    if (!paymentMethods[method]) {
      paymentMethods[method] = 0;
    }
    paymentMethods[method] += sale.grand_total || 0;
  });
  const paymentData = Object.entries(paymentMethods).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // GST Summary
  const cgst = filteredSales.reduce((sum, sale) => sum + (sale.cgst_amount || 0), 0);
  const sgst = filteredSales.reduce((sum, sale) => sum + (sale.sgst_amount || 0), 0);
  const igst = filteredSales.reduce((sum, sale) => sum + (sale.igst_amount || 0), 0);

  // Export Functions
  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Sales Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Period: ${format(start, 'dd MMM yyyy')} - ${format(end, 'dd MMM yyyy')}`, 14, 28);
    
    doc.setFontSize(12);
    doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`, 14, 40);
    doc.text(`Total Orders: ${totalOrders}`, 14, 47);
    doc.text(`Avg Order Value: ₹${avgOrderValue.toFixed(0)}`, 14, 54);
    doc.text(`Total GST: ₹${totalGst.toLocaleString()}`, 14, 61);
    
    doc.autoTable({
      startY: 70,
      head: [['Product', 'Quantity', 'Revenue']],
      body: topProducts.map(p => [p.name, p.quantity, `₹${p.revenue.toLocaleString()}`]),
    });
    
    doc.save(`sales-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: "PDF exported successfully" });
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Sales Report'],
      ['Period', `${format(start, 'dd MMM yyyy')} - ${format(end, 'dd MMM yyyy')}`],
      [],
      ['Total Revenue', totalRevenue],
      ['Total Orders', totalOrders],
      ['Avg Order Value', avgOrderValue.toFixed(2)],
      ['Total GST', totalGst],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    
    // Top Products sheet
    const ws2 = XLSX.utils.json_to_sheet(topProducts);
    XLSX.utils.book_append_sheet(wb, ws2, "Top Products");
    
    // Sales Details
    const salesData = filteredSales.map(sale => ({
      'Invoice': sale.invoice_number,
      'Date': format(new Date(sale.sale_date || sale.created_date), 'dd MMM yyyy'),
      'Customer': sale.customer_name,
      'Amount': sale.grand_total,
      'Payment': sale.payment_method,
      'Status': sale.payment_status,
    }));
    const ws3 = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, ws3, "Sales Details");
    
    XLSX.writeFile(wb, `sales-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast({ title: "Excel exported successfully" });
  };

  const exportCSV = () => {
    const csvData = [
      ['Invoice', 'Date', 'Customer', 'Amount', 'Payment', 'Status'],
      ...filteredSales.map(sale => [
        sale.invoice_number,
        format(new Date(sale.sale_date || sale.created_date), 'dd MMM yyyy'),
        sale.customer_name,
        sale.grand_total,
        sale.payment_method,
        sale.payment_status,
      ])
    ];
    
    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast({ title: "CSV exported successfully" });
  };

  const COLORS = ['#1e3a5f', '#d4a574', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">Advanced insights, trends, and forecasting</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">Last 90 Days</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportPDF}>
                <FileText className="w-4 h-4 mr-2" /> Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCSV}>
                <FileText className="w-4 h-4 mr-2" /> Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] rounded-2xl shadow-lg">
                <IndianRupee className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-white to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{totalOrders}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-[#d4a574] to-[#c49464] rounded-2xl shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-white to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Avg Order Value</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">₹{avgOrderValue.toFixed(0)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-white to-rose-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total GST Collected</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">₹{totalGst.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="bg-white shadow-sm border">
          <TabsTrigger value="trends">Sales Trends</TabsTrigger>
          <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
          <TabsTrigger value="forecast">Forecasting</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="gst">GST Report</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Sales Chart */}
            <Card className="lg:col-span-2 border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Daily Sales (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailySalesData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales']} />
                      <Area type="monotone" dataKey="sales" stroke="#1e3a5f" fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="#1e3a5f" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Seasonal Analysis */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Seasonal Sales Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="season" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="#d4a574" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#94a3b8" tickFormatter={(v) => `₹${v/1000}k`} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" width={100} />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <CardTitle>30-Day Revenue Forecast</CardTitle>
              </div>
              <p className="text-sm text-slate-500">AI-powered projection based on historical trends</p>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData}>
                    <defs>
                      <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Forecast']} />
                    <Line type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={2} dot={false} fill="url(#forecastGradient)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-purple-50 rounded-xl">
                <p className="text-sm text-purple-900">
                  <strong>Insight:</strong> Based on current trends, projected revenue for next month is 
                  <strong className="text-purple-600"> ₹{forecastData.reduce((sum, d) => sum + d.forecast, 0).toLocaleString()}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Qty Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">No sales data</TableCell>
                    </TableRow>
                  ) : (
                    topProducts.map((product, index) => (
                      <TableRow key={product.name}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell className="text-center">{product.quantity}</TableCell>
                        <TableCell className="text-right font-medium">₹{product.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-[#1e3a5f]/10 text-[#1e3a5f]">
                            {((product.revenue / totalRevenue) * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {/* Customer Purchase Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500 font-medium">Total Customers</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{customers.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500 font-medium">Active Buyers</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {new Set(filteredSales.map(s => s.customer_phone).filter(Boolean)).size}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500 font-medium">Avg Spend / Customer</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  ₹{(totalRevenue / Math.max(new Set(filteredSales.map(s => s.customer_phone).filter(Boolean)).size, 1)).toFixed(0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Top Customers by Spend</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const customerSpend = {};
                filteredSales.forEach(sale => {
                  const key = sale.customer_phone || sale.customer_name || "Walk-in";
                  if (!customerSpend[key]) {
                    customerSpend[key] = { name: sale.customer_name || "Walk-in", phone: sale.customer_phone || "-", total: 0, orders: 0 };
                  }
                  customerSpend[key].total += sale.grand_total || 0;
                  customerSpend[key].orders += 1;
                });
                const topCustomers = Object.values(customerSpend).sort((a, b) => b.total - a.total).slice(0, 10);
                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-center">Orders</TableHead>
                        <TableHead className="text-right">Total Spend</TableHead>
                        <TableHead className="text-right">Avg Order</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCustomers.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No data</TableCell></TableRow>
                      ) : topCustomers.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{i + 1}</TableCell>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-slate-500">{c.phone}</TableCell>
                          <TableCell className="text-center">{c.orders}</TableCell>
                          <TableCell className="text-right font-semibold text-[#1e3a5f]">₹{c.total.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-slate-500">₹{(c.total / c.orders).toFixed(0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gst">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>GST Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">CGST Collected</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">₹{cgst.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">SGST Collected</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">₹{sgst.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">IGST Collected</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">₹{igst.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-6 bg-[#1e3a5f]/5 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Total GST Liability</p>
                    <p className="text-sm text-slate-500 mt-1">For the selected period</p>
                  </div>
                  <p className="text-3xl font-bold text-[#1e3a5f]">₹{totalGst.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}