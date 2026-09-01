import React, { useState, useEffect } from "react";
import { ScrollText, User, Bug, TrendingUp, Stethoscope, LogIn } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.User.list().catch(() => []),
      base44.entities.CropDiagnosis.filter({}, "-created_date", 10).catch(() => []),
      base44.entities.DiseaseAlert.filter({}, "-created_date", 10).catch(() => []),
      base44.entities.MarketPrice.filter({}, "-created_date", 10).catch(() => []),
      base44.entities.Conversation.filter({}, "-created_date", 10).catch(() => []),
    ]).then(([users, diagnoses, alerts, prices, convs]) => {
      const entries = [];
      users.forEach((u) =>
        entries.push({
          id: `u-${u.id}`,
          icon: User,
          action: "User Account Registered",
          detail: `${u.full_name || "Farmer"} (${u.email})`,
          date: u.created_date,
          color: "emerald",
        })
      );
      diagnoses.forEach((d) =>
        entries.push({
          id: `d-${d.id}`,
          icon: Stethoscope,
          action: "Leaf Diagnosis Scanned",
          detail: `${d.disease_name || d.disease} on ${d.crop}`,
          date: d.created_date,
          color: "amber",
        })
      );
      alerts.forEach((a) =>
        entries.push({
          id: `a-${a.id}`,
          icon: Bug,
          action: "Disease Advisory Created",
          detail: `${a.disease} — ${a.location}`,
          date: a.created_date,
          color: "red",
        })
      );
      prices.forEach((p) =>
        entries.push({
          id: `p-${p.id}`,
          icon: TrendingUp,
          action: "Market Price Record Added",
          detail: `${p.market} ${p.crop} ₹${p.avg_price}/kg`,
          date: p.created_date,
          color: "blue",
        })
      );
      convs.forEach((c) =>
        entries.push({
          id: `c-${c.id}`,
          icon: LogIn,
          action: "AI Consultation Session Started",
          detail: c.title,
          date: c.created_date,
          color: "emerald",
        })
      );
      entries.sort((a, b) => new Date(b.date) - new Date(a.date));
      setLogs(entries.slice(0, 40));
    });
  }, []);

  const colors = {
    emerald: "bg-[#E8F8F1] text-[#005A3C]",
    amber: "bg-amber-50 text-amber-600 border border-amber-200",
    red: "bg-red-50 text-red-600 border border-red-200",
    blue: "bg-blue-50 text-blue-600 border border-blue-200",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17201C] flex items-center gap-2.5">
          <ScrollText className="w-6 h-6 text-[#005A3C]" />
          Platform Audit Logs
        </h1>
        <p className="text-sm text-[#66736D] mt-1">Real-time system events and data modifications across all entities.</p>
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E1E8E4] p-8 text-center text-[#66736D] text-sm shadow-sm">
            No audit log entries recorded yet.
          </div>
        ) : (
          logs.map((l) => (
            <div
              key={l.id}
              className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-4 flex items-center justify-between gap-4 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${colors[l.color]}`}>
                  <l.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#17201C] text-sm">{l.action}</p>
                  <p className="text-xs text-[#66736D] mt-0.5 truncate">{l.detail}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-[#66736D] shrink-0 bg-[#F7F9F7] px-3 py-1 rounded-full border border-[#E1E8E4]">
                {new Date(l.date).toLocaleString([], {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}