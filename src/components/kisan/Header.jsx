import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Sprout, Bell, Bug, ArrowRight, Check, X, ChevronRight, Globe, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFarm } from "@/lib/farmContext";
import { t, LANGUAGES } from "@/lib/translations";

export default function Header({ user: propUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { farm, user: contextUser, language, setLanguage } = useFarm();
  const user = propUser || contextUser;

  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef(null);
  const langRef = useRef(null);

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const getPageLabel = (pathname, lang) => {
    switch (pathname) {
      case "/":
      case "/dashboard":
        return t(lang, "dashboard");
      case "/crop-doctor":
        return t(lang, "cropHealth");
      case "/harvest-guardian":
        return t(lang, "harvestGuardian");
      case "/outbreak-radar":
        return t(lang, "outbreakRadar");
      case "/market-copilot":
        return t(lang, "marketCopilot");
      case "/chat":
      case "/ask-kisan-mitra":
        return t(lang, "aiAssistant");
      case "/conversations":
        return t(lang, "pastConversations");
      case "/preferences":
        return t(lang, "farmSettings");
      case "/profile":
        return t(lang, "farmerProfile");
      default:
        return pathname.startsWith("/admin") ? t(lang, "adminPanel") : t(lang, "dashboard");
    }
  };

  const currentPageLabel = getPageLabel(location.pathname, language);

  const isDashboard = location.pathname === "/" || location.pathname === "/dashboard";

  useEffect(() => {
    base44.entities.DiseaseAlert.filter({ active: true })
      .then((data) => {
        if (data && data.length > 0) setAlerts(data);
        else {
          setAlerts([
            { id: "1", disease_name: "Brown Plant Hopper", crop: "Rice", severity: "High", location: "Ernakulam District", report_date: new Date().toISOString() },
            { id: "2", disease_name: "Late Blight Advisory", crop: "Potato", severity: "Moderate", location: "Thrissur Region", report_date: new Date().toISOString() },
            { id: "3", disease_name: "Harvest Window Approaching", crop: "Rice", severity: "Low", location: "Varikoli, Kerala", report_date: new Date().toISOString() },
          ]);
        }
      })
      .catch(() => {
        setAlerts([
          { id: "1", disease_name: "Brown Plant Hopper", crop: "Rice", severity: "High", location: "Ernakulam District", report_date: new Date().toISOString() },
          { id: "2", disease_name: "Late Blight Advisory", crop: "Potato", severity: "Moderate", location: "Thrissur Region", report_date: new Date().toISOString() },
          { id: "3", disease_name: "Harvest Window Approaching", crop: "Rice", severity: "Low", location: "Varikoli, Kerala", report_date: new Date().toISOString() },
        ]);
      });
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const alertCount = alerts.length;

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E1E8E4] transition-all">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left Branding & Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Mobile Brand */}
          <div className="flex items-center gap-2 lg:hidden min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#087F5B] flex items-center justify-center shadow-xs shrink-0">
              <Sprout className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex items-center gap-1.5 text-xs min-w-0">
              <span className="font-bold text-[#063F2E] tracking-tight shrink-0">KISAN MITRA</span>
              {!isDashboard && (
                <>
                  <span className="text-[#A1ACA5]">/</span>
                  <span className="font-semibold text-[#17211D] truncate">{currentPageLabel}</span>
                </>
              )}
            </div>
          </div>

          {/* Desktop Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-1.5 text-xs">
            {isDashboard ? (
              <span className="text-sm font-bold text-[#17211D] tracking-tight">
                {t(language, "dashboard")}
              </span>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="text-[#65736C] hover:text-[#063F2E] font-medium transition-colors"
                >
                  {t(language, "dashboard")}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-[#A1ACA5] shrink-0" />
                <span className="font-semibold text-[#17211D]">{currentPageLabel}</span>
              </>
            )}
          </nav>
        </div>

        {/* Right Controls: Language Translator & Notification Bell */}
        <div className="flex items-center gap-2">
          {/* Top Header Language Translator */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-white hover:bg-[#F6F8F5] text-xs font-semibold text-[#17211D] transition-all cursor-pointer border border-[#E1E8E4]"
              title={t(language, "selectLanguage")}
            >
              <Globe className="w-3.5 h-3.5 text-[#087F5B]" />
              <span className="hidden sm:inline">{currentLangObj.label}</span>
              <span className="sm:hidden font-medium text-[11px]">{currentLangObj.short}</span>
              <ChevronDown className={`w-3 h-3 text-[#65736C] transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#E1E8E4] py-1.5 text-[#17211D] z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-[#E1E8E4] text-[10px] font-bold text-[#65736C] uppercase tracking-wider">
                  {t(language, "selectLanguage")}
                </div>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      setLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-[#F6F8F5] cursor-pointer transition-colors ${
                      language === l.code ? "bg-[#DDF5EA] font-bold text-[#063F2E]" : ""
                    }`}
                  >
                    <span className="font-medium">{l.native}</span>
                    <span className="text-[11px] text-[#65736C] flex items-center gap-1.5">
                      {l.label}
                      {language === l.code && <Check className="w-3.5 h-3.5 text-[#087F5B]" />}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Bell Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[#65736C] hover:bg-[#F6F8F5] hover:text-[#063F2E] transition-all cursor-pointer border border-[#E1E8E4]"
              title={t(language, "notifications")}
            >
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#D94A4A] text-white text-[9px] font-bold flex items-center justify-center shadow-xs ring-2 ring-white">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {open && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl shadow-lg border border-[#E1E8E4] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 border-b border-[#E1E8E4] flex items-center justify-between bg-[#F6F8F5]">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#063F2E]" />
                    <h3 className="text-xs font-bold text-[#17211D] uppercase tracking-wider">
                      {t(language, "alertsAndAdvisories")}
                    </h3>
                    <span className="bg-[#DDF5EA] text-[#063F2E] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {alertCount} {t(language, "active")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-[#65736C] hover:text-[#17211D] p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Notification Items List */}
                <div className="divide-y divide-[#E1E8E4] max-h-80 overflow-y-auto">
                  {alerts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setOpen(false);
                        navigate(item.severity === "High" ? "/outbreak-radar" : "/harvest-guardian");
                      }}
                      className="p-3.5 hover:bg-[#DDF5EA]/30 transition-colors cursor-pointer flex items-start gap-3"
                    >
                      <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5 border border-red-100">
                        <Bug className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-[#17211D] truncate">
                            {item.disease_name || item.disease}
                          </p>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              item.severity === "High"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {item.severity}
                          </span>
                        </div>
                        <p className="text-xs text-[#65736C] mt-0.5 truncate">
                          {item.location} • {t(language, "crop")}: {item.crop || "Rice"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Links */}
                <div className="p-3 bg-[#F6F8F5] border-t border-[#E1E8E4] flex items-center justify-between text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setAlerts([]);
                      setOpen(false);
                    }}
                    className="text-[#65736C] hover:text-[#17211D] flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> {t(language, "clearAll")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate("/outbreak-radar");
                    }}
                    className="text-[#063F2E] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    {t(language, "viewOutbreakRadar")} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}