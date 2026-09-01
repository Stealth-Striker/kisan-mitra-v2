import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, Bell, Bug, ArrowRight, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Header({ user }) {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const alertCount = alerts.length;

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#E1E8E4] transition-all">
      <div className="flex items-center justify-between px-6 lg:px-8 h-16">
        {/* Left Branding */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#005A3C] flex items-center justify-center lg:hidden shadow-sm">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#005A3C] leading-none">
              KISAN MITRA
            </h1>
          </div>
          <span className="hidden md:inline-block w-px h-5 bg-[#E1E8E4]" />
          <p className="hidden md:block text-xs font-medium text-[#66736D]">
            Multilingual Voice &amp; Chat Farming Intelligence
          </p>
        </div>

        {/* Right Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-[#66736D] hover:bg-[#E8F8F1] hover:text-[#005A3C] transition-all cursor-pointer border border-transparent hover:border-[#E1E8E4]"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#DC2626] text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs ring-2 ring-white">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Popover */}
          {open && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E1E8E4] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-[#E1E8E4] flex items-center justify-between bg-[#F7F9F7]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#005A3C]" />
                  <h3 className="text-sm font-bold text-[#17201C]">Alerts &amp; Advisories</h3>
                  <span className="bg-[#E8F8F1] text-[#005A3C] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {alertCount} New
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-[#66736D] hover:text-[#17201C] p-1 rounded-lg hover:bg-gray-200/50 transition-colors"
                >
                  <X className="w-4 h-4" />
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
                    className="p-3.5 hover:bg-[#E8F8F1]/40 transition-colors cursor-pointer flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bug className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-[#17201C] truncate">{item.disease_name || item.disease}</p>
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
                      <p className="text-xs text-[#66736D] mt-0.5 truncate">
                        {item.location} • Affects: {item.crop || "Rice"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Links */}
              <div className="p-3 bg-[#F7F9F7] border-t border-[#E1E8E4] flex items-center justify-between text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAlerts([]);
                    setOpen(false);
                  }}
                  className="text-[#66736D] hover:text-[#17201C] flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Clear All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate("/outbreak-radar");
                  }}
                  className="text-[#005A3C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View Outbreak Radar <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}