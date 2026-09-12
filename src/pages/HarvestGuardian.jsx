import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  SunMedium,
  Droplets,
  CloudRain,
  ArrowRight,
  Sparkles,
  Warehouse,
  Send,
  Loader2,
  Calendar,
  CheckSquare,
  Square,
  LineChart,
  Plus,
  Trash2,
} from "lucide-react";
import { useFarm } from "@/lib/farmContext";
import { base44 } from "@/api/base44Client";
import SEO from "@/components/SEO";
import RecommendationBanner from "@/components/ui/RecommendationBanner";

// Crop profiles with biological growth parameters (GDD & Moisture Decay)
const CROP_PROFILES = {
  Rice: {
    cropName: "Paddy / Rice",
    duration: 120,
    unit: "Quintals",
    yieldPerAcre: 22,
    baseTemp: 10.0,
    gddTarget: 1550,
    idealMoisture: "14% - 16%",
    targetMoistureNum: 14.5,
    storageMoisture: "13% - 14%",
    stages: [
      { name: "Sowing & Seedling", dayPct: 0.12, description: "Germination and nursery emergence" },
      { name: "Vegetative & Tillering", dayPct: 0.38, description: "Active tillering and root spread" },
      { name: "Flowering & Panicle Initiation", dayPct: 0.70, description: "Heading, pollination, and grain fill" },
      { name: "Grain Dough & Ripening", dayPct: 0.92, description: "Grain golden turning, milk to hard dough" },
      { name: "Optimal Harvest Window", dayPct: 1.0, description: "Golden straw, hard grain, minimal shatter" },
    ],
    inspectionSigns: [
      "80% to 85% of panicles have turned golden straw yellow",
      "Grains are firm and cannot be crushed easily between fingernails",
      "Moisture level feels under 20% when grain is snapped",
      "Flag leaves have turned yellowish-brown",
    ],
  },
  Tomato: {
    cropName: "Tomato",
    duration: 75,
    unit: "Quintals",
    yieldPerAcre: 140,
    baseTemp: 10.0,
    gddTarget: 1100,
    idealMoisture: "88% - 92%",
    targetMoistureNum: 88.0,
    storageMoisture: "Room temp / Crates",
    stages: [
      { name: "Transplanting & Rooting", dayPct: 0.20, description: "Field establishment and initial growth" },
      { name: "Vegetative Branching", dayPct: 0.45, description: "Canopy development and flower cluster setup" },
      { name: "Flowering & Fruit Set", dayPct: 0.75, description: "Green fruit swelling and sizing" },
      { name: "Breaker / Color Turning", dayPct: 0.92, description: "Color break at blossom end, firm shoulder" },
      { name: "Optimal Harvest Picking", dayPct: 1.0, description: "Harvest at pink/breaker stage for transit" },
    ],
    inspectionSigns: [
      "Blossom end shows pinkish/red color break",
      "Fruits are firm with smooth, glossy skin",
      "Easily detaches from vine with gentle upward twist",
      "Morning harvest preferred to preserve post-harvest firmness",
    ],
  },
  Wheat: {
    cropName: "Wheat",
    duration: 125,
    unit: "Quintals",
    yieldPerAcre: 20,
    baseTemp: 4.5,
    gddTarget: 1700,
    idealMoisture: "12% - 14%",
    targetMoistureNum: 13.0,
    storageMoisture: "12%",
    stages: [
      { name: "Crown Root & Tillering", dayPct: 0.25, description: "Early tillering and root anchoring" },
      { name: "Jointing & Stem Elongation", dayPct: 0.55, description: "Rapid stalk elongation and spike setup" },
      { name: "Heading & Flowering", dayPct: 0.75, description: "Spike emergence and grain initiation" },
      { name: "Dough & Ripening", dayPct: 0.92, description: "Grains harden from soft to hard dough" },
      { name: "Optimal Harvest Window", dayPct: 1.0, description: "Straw turns yellow, kernels snap cleanly" },
    ],
    inspectionSigns: [
      "Straw and heads turn uniform golden-yellow",
      "Grain cracks firmly between teeth with a sharp snap",
      "Moisture is below 14% to prevent bin burning in storage",
      "No green stems remaining in the upper canopy",
    ],
  },
  Maize: {
    cropName: "Maize (Corn)",
    duration: 100,
    unit: "Quintals",
    yieldPerAcre: 26,
    baseTemp: 10.0,
    gddTarget: 1450,
    idealMoisture: "15% - 18%",
    targetMoistureNum: 15.5,
    storageMoisture: "13% - 14%",
    stages: [
      { name: "Emergence & Early Growth", dayPct: 0.18, description: "Sprouting and leaf collar emergence" },
      { name: "Vegetative & Tasseling", dayPct: 0.50, description: "Rapid height gain and tassel extrusion" },
      { name: "Silking & Kernel Blister", dayPct: 0.75, description: "Ear pollination and kernel development" },
      { name: "Dent & Black Layer", dayPct: 0.92, description: "Kernel milk line descends, black layer forms" },
      { name: "Optimal Harvest Window", dayPct: 1.0, description: "Husks papery dry, kernels hard and dented" },
    ],
    inspectionSigns: [
      "Black layer visible at kernel base indicating physiological maturity",
      "Outer husks are completely dry and papery white",
      "Kernels are dented and resistant to thumbnail impression",
      "Cobs droop downwards on the stalk",
    ],
  },
};

