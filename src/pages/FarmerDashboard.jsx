import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  Ruler,
  CalendarClock,
  ArrowRight,
  ShieldAlert,
  Stethoscope,
  Radar,
  LineChart,
  SunMedium,
  Camera,
} from "lucide-react";
import { useFarm } from "@/lib/farmContext";
import { t } from "@/lib/translations";
import { base44 } from "@/api/base44Client";
import SEO from "@/components/SEO";

export default function FarmerDashboard() {
  const { farm, user, language } = useFarm();
  const navigate = useNavigate();

  const [nearbyAlerts, setNearbyAlerts] = useState(3);
  const [nearestAlert, setNearestAlert] = useState({
    disease_name: "Brown Plant Hopper",
    location: "Kalamassery Belt",
    distance_km: 14,
    severity: "High",
  });
  const [marketPrice, setMarketPrice] = useState("₹33.18/kg");
  const [recentDiagnosis, setRecentDiagnosis] = useState(null);

  const crop = farm?.primary_crop || "Rice";
  const locationStr = farm ? `${farm.location || "Varikoli"}, ${farm.state || "Kerala"}` : "Varikoli, Kerala";
  const farmSize = farm ? `${farm.farm_size || 1} ${farm.farm_size_unit || "Acre"}` : "1 Acre";

  useEffect(() => {
    base44.entities.DiseaseAlert.filter({ active: true })
      .then((alerts) => {
        if (alerts && alerts.length > 0) {
          setNearbyAlerts(alerts.length);
          setNearestAlert(alerts[0]);
        }
      })
      .catch(() => {});

    base44.entities.MarketPrice.filter({ crop })
      .then((prices) => {
        if (prices.length > 0 && prices[0].avg_price) {
          setMarketPrice(`₹${Number(prices[0].avg_price).toFixed(2)}/kg`);
        }
      })
      .catch(() => {});

    base44.entities.CropDiagnosis.filter({}, "-created_date", 1)
      .then((history) => {
        if (history && history.length > 0) {
          setRecentDiagnosis(history[0]);
        }
      })
      .catch(() => {});
  }, [crop]);

  const firstName = user?.full_name?.trim()
    ? user.full_name.trim().split(/\s+/)[0]
    : user?.name?.trim()
    ? user.name.trim().split(/\s+/)[0]
    : user?.email
    ? user.email.split("@")[0]
    : t(language, "farmer");

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      <SEO
        title="Farm Command Center"
        description="Intelligent daily farm command center: real-time crop health monitoring, harvest readiness predictions, regional pest radar, and market price benchmarks."
        canonicalPath="/dashboard"
      />

      {/* ── Top Header & Greeting Strip ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E8E4] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17211D]">
            {t(language, "namaskaram")}, {firstName}
          </h1>
        </div>

        {/* Farm Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#E1E8E4] text-xs font-medium text-[#17211D]">
            <MapPin className="w-3.5 h-3.5 text-[#087F5B]" />
            <span>{locationStr}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#E1E8E4] text-xs font-medium text-[#17211D]">
            <Ruler className="w-3.5 h-3.5 text-[#087F5B]" />
            <span>{farmSize}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#DDF5EA] border border-[#16A36F]/30 text-xs font-semibold text-[#063F2E]">
            <span>{t(language, "cultivation", { crop })}</span>
          </div>
        </div>
      </div>

      {/* ── HERO COMMAND CARD: Harvest Readiness ── */}
      <div className="bg-white rounded-2xl border border-[#E1E8E4] p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-[#DDF5EA]/50 to-transparent pointer-events-none rounded-full blur-2xl -mr-16 -mt-16" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Hero Narrative & Metrics (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#DDF5EA] text-[#063F2E] text-xs font-bold tracking-wide">
                {t(language, "optimalWindow")}
              </span>
              <span className="text-xs text-[#65736C]">{t(language, "dryWeatherActive")}</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17211D]">
                {t(language, "cropReadyForHarvest", { crop })}
              </h2>
              <p className="text-xs sm:text-sm text-[#65736C] mt-1">
                {t(language, "heroNarrative")}
              </p>
            </div>

            {/* Concise Supporting Metric Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
                <p className="text-[11px] font-medium text-[#65736C]">{t(language, "moisture")}</p>
                <p className="text-base font-bold text-[#17211D]">17.7%</p>
                <span className="text-[10px] text-[#087F5B] font-semibold">{t(language, "targetMoisture")}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
                <p className="text-[11px] font-medium text-[#65736C]">{t(language, "weatherSafety")}</p>
                <p className="text-base font-bold text-[#087F5B]">92%</p>
                <span className="text-[10px] text-[#65736C]">{t(language, "dryAndSunny")}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
                <p className="text-[11px] font-medium text-[#65736C]">{t(language, "groundTraction")}</p>
                <p className="text-base font-bold text-[#17211D]">{t(language, "firmDry")}</p>
                <span className="text-[10px] text-[#087F5B] font-semibold">{t(language, "harvesterReady")}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
                <p className="text-[11px] font-medium text-[#65736C]">{t(language, "shatterRisk")}</p>
                <p className="text-base font-bold text-[#087F5B]">{t(language, "low")}</p>
                <span className="text-[10px] text-[#65736C]">{t(language, "onSchedule")}</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => navigate("/harvest-guardian")}
                className="km-btn-primary py-2 px-4 text-xs font-bold"
              >
                <span>{t(language, "prepareForHarvest")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Compact Metric Dial (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 bg-[#F6F8F5] rounded-2xl border border-[#E1E8E4]">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-[#E1E8E4]"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-[#087F5B]"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset="5"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-3xl font-extrabold tracking-tight text-[#063F2E]">98%</span>
                <span className="text-[10px] font-bold text-[#65736C] uppercase tracking-wider">
                  {t(language, "maturity")}
                </span>
              </div>
            </div>
            <p className="text-xs font-bold text-[#17211D] mt-2">{t(language, "peakRipening")}</p>
          </div>
        </div>
      </div>

      {/* ── BENTO GRID: 4 CORE AGRONOMIC MODULES ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1: Crop Health */}
        <div className="km-card p-4 flex flex-col justify-between hover:border-[#087F5B]/40 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#65736C] uppercase tracking-wider">{t(language, "cropHealth")}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DDF5EA] text-[#063F2E]">
                {t(language, "active")}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#DDF5EA] text-[#063F2E] flex items-center justify-center shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#17211D]">{t(language, "plantDiagnostics")}</p>
                <p className="text-[11px] text-[#65736C]">
                  {recentDiagnosis ? recentDiagnosis.disease : t(language, "noActiveInfections")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E1E8E4]/60">
            <Link
              to="/crop-doctor"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#087F5B] hover:text-[#063F2E] transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t(language, "scanLeaf")}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Link>
          </div>
        </div>

        {/* Module 2: Outbreak Radar */}
        <div className="km-card p-4 flex flex-col justify-between hover:border-[#087F5B]/40 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#65736C] uppercase tracking-wider">{t(language, "outbreakRadar")}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-[#92540C] border border-amber-200/60">
                {nearestAlert.distance_km || 14} km
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#E99B16] flex items-center justify-center shrink-0 border border-amber-200/50">
                <Radar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#17211D] truncate max-w-[140px]">{nearestAlert.disease_name}</p>
                <p className="text-[11px] text-[#65736C]">{nearestAlert.location}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E1E8E4]/60">
            <Link
              to="/outbreak-radar"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#087F5B] hover:text-[#063F2E] transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t(language, "liveThreatMap")}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Link>
          </div>
        </div>

        {/* Module 3: Field Weather */}
        <div className="km-card p-4 flex flex-col justify-between hover:border-[#087F5B]/40 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#65736C] uppercase tracking-wider">{t(language, "fieldWeather")}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DDF5EA] text-[#063F2E]">
                {t(language, "favorable")}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#DDF5EA] text-[#063F2E] flex items-center justify-center shrink-0">
                <SunMedium className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#17211D]">{t(language, "weatherMetrics")}</p>
                <p className="text-[11px] text-[#65736C]">{t(language, "weatherDetails")}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E1E8E4]/60">
            <Link
              to="/harvest-guardian"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#087F5B] hover:text-[#063F2E] transition-colors"
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>{t(language, "sevenDayRadar")}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Link>
          </div>
        </div>

        {/* Module 4: Market Copilot */}
        <div className="km-card p-4 flex flex-col justify-between hover:border-[#087F5B]/40 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#65736C] uppercase tracking-wider">{t(language, "mandiRates")}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DDF5EA] text-[#063F2E]">
                +2.4%
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#DDF5EA] text-[#063F2E] flex items-center justify-center shrink-0">
                <LineChart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#17211D]">{marketPrice}</p>
                <p className="text-[11px] text-[#65736C]">{t(language, "peakPriceForecast")}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E1E8E4]/60">
            <Link
              to="/market-copilot"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#087F5B] hover:text-[#063F2E] transition-colors"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>{t(language, "marketCopilot")}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}