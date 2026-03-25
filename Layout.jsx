import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Store,
  Bell,
  Search,
  Brain

} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.log("Not logged in");
    }
  };

  const navigation = [
    { name: "Dashboard", href: "Dashboard", icon: LayoutDashboard, group: "main" },
    { name: "POS Billing", href: "POS", icon: ShoppingCart, group: "main", highlight: true },
    { name: "Products", href: "Products", icon: Package, group: "inventory" },
    { name: "Inventory", href: "Inventory", icon: Package, group: "inventory" },
    { name: "Purchases", href: "Purchases", icon: Store, group: "inventory" },
    { name: "Customers", href: "Customers", icon: Users, group: "crm" },
    { name: "Marketing", href: "Marketing", icon: Bell, group: "crm" },
    { name: "Suppliers", href: "Suppliers", icon: Truck, group: "crm" },
    { name: "Reports", href: "Reports", icon: BarChart3, group: "insights" },
    { name: "AI Insights", href: "AIInsights", icon: Brain, group: "insights" },
    { name: "Settings", href: "Settings", icon: Settings, group: "config" },
  ];

  const isActive = (pageName) => currentPageName === pageName;

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        :root {
          --primary: 222 47% 25%;
          --primary-foreground: 210 40% 98%;
          --accent: 30 45% 65%;
          --gradient-start: #1e3a5f;
          --gradient-end: #0f1f33;
          --gold-start: #d4a574;
          --gold-end: #c49464;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Smooth transitions */
        * {
          transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }
      `}</style>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 lg:w-72 bg-gradient-to-br from-[#1e3a5f] via-[#16304a] to-[#0f1f33] shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10 bg-black/10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-[#d4a574] to-[#c49464] rounded-2xl flex items-center justify-center shadow-lg">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-xl tracking-tight">HOME FASHION</h1>
                <p className="text-[#d4a574] text-xs font-medium">Textile ERP System</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
            {navigation.map((item, index) => {
              const prevItem = navigation[index - 1];
              const showDivider = index > 0 && prevItem?.group !== item.group;
              return (
                <React.Fragment key={item.name}>
                  {showDivider && <div className="my-2 border-t border-white/10" />}
                  <Link
                    to={createPageUrl(item.href)}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative ${
                      isActive(item.href)
                        ? "bg-white/15 text-white shadow-sm"
                        : item.highlight
                        ? "text-[#d4a574] hover:bg-white/10 hover:text-white"
                        : "text-white/65 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    {isActive(item.href) && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#d4a574] rounded-r-full" />
                    )}
                    <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive(item.href) ? "text-[#d4a574]" : item.highlight ? "text-[#d4a574]" : "group-hover:text-[#d4a574]"}`} style={{ width: '18px', height: '18px' }} />
                    <span className={`font-medium text-sm ${isActive(item.href) ? "text-white" : ""}`}>{item.name}</span>
                    {item.highlight && !isActive(item.href) && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#d4a574] animate-pulse" />
                    )}
                  </Link>
                </React.Fragment>
              );
            })}
          </nav>

          {/* User section */}
          {user && (
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-[#d4a574] to-[#c49464] rounded-full flex items-center justify-center text-white font-semibold">
                  {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{user.full_name || "User"}</p>
                  <p className="text-white/50 text-xs truncate">{user.role || "Staff"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-3 lg:px-8 h-14 lg:h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2 w-80">
                <Search className="w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search products, customers..."
                  className="border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#1e3a5f] to-[#0f1f33] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Settings")}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}