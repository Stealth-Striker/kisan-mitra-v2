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
  AlertTriangle,
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
            {t(language, "namaskaram")}, {user?.full_name || "Ramesh"}
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
            <span>{crop} Cultivation</span>
          </div>
        </div>
      </div>

      {/* ── HERO COMMAND CARD: Harvest Readiness & Urgent Recommendation ── */}
      <div className="bg-white rounded-2xl border border-[#E1E8E4] p-6 sm:p-7 shadow-xs relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-[#DDF5EA]/60 to-transparent pointer-events-none rounded-full blur-2xl -mr-20 -mt-20" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Hero Narrative & CTA (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#087F5B]">
              <span>Recommended Harvest Window: Sep 16–19</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#17211D] leading-tight">
                Your {crop.toLowerCase()} crop is approaching its optimal harvest window.
              </h2>
              <p className="text-sm text-[#65736C] mt-2 leading-relaxed max-w-2xl">
                Thermal heat accumulation (GDD) indicates peak kernel maturity. Ambient moisture is dropping into the safe threshold, and a 4-day dry weather window provides ideal harvesting conditions before regional rain risks increase.
              </p>
            </div>

            {/* Quick Supporting Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
                <p className="text-[11px] font-medium text-[#65736C]">Grain Moisture</p>
                <p className="text-base font-bold text-[#17211D] mt-0.5">17.7%</p>
                <span className="text-[10px] text-[#087F5B] font-semibold">Target 14.5%</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
                <p className="text-[11px] font-medium text-[#65736C]">Weather Safety</p>
                <p className="text-base font-bold text-[#087F5B] mt-0.5">92%</p>
                <span className="text-[10px] text-[#65736C]">4-Day Dry Sun</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
                <p className="text-[11px] font-medium text-[#65736C]">Field Ground</p>
                <p className="text-base font-bold text-[#17211D] mt-0.5">Firm Dry</p>
                <span className="text-[10px] text-[#65736C]">Combine Ready</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
                <p className="text-[11px] font-medium text-[#65736C]">Shatter Risk</p>
                <p className="text-base font-bold text-[#087F5B] mt-0.5">Minimal</p>
                <span className="text-[10px] text-[#65736C]">Harvest on time</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/harvest-guardian")}
                className="km-btn-primary"
              >
                <span>Prepare for Harvest</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Big Metric Dial (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-[#F6F8F5] rounded-2xl border border-[#E1E8E4]">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Radial circle representation */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-[#E1E8E4]"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-[#087F5B]"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset="8"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-4xl font-extrabold tracking-tight text-[#063F2E]">98%</span>
                <span className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider mt-0.5">
                  Maturity
                </span>
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs font-bold text-[#17211D]">Physiological Ripening</p>
              <p className="text-[11px] text-[#65736C]">Ideal Harvest: Sep 16–19</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── BENTO GRID: 4 CORE AGRONOMIC MODULES ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Module 1: Crop Health / Doctor */}
        <div className="km-card p-5 flex flex-col justify-between hover:border-[#087F5B]/30 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-[#65736C] uppercase tracking-wider">Crop Health</span>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#DDF5EA] text-[#063F2E] flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <p className="text-base font-bold text-[#17211D]">Plant Diagnostics</p>
                <p className="text-xs text-[#65736C]">Visual leaf pathology AI</p>
              </div>
            </div>

            <p className="text-xs text-[#65736C] leading-relaxed">
              {recentDiagnosis
                ? `Last diagnosis: ${recentDiagnosis.disease} (${recentDiagnosis.confidence || 94}% confidence).`
                : "No active fungal or bacterial leaf infections reported in your plot."}
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E1E8E4]/60">
            <Link
              to="/crop-doctor"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087F5B] hover:text-[#063F2E] transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan Leaf Photo</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Link>
          </div>
        </div>

        {/* Module 2: Outbreak Radar */}
        <div className="km-card p-5 flex flex-col justify-between hover:border-[#087F5B]/30 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-[#65736C] uppercase tracking-wider">Outbreak Radar</span>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#E99B16] flex items-center justify-center shrink-0 border border-amber-200/50">
                <Radar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-base font-bold text-[#17211D]">Regional Radar</p>
                <p className="text-xs text-[#65736C]">{nearestAlert.location}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs space-y-1">
              <p className="font-bold text-[#92540C] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {nearestAlert.disease_name}
              </p>
              <p className="text-[11px] text-[#65736C]">
                Reported {nearestAlert.distance_km || 14} km away. Monitor lower tillers for hopper nymphs.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E1E8E4]/60">
            <Link
              to="/outbreak-radar"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087F5B] hover:text-[#063F2E] transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Inspect Live Threat Map</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Link>
          </div>
        </div>

        {/* Module 3: Weather & Field Spray Window */}
        <div className="km-card p-5 flex flex-col justify-between hover:border-[#087F5B]/30 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-[#65736C] uppercase tracking-wider">Field Weather</span>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#DDF5EA] text-[#063F2E] flex items-center justify-center shrink-0">
                <SunMedium className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-base font-bold text-[#17211D]">28.4°C • Sunny</p>
                <p className="text-xs text-[#65736C]">Humidity: 62% (Favorable)</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-[#65736C]">
              <div className="flex justify-between">
                <span>Rain Risk:</span>
                <span className="font-semibold text-[#087F5B]">5% (Low next 72h)</span>
              </div>
              <div className="flex justify-between">
                <span>Field Spraying:</span>
                <span className="font-semibold text-[#17211D]">Optimal morning hours</span>
              </div>
              <div className="flex justify-between">
                <span>Harvest Drying:</span>
                <span className="font-semibold text-[#087F5B]">8.5 hrs daylight</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E1E8E4]/60">
            <Link
              to="/harvest-guardian"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087F5B] hover:text-[#063F2E] transition-colors"
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>View 7-Day Weather Radar</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Link>
          </div>
        </div>

        {/* Module 4: Market Copilot Benchmark */}
        <div className="km-card p-5 flex flex-col justify-between hover:border-[#087F5B]/30 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-[#65736C] uppercase tracking-wider">Commerce</span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#DDF5EA] text-[#063F2E] flex items-center justify-center shrink-0">
                <LineChart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-[#17211D]">{marketPrice}</p>
                <p className="text-xs text-[#65736C]">Regional Benchmark</p>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] text-xs space-y-1">
              <p className="font-semibold text-[#17211D] flex items-center justify-between">
                <span>Peak Market:</span>
                <strong className="text-[#087F5B]">₹34.60/kg</strong>
              </p>
              <p className="text-[11px] text-[#65736C]">
                Strategy: Hold harvest for 3–4 days to capture peak arrival prices.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E1E8E4]/60">
            <Link
              to="/market-copilot"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087F5B] hover:text-[#063F2E] transition-colors"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Open Market Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}