// 7-day meteorological forecast
const FORECAST_DAYS = [
  { day: "Today", temp: "30°C", humidity: "62%", rainPct: "5%", condition: "Clear Sunny", status: "Ideal", icon: SunMedium },
  { day: "Tomorrow", temp: "31°C", humidity: "58%", rainPct: "10%", condition: "Sunny Dry", status: "Ideal", icon: SunMedium },
  { day: "Day 3", temp: "29°C", humidity: "65%", rainPct: "15%", condition: "Partly Clear", status: "Good", icon: SunMedium },
  { day: "Day 4", temp: "28°C", humidity: "68%", rainPct: "20%", condition: "Dry Window", status: "Good", icon: SunMedium },
  { day: "Day 5", temp: "27°C", humidity: "76%", rainPct: "45%", condition: "Overcast", status: "Moderate", icon: Droplets },
  { day: "Day 6", temp: "26°C", humidity: "85%", rainPct: "70%", condition: "Showers Risk", status: "Rain Risk", icon: CloudRain },
  { day: "Day 7", temp: "28°C", humidity: "74%", rainPct: "35%", condition: "Clearing", status: "Moderate", icon: Droplets },
];

export default function HarvestGuardian() {
  const { farm } = useFarm();
  const rawCrop = farm?.primary_crop || "Rice";
  const [selectedCrop, setSelectedCrop] = useState(CROP_PROFILES[rawCrop] ? rawCrop : "Rice");

  const cropData = CROP_PROFILES[selectedCrop] || CROP_PROFILES.Rice;
  const initialDaysAgo = Math.round(cropData.duration * 0.88);
  const defaultDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - initialDaysAgo);
    return d.toISOString().split("T")[0];
  }, [selectedCrop, initialDaysAgo]);

  const [sowingDate, setSowingDate] = useState(defaultDateStr);
  const [checkedSigns, setCheckedSigns] = useState({});
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [customSignsByCrop, setCustomSignsByCrop] = useState({});
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionText, setNewOptionText] = useState("");
  const [activeTab, setActiveTab] = useState("readiness"); // "readiness" | "checklist" | "storage"

  // Biological growth and timeline calculation (GDD & Moisture Differential)
  const {
    daysElapsed,
    maturityPct,
    currentStageIdx,
    harvestWindowStart,
    harvestWindowEnd,
    gddAccumulated,
    gddTarget,
    currentMoisturePct,
    targetMoisturePct,
    moistureDecayCurve,
  } = useMemo(() => {
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

    // Thermal accumulation: GDD = days * average daily effective thermal units
    const dailyMeanTemp = 29.5;
    const dailyGDD = Math.max(0, dailyMeanTemp - cropData.baseTemp);
    const gddAcc = Math.min(cropData.gddTarget, Math.round(elapsed * dailyGDD));

    // Continuous grain moisture decay model: dM/dt = -k*(M - Meq)
    // Starting at milk stage ~32%, decaying towards targetMoistureNum
    const kDry = 0.045;
    const initialM = selectedCrop === "Tomato" ? 92.0 : 32.0;
    const targetM = cropData.targetMoistureNum;
    const currentM = Math.max(targetM, Number((targetM + (initialM - targetM) * Math.exp(-kDry * elapsed * 0.35)).toFixed(1)));

    // 7-day predictive trajectory
    const curve = [];
    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const predM = Math.max(targetM - 0.5, Number((targetM + (currentM - targetM) * Math.exp(-kDry * dayOffset * 2.5)).toFixed(1)));
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + dayOffset);
      curve.push({
        day: dayOffset === 0 ? "Today" : `+${dayOffset}d`,
        date: fmt(futureDate),
        moisture: predM,
      });
    }

    return {
      daysElapsed: elapsed,
      maturityPct: pct,
      currentStageIdx: Math.min(stageIdx, cropData.stages.length - 1),
      harvestWindowStart: fmt(windowStart),
      harvestWindowEnd: fmt(windowEnd),
      gddAccumulated: gddAcc,
      gddTarget: cropData.gddTarget,
      currentMoisturePct: currentM,
      targetMoisturePct: targetM,
      moistureDecayCurve: curve,
    };
  }, [sowingDate, cropData, selectedCrop]);

  const allSigns = useMemo(() => {
    const base = (cropData.inspectionSigns || []).map((text, idx) => ({
      id: `base-${idx}`,
      text,
      isCustom: false,
    }));
    const custom = (customSignsByCrop[selectedCrop] || []).map((text, idx) => ({
      id: `custom-${idx}`,
      text,
      isCustom: true,
      customIdx: idx,
    }));
    return [...base, ...custom];
  }, [cropData.inspectionSigns, customSignsByCrop, selectedCrop]);

  const toggleSign = (id) => {
    setCheckedSigns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddOption = (e) => {
    e.preventDefault();
    const trimmed = newOptionText.trim();
    if (!trimmed) return;
    setCustomSignsByCrop((prev) => ({
      ...prev,
      [selectedCrop]: [...(prev[selectedCrop] || []), trimmed],
    }));
    setNewOptionText("");
    setIsAddingOption(false);
  };

  const handleRemoveOption = (customIdx, id) => {
    setCustomSignsByCrop((prev) => {
      const currentList = prev[selectedCrop] || [];
      return {
        ...prev,
        [selectedCrop]: currentList.filter((_, idx) => idx !== customIdx),
      };
    });
    setCheckedSigns((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const completedSignsCount = allSigns.filter((item) => !!checkedSigns[item.id]).length;
  const signsTotal = allSigns.length;
  const farmAcres = Number(farm?.farm_size) || 1;
  const totalYieldEstimate = Math.round(farmAcres * cropData.yieldPerAcre);

  // AI Harvest Logistics Consultation
  const askHarvestAi = async (customQuery) => {
    const q = customQuery || aiQuestion;
    if (!q.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await base44.functions.invoke("askKisanMitra", {
        question: `I am a farmer with ${selectedCrop} crop currently at ${maturityPct}% maturity (${daysElapsed} days since sowing, moisture at ${currentMoisturePct}%, GDD at ${gddAccumulated}/${gddTarget}). Optimal harvest window is ${harvestWindowStart} to ${harvestWindowEnd}. 4-day dry window active before Day 6 rain risk. Farmer Question: "${q}". Please give practical, concise advice in 3 bullet points with zero emojis.`,
        language: "English",
      });
      setAiAnswer(res.data?.answer || "Weather and crop maturity align well. Proceed with harvest preparations.");
    } catch {
      setAiAnswer(
        "Recommendations for your " +
          selectedCrop +
          ":\n• Monitor grain moisture in early afternoon once canopy dew has fully evaporated.\n• A 4-day clear dry window is active: schedule combine harvester operations immediately.\n• Ensure clean tarpaulins and drying yard are ready to prevent moisture re-absorption."
      );
    }
    setAiLoading(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <SEO
        title="Harvest Guardian - Maturity & Weather Simulation"
        description="Predictive crop maturity modeling, grain moisture differential trajectory, 7-day harvest weather radar, and storage risk management."
        canonicalPath="/harvest-guardian"
      />

      {/* ── Top Header & Commodity Switcher ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E8E4] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17211D] flex items-center gap-2.5">
            <CalendarClock className="w-6 h-6 text-[#063F2E]" />
            Harvest Guardian
          </h1>
          <p className="text-xs sm:text-sm text-[#65736C] mt-0.5">
            Meteorological maturity modeling and weather-guarded harvest window intelligence.
          </p>
        </div>

        {/* Commodity Selector & Sowing Date Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#E1E8E4] text-xs">
            <label htmlFor="harvest-crop-select" className="text-[#65736C] font-medium">Crop:</label>
            <select
              id="harvest-crop-select"
              aria-label="Select Crop"
              value={selectedCrop}
              onChange={(e) => {
                setSelectedCrop(e.target.value);
                setCheckedSigns({});
                setAiAnswer(null);
              }}
              className="font-bold text-[#063F2E] bg-transparent focus:outline-none cursor-pointer"
            >
              {Object.keys(CROP_PROFILES).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#E1E8E4] text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#087F5B]" />
            <label htmlFor="harvest-sow-date" className="text-[#65736C] font-medium">Sown:</label>
            <input
              id="harvest-sow-date"
              aria-label="Sowing Date"
              type="date"
              value={sowingDate}
              onChange={(e) => setSowingDate(e.target.value)}
              className="font-semibold text-[#17211D] bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ── ACTIONABLE RECOMMENDATION BANNER ─────────────────────── */}
      <RecommendationBanner
        headline={`Prepare harvesting equipment for ${cropData.cropName}.`}
        whyItMatters={`Crop reached ${maturityPct}% maturity. 4-day dry window active before Day 6 rain risk.`}
        recommendedAction={`Inspect grain firmness, secure combine harvester, and prepare drying yard.`}
        ctaText="View Inspection Checklist"
        onCtaClick={() => setActiveTab("checklist")}
      />

      {/* ── SEGMENTED NAVIGATION TABS ────────────────────────────── */}
      <div className="flex items-center gap-2 bg-[#F6F8F5] p-1.5 rounded-2xl border border-[#E1E8E4] w-fit">
        {[
          { id: "readiness", label: "Readiness & Forecast", icon: SunMedium },
          { id: "checklist", label: `Field Checklist (${completedSignsCount}/${signsTotal})`, icon: CheckSquare },
          { id: "storage", label: "Storage & AI Advisory", icon: Warehouse },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-[#063F2E] shadow-xs border border-[#E1E8E4]"
                  : "text-[#65736C] hover:text-[#17211D]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#087F5B]" : "text-[#65736C]"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: READINESS & WEATHER FORECAST ─────────────────────── */}
      {activeTab === "readiness" && (
        <div className="space-y-6">
          {/* Bento: Maturity Gauge & Core Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Radial Readiness Centerpiece (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E1E8E4] p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#65736C]">
                  Harvest Readiness
                </span>
                <span className="text-xs font-bold text-[#087F5B] bg-[#DDF5EA] px-2.5 py-0.5 rounded-full">
                  Day {daysElapsed} / {cropData.duration}
                </span>
              </div>

              {/* Radial Visualization */}
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative w-44 h-44 flex items-center justify-center">
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
                      strokeDashoffset={251.2 - (251.2 * maturityPct) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#063F2E]">
                      {maturityPct}%
                    </span>
                    <span className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider mt-1">
                      Readiness
                    </span>
                  </div>
                </div>
              </div>

              {/* Optimal Window Highlight Box */}
              <div className="p-4 rounded-xl bg-[#DDF5EA]/60 border border-[#087F5B]/20 text-xs">
                <div className="flex items-center justify-between font-bold text-[#063F2E] mb-1">
                  <span>Optimal Window:</span>
                  <span className="text-sm">{harvestWindowStart} – {harvestWindowEnd}</span>
                </div>
                <p className="text-[#65736C] text-[11px]">
                  Harvesting in this window minimizes shatter loss and preserves grain density.
                </p>
              </div>
            </div>

            {/* Right: Agronomic Metrics & Moisture Curve (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* 4 Supporting Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-xs">
                  <span className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider block mb-1">
                    Grain Moisture
                  </span>
                  <span className="text-xl font-bold text-[#17211D]">{currentMoisturePct}%</span>
                  <span className="text-[10px] text-[#087F5B] block mt-1 font-semibold">Target: {targetMoisturePct}%</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-xs">
                  <span className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider block mb-1">
                    Heat Units (GDD)
                  </span>
                  <span className="text-xl font-bold text-[#17211D]">{gddAccumulated}</span>
                  <span className="text-[10px] text-[#65736C] block mt-1">Target: {gddTarget}</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-xs">
                  <span className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider block mb-1">
                    Air Humidity
                  </span>
                  <span className="text-xl font-bold text-[#17211D]">62%</span>
                  <span className="text-[10px] text-[#087F5B] block mt-1 font-semibold">Dry Ripening</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-xs">
                  <span className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider block mb-1">
                    Yield Estimate
                  </span>
                  <span className="text-xl font-bold text-[#17211D]">{totalYieldEstimate}</span>
                  <span className="text-[10px] text-[#65736C] block mt-1">{cropData.unit} ({farmAcres} Ac)</span>
                </div>
              </div>

              {/* Desorption Trajectory Strip */}
              <div className="bg-white rounded-2xl border border-[#E1E8E4] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-[#17211D] uppercase tracking-wider flex items-center gap-1.5">
                    <LineChart className="w-3.5 h-3.5 text-[#087F5B]" />
                    Moisture Desorption Curve
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DDF5EA] text-[#063F2E]">
                    Safe Target: {targetMoisturePct}%
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center pt-1">
                  {moistureDecayCurve.map((node, i) => {
                    const isTargetReached = node.moisture <= targetMoisturePct + 0.5;
                    return (
                      <div
                        key={i}
                        className={`p-2 rounded-xl border text-xs transition-all ${
                          isTargetReached
                            ? "bg-[#DDF5EA]/70 border-[#087F5B]/30 font-bold"
                            : "bg-[#F6F8F5] border-[#E1E8E4]"
                        }`}
                      >
                        <p className="text-[10px] text-[#65736C]">{node.day}</p>
                        <p className={`text-xs font-extrabold mt-0.5 ${isTargetReached ? "text-[#063F2E]" : "text-[#17211D]"}`}>
                          {node.moisture}%
                        </p>
                        <span className="text-[9px] text-[#65736C] block">{node.date.split(",")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lifecycle Progression Timeline */}
              <div className="bg-white rounded-2xl border border-[#E1E8E4] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-xs font-bold text-[#17211D] uppercase tracking-wider">
                    Crop Lifecycle
                  </h3>
                  <span className="text-[11px] font-semibold text-[#087F5B] bg-[#DDF5EA] px-2.5 py-0.5 rounded-full">
                    Stage {currentStageIdx + 1} of {cropData.stages.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {cropData.stages.map((stage, idx) => {
                    const isCompleted = idx < currentStageIdx;
                    const isActive = idx === currentStageIdx;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                          isActive
                            ? "bg-[#063F2E] text-white border-[#063F2E] shadow-xs"
                            : isCompleted
                            ? "bg-[#DDF5EA]/50 text-[#063F2E] border-[#087F5B]/20"
                            : "bg-[#F6F8F5] text-[#65736C] border-[#E1E8E4]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold opacity-75">Stage {idx + 1}</span>
                          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B]" />}
                        </div>
                        <p className="font-bold leading-tight">{stage.name}</p>
                        <p className={`text-[10px] mt-1 leading-snug line-clamp-2 ${isActive ? "text-emerald-100" : "text-[#65736C]"}`}>
                          {stage.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 7-Day Harvest Weather Window Radar */}
          <div className="bg-white rounded-2xl border border-[#E1E8E4] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E1E8E4] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#17211D] uppercase tracking-wider flex items-center gap-2">
                  <SunMedium className="w-4 h-4 text-[#E99B16]" />
                  7-Day Harvest Weather Radar
                </h3>
                <p className="text-xs text-[#65736C] mt-0.5">
                  Precipitation forecast for field machinery access and threshing.
                </p>
              </div>
              <span className="self-start sm:self-auto text-xs font-semibold text-[#087F5B] bg-[#DDF5EA] px-3 py-1 rounded-full">
                4-Day Golden Window Active
              </span>
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
                        ? "bg-[#DDF5EA]/60 border-[#087F5B]/30 ring-1 ring-[#087F5B]/20"
                        : isGood
                        ? "bg-white border-[#E1E8E4]"
                        : isRisk
                        ? "bg-red-50/70 border-red-200"
                        : "bg-amber-50/50 border-amber-200"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-[#17211D]">{f.day}</p>
                      <p className="text-[10px] text-[#65736C]">{f.condition}</p>
                    </div>

                    <div className="flex justify-center py-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isIdeal
                            ? "bg-[#063F2E] text-white"
                            : isRisk
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold text-[#17211D]">{f.temp}</p>
                      <p className="text-[10px] text-[#65736C]">Humidity: {f.humidity}</p>
                      <p className={`text-[10px] font-semibold ${isRisk ? "text-red-600" : "text-[#087F5B]"}`}>
                        Rain: {f.rainPct}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: FIELD CHECKLIST ─────────────────────────────────── */}
      {activeTab === "checklist" && (
        <div className="bg-white rounded-2xl border border-[#E1E8E4] p-5 sm:p-6 shadow-xs space-y-5 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E8E4] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#17211D] uppercase tracking-wider">
                Field Inspection Checklist
              </h3>
              <p className="text-xs text-[#65736C] mt-0.5">
                Verify physical maturity indicators before harvesting.
              </p>
            </div>
            <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-[#DDF5EA] text-[#063F2E]">
              {completedSignsCount} of {signsTotal} Verified
            </span>
          </div>

          <div className="space-y-2.5">
            {allSigns.map((item) => {
              const isChecked = !!checkedSigns[item.id];
              return (
                <div
                  key={item.id}
                  className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    isChecked
                      ? "bg-[#DDF5EA]/50 border-[#087F5B]/30 text-[#063F2E]"
                      : "bg-[#F6F8F5] border-[#E1E8E4] text-[#17211D] hover:border-[#D1DCD5]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSign(item.id)}
                    className="flex-1 flex items-start gap-3 text-left cursor-pointer"
                  >
                    <div className="mt-0.5 shrink-0">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[#087F5B]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#65736C]" />
                      )}
                    </div>
                    <span className={`text-xs font-medium leading-relaxed ${isChecked ? "font-semibold" : ""}`}>
                      {item.text}
                    </span>
                  </button>

                  {item.isCustom && (
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => handleRemoveOption(item.customIdx, item.id)}
                      className="text-[#65736C] hover:text-[#DC2626] p-1 rounded-lg hover:bg-white/80 transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add more option to checklist */}
          {isAddingOption ? (
            <form onSubmit={handleAddOption} className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Inspect boundary bunds for lodging..."
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  autoFocus
                  className="flex-1 text-xs px-3 py-2 bg-[#F6F8F5] rounded-xl border border-[#087F5B]/40 focus:outline-none focus:ring-1 focus:ring-[#087F5B] text-[#17211D]"
                />
                <button
                  type="submit"
                  disabled={!newOptionText.trim()}
                  className="px-3.5 py-2 bg-[#087F5B] hover:bg-[#063F2E] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingOption(false);
                    setNewOptionText("");
                  }}
                  className="px-2.5 py-2 text-xs font-medium text-[#65736C] hover:text-[#17211D] rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingOption(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 border border-dashed border-[#087F5B]/40 rounded-xl text-xs font-semibold text-[#087F5B] bg-[#DDF5EA]/30 hover:bg-[#DDF5EA]/60 hover:border-[#087F5B] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add More Option to Checklist</span>
            </button>
          )}

          <div className="pt-3 border-t border-[#E1E8E4] flex items-center justify-between text-xs text-[#65736C]">
            <span>Checklist completed?</span>
            <Link
              to="/market-copilot"
              className="text-[#087F5B] hover:text-[#063F2E] font-semibold flex items-center gap-1"
            >
              <span>Compare Market Selling Rates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── TAB 3: STORAGE & AI ADVISORY ─────────────────────────── */}
      {activeTab === "storage" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Storage Guidelines */}
          <div className="bg-white rounded-2xl border border-[#E1E8E4] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-[#E1E8E4] pb-3">
              <h3 className="text-sm font-bold text-[#17211D] uppercase tracking-wider flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-[#063F2E]" />
                Post-Harvest Storage Guidelines
              </h3>
              <p className="text-xs text-[#65736C] mt-0.5">
                Prevent moisture spoilage, mould, and grain discoloration.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                <span className="font-bold text-[#17211D]">Safe Moisture Threshold:</span>
                <p className="text-[#65736C]">
                  Sun-dry grain to <strong>{cropData.storageMoisture}</strong> before bagging. Packing above 16% moisture risks fungal heating and rot.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                <span className="font-bold text-[#17211D]">Bagging &amp; Pallet Stacking:</span>
                <p className="text-[#65736C]">
                  Store in clean gunny bags elevated on wooden pallets (15 cm above floor). Keep 50 cm distance from concrete walls.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                <span className="font-bold text-[#17211D]">Combine Timing:</span>
                <p className="text-[#65736C]">
                  Operate machinery between 10:00 AM and 04:30 PM after canopy dew evaporates to prevent threshing breakage.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Ask Harvest AI Assistant */}
          <div className="bg-white rounded-2xl border border-[#E1E8E4] p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#E1E8E4] pb-3">
                <div className="w-8 h-8 rounded-xl bg-[#063F2E] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#17211D]">Harvest AI Assistant</h3>
                  <p className="text-xs text-[#65736C]">
                    Ask about machinery booking, drying, or weather risks.
                  </p>
                </div>
              </div>

              {/* Quick prompt chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  "Harvest before Day 6 rain?",
                  "Sun-drying hours needed?",
                  "Action if moisture is 18%?",
                ].map((promptText, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setAiQuestion(promptText);
                      askHarvestAi(promptText);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#F6F8F5] hover:bg-[#DDF5EA] border border-[#E1E8E4] text-xs font-semibold text-[#17211D] hover:text-[#063F2E] transition-colors cursor-pointer"
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>

              {/* Input box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askHarvestAi()}
                  placeholder="Ask a harvest or storage question..."
                  className="km-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => askHarvestAi()}
                  disabled={aiLoading || !aiQuestion.trim()}
                  className="km-btn-primary shrink-0"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span className="hidden sm:inline">Ask</span>
                </button>
              </div>

              {/* AI Answer Box */}
              {aiAnswer && (
                <div className="p-4 rounded-xl bg-[#DDF5EA]/50 border border-[#087F5B]/20 text-xs text-[#17211D] leading-relaxed whitespace-pre-line space-y-1">
                  <p className="font-bold text-[#063F2E] flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> Assessment:
                  </p>
                  {aiAnswer}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}