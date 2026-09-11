import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Sprout, ArrowLeft, Home, Stethoscope, Radar, TrendingUp } from "lucide-react";
import SEO from "@/components/SEO";

export default function PageNotFound() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F7F9F7]">
      <SEO 
        title="404 - Page Not Found" 
        description="The requested page could not be found on Kisan Mitra. Navigate back to your smart farming dashboard."
      />
      <div className="max-w-xl w-full text-center">
        {/* Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#E8F8F1] text-[#005A3C] shadow-sm mb-6">
          <Sprout className="w-10 h-10" />
        </div>

        {/* 404 Header */}
        <h1 className="text-6xl sm:text-7xl font-extrabold text-[#005A3C] tracking-tight mb-3">
          404
        </h1>
        <h2 className="text-2xl font-bold text-[#17201C] mb-2">
          Page Not Found
        </h2>
        <p className="text-[#66736D] text-sm sm:text-base max-w-md mx-auto mb-8">
          The field you are looking for at <code className="bg-emerald-50 text-[#005A3C] px-2 py-0.5 rounded text-xs font-mono">{path}</code> does not exist or has been moved.
        </p>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
          <Link
            to="/dashboard"
            className="p-4 bg-white rounded-2xl border border-[#E1E8E4] hover:border-[#0B8F62] hover:shadow-sm transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8F8F1] text-[#005A3C] flex items-center justify-center shrink-0 group-hover:bg-[#005A3C] group-hover:text-white transition-colors">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#17201C]">Farmer Dashboard</div>
              <div className="text-xs text-[#66736D]">Overview and daily farm metrics</div>
            </div>
          </Link>

          <Link
            to="/crop-doctor"
            className="p-4 bg-white rounded-2xl border border-[#E1E8E4] hover:border-[#0B8F62] hover:shadow-sm transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8F8F1] text-[#005A3C] flex items-center justify-center shrink-0 group-hover:bg-[#005A3C] group-hover:text-white transition-colors">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#17201C]">Crop Doctor</div>
              <div className="text-xs text-[#66736D]">AI visual diagnosis for plant health</div>
            </div>
          </Link>

          <Link
            to="/outbreak-radar"
            className="p-4 bg-white rounded-2xl border border-[#E1E8E4] hover:border-[#0B8F62] hover:shadow-sm transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8F8F1] text-[#005A3C] flex items-center justify-center shrink-0 group-hover:bg-[#005A3C] group-hover:text-white transition-colors">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#17201C]">Outbreak Radar</div>
              <div className="text-xs text-[#66736D]">Regional pest and disease alert map</div>
            </div>
          </Link>

          <Link
            to="/market-copilot"
            className="p-4 bg-white rounded-2xl border border-[#E1E8E4] hover:border-[#0B8F62] hover:shadow-sm transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8F8F1] text-[#005A3C] flex items-center justify-center shrink-0 group-hover:bg-[#005A3C] group-hover:text-white transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#17201C]">Market Copilot</div>
              <div className="text-xs text-[#66736D]">Live APMC market prices and trends</div>
            </div>
          </Link>
        </div>

        {/* Return Button */}
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#005A3C] hover:bg-[#0B8F62] text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}