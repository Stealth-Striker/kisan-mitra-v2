import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutGrid, Stethoscope, Radar, LineChart, Bot } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { FarmProvider, useFarm } from "@/lib/farmContext";
import { t } from "@/lib/translations";

function FarmerLayoutContent() {
  const { user, setUser, refresh, language } = useFarm();
  const location = useLocation();

  const mobileNavItems = [
    { label: t(language, "overview"), path: "/dashboard", icon: LayoutGrid },
    { label: t(language, "cropSection"), path: "/crop-doctor", icon: Stethoscope },
    { label: t(language, "radar"), path: "/outbreak-radar", icon: Radar },
    { label: t(language, "market"), path: "/market-copilot", icon: LineChart },
    { label: t(language, "assistant"), path: "/chat", icon: Bot },
  ];

  const isCurrentActive = (p) => {
    if (p === "/chat") return location.pathname === "/chat" || location.pathname === "/ask-kisan-mitra";
    return location.pathname === p;
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8F5]">
      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block">
        <Sidebar user={user} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Header user={user} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
          <Outlet context={{ user, setUser, refreshUser: refresh }} />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E1E8E4] px-2 py-1.5 flex items-center justify-around shadow-sm"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isCurrentActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-medium transition-all ${
                active
                  ? "text-[#063F2E] font-bold"
                  : "text-[#65736C] hover:text-[#17211D]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  active ? "bg-[#DDF5EA] text-[#063F2E]" : "text-[#65736C]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[10px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function FarmerLayout() {
  return (
    <FarmProvider>
      <FarmerLayoutContent />
    </FarmProvider>
  );
}