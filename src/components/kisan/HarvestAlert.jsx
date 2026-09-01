import React from "react";
import { Bell, ArrowRight, X } from "lucide-react";
import { useFarm } from "@/lib/farmContext";
import { t } from "@/lib/translations";

export default function HarvestAlert({ message, onView, onDismiss }) {
  const { language } = useFarm();

  return (
    <div className="flex items-center justify-between gap-4 bg-[#FFF9F5] border border-[#FDE6D5] border-l-4 border-l-[#F59E0B] rounded-2xl px-6 py-4.5 shadow-xs w-full">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-14 h-14 rounded-2xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
          <Bell className="w-7 h-7 text-[#D97706]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#D97706]">{t(language, "harvestAlert")}</p>
          <p className="text-sm font-semibold text-[#17201C] mt-0.5 truncate sm:whitespace-normal">{message}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onView}
          className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#005A3C] hover:underline whitespace-nowrap cursor-pointer"
        >
          {t(language, "viewRecommendation")} <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onDismiss}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[#66736D] hover:bg-orange-100/50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}