import React from "react";
import { useOutletContext, useLocation } from "react-router-dom";
import { Bot, MessageSquare, Mic, Camera } from "lucide-react";
import ChatPanel from "@/components/kisan/ChatPanel";
import SEO from "@/components/SEO";
import { useFarm } from "@/lib/farmContext";
import { t } from "@/lib/translations";

export default function AskKisanMitra() {
  const context = useOutletContext();
  const user = context?.user;
  const { farm, language } = useFarm();
  const location = useLocation();

  const prompt = new URLSearchParams(location.search).get("prompt");
  const crop = farm?.primary_crop || "Rice";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <SEO
        title="Ask Kisan Mitra - AI Farming Assistant"
        description="Interact with Kisan Mitra, an intelligent bilingual agricultural assistant answering questions on fertilizer doses, pest treatments, crop planning, and APMC rates."
        canonicalPath="/chat"
      />

      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#032C21] via-[#063F2E] to-[#087F5B] rounded-3xl p-6 sm:p-8 text-white shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Bot className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t(language, "askKisanMitraNav")}
          </h1>
          <p className="text-sm sm:text-base text-[#DDF5EA]/90 leading-relaxed font-normal">
            {t(language, "chatDescription", { crop })}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-[#DDF5EA]/80">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
              <Mic className="w-3.5 h-3.5" /> {t(language, "voiceInputSpeech")}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
              <Camera className="w-3.5 h-3.5" /> {t(language, "leafPhotoDiagnosis")}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
              <MessageSquare className="w-3.5 h-3.5" /> {t(language, "multilingualSupport")}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Assistant Panel */}
      <ChatPanel user={user} initialPrompt={prompt} />
    </div>
  );
}
