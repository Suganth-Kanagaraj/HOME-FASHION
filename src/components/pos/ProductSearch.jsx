import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Barcode } from "lucide-react";

export default function ProductSearch({ products, onAddProduct }) {
  const [search, setSearch] = useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    // Auto-focus on mount for barcode scanner
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const filteredProducts = products.filter(p => 
    p.is_active !== false &&
    (p.name?.toLowerCase().includes(search.toLowerCase()) ||
     p.sku?.toLowerCase().includes(search.toLowerCase()) ||
     p.barcode?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
        <Input
          ref={inputRef}
          placeholder="Search by name, SKU or scan barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            // Quick add with Enter key
            if (e.key === "Enter" && filteredProducts.length === 1) {
              onAddProduct(filteredProducts[0]);
              setSearch("");
            }
          }}
          className="pl-10 h-12 text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:bg-white/20 focus:border-white/40"
          autoFocus
        />
      </div>

      {search && (
        <div className="max-h-[400px] overflow-y-auto space-y-2 bg-white/5 p-2 rounded-xl">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Barcode className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No products found</p>
            </div>
          ) : (
            filteredProducts.slice(0, 10).map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  onAddProduct(product);
                  setSearch("");
                }}
                className="w-full flex items-center justify-between p-4 bg-white rounded-xl border-2 border-slate-100 hover:border-[#d4a574] hover:bg-[#d4a574]/5 hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center gap-4">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                      <Barcode className="w-6 h-6" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-500">{product.sku} • Stock: {product.stock_quantity || 0}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#1e3a5f]">₹{product.selling_price?.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">GST: {product.gst_rate || 5}%</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}