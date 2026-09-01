import React, { useState, useEffect } from "react";
import { Radar, MapPin, Filter } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFarm } from "@/lib/farmContext";

export default function OutbreakRadar() {
  const { farm } = useFarm();
  const [alerts, setAlerts] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState("All");

  useEffect(() => {
    base44.entities.DiseaseAlert.filter({})
      .then((data) => {
        if (data.length > 0) setAlerts(data);
        else {
          setAlerts([
            { id: "1", disease_name: "Brown Plant Hopper", crop: "Rice", severity: "High", location: "Ernakulam District", distance_km: 12, description: "Active infestation reported in nearby fields." },
            { id: "2", disease_name: "Late Blight", crop: "Potato", severity: "Moderate", location: "Thrissur Region", distance_km: 25, description: "Favorable humid conditions causing mild outbreaks." },
            { id: "3", disease_name: "Yellow Mosaic Virus", crop: "Pulses", severity: "Low", location: "Kottayam District", distance_km: 40, description: "Isolated cases detected in low-lying areas." },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = alerts.filter((a) => (filterSeverity === "All" ? true : a.severity === filterSeverity));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17201C] flex items-center gap-2.5">
            <Radar className="w-6 h-6 text-[#005A3C]" />
            Outbreak Radar
          </h1>
          <p className="text-sm text-[#66736D] mt-1">
            Real-time agricultural pest and disease monitoring in your surrounding district.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#E1E8E4] shadow-sm">
          <Filter className="w-4 h-4 text-[#66736D] ml-2" />
          {["All", "High", "Moderate", "Low"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                filterSeverity === s
                  ? "bg-[#005A3C] text-white shadow-sm"
                  : "text-[#66736D] hover:bg-[#E8F8F1] hover:text-[#005A3C]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Map visual area placeholder */}
      <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6 relative overflow-hidden min-h-[220px] flex flex-col justify-between" style={{ background: "linear-gradient(135deg, #E8F8F1 0%, #FFFFFF 100%)" }}>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#005A3C] bg-white px-3 py-1 rounded-full border border-[#005A3C]/20 shadow-sm">
              Live District Radar
            </span>
            <h2 className="text-lg font-bold text-[#17201C] mt-2">
              {farm?.location || "Varikoli"}, {farm?.state || "Kerala"} (50km Radius)
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[#E1E8E4] text-xs font-semibold text-[#005A3C]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {filtered.length} Active Threat Reports
          </div>
        </div>

        {/* Abstract radar graphic */}
        <div className="absolute right-8 bottom-4 w-44 h-44 rounded-full border border-[#005A3C]/20 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-32 rounded-full border border-[#005A3C]/30 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border border-[#005A3C]/40 flex items-center justify-center bg-[#005A3C]/10 animate-pulse">
              <MapPin className="w-6 h-6 text-[#005A3C]" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    item.severity === "High"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : item.severity === "Moderate"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {item.severity} Severity
                </span>
                <span className="text-xs font-semibold text-[#66736D] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#005A3C]" />
                  {item.distance_km || 15}km away
                </span>
              </div>
              <h3 className="text-base font-bold text-[#17201C]">{item.disease_name}</h3>
              <p className="text-xs text-[#005A3C] font-semibold mt-0.5">Affects: {item.crop}</p>
              <p className="text-xs text-[#66736D] mt-2 leading-relaxed">{item.description}</p>
            </div>

            <div className="pt-3 border-t border-[#E1E8E4] flex items-center justify-between text-xs">
              <span className="text-[#66736D]">{item.location}</span>
              <button className="text-[#005A3C] font-semibold hover:underline flex items-center gap-1">
                View Advisory
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}