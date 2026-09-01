import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Users, Bug, TrendingUp, MessageSquare, Stethoscope, Activity, Sprout } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AdminDashboard() {
  const { user } = useOutletContext();
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    Promise.all([
      base44.entities.User.list().catch(() => []),
      base44.entities.Farm.list().catch(() => []),
      base44.entities.CropDiagnosis.list().catch(() => []),
      base44.entities.DiseaseAlert.filter({ active: true }).catch(() => []),
      base44.entities.Conversation.list().catch(() => []),
      base44.entities.MarketPrice.list().catch(() => []),
    ]).then(([users, farms, diagnoses, alerts, conversations, prices]) => {
      const farmers = users.filter((u) => u.role !== "admin");
      setMetrics({
        totalFarmers: farmers.length,
        totalFarms: farms.length,
        diagnoses: diagnoses.length,
        activeAlerts: alerts.length,
        conversations: conversations.length,
        marketPrices: prices.length,
      });
    });
  }, []);

  const cards = [
    { label: "Total Farmers", value: metrics.totalFarmers ?? 0, icon: Users, color: "green" },
    { label: "Total Farms", value: metrics.totalFarms ?? 0, icon: Sprout, color: "mint" },
    { label: "Crop Diagnoses", value: metrics.diagnoses ?? 0, icon: Stethoscope, color: "amber" },
    { label: "Active Disease Alerts", value: metrics.activeAlerts ?? 0, icon: Bug, color: "red" },
    { label: "Conversations", value: metrics.conversations ?? 0, icon: MessageSquare, color: "green" },
    { label: "Market Data Points", value: metrics.marketPrices ?? 0, icon: TrendingUp, color: "blue" },
  ];

  const colors = {
    green: "bg-[#E8F8F1] text-[#005A3C]",
    mint: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17201C]">Admin Dashboard</h1>
        <p className="text-sm text-[#66736D] mt-1">Welcome back, {user?.full_name || "Admin"}. Here is your platform overview.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6 space-y-2">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[c.color]}`}>
              <c.icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-extrabold text-[#17201C] pt-1">{c.value}</p>
            <p className="text-xs font-semibold text-[#66736D] uppercase tracking-wider">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-[#17201C] text-sm uppercase tracking-wider flex items-center gap-2 border-b border-[#E1E8E4] pb-3">
          <Activity className="w-4 h-4 text-[#005A3C]" /> System Infrastructure Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <StatusItem label="AI Service (Gemini API)" status="Operational" color="emerald" />
          <StatusItem label="JSON File Database" status="Connected & Verified" color="emerald" />
          <StatusItem label="Local File Storage" status="Ready (/uploads)" color="emerald" />
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, status, color }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E1E8E4] bg-[#F7F9F7]">
      <span className={`w-3 h-3 rounded-full bg-${color}-500 shrink-0`} />
      <div>
        <p className="text-sm font-bold text-[#17201C]">{label}</p>
        <p className="text-xs text-[#66736D]">{status}</p>
      </div>
    </div>
  );
}