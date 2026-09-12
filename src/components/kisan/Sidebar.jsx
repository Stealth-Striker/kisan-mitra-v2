import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sprout,
  LayoutGrid,
  Stethoscope,
  CalendarClock,
  Radar,
  LineChart,
  Bot,
  MessageSquare,
  Settings,
  Shield,
  LogOut,
  Globe,
  ChevronDown,
  MapPin,
  Check,
} from "lucide-react";
import { useFarm } from "@/lib/farmContext";
import { LANGUAGES, t } from "@/lib/translations";
import { base44 } from "@/api/base44Client";

export default function Sidebar({ user: propUser }) {
  const location = useLocation();
  const { farm, user: contextUser, language, setLanguage } = useFarm();
  const user = propUser || contextUser;
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    if (langOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [langOpen]);

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = "/login";
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const crop = farm?.primary_crop || "Rice";

  const isActive = (path) => {
    if (path === "/chat") {
      return location.pathname === "/chat" || location.pathname === "/ask-kisan-mitra";
    }
    return location.pathname === path;
  };

  return (
    <aside
      className="km-sidebar flex flex-col w-64 shrink-0 h-screen sticky top-0 text-white z-30 select-none overflow-hidden"
      style={{ background: "#032C21" }}
    >
      {/* ── Brand Header ────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3 shrink-0 border-b border-white/[0.08]">
        <div className="w-10 h-10 rounded-xl bg-[#087F5B] flex items-center justify-center shrink-0 shadow-xs">
          <Sprout className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-wide text-white leading-none">KISAN MITRA</div>
          <p className="text-[11px] text-[#DDF5EA]/70 mt-1 font-medium">AI Farming Companion</p>
        </div>
      </div>

      {/* ── Primary Navigation ──────────────────────────────────── */}
      <div className="px-3 py-4 space-y-5 flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Dashboard */}
        <div className="space-y-1">
          <Link
            to="/dashboard"
            className={`km-nav-item ${isActive("/dashboard") ? "km-nav-item-active" : ""}`}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span>{t(language, "dashboard")}</span>
          </Link>
        </div>

        {/* Crop Management */}
        <div className="space-y-1">
          <div className="km-section-label px-3 mb-1.5">Crop</div>
          <Link
            to="/crop-doctor"
            className={`km-nav-item ${isActive("/crop-doctor") ? "km-nav-item-active" : ""}`}
          >
            <Stethoscope className="w-4 h-4 shrink-0" />
            <span>Crop Health</span>
          </Link>
          <Link
            to="/harvest-guardian"
            className={`km-nav-item ${isActive("/harvest-guardian") ? "km-nav-item-active" : ""}`}
          >
            <CalendarClock className="w-4 h-4 shrink-0" />
            <span>Harvest Guardian</span>
          </Link>
        </div>

        {/* Farm Monitoring */}
        <div className="space-y-1">
          <div className="km-section-label px-3 mb-1.5">Farm Monitor</div>
          <Link
            to="/outbreak-radar"
            className={`km-nav-item ${isActive("/outbreak-radar") ? "km-nav-item-active" : ""}`}
          >
            <Radar className="w-4 h-4 shrink-0" />
            <span>Outbreak Radar</span>
          </Link>
        </div>

        {/* Market Intelligence */}
        <div className="space-y-1">
          <div className="km-section-label px-3 mb-1.5">Commerce</div>
          <Link
            to="/market-copilot"
            className={`km-nav-item ${isActive("/market-copilot") ? "km-nav-item-active" : ""}`}
          >
            <LineChart className="w-4 h-4 shrink-0" />
            <span>Market Copilot</span>
          </Link>
        </div>

        {/* AI Assistant */}
        <div className="space-y-1">
          <div className="km-section-label px-3 mb-1.5">Intelligence</div>
          <Link
            to="/chat"
            className={`km-nav-item ${isActive("/chat") ? "km-nav-item-active" : ""}`}
          >
            <Bot className="w-4 h-4 shrink-0" />
            <span>Ask Kisan Mitra</span>
          </Link>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.08] pt-3 space-y-1">
          <div className="km-section-label px-3 mb-1.5">Activity & Settings</div>
          <Link
            to="/conversations"
            className={`km-nav-item ${isActive("/conversations") ? "km-nav-item-active" : ""}`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>{t(language, "conversationHistory")}</span>
          </Link>
          <Link
            to="/preferences"
            className={`km-nav-item ${isActive("/preferences") ? "km-nav-item-active" : ""}`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>{t(language, "preferences")}</span>
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className={`km-nav-item ${location.pathname.startsWith("/admin") ? "km-nav-item-active" : ""}`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Admin Panel</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Farmer Profile & Actions Footer ───────────────────── */}
      <div className="p-3 border-t border-white/[0.08] shrink-0">
        <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2.5">
          {/* User Profile */}
          <Link
            to="/profile"
            className="flex items-center gap-2.5 min-w-0 group hover:opacity-90 transition-opacity"
            title="View Farmer Profile"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user?.full_name || (user?.email ? user.email.split("@")[0] : "Farmer")}
                className="w-8 h-8 rounded-xl object-cover border border-[#16A36F]/40 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[#087F5B]/40 border border-[#16A36F]/40 flex items-center justify-center text-[#DDF5EA] font-bold text-xs shrink-0 shadow-xs group-hover:bg-[#087F5B]">
                {(user?.full_name || (user?.email ? user.email.split("@")[0] : "F")).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white tracking-tight leading-tight truncate group-hover:text-emerald-300 transition-colors">
                {user?.full_name || (user?.email ? user.email.split("@")[0] : "Farmer")}
              </p>
              <p className="text-[11px] text-emerald-200/60 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0 text-emerald-400/80" />
                <span>{farm?.location || "Varikoli"} • {crop}</span>
              </p>
            </div>
          </Link>

          {/* Controls Bar: Language & Logout */}
          <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/[0.06]" ref={langRef}>
            {/* Language Selector */}
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-emerald-100/90 transition-all cursor-pointer border border-white/[0.06]"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Globe className="w-3 h-3 text-emerald-300 shrink-0" />
                  <span className="truncate">{currentLangObj.label}</span>
                </div>
                <ChevronDown className={`w-3 h-3 text-white/50 shrink-0 transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Language Options Menu */}
              {langOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-44 bg-white rounded-2xl shadow-xl border border-[#E1E8E4] py-1.5 text-[#17211D] z-50">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code);
                        setLangOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-[#F6F8F5] cursor-pointer transition-colors ${
                        language === l.code ? "bg-[#DDF5EA] font-semibold text-[#063F2E]" : ""
                      }`}
                    >
                      <span className="font-medium">{l.native}</span>
                      <span className="text-[11px] text-[#65736C] flex items-center gap-1">
                        {l.label}
                        {language === l.code && <Check className="w-3 h-3 text-[#087F5B]" />}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logout Action */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-white/60 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
              title="Logout from session"
            >
              <LogOut className="w-3 h-3" />
              <span>{t(language, "logout")}</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}