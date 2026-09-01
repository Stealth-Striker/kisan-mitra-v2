import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Ruler, MapPin, Stethoscope, Radar, CalendarClock, LineChart, Sprout } from "lucide-react";
import { useFarm } from "@/lib/farmContext";
import { t } from "@/lib/translations";
import FeatureCard from "@/components/kisan/FeatureCard";
import HarvestAlert from "@/components/kisan/HarvestAlert";
import ChatPanel from "@/components/kisan/ChatPanel";
import { base44 } from "@/api/base44Client";

export default function FarmerDashboard() {
  const { user } = useOutletContext();
  const { farm, language } = useFarm();
  const navigate = useNavigate();
  const [alertVisible, setAlertVisible] = useState(true);
  const [nearbyAlerts, setNearbyAlerts] = useState(0);
  const [marketPrice, setMarketPrice] = useState("₹31/kg");

  const crop = farm?.primary_crop || "Rice";
  const locationStr = farm ? `${farm.location || "Varikoli"}, ${farm.state || "Kerala"}` : "Varikoli, Kerala";
  const farmSize = farm ? `${farm.farm_size || 1} ${farm.farm_size_unit || "Acre"}` : "1 Acre";

  useEffect(() => {
    base44.entities.DiseaseAlert.filter({ active: true })
      .then((alerts) => setNearbyAlerts(alerts.length || 3))
      .catch(() => setNearbyAlerts(3));

    base44.entities.MarketPrice.filter({ crop })
      .then((prices) => {
        if (prices.length > 0) {
          setMarketPrice(`₹${Math.round(prices[0].avg_price || 31)}/kg`);
        }
      })
      .catch(() => {});
  }, [crop]);

  const prompt = new URLSearchParams(window.location.search).get("prompt");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Greeting section with seamless right-side landscape artwork */}
      <div className="relative rounded-2xl p-4 sm:p-6 min-h-[170px] flex flex-col justify-between overflow-hidden">
        {/* Right side landscape artwork */}
        <div className="absolute right-0 top-0 bottom-0 w-3/5 sm:w-1/2 md:w-3/5 pointer-events-none overflow-hidden rounded-2xl">
          <div
            className="absolute inset-0 z-10"
            style={{
              background: "linear-gradient(90deg, #F7F9F7 0%, rgba(247,249,247,0.85) 25%, transparent 80%)",
            }}
          />
          <img src="/hero-landscape.png" alt="Agricultural Landscape" className="w-full h-full object-cover" />
        </div>

        {/* Content area */}
        <div className="relative z-20 space-y-4 max-w-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17201C]">
              {t(language, "namaskaram")}, {user?.full_name || "Ramesh"} 👋
            </h1>
            <p className="text-[#66736D] text-sm sm:text-base mt-1.5 font-normal">
              {t(language, "howCanIHelp", { crop })}
            </p>
          </div>

          {/* Farm metadata chips matching reference exact 3 pills */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E1E8E4] shadow-xs text-sm font-medium text-[#17201C]">
              <MapPin className="w-4 h-4 text-[#005A3C]" />
              <span>{locationStr}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E1E8E4] shadow-xs text-sm font-medium text-[#17201C]">
              <Ruler className="w-4 h-4 text-[#005A3C]" />
              <span>{farmSize}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E1E8E4] shadow-xs text-sm font-medium text-[#17201C]">
              <Sprout className="w-4 h-4 text-[#005A3C]" />
              <span>—</span>
            </div>
          </div>
        </div>
      </div>

      {/* HARVEST ALERT - wide horizontal banner matching reference */}
      {alertVisible && (
        <HarvestAlert
          message={`${crop}s may reach peak harvest readiness in ~7 days.`}
          onView={() => navigate("/harvest-guardian")}
          onDismiss={() => setAlertVisible(false)}
        />
      )}

      {/* 4 AI MODULE CARDS in 2x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FeatureCard
          icon={Stethoscope}
          title={t(language, "cropDoctor")}
          subtitle={t(language, "aiCropDiagnosis")}
          description={t(language, "uploadLeafPhoto")}
          status={t(language, "ready")}
          statusColor="green"
          to={() => navigate("/crop-doctor")}
        />
        <FeatureCard
          icon={Radar}
          title={t(language, "outbreakRadar")}
          subtitle={t(language, "localDiseaseMonitoring")}
          description={t(language, "seeNearbyPest")}
          status={`${nearbyAlerts} ${t(language, "nearbyAlerts")}`}
          statusColor="red"
          to={() => navigate("/outbreak-radar")}
        />
        <FeatureCard
          icon={CalendarClock}
          title={t(language, "harvestGuardian")}
          subtitle={t(language, "harvestTimingAssistant")}
          description={t(language, "estimateWhenReady")}
          status={t(language, "monitoring")}
          statusColor="yellow"
          to={() => navigate("/harvest-guardian")}
        />
        <FeatureCard
          icon={LineChart}
          title={t(language, "marketCopilot")}
          subtitle={t(language, "marketIntelligence")}
          description={t(language, "comparePrices")}
          status={`${marketPrice} nearby`}
          statusColor="blue"
          to={() => navigate("/market-copilot")}
        />
      </div>

      {/* ASK KISAN MITRA AI Assistant input card */}
      <ChatPanel user={user} initialPrompt={prompt} />
    </div>
  );
}