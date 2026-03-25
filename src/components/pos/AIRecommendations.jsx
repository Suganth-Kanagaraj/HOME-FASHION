import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";

export default function AIRecommendations({ currentCart, onAddProduct, sales, products }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (currentCart.length > 0) {
      generateRecommendations();
    }
  }, [currentCart]);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      // Analyze current cart
      const cartItems = currentCart.map(item => item.product_name).join(', ');
      
      // Find frequently bought together patterns from sales
      const purchasePatterns = sales.slice(0, 50).map(sale => ({
        items: sale.items?.map(i => i.product_name) || [],
        total: sale.grand_total,
      }));

      const prompt = `You are an AI product recommendation expert for a retail store. Analyze the current shopping cart and historical purchase patterns to recommend complementary products.

Current Cart Items: ${cartItems}

Historical Purchase Patterns (last 50 sales):
${JSON.stringify(purchasePatterns.slice(0, 10), null, 2)}

Available Products:
${JSON.stringify(products.slice(0, 30).map(p => ({ name: p.name, price: p.selling_price, category: p.category_id })), null, 2)}

Recommend 3-5 products that:
1. Complement the current cart items
2. Are frequently purchased together
3. Have good profit margins
4. Match customer preferences`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  reason: { type: "string" },
                  confidence: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Match recommendations with actual products
      const recs = response.recommendations?.map(rec => {
        const product = products.find(p => 
          p.name.toLowerCase().includes(rec.product_name.toLowerCase()) ||
          rec.product_name.toLowerCase().includes(p.name.toLowerCase())
        );
        return product ? { ...product, ai_reason: rec.reason, confidence: rec.confidence } : null;
      }).filter(Boolean) || [];

      setRecommendations(recs);
    } catch (error) {
      console.error("Error generating recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (currentCart.length === 0 || recommendations.length === 0) return null;

  return (
    <Card className="border shadow-sm bg-gradient-to-br from-purple-50 to-white">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            AI Recommendations {recommendations.length > 0 && `(${recommendations.length})`}
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-slate-500">Analyzing patterns...</p>
          ) : (
            recommendations.slice(0, 3).map((product) => (
            <div key={product.id} className="p-3 bg-white rounded-lg border border-purple-100 hover:border-purple-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-slate-900 text-sm">{product.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{product.ai_reason}</p>
                </div>
                <Badge className="bg-purple-100 text-purple-700 text-xs ml-2">
                  {product.confidence}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="font-semibold text-purple-600">₹{product.selling_price}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs border-purple-300 text-purple-600 hover:bg-purple-50"
                  onClick={() => onAddProduct(product)}
                >
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
            ))
          )}
        </CardContent>
      )}
    </Card>
  );
}