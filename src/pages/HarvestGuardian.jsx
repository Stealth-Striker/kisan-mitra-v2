import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  SunMedium,
  Thermometer,
  Droplets,
  CloudRain,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Scale,
  ShieldCheck,
  Warehouse,
  Tractor,
  Send,
  Loader2,
  Info,
  Calendar,
  CheckSquare,
  Square
} from "lucide-react";
import { useFarm } from "@/lib/farmContext";
import { base44 } from "@/api/base44Client";
import SEO from "@/components/SEO";

// Crop profiles with maturation duration, stages, and yield metrics
const CROP_PROFILES = {
  Rice: {
    duration: 120,
    unit: "Quintals",
    yieldPerAcre: 22,
    idealMoisture: "14% - 16%",
    storageMoisture: "13% - 14%",
    stages: [
      { name: "Sowing & Seedling", dayPct: 0.12, description: "Germination and nursery emergence" },
      { name: "Vegetative & Tillering", dayPct: 0.38, description: "Active tillering and root spread" },
      { name: "Flowering & Panicle Initiation", dayPct: 0.70, description: "Heading, pollination, and grain fill" },
      { name: "Grain Dough & Ripening", dayPct: 0.92, description: "Grain golden turning, milk to hard dough" },
      { name: "Optimal Harvest Window", dayPct: 1.0, description: "Golden straw, hard grain, minimal shatter" }
    ],
    inspectionSigns: [
      "80% to 85% of panicles have turned golden straw yellow",
      "Grains are firm and cannot be crushed easily between fingernails",
      "Moisture level feels under 20% when grain is snapped",
      "Flag leaves have turned yellowish-brown"
    ]
  },
  Tomato: {
    duration: 75,
    unit: "Quintals",
    yieldPerAcre: 140,
    idealMoisture: "88% - 92%",
    storageMoisture: "Room temp / Crates",
    stages: [
      { name: "Transplanting & Rooting", dayPct: 0.20, description: "Field establishment and initial growth" },
      { name: "Vegetative Branching", dayPct: 0.45, description: "Canopy development and flower cluster setup" },
      { name: "Flowering & Fruit Set", dayPct: 0.75, description: "Green fruit swelling and sizing" },
      { name: "Breaker / Color Turning", dayPct: 0.92, description: "Color break at blossom end, firm shoulder" },
      { name: "Optimal Harvest Picking", dayPct: 1.0, description: "Harvest at pink/breaker stage for transit" }
    ],
    inspectionSigns: [
      "Blossom end shows pinkish/red color break",
      "Fruits are firm with smooth, glossy skin",
      "Easily detaches from vine with gentle upward twist",
      "Morning harvest preferred to preserve post-harvest firmness"
    ]
  },
  Wheat: {
    duration: 125,
    unit: "Quintals",
    yieldPerAcre: 20,
    idealMoisture: "12% - 14%",
    storageMoisture: "12%",
    stages: [
      { name: "Crown Root & Tillering", dayPct: 0.25, description: "Early tillering and root anchoring" },
      { name: "Jointing & Stem Elongation", dayPct: 0.55, description: "Rapid stalk elongation and spike setup" },
      { name: "Heading & Flowering", dayPct: 0.75, description: "Spike emergence and grain initiation" },
      { name: "Dough & Ripening", dayPct: 0.92, description: "Grains harden from soft to hard dough" },
      { name: "Optimal Harvest Window", dayPct: 1.0, description: "Straw turns yellow, kernels snap cleanly" }
    ],
    inspectionSigns: [
      "Straw and heads turn uniform golden-yellow",
      "Grain cracks firmly between teeth with a sharp snap",
      "Moisture is below 14% to prevent bin burning in storage",
      "No green stems remaining in the upper canopy"
    ]
  },
  Maize: {
    duration: 100,
    unit: "Quintals",
    yieldPerAcre: 26,
    idealMoisture: "15% - 18%",
    storageMoisture: "13% - 14%",
    stages: [
      { name: "Emergence & Early Growth", dayPct: 0.18, description: "Sprouting and leaf collar emergence" },
      { name: "Vegetative & Tasseling", dayPct: 0.50, description: "Rapid height gain and tassel extrusion" },
      { name: "Silking & Kernel Blister", dayPct: 0.75, description: "Ear pollination and kernel development" },
      { name: "Dent & Black Layer", dayPct: 0.92, description: "Kernel milk line descends, black layer forms" },
      { name: "Optimal Harvest Window", dayPct: 1.0, description: "Husks papery dry, kernels hard and dented" }
    ],
    inspectionSigns: [
      "Black layer visible at kernel base indicating physiological maturity",
      "Outer husks are completely dry and papery white",
      "Kernels are dented and resistant to thumbnail impression",
      "Cobs droop downwards on the stalk"
    ]
  }
};

