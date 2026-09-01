import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sprout,
  LayoutGrid,
  Settings,
  MessageSquare,
  MapPin,
  Calendar,
  Globe,
  LogOut,
  ChevronDown,
  Shield,
  User as UserIcon,
  Phone,
  Users,
} from "lucide-react";
import { useFarm } from "@/lib/farmContext";
import { LANGUAGES, t } from "@/lib/translations";
import { base44 } from "@/api/base44Client";

export default function Sidebar({ user }) {
  const location = useLocation();
  const { farm, language, setLanguage } = useFarm();
  const [langOpen, setLangOpen] = useState(false);

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = "/login";
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <aside
      className="km-sidebar flex flex-col w-64 shrink-0 h-screen sticky top-0 text-white z-30 select-none overflow-hidden"
      style={{ background: "#002D1F" }}
    >
      {/* Branding */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3.5 shrink-0">
        <div className="w-11 h-11 rounded-full bg-[#0B8F62] flex items-center justify-center shrink-0 shadow-md">
          <Sprout className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-wide text-white leading-none">KISAN MITRA</h1>
          <p className="text-[11px] text-emerald-200/70 mt-1 font-medium">AI Farming Companion</p>
        </div>
      </div>

      {/* Overview Button */}
      <div className="px-3 mb-3 shrink-0">
        <Link
          to="/dashboard"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
            location.pathname === "/dashboard"
              ? "bg-[#0B8F62] text-white shadow-lg"
              : "text-emerald-100/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <LayoutGrid className="w-5 h-5 shrink-0" />
          <span>{t(language, "overview")}</span>
        </Link>
      </div>

      {/* MY PROFILE Section */}
      <div className="px-5 mb-1.5 text-[10px] uppercase tracking-widest font-bold text-emerald-200/50 shrink-0">
        MY PROFILE
      </div>

      {/* MY PROFILE Card Box */}
      <div className="mx-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 text-xs text-white/90 font-medium shrink-0">
        <div className="flex items-center gap-3 px-1">
          <UserIcon className="w-3.5 h-3.5 text-white/70 shrink-0" />
          <span className="truncate">{user?.full_name || "Ramesh"}</span>
        </div>
        <div className="flex items-center gap-3 px-1">
          <Phone className="w-3.5 h-3.5 text-white/70 shrink-0" />
          <span className="truncate">{user?.phone || "+91 98765 43210"}</span>
        </div>
        <div className="flex items-center gap-3 px-1">
          <MapPin className="w-3.5 h-3.5 text-white/70 shrink-0" />
          <span className="truncate">{farm ? `${farm.location || "Varikoli"}, ${farm.state || "Kerala"}` : "Varikoli, Kerala"}</span>
        </div>
        <div className="flex items-center gap-3 px-1">
          <Calendar className="w-3.5 h-3.5 text-white/70 shrink-0" />
          <span className="truncate">{farm ? `${farm.farm_size || 1} ${farm.farm_size_unit || "Acre"}` : "1 Acre"}</span>
        </div>
        <div className="flex items-center gap-3 px-1">
          <Users className="w-3.5 h-3.5 text-white/70 shrink-0" />
          <span className="truncate">Farmer since {farm?.farmer_since || "2018"}</span>
        </div>

        {/* Divider & Language Selector */}
        <div className="border-t border-white/10 pt-2 relative">
          <button
            type="button"
            onClick={() => setLangOpen(!langOpen)}
            className="w-full flex items-center justify-between text-left hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-3.5 h-3.5 text-white/70 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">{t(language, "language")}</p>
                <p className="text-[11px] text-white/60">{currentLangObj.label}</p>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform ${langOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Language Dropdown Menu */}
          {langOpen && (
            <div className="absolute left-0 right-0 bottom-full mb-2 bg-white rounded-xl shadow-2xl border border-[#E1E8E4] py-1 text-[#17201C] z-50 animate-in fade-in zoom-in-95 duration-150">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLanguage(l.code);
                    setLangOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-[#E8F8F1] cursor-pointer transition-colors ${
                    language === l.code ? "bg-[#E8F8F1] font-semibold text-[#005A3C]" : ""
                  }`}
                >
                  <span className="font-medium text-[#17201C]">{l.native}</span>
                  <span className="text-[10px] text-muted-foreground">{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ACTIVITY Section */}
      <div className="px-5 mt-4 mb-1.5 text-[10px] uppercase tracking-widest font-bold text-emerald-200/50 shrink-0">
        ACTIVITY
      </div>
      <div className="px-3 shrink-0">
        <Link
          to="/conversations"
          className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            location.pathname === "/conversations"
              ? "bg-[#0B8F62] text-white shadow-md"
              : "text-emerald-100/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>{t(language, "conversationHistory")}</span>
        </Link>
      </div>

      {/* SETTINGS Section */}
      <div className="px-5 mt-3 mb-1.5 text-[10px] uppercase tracking-widest font-bold text-emerald-200/50 shrink-0">
        SETTINGS
      </div>
      <div className="px-3 space-y-1 shrink-0">
        <Link
          to="/preferences"
          className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            location.pathname === "/preferences"
              ? "bg-[#0B8F62] text-white shadow-md"
              : "text-emerald-100/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>{t(language, "preferences")}</span>
        </Link>
        {user?.role === "admin" && (
          <Link
            to="/admin"
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-emerald-100/70 hover:bg-white/10 hover:text-white transition-all font-medium"
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>Admin Panel</span>
          </Link>
        )}
      </div>

      {/* Bottom Landscape Image */}
      <div className="mt-auto pt-2 relative shrink-0">
        <div className="h-20 overflow-hidden relative">
          <img
            src="/sidebar-landscape.jpg"
            alt="Agricultural Landscape"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#002D1F]/60 via-transparent to-[#002D1F]" />
        </div>

        {/* Logout */}
        <div className="px-4 pb-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-2 py-1.5 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-all text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{t(language, "logout")}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}