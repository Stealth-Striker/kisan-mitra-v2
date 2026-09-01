import React from "react";
import { CalendarClock, CheckCircle2, SunMedium, Thermometer, Droplets } from "lucide-react";
import { useFarm } from "@/lib/farmContext";

export default function HarvestGuardian() {
  const { farm } = useFarm();
  const crop = farm?.primary_crop || "Rice";

  const milestones = [
    { title: "Sowing & Germination", date: "May 10", status: "completed" },
    { title: "Vegetative Growth & Tiller Development", date: "June 15", status: "completed" },
    { title: "Flowering & Grain Formation", date: "July 20", status: "completed" },
    { title: "Peak Grain Ripening (Current Stage)", date: "Today", status: "active" },
    { title: "Estimated Ideal Harvest Date", date: "In ~7 Days (Sept 07)", status: "upcoming" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17201C] flex items-center gap-2.5">
          <CalendarClock className="w-6 h-6 text-[#005A3C]" />
          Harvest Guardian
        </h1>
        <p className="text-sm text-[#66736D] mt-1">
          Predictive maturity modeling and ideal harvest window tracking for maximum crop yield.
        </p>
      </div>

      {/* Main Readiness & Recommendation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Harvest Readiness Meter Card */}
        <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#005A3C] bg-[#E8F8F1] px-3 py-1 rounded-full">
              Maturity Index
            </span>
            <h2 className="text-xl font-bold text-[#17201C] mt-3">{crop} Crop Readiness</h2>
            <p className="text-xs text-[#66736D] mt-1">Based on thermal degree days and weather monitoring</p>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-36 h-36 rounded-full border-8 border-[#E8F8F1] border-t-[#005A3C] border-r-[#005A3C] border-b-[#005A3C] flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl font-extrabold text-[#005A3C]">88%</span>
                <p className="text-[11px] text-[#66736D] font-medium">Ready for Harvest</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#F7F9F7] rounded-xl border border-[#E1E8E4] text-xs text-[#17201C] space-y-1">
            <div className="flex justify-between font-semibold">
              <span>Optimal Harvest Window:</span>
              <span className="text-[#005A3C]">Sept 05 – Sept 10</span>
            </div>
            <p className="text-[#66736D] text-[11px]">Harvesting within this 5-day window prevents grain shattering.</p>
          </div>
        </div>

        {/* Advisory & Weather Context */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Recommendation banner */}
          <div className="bg-[#E8F8F1] border border-[#005A3C]/30 border-l-4 border-l-[#005A3C] rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#005A3C] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#005A3C]" />
              Harvest Recommendation for {crop}
            </h3>
            <p className="text-sm text-[#17201C] mt-2 leading-relaxed">
              Your {crop.toLowerCase()} fields have reached 88% maturity. Grain moisture is estimated at optimal harvest level. Weather forecasts show clear dry conditions for the next 7 days, ideal for cutting and threshing.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-[#005A3C]">
              <span>✓ High Market Value Index</span>
              <span>✓ Minimal Loss Risk</span>
            </div>
          </div>

          {/* Environmental Context Chips */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-amber-600 flex items-center justify-center">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#66736D]">Avg Temp</p>
                <p className="text-sm font-bold text-[#17201C]">29°C Ideal</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#66736D]">Humidity</p>
                <p className="text-sm font-bold text-[#17201C]">65% Good</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <SunMedium className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#66736D]">Sunshine</p>
                <p className="text-sm font-bold text-[#17201C]">7.5 hrs/day</p>
              </div>
            </div>
          </div>

          {/* Growth Timeline */}
          <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#17201C] mb-4">Crop Growth Timeline</h3>
            <div className="space-y-4">
              {milestones.map((m, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      m.status === "completed"
                        ? "bg-[#E8F8F1] text-[#005A3C] border border-[#005A3C]/30"
                        : m.status === "active"
                        ? "bg-[#005A3C] text-white shadow-sm ring-4 ring-[#E8F8F1]"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {m.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between border-b border-[#E1E8E4]/60 pb-3">
                    <div>
                      <p className={`text-sm font-semibold ${m.status === "active" ? "text-[#005A3C]" : "text-[#17201C]"}`}>
                        {m.title}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[#66736D]">{m.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}