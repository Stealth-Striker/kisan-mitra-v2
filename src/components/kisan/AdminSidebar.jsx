import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Bug,
  TrendingUp,
  MessageSquare,
  ScrollText,
  LogOut,
  Shield,
  Sprout,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const NAV = [
  { to: "/dashboard", icon: Sprout, label: "Farmer View" },
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/farmers", icon: Users, label: "Farmers" },
  { to: "/admin/disease-alerts", icon: Bug, label: "Disease Alerts" },
  { to: "/admin/market-data", icon: TrendingUp, label: "Market Data" },
  { to: "/admin/conversations", icon: MessageSquare, label: "Conversations" },
  { to: "/admin/audit", icon: ScrollText, label: "Audit Logs" },
];

export default function AdminSidebar() {
  const location = useLocation();

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = "/login";
  };

  return (
    <aside
      className="km-sidebar flex flex-col w-64 shrink-0 h-screen sticky top-0 text-white z-30 select-none overflow-hidden"
      style={{ background: "#002D1F" }}
    >
      {/* Branding */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3.5 shrink-0">
        <div className="w-11 h-11 rounded-full bg-[#0B8F62] flex items-center justify-center shrink-0 shadow-md">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-wide text-white leading-none">ADMIN</h1>
          <p className="text-[11px] text-emerald-200/70 mt-1 font-medium">Kisan Mitra Console</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-3 mb-2 text-[10px] uppercase tracking-widest font-bold text-emerald-200/50 shrink-0 pl-5 pt-2">
        ADMIN MENU
      </div>

      <nav className="px-3 space-y-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-1">
        {NAV.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-[#0B8F62] text-white shadow-md font-semibold"
                  : "text-emerald-100/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Landscape Image & Logout */}
      <div className="mt-auto pt-2 relative shrink-0">
        <div className="h-20 overflow-hidden relative">
          <img
            src="/sidebar-landscape.jpg"
            alt="Agricultural Landscape"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#002D1F]/60 via-transparent to-[#002D1F]" />
        </div>

        <div className="px-4 pb-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-2 py-1.5 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-all text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}