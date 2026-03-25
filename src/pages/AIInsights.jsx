import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp, Package, AlertTriangle, ShoppingCart, Brain, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

export default function AIInsights() {
  const [loadingForecasting, setLoadingForecasting] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingAnomalies, setLoadingAnomalies] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [inventoryRecs, setInventoryRecs] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const { toast } = useToast();

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 200),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const generateSalesForecast = async () => {
    setLoadingForecasting(true);
    try {
      // Prepare historical sales data
      const last90Days = Array.from({ length: 90 }, (_, i) => {
        const date = format(subDays(new Date(), 89 - i), 'yyyy-MM-dd');
        const daySales = sales.filter(s => (s.sale_date || s.created_date)?.startsWith(date));
        return {
          date,
          revenue: daySales.reduce((sum, s) => sum + (s.grand_total || 0), 0),
          orders: daySales.length,
        };
      });

      const prompt = `You are a sales forecasting expert. Analyze the following 90 days of sales data and provide a 30-day forecast.

Historical Data (last 90 days):
${JSON.stringify(last90Days.slice(-30), null, 2)}

Key Statistics:
- Total Revenue (90 days): ₹${sales.reduce((sum, s) => sum + (s.grand_total || 0), 0).toLocaleString()}
- Total Orders: ${sales.length}
- Average Daily Revenue: ₹${(sales.reduce((sum, s) => sum + (s.grand_total || 0), 0) / 90).toFixed(0)}

Provide:
1. 30-day revenue forecast (daily predictions)
2. Key trends and patterns identified
3. Seasonality insights
4. Confidence level
5. Risk factors
6. Actionable recommendations`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            daily_forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  predicted_revenue: { type: "number" },
                  confidence: { type: "string" }
                }
              }
            },
            trends: { type: "array", items: { type: "string" } },
            seasonality: { type: "string" },
            confidence_level: { type: "string" },
            risk_factors: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setForecast(response);
      toast({ title: "✨ AI Forecast Generated", description: "30-day sales predictions ready" });
    } catch (error) {
      toast({ title: "Error generating forecast", variant: "destructive" });
    } finally {
      setLoadingForecasting(false);
    }
  };

  const generateInventoryRecommendations = async () => {
    setLoadingInventory(true);
    try {
      // Prepare product and sales data
      const productData = products.map(p => {
        const productSales = sales.flatMap(s => 
          (s.items || []).filter(i => i.product_id === p.id)
        );
        const totalSold = productSales.reduce((sum, i) => sum + (i.quantity || 0), 0);
        const avgMonthlySales = totalSold / 3; // Approximate
        
        return {
          name: p.name,
          sku: p.sku,
          current_stock: p.stock_quantity || 0,
          low_stock_threshold: p.low_stock_threshold || 10,
          total_sold_90_days: totalSold,
          avg_monthly_sales: avgMonthlySales,
          purchase_price: p.purchase_price || 0,
          selling_price: p.selling_price || 0,
        };
      });

      const prompt = `You are an inventory optimization expert. Analyze the following product data and provide AI-driven recommendations for optimal stock levels.

Product Inventory Data:
${JSON.stringify(productData.slice(0, 20), null, 2)}

Total Products: ${products.length}

Provide recommendations for:
1. Products to restock immediately (with suggested order quantities)
2. Overstock items to reduce
3. Optimal stock levels for top products
4. Cost optimization opportunities
5. Products with concerning stock patterns`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            restock_urgently: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  current_stock: { type: "number" },
                  recommended_order: { type: "number" },
                  reason: { type: "string" }
                }
              }
            },
            reduce_stock: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  current_stock: { type: "number" },
                  reason: { type: "string" }
                }
              }
            },
            optimal_levels: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  optimal_stock: { type: "number" },
                  reorder_point: { type: "number" }
                }
              }
            },
            cost_savings: { type: "string" },
            key_insights: { type: "array", items: { type: "string" } }
          }
        }
      });

      setInventoryRecs(response);
      toast({ title: "✨ AI Recommendations Ready", description: "Inventory optimization suggestions generated" });
    } catch (error) {
      toast({ title: "Error generating recommendations", variant: "destructive" });
    } finally {
      setLoadingInventory(false);
    }
  };

  const detectAnomalies = async () => {
    setLoadingAnomalies(true);
    try {
      // Prepare anomaly detection data
      const dailyStats = Array.from({ length: 30 }, (_, i) => {
        const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
        const daySales = sales.filter(s => (s.sale_date || s.created_date)?.startsWith(date));
        return {
          date,
          revenue: daySales.reduce((sum, s) => sum + (s.grand_total || 0), 0),
          orders: daySales.length,
          avg_order_value: daySales.length > 0 ? daySales.reduce((sum, s) => sum + (s.grand_total || 0), 0) / daySales.length : 0,
        };
      });

      const prompt = `You are an anomaly detection specialist. Analyze the following 30-day sales data and identify unusual patterns, outliers, and potential issues.

Daily Sales Data:
${JSON.stringify(dailyStats, null, 2)}

Detect and report:
1. Revenue anomalies (unusually high or low days)
2. Order volume anomalies
3. Suspicious patterns
4. Potential data quality issues
5. Business risks or opportunities`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            anomalies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  type: { type: "string" },
                  severity: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            patterns: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            data_quality_score: { type: "string" }
          }
        }
      });

      setAnomalies(response);
      toast({ title: "✨ Anomaly Detection Complete", description: "Unusual patterns identified" });
    } catch (error) {
      toast({ title: "Error detecting anomalies", variant: "destructive" });
    } finally {
      setLoadingAnomalies(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-slate-900">AI Business Intelligence</h1>
          </div>
          <p className="text-slate-500 mt-1">Machine learning powered insights and predictions</p>
        </div>
      </div>

      <Tabs defaultValue="forecasting" className="space-y-6">
        <TabsList className="bg-white shadow-sm border">
          <TabsTrigger value="forecasting">Sales Forecasting</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Optimization</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
        </TabsList>

        {/* Sales Forecasting */}
        <TabsContent value="forecasting" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI-Powered Sales Forecasting
                  </CardTitle>
                  <CardDescription>Machine learning predictions for next 30 days</CardDescription>
                </div>
                <Button onClick={generateSalesForecast} disabled={loadingForecasting} className="bg-purple-600 hover:bg-purple-700">
                  {loadingForecasting ? "Generating..." : "Generate Forecast"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!forecast ? (
                <div className="text-center py-12 text-slate-500">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-purple-300" />
                  <p>Click "Generate Forecast" to create AI predictions</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Forecast Chart */}
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={forecast.daily_forecast?.slice(0, 30) || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => format(new Date(v), 'dd MMM')} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                        <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Predicted Revenue']} />
                        <Line type="monotone" dataKey="predicted_revenue" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-xl border">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        Key Trends
                      </h3>
                      <ul className="space-y-2">
                        {forecast.trends?.map((trend, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            {trend}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-white rounded-xl border">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Risk Factors
                      </h3>
                      <ul className="space-y-2">
                        {forecast.risk_factors?.map((risk, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-amber-600">•</span>
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <h3 className="font-semibold text-purple-900 mb-3">AI Recommendations</h3>
                    <ul className="space-y-2">
                      {forecast.recommendations?.map((rec, i) => (
                        <li key={i} className="text-sm text-purple-800 flex items-start gap-2">
                          <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-sm text-slate-500">Seasonality Pattern</p>
                      <p className="font-medium text-slate-900">{forecast.seasonality}</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700">
                      {forecast.confidence_level} Confidence
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Optimization */}
        <TabsContent value="inventory" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-600" />
                    AI Inventory Optimization
                  </CardTitle>
                  <CardDescription>Smart recommendations for stock management</CardDescription>
                </div>
                <Button onClick={generateInventoryRecommendations} disabled={loadingInventory} className="bg-emerald-600 hover:bg-emerald-700">
                  {loadingInventory ? "Analyzing..." : "Generate Recommendations"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!inventoryRecs ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
                  <p>Click "Generate Recommendations" to get AI insights</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Urgent Restocking */}
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                    <h3 className="font-semibold text-rose-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Urgent Restocking Required ({inventoryRecs.restock_urgently?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {inventoryRecs.restock_urgently?.slice(0, 5).map((item, i) => (
                        <div key={i} className="p-3 bg-white rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-slate-900">{item.product_name}</p>
                            <Badge className="bg-rose-100 text-rose-700">Order {item.recommended_order} units</Badge>
                          </div>
                          <p className="text-sm text-slate-600">Current: {item.current_stock} • {item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optimal Levels */}
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <h3 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Optimal Stock Levels
                    </h3>
                    <div className="space-y-3">
                      {inventoryRecs.optimal_levels?.slice(0, 5).map((item, i) => (
                        <div key={i} className="p-3 bg-white rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{item.product_name}</p>
                            <p className="text-sm text-slate-600">Reorder Point: {item.reorder_point} units</p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700">{item.optimal_stock} units</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reduce Stock */}
                  {inventoryRecs.reduce_stock?.length > 0 && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <h3 className="font-semibold text-amber-900 mb-4">Overstock Items</h3>
                      <div className="space-y-3">
                        {inventoryRecs.reduce_stock.slice(0, 5).map((item, i) => (
                          <div key={i} className="p-3 bg-white rounded-lg">
                            <p className="font-medium text-slate-900">{item.product_name}</p>
                            <p className="text-sm text-slate-600">Stock: {item.current_stock} • {item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Insights */}
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <h3 className="font-semibold text-emerald-900 mb-3">Key Insights</h3>
                    <ul className="space-y-2">
                      {inventoryRecs.key_insights?.map((insight, i) => (
                        <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                          <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                    {inventoryRecs.cost_savings && (
                      <div className="mt-3 p-3 bg-white rounded-lg">
                        <p className="text-sm font-medium text-emerald-900">💰 {inventoryRecs.cost_savings}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomaly Detection */}
        <TabsContent value="anomalies" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    Anomaly Detection
                  </CardTitle>
                  <CardDescription>Identify unusual patterns and potential issues</CardDescription>
                </div>
                <Button onClick={detectAnomalies} disabled={loadingAnomalies} className="bg-amber-600 hover:bg-amber-700">
                  {loadingAnomalies ? "Analyzing..." : "Detect Anomalies"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!anomalies ? (
                <div className="text-center py-12 text-slate-500">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-300" />
                  <p>Click "Detect Anomalies" to analyze patterns</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Detected Anomalies */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      Detected Anomalies ({anomalies.anomalies?.length || 0})
                    </h3>
                    {anomalies.anomalies?.map((anomaly, i) => (
                      <div key={i} className={`p-4 rounded-xl border ${
                        anomaly.severity === 'high' ? 'bg-rose-50 border-rose-200' :
                        anomaly.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-900">{anomaly.type}</p>
                            <p className="text-sm text-slate-600">{format(new Date(anomaly.date), 'dd MMM yyyy')}</p>
                          </div>
                          <Badge className={
                            anomaly.severity === 'high' ? 'bg-rose-100 text-rose-700' :
                            anomaly.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {anomaly.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700 mb-1">{anomaly.description}</p>
                        <p className="text-sm text-slate-600 font-medium">Impact: {anomaly.impact}</p>
                      </div>
                    ))}
                  </div>

                  {/* Patterns & Opportunities */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-xl border">
                      <h3 className="font-semibold text-slate-900 mb-3">Patterns Identified</h3>
                      <ul className="space-y-2">
                        {anomalies.patterns?.map((pattern, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-amber-600">•</span>
                            {pattern}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <h3 className="font-semibold text-emerald-900 mb-3">Opportunities</h3>
                      <ul className="space-y-2">
                        {anomalies.opportunities?.map((opp, i) => (
                          <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                            <span className="text-emerald-600">•</span>
                            {opp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Risks */}
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                    <h3 className="font-semibold text-rose-900 mb-3">Risk Factors</h3>
                    <ul className="space-y-2">
                      {anomalies.risks?.map((risk, i) => (
                        <li key={i} className="text-sm text-rose-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Data Quality */}
                  <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Data Quality Score</p>
                      <p className="font-medium text-slate-900">{anomalies.data_quality_score}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}