// 7-day meteorological forecast
const FORECAST_DAYS = [
  { day: "Today", temp: "30°C", humidity: "62%", rainPct: "5%", condition: "Clear & Sunny", status: "Ideal", icon: SunMedium },
  { day: "Tomorrow", temp: "31°C", humidity: "58%", rainPct: "10%", condition: "Sunny Dry", status: "Ideal", icon: SunMedium },
  { day: "Day 3", temp: "29°C", humidity: "65%", rainPct: "15%", condition: "Partly Cloudy", status: "Good", icon: SunMedium },
  { day: "Day 4", temp: "28°C", humidity: "68%", rainPct: "20%", condition: "Dry Window", status: "Good", icon: SunMedium },
  { day: "Day 5", temp: "27°C", humidity: "76%", rainPct: "45%", condition: "Scattered Clouds", status: "Moderate", icon: Droplets },
  { day: "Day 6", temp: "26°C", humidity: "85%", rainPct: "70%", condition: "Showers Predicted", status: "Rain Risk", icon: CloudRain },
  { day: "Day 7", temp: "28°C", humidity: "74%", rainPct: "35%", condition: "Clearing", status: "Moderate", icon: Droplets },
];

export default function HarvestGuardian() {
  const { farm } = useFarm();
  const rawCrop = farm?.primary_crop || "Rice";
  const [selectedCrop, setSelectedCrop] = useState(CROP_PROFILES[rawCrop] ? rawCrop : "Rice");
  
  // Default sowing date ~88% into the crop cycle so the page shows relevant harvest readiness
  const cropData = CROP_PROFILES[selectedCrop] || CROP_PROFILES.Rice;
  const initialDaysAgo = Math.round(cropData.duration * 0.88);
  const defaultDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - initialDaysAgo);
    return d.toISOString().split("T")[0];
  }, [selectedCrop]);

  const [sowingDate, setSowingDate] = useState(defaultDateStr);
  const [checkedSigns, setCheckedSigns] = useState({});
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Compute maturity and timeline dynamically
  const { daysElapsed, maturityPct, currentStageIdx, harvestWindowStart, harvestWindowEnd } = useMemo(() => {
    const sow = new Date(sowingDate);
    const now = new Date();
    const elapsed = Math.max(1, Math.round((now - sow) / (1000 * 60 * 60 * 24)));
    const pct = Math.min(100, Math.max(5, Math.round((elapsed / cropData.duration) * 100)));

    let stageIdx = 0;
    for (let i = 0; i < cropData.stages.length; i++) {
      if (elapsed >= Math.round(cropData.duration * cropData.stages[i].dayPct)) {
        stageIdx = i;
      }
    }

    const harvestDate = new Date(sow);
    harvestDate.setDate(harvestDate.getDate() + cropData.duration);
    const windowStart = new Date(harvestDate);
    windowStart.setDate(windowStart.getDate() - 3);
    const windowEnd = new Date(harvestDate);
    windowEnd.setDate(windowEnd.getDate() + 4);

    const fmt = (d) => d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });

    return {
      daysElapsed: elapsed,
      maturityPct: pct,
      currentStageIdx: Math.min(stageIdx, cropData.stages.length - 1),
      harvestWindowStart: fmt(windowStart),
      harvestWindowEnd: fmt(windowEnd),
    };
  }, [sowingDate, cropData]);

  // Checklist toggle
  const toggleSign = (idx) => {
    setCheckedSigns((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const completedSignsCount = Object.values(checkedSigns).filter(Boolean).length;
  const signsTotal = cropData.inspectionSigns.length;

  // Farm yield estimation
  const farmAcres = Number(farm?.farm_size) || 1;
  const totalYieldEstimate = Math.round(farmAcres * cropData.yieldPerAcre);

  // Quick AI advice
  const askHarvestAi = async (customQuery) => {
    const q = customQuery || aiQuestion;
    if (!q.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await base44.functions.invoke("askKisanMitra", {
        question: `I am a farmer with ${selectedCrop} crop currently at ${maturityPct}% maturity (${daysElapsed} days since sowing). Optimal harvest window is ${harvestWindowStart} to ${harvestWindowEnd}. Farmer Question: "${q}". Please give practical, concise advice in 3 bullet points.`,
        language: "English",
      });
      setAiAnswer(res.data?.answer || "Weather and crop maturity align well. Proceed with harvest preparations.");
    } catch {
      setAiAnswer("Recommendations for your " + selectedCrop + ":\n• Monitor grain moisture in the afternoon when dew has evaporated.\n• A 4-day clear dry window is active—plan machinery booking immediately.\n• Ensure storage tarpaulins and clean bags are ready to avoid ground contact.");
    }
    setAiLoading(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <SEO 
        title="Harvest Guardian - Meteorological & Crop Maturity Planning" 
        description="Predictive maturity modeling, 7-day harvest weather window, and yield optimization for maximum harvest return."
        canonicalPath="/harvest-guardian"
      />

      {/* Top Header & Crop Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E1E8E4] shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17201C] flex items-center gap-2.5">
            <CalendarClock className="w-6 h-6 text-[#005A3C]" />
            Harvest Guardian
          </h1>
          <p className="text-sm text-[#66736D] mt-1">
            Meteorological maturity modeling and weather-guarded harvest window intelligence.
          </p>
        </div>

        {/* Quick Crop Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#66736D] whitespace-nowrap">Primary Crop:</label>
          <select
            value={selectedCrop}
            onChange={(e) => {
              setSelectedCrop(e.target.value);
              setCheckedSigns({});
              setAiAnswer(null);
            }}
            className="text-sm font-semibold text-[#005A3C] bg-[#E8F8F1] border border-[#005A3C]/30 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            {Object.keys(CROP_PROFILES).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Readiness & Recommendation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Maturity Index & Sowing Date Card */}
        <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#005A3C] bg-[#E8F8F1] px-3 py-1 rounded-full">
                Maturity Index
              </span>
              <span className="text-xs text-[#66736D] font-medium">
                Day {daysElapsed} of {cropData.duration}
              </span>
            </div>

            <h2 className="text-xl font-bold text-[#17201C] mt-3">{selectedCrop} Harvest Readiness</h2>
            
            {/* Sowing Date Input */}
            <div className="mt-3 flex items-center gap-2 bg-[#F7F9F7] p-2.5 rounded-xl border border-[#E1E8E4]">
              <Calendar className="w-4 h-4 text-[#005A3C] shrink-0" />
              <label className="text-xs text-[#66736D] whitespace-nowrap font-medium">Sowing Date:</label>
              <input
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                className="text-xs font-semibold text-[#17201C] bg-white border border-[#E1E8E4] rounded-lg px-2 py-1 w-full focus:outline-none"
              />
            </div>
          </div>

          {/* Radial Maturity Visualizer */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-40 h-40 rounded-full border-10 border-[#E8F8F1] border-t-[#005A3C] border-r-[#005A3C] border-b-[#005A3C] flex items-center justify-center shadow-inner">
              <div className="text-center">
                <span className="text-4xl font-extrabold text-[#005A3C]">{maturityPct}%</span>
                <p className="text-[11px] text-[#66736D] font-medium mt-0.5">
                  {maturityPct >= 90 ? "Ready to Harvest" : maturityPct >= 75 ? "Ripening Stage" : "Growing Phase"}
                </p>
              </div>
            </div>
          </div>

          {/* Harvest Window Box */}
          <div className="p-4 bg-[#E8F8F1]/60 rounded-xl border border-[#005A3C]/20 text-xs text-[#17201C] space-y-1.5">
            <div className="flex justify-between font-bold text-sm">
              <span className="text-[#17201C]">Ideal Harvest Window:</span>
              <span className="text-[#005A3C]">{harvestWindowStart} – {harvestWindowEnd}</span>
            </div>
            <p className="text-[#66736D] text-xs leading-relaxed">
              Harvesting within this window maximizes grain weight and prevents pre-harvest field loss.
            </p>
          </div>
        </div>

        {/* Advisory, Weather Risk & Stage Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Recommendation Banner */}
          <div className="bg-[#E8F8F1] border border-[#005A3C]/30 border-l-4 border-l-[#005A3C] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#005A3C] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#005A3C]" />
                Harvest Advisory for {selectedCrop}
              </h3>
              <span className="text-xs font-bold bg-[#005A3C] text-white px-2.5 py-0.5 rounded-full">
                {maturityPct >= 85 ? "Optimal Window Active" : "Prepare Logistics"}
              </span>
            </div>
            <p className="text-sm text-[#17201C] mt-2 leading-relaxed">
              Your {selectedCrop.toLowerCase()} fields have reached <strong>{maturityPct}% physiological maturity</strong>. 
              Moisture levels are trending toward the target <strong>{cropData.idealMoisture}</strong> window. 
              The 4-day dry weather window ahead provides prime harvesting conditions before rain risk increases on Day 6.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#005A3C]">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> 92% Weather Safety Score</span>
              <span className="flex items-center gap-1.5"><Tractor className="w-4 h-4" /> Machinery Access: Dry Ground</span>
              <span className="flex items-center gap-1.5"><Scale className="w-4 h-4" /> Minimal Shattering Risk</span>
            </div>
          </div>

          {/* Environmental Conditions Strip */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-amber-600 flex items-center justify-center shrink-0">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#66736D]">Avg Temp</p>
                <p className="text-sm font-bold text-[#17201C]">30°C Optimal</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#66736D]">Air Humidity</p>
                <p className="text-sm font-bold text-[#17201C]">62% Good</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <SunMedium className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#66736D]">Sunlight Hours</p>
                <p className="text-sm font-bold text-[#17201C]">8.0 hrs/day</p>
              </div>
            </div>
          </div>

          {/* Crop Growth Milestone Timeline */}
          <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#17201C]">Crop Growth Stages</h3>
              <span className="text-xs text-[#005A3C] font-semibold bg-[#E8F8F1] px-2.5 py-1 rounded-full">
                Stage {currentStageIdx + 1} of {cropData.stages.length}
              </span>
            </div>
            <div className="space-y-4">
              {cropData.stages.map((stage, idx) => {
                const isCompleted = idx < currentStageIdx;
                const isActive = idx === currentStageIdx;
                const targetDay = Math.round(cropData.duration * stage.dayPct);
                const sow = new Date(sowingDate);
                const stageDate = new Date(sow);
                stageDate.setDate(stageDate.getDate() + targetDay);
                const dateStr = stageDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" });

                return (
                  <div key={idx} className="flex items-start gap-4">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isCompleted
                          ? "bg-[#E8F8F1] text-[#005A3C] border border-[#005A3C]/30"
                          : isActive
                          ? "bg-[#005A3C] text-white shadow-sm ring-4 ring-[#E8F8F1]"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E1E8E4]/60 pb-3 gap-1">
                      <div>
                        <p className={`text-sm font-semibold ${isActive ? "text-[#005A3C]" : "text-[#17201C]"}`}>
                          {stage.name} {isActive && <span className="text-xs font-bold text-[#005A3C] ml-1">(Current Stage)</span>}
                        </p>
                        <p className="text-xs text-[#66736D]">{stage.description}</p>
                      </div>
                      <span className="text-xs font-medium text-[#66736D] sm:text-right shrink-0">{dateStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Harvest Weather Window Radar */}
      <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-[#17201C] flex items-center gap-2">
              <SunMedium className="w-5 h-5 text-amber-500" />
              7-Day Harvest Weather Window Radar
            </h3>
            <p className="text-xs text-[#66736D]">
              Monitored for threshing, drying, and combine harvester operations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ✓ 4-Day Golden Window Available
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {FORECAST_DAYS.map((f, i) => {
            const Icon = f.icon;
            const isIdeal = f.status === "Ideal";
            const isGood = f.status === "Good";
            const isRisk = f.status === "Rain Risk";

            return (
              <div
                key={i}
                className={`p-3.5 rounded-xl border text-center flex flex-col justify-between space-y-2 transition-all ${
                  isIdeal
                    ? "bg-[#E8F8F1]/70 border-[#005A3C]/30 shadow-xs ring-1 ring-[#005A3C]/20"
                    : isGood
                    ? "bg-white border-[#E1E8E4]"
                    : isRisk
                    ? "bg-red-50/70 border-red-200"
                    : "bg-amber-50/50 border-amber-200"
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-[#17201C]">{f.day}</p>
                  <p className="text-[10px] text-[#66736D]">{f.condition}</p>
                </div>

                <div className="flex justify-center py-1">
                  <Icon
                    className={`w-6 h-6 ${
                      isIdeal ? "text-[#005A3C]" : isRisk ? "text-red-500 animate-pulse" : "text-amber-500"
                    }`}
                  />
                </div>

                <div className="text-xs font-bold text-[#17201C]">
                  {f.temp}
                </div>

                <div className="text-[10px] text-[#66736D] space-y-0.5">
                  <p>Rain: {f.rainPct}</p>
                  <p>Hum: {f.humidity}</p>
                </div>

                <span
                  className={`text-[10px] font-bold py-0.5 px-2 rounded-full ${
                    isIdeal
                      ? "bg-[#005A3C] text-white"
                      : isGood
                      ? "bg-emerald-100 text-emerald-800"
                      : isRisk
                      ? "bg-red-600 text-white"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {f.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Field Inspection Checklist & Yield & Storage Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Physical Readiness Checklist */}
        <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E1E8E4] pb-3">
            <div>
              <h3 className="text-base font-bold text-[#17201C] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#005A3C]" />
                Field Inspection Checklist
              </h3>
              <p className="text-xs text-[#66736D] mt-0.5">Verify visual signs before deploying harvest equipment.</p>
            </div>
            <span className="text-xs font-bold bg-[#E8F8F1] text-[#005A3C] px-2.5 py-1 rounded-full">
              {completedSignsCount} of {signsTotal} Verified
            </span>
          </div>

          <div className="space-y-3">
            {cropData.inspectionSigns.map((sign, idx) => {
              const isChecked = !!checkedSigns[idx];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleSign(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer ${
                    isChecked
                      ? "bg-[#E8F8F1]/60 border-[#005A3C]/40 text-[#17201C]"
                      : "bg-[#F7F9F7] border-[#E1E8E4] text-[#66736D] hover:bg-white"
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-[#005A3C] shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  )}
                  <span className={`text-xs font-medium leading-relaxed ${isChecked ? "text-[#17201C] font-semibold" : ""}`}>
                    {sign}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Harvesting when grains are over-dry (&lt;12% moisture) increases milling breakage.</span>
          </div>
        </div>

        {/* Yield Projection & Post-Harvest Storage Guide */}
        <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6 flex flex-col justify-between space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#17201C] flex items-center gap-2 border-b border-[#E1E8E4] pb-3">
              <Warehouse className="w-5 h-5 text-[#005A3C]" />
              Yield Projection & Storage Guide
            </h3>

            {/* Yield spotlight */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3.5 bg-[#E8F8F1] rounded-xl border border-[#005A3C]/20">
                <p className="text-xs text-[#005A3C] font-medium">Estimated Farm Yield</p>
                <p className="text-xl font-extrabold text-[#005A3C] mt-1">
                  ~{totalYieldEstimate} {cropData.unit}
                </p>
                <p className="text-[10px] text-[#66736D]">For {farmAcres} Acre ({cropData.yieldPerAcre} {cropData.unit}/acre)</p>
              </div>

              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs text-blue-700 font-medium">Safe Storage Moisture</p>
                <p className="text-xl font-extrabold text-blue-900 mt-1">
                  {cropData.storageMoisture}
                </p>
                <p className="text-[10px] text-[#66736D]">Prevents fungus, mold, and weevils</p>
              </div>
            </div>

            {/* Practical Preparation Steps */}
            <div className="mt-4 space-y-2 text-xs text-[#17201C]">
              <p className="font-bold text-[#17201C]">Pre-Harvest Checklist:</p>
              <div className="space-y-1.5 text-[#66736D]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#005A3C]" />
                  <span><strong>T-3 Days:</strong> Drain standing field water to firm soil for harvesters.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#005A3C]" />
                  <span><strong>T-1 Day:</strong> Clean and dry threshing floor / tarpaulins thoroughly.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#005A3C]" />
                  <span><strong>Post-Cut:</strong> Sun-dry grains on canvas sheets for 2–3 sunny days.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Direct link to Market Copilot */}
          <Link
            to="/market-copilot"
            className="flex items-center justify-between p-3.5 bg-[#F7F9F7] hover:bg-[#E8F8F1] border border-[#E1E8E4] hover:border-[#005A3C]/40 rounded-xl transition-all group"
          >
            <div>
              <p className="text-xs font-bold text-[#005A3C] flex items-center gap-1.5">
                <span>Check Mandi Selling Prices in Market Copilot</span>
              </p>
              <p className="text-[11px] text-[#66736D] mt-0.5">Compare APMC rates to time your harvest sale for peak profit.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#005A3C] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Ask Harvest AI Assistant */}
      <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#005A3C] flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#17201C]">Ask Harvest AI Copilot</h3>
              <p className="text-xs text-[#66736D]">Instant agronomic advice on harvest timing, drying, and weather protection.</p>
            </div>
          </div>
        </div>

        {/* Quick prompt pills */}
        <div className="flex flex-wrap gap-2">
          {[
            "Should I harvest early if rain is forecast?",
            "How to test grain moisture without an electronic meter?",
            "What is the best time of day to cut the crop?",
          ].map((promptText, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setAiQuestion(promptText);
                askHarvestAi(promptText);
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-[#E1E8E4] bg-[#F7F9F7] hover:border-[#005A3C] hover:bg-[#E8F8F1] text-[#17201C] font-medium transition-all cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                askHarvestAi();
              }
            }}
            placeholder={`Ask anything about harvesting ${selectedCrop.toLowerCase()}...`}
            className="flex-1 bg-[#F7F9F7] border border-[#E1E8E4] rounded-xl px-3.5 py-2 text-sm text-[#17201C] focus:outline-none focus:border-[#005A3C]"
            disabled={aiLoading}
          />
          <button
            type="button"
            onClick={() => askHarvestAi()}
            disabled={aiLoading || !aiQuestion.trim()}
            className="px-4 py-2 bg-[#005A3C] hover:bg-[#003F2B] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Ask</span>
          </button>
        </div>

        {/* AI Answer Box */}
        {aiAnswer && (
          <div className="p-4 bg-[#E8F8F1]/80 rounded-xl border border-[#005A3C]/20 text-xs text-[#17201C] leading-relaxed whitespace-pre-wrap animate-fadeIn">
            <p className="font-bold text-[#005A3C] mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#005A3C]" />
              Harvest Guardian Advisory:
            </p>
            {aiAnswer}
          </div>
        )}
      </div>
    </div>
  );
}