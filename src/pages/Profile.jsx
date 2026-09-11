import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  User,
  Sprout,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Ruler,
  Layers,
  Droplets,
  ArrowRight,
  Globe,
  Settings,
  BadgeCheck,
} from "lucide-react";
import { useFarm } from "@/lib/farmContext";
import { LANGUAGES, t } from "@/lib/translations";
import SEO from "@/components/SEO";

export default function Profile() {
  const context = useOutletContext() || {};
  const { farm, user: farmUser, language } = useFarm();
  const user = context.user || farmUser;

  const displayName = user?.full_name || user?.name || "Ramesh Kumar";
  const avatarLetter = (displayName[0] || "F").toUpperCase();
  const phone = user?.phone || "+91 98765 43210";
  const email = user?.email || "farmer@kisanmitra.in";
  const role = user?.role === "admin" ? "System Administrator" : "Verified Producer";

  const farmName = farm?.name || "Varikoli Heritage Farm";
  const primaryCrop = farm?.primary_crop || farm?.crop || "Rice";
  const secondaryCrop = farm?.secondary_crop || "Black Pepper & Coconut";
  const farmSize = farm?.farm_size || farm?.acreage || 1.5;
  const farmSizeUnit = farm?.farm_size_unit || "Acre";
  const soilType = farm?.soil_type || "Alluvial Clay Loam";
  const irrigation = farm?.irrigation || "Canal & Borewell Drip";
  const location = farm?.location || "Varikoli";
  const district = farm?.district || "Ernakulam";
  const stateName = farm?.state || "Kerala";
  const farmerSince = farm?.farmer_since || "2018";
  const kisanId = farm?.kisan_id || `KM-KL-${farm?.id ? farm.id.slice(0, 4).toUpperCase() : "8841"}`;

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <SEO
        title="Farmer Profile"
        description="View your farmer identity, agricultural landholding, registered crops, and Kisan credentials."
        canonicalPath="/profile"
      />

      {/* ── Top Hero Profile Banner (Read-Only) ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E1E8E4] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-[#DDF5EA]/50 to-transparent pointer-events-none rounded-full blur-2xl -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar Container */}
            <div className="relative shrink-0">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={displayName}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover shadow-sm border-2 border-white ring-4 ring-[#DDF5EA]"
                />
              ) : (
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-[#087F5B] text-white flex items-center justify-center text-3xl font-extrabold shadow-sm border-2 border-white ring-4 ring-[#DDF5EA]">
                  {avatarLetter}
                </div>
              )}
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#16A36F] text-white flex items-center justify-center shadow-xs ring-2 ring-white"
                title="Verified Farmer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Farmer Core Metadata */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17211D]">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DDF5EA] text-[#063F2E] text-xs font-bold tracking-wide">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {role}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#65736C] flex items-center gap-2 flex-wrap">
                <span className="font-medium text-[#17211D]">{farmName}</span>
                <span className="text-[#A1ACA5]">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#087F5B]" />
                  {location}, {district}, {stateName}
                </span>
              </p>

              <div className="flex items-center gap-4 text-xs text-[#65736C] pt-1">
                <span>Kisan ID: <strong className="text-[#063F2E] font-semibold">{kisanId}</strong></span>
                <span>Practicing Since: <strong className="text-[#17211D] font-semibold">{farmerSince}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Link to Preferences if modifications needed */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/preferences"
              className="px-4 py-2.5 rounded-xl border border-[#E1E8E4] bg-[#F6F8F5] hover:bg-[#DDF5EA]/50 text-xs font-bold text-[#063F2E] transition-colors flex items-center gap-2"
            >
              <Settings className="w-3.5 h-3.5 text-[#087F5B]" />
              <span>Edit in Preferences</span>
            </Link>
          </div>
        </div>

        {/* Highlight Metrics Strip */}
        <div className="mt-7 pt-6 border-t border-[#E1E8E4] grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
            <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Landholding</p>
            <p className="text-base font-bold text-[#17211D] mt-0.5">{farmSize} {farmSizeUnit}</p>
            <p className="text-[10px] text-[#087F5B] font-medium mt-0.5">Active cultivation</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
            <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Primary Crop</p>
            <p className="text-base font-bold text-[#17211D] mt-0.5">{primaryCrop}</p>
            <p className="text-[10px] text-[#087F5B] font-medium mt-0.5">Kharif Season</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
            <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Soil Profile</p>
            <p className="text-base font-bold text-[#17211D] mt-0.5 truncate">{soilType}</p>
            <p className="text-[10px] text-[#087F5B] font-medium mt-0.5">pH 6.4 • Fertile</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
            <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Kisan Registry</p>
            <p className="text-base font-bold text-[#063F2E] mt-0.5">Verified Active</p>
            <p className="text-[10px] text-[#65736C] font-medium mt-0.5">KCC &amp; PM-Kisan</p>
          </div>
        </div>
      </div>

      {/* ── Read-Only Details Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Personal Details & Farm Registry */}
        <div className="lg:col-span-7 space-y-6">
          {/* Personal Information (Read-Only) */}
          <div className="bg-white rounded-2xl border border-[#E1E8E4] p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#E1E8E4] pb-3">
              <div className="w-8 h-8 rounded-lg bg-[#DDF5EA] text-[#063F2E] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#17211D] uppercase tracking-wider">
                  Personal Details
                </h2>
                <p className="text-xs text-[#65736C]">Verified producer identity and contact information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Full Legal Name</p>
                <p className="text-xs font-bold text-[#17211D]">{displayName}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Contact Mobile</p>
                <p className="text-xs font-bold text-[#17211D] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#087F5B]" />
                  <span>{phone}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Registered Email</p>
                <p className="text-xs font-bold text-[#17211D] flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                  <span className="truncate">{email}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">System Language</p>
                <p className="text-xs font-bold text-[#17211D] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#087F5B]" />
                  <span>{currentLangObj.label} ({currentLangObj.native})</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1 sm:col-span-2">
                <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Government Scheme Linkage</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#DDF5EA] text-[#063F2E] text-[11px] font-semibold">
                    <BadgeCheck className="w-3.5 h-3.5" /> PM-Kisan ID Linked
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#DDF5EA] text-[#063F2E] text-[11px] font-semibold">
                    <BadgeCheck className="w-3.5 h-3.5" /> Kisan Credit Card (KCC) Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Farm & Landholding (Read-Only) */}
          <div className="bg-white rounded-2xl border border-[#E1E8E4] p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#E1E8E4] pb-3">
              <div className="w-8 h-8 rounded-lg bg-[#DDF5EA] text-[#063F2E] flex items-center justify-center">
                <Sprout className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#17211D] uppercase tracking-wider">
                  Farm &amp; Cultivation Parameters
                </h2>
                <p className="text-xs text-[#65736C]">Landholding area, crop profile, and irrigation system</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1 sm:col-span-2">
                <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Farm / Holding Name</p>
                <p className="text-xs font-bold text-[#17211D]">{farmName}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Primary Target Crop</p>
                <p className="text-xs font-bold text-[#063F2E] flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5" />
                  <span>{primaryCrop} Cultivation</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Secondary / Intercrop</p>
                <p className="text-xs font-bold text-[#17211D]">{secondaryCrop}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Total Land Area</p>
                <p className="text-xs font-bold text-[#17211D] flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-[#087F5B]" />
                  <span>{farmSize} {farmSizeUnit}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Soil Classification</p>
                <p className="text-xs font-bold text-[#17211D] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#087F5B]" />
                  <span>{soilType}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1 sm:col-span-2">
                <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Irrigation Setup</p>
                <p className="text-xs font-bold text-[#17211D] flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-[#087F5B]" />
                  <span>{irrigation}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Geographic Details & Hub Navigation */}
        <div className="lg:col-span-5 space-y-6">
          {/* Geographic Location (Read-Only) */}
          <div className="bg-white rounded-2xl border border-[#E1E8E4] p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#E1E8E4] pb-3">
              <div className="w-8 h-8 rounded-lg bg-[#DDF5EA] text-[#063F2E] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#17211D] uppercase tracking-wider">
                  Geographic Location
                </h2>
                <p className="text-xs text-[#65736C]">Calibrated for regional weather and APMC mandis</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Village / Town</p>
                <p className="text-xs font-bold text-[#17211D]">{location}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                  <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">District</p>
                  <p className="text-xs font-bold text-[#17211D]">{district}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                  <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">State</p>
                  <p className="text-xs font-bold text-[#17211D]">{stateName}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1">
                <p className="text-[11px] font-semibold text-[#65736C] uppercase tracking-wider">Farming Experience</p>
                <p className="text-xs font-bold text-[#17211D] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#087F5B]" />
                  <span>Cultivating since {farmerSince} (6+ years active)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Connected Farm Hubs */}
          <div className="bg-white rounded-2xl border border-[#E1E8E4] p-5 sm:p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-[#17211D] uppercase tracking-wider">
              Connected Farm Hubs
            </h3>

            <div className="space-y-2">
              <Link
                to="/crop-doctor"
                className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] flex items-center justify-between hover:border-[#087F5B]/40 hover:bg-[#DDF5EA]/20 transition-all text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#DDF5EA] text-[#063F2E] flex items-center justify-center font-bold">
                    <Sprout className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-[#17211D] group-hover:text-[#063F2E]">Crop Doctor Inspection</p>
                    <p className="text-[11px] text-[#65736C]">AI pathogen diagnosis &amp; tank mix calculator</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#65736C] group-hover:text-[#087F5B] transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                to="/outbreak-radar"
                className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] flex items-center justify-between hover:border-[#087F5B]/40 hover:bg-[#DDF5EA]/20 transition-all text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#DDF5EA] text-[#063F2E] flex items-center justify-center font-bold">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-[#17211D] group-hover:text-[#063F2E]">Outbreak Radar</p>
                    <p className="text-[11px] text-[#65736C]">Live pest perimeter &amp; community alerts</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#65736C] group-hover:text-[#087F5B] transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                to="/market-copilot"
                className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] flex items-center justify-between hover:border-[#087F5B]/40 hover:bg-[#DDF5EA]/20 transition-all text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#DDF5EA] text-[#063F2E] flex items-center justify-center font-bold">
                    <Ruler className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-[#17211D] group-hover:text-[#063F2E]">Market Copilot</p>
                    <p className="text-[11px] text-[#65736C]">APMC wholesale price trajectories &amp; freight</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#65736C] group-hover:text-[#087F5B] transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
