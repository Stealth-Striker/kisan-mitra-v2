import React from "react";
import { ArrowRight } from "lucide-react";

const STATUS = {
  green: { dot: "bg-[#22C55E]", text: "text-[#16A34A]" },
  red: { dot: "bg-[#EF4444]", text: "text-[#DC2626]" },
  yellow: { dot: "bg-[#F59E0B]", text: "text-[#D97706]" },
  blue: { dot: "bg-[#3B82F6]", text: "text-[#2563EB]" },
};

export default function FeatureCard({ icon: Icon, title, subtitle, description, status, statusColor, to }) {
  const st = STATUS[statusColor] || STATUS.green;
  return (
    <button
      onClick={to}
      className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6 text-left w-full flex flex-col transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-[#0B8F62]/40 group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 rounded-2xl bg-[#E8F8F1] flex items-center justify-center shrink-0">
          <Icon className="w-7 h-7 text-[#005A3C]" />
        </div>
        <div className="flex items-center gap-1.5 bg-[#F7F9F7] px-2.5 py-1 rounded-full border border-[#E1E8E4]">
          <span className={`w-2 h-2 rounded-full ${st.dot}`} />
          <span className={`text-xs font-semibold ${st.text}`}>{status}</span>
        </div>
      </div>
      <h3 className="text-base font-bold text-[#17201C] mb-0.5">{title}</h3>
      <p className="text-xs font-medium text-[#66736D] mb-2">{subtitle}</p>
      <p className="text-sm text-[#66736D] leading-relaxed flex-1">{description}</p>
      <div className="mt-4 flex justify-end">
        <span className="w-10 h-10 rounded-full bg-[#E8F8F1] flex items-center justify-center text-[#005A3C] group-hover:bg-[#005A3C] group-hover:text-white transition-colors">
          <ArrowRight className="w-5 h-5" />
        </span>
      </div>
    </button>
  );
}