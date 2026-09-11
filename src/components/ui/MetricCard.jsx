import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function MetricCard({
  label,
  value,
  unit = "",
  trend,
  trendType = "neutral", // "positive" | "negative" | "neutral"
  subtext = "",
  icon: Icon,
  badge = null,
  onClick = undefined,
  className = "",
}) {
  const TrendIcon =
    trendType === "positive"
      ? TrendingUp
      : trendType === "negative"
      ? TrendingDown
      : Minus;

  const trendColor =
    trendType === "positive"
      ? "text-[#087F5B]"
      : trendType === "negative"
      ? "text-[#D94A4A]"
      : "text-[#65736C]";

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-[#ECE9DF] p-5 shadow-xs transition-all ${
        onClick ? "cursor-pointer hover:border-[#16A36F]/40 hover:shadow-xs" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-[#65736C] uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {badge}
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-[#DDF5EA] text-[#063F2E] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17211D]">
          {value}
        </span>
        {unit && <span className="text-xs font-semibold text-[#65736C]">{unit}</span>}
      </div>

      {(trend || subtext) && (
        <div className="mt-2 pt-2.5 border-t border-[#ECE9DF] flex items-center justify-between text-xs">
          {trend && (
            <span className={`inline-flex items-center gap-1 font-semibold ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              {trend}
            </span>
          )}
          {subtext && <span className="text-[#65736C] font-normal truncate">{subtext}</span>}
        </div>
      )}
    </div>
  );
}
