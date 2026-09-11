import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

export default function RecommendationBanner({
  badge = null,
  headline,
  whyItMatters,
  recommendedAction,
  ctaText,
  onCtaClick,
  icon: Icon = Sparkles,
  variant = "primary", // "primary" (forest) | "amber" | "danger" | "neutral"
  className = "",
}) {
  const variantStyles = {
    primary: {
      wrapper: "bg-[#DDF5EA]/60 border-[#087F5B]/30 border-l-4 border-l-[#087F5B]",
      badge: "bg-[#063F2E] text-white",
      headline: "text-[#063F2E]",
      iconBox: "bg-[#063F2E] text-white",
      cta: "bg-[#063F2E] hover:bg-[#087F5B] text-white",
    },
    amber: {
      wrapper: "bg-amber-50/70 border-amber-300 border-l-4 border-l-[#E99B16]",
      badge: "bg-[#E99B16] text-white",
      headline: "text-[#92540C]",
      iconBox: "bg-[#E99B16] text-white",
      cta: "bg-[#92540C] hover:bg-[#7A4508] text-white",
    },
    danger: {
      wrapper: "bg-red-50/70 border-red-300 border-l-4 border-l-[#D94A4A]",
      badge: "bg-[#D94A4A] text-white",
      headline: "text-[#991B1B]",
      iconBox: "bg-[#D94A4A] text-white",
      cta: "bg-[#991B1B] hover:bg-[#7F1D1D] text-white",
    },
    neutral: {
      wrapper: "bg-white border-[#E1E8E4] border-l-4 border-l-[#65736C]",
      badge: "bg-[#65736C] text-white",
      headline: "text-[#17211D]",
      iconBox: "bg-[#65736C] text-white",
      cta: "bg-[#17211D] hover:bg-[#2C3833] text-white",
    },
  }[variant] || variantStyles.primary;

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 shadow-xs transition-all ${variantStyles.wrapper} ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${variantStyles.iconBox}`}>
            <Icon className="w-4 h-4" />
          </div>
          {badge && (
            <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${variantStyles.badge}`}>
              {badge}
            </span>
          )}
        </div>
        {ctaText && onCtaClick && (
          <button
            type="button"
            onClick={onCtaClick}
            className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer ${variantStyles.cta}`}
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {headline && (
        <h3 className={`text-base sm:text-lg font-bold tracking-tight mb-1.5 ${variantStyles.headline}`}>
          {headline}
        </h3>
      )}

      {whyItMatters && (
        <p className="text-xs sm:text-sm text-[#65736C] leading-relaxed mb-3">
          {whyItMatters}
        </p>
      )}

      {recommendedAction && (
        <div className="pt-3 border-t border-black/5 flex items-start gap-2 text-xs sm:text-sm font-semibold text-[#17211D]">
          <span className="text-[#087F5B] shrink-0 font-bold uppercase text-[11px] tracking-wide">
            Action:
          </span>
          <span className="leading-snug">{recommendedAction}</span>
        </div>
      )}
    </div>
  );
}
