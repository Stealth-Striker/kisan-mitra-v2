import React from "react";
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, ShieldCheck } from "lucide-react";

const STATUS_CONFIGS = {
  healthy: {
    bg: "bg-[#DDF5EA]",
    text: "text-[#087F5B]",
    border: "border-[#16A36F]/20",
    icon: CheckCircle2,
    defaultLabel: "Healthy",
  },
  optimal: {
    bg: "bg-[#DDF5EA]",
    text: "text-[#063F2E]",
    border: "border-[#087F5B]/30",
    icon: ShieldCheck,
    defaultLabel: "Optimal Window",
  },
  low: {
    bg: "bg-[#F6F8F5]",
    text: "text-[#65736C]",
    border: "border-[#E1E8E4]",
    icon: Info,
    defaultLabel: "Low Risk",
  },
  moderate: {
    bg: "bg-amber-50",
    text: "text-[#E99B16]",
    border: "border-amber-200",
    icon: AlertTriangle,
    defaultLabel: "Moderate Risk",
  },
  high: {
    bg: "bg-red-50",
    text: "text-[#D94A4A]",
    border: "border-red-200",
    icon: AlertOctagon,
    defaultLabel: "High Threat",
  },
  critical: {
    bg: "bg-red-100",
    text: "text-[#D94A4A]",
    border: "border-red-300",
    icon: AlertOctagon,
    defaultLabel: "Critical",
  },
  info: {
    bg: "bg-sky-50",
    text: "text-[#3B82A0]",
    border: "border-sky-200",
    icon: Info,
    defaultLabel: "Advisory",
  },
};

export default function StatusBadge({
  status = "healthy",
  label,
  showIcon = true,
  className = "",
  size = "md",
}) {
  const normalized = (status || "healthy").toLowerCase();
  const config = STATUS_CONFIGS[normalized] || STATUS_CONFIGS.healthy;
  const Icon = config.icon;
  const displayText = label || config.defaultLabel;

  const sizeClasses =
    size === "sm"
      ? "text-[10px] px-2 py-0.5 gap-1"
      : size === "lg"
      ? "text-xs px-3 py-1 gap-1.5 font-semibold"
      : "text-[11px] px-2.5 py-0.5 gap-1.5 font-medium";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium select-none ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      {showIcon && <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5 shrink-0"} />}
      <span>{displayText}</span>
    </span>
  );
}
