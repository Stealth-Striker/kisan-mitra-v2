import React from "react";
import { useOutletContext, useLocation } from "react-router-dom";
import { Bot, Sparkles, MessageSquare, Mic, Camera } from "lucide-react";
import ChatPanel from "@/components/kisan/ChatPanel";
import SEO from "@/components/SEO";
import { useFarm } from "@/lib/farmContext";

export default function AskKisanMitra() {
  const context = useOutletContext();
  const user = context?.user;
  const { farm } = useFarm();
  const location = useLocation();

  const prompt = new URLSearchParams(location.search).get("prompt");
  const crop = farm?.primary_crop || "Rice";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <SEO
        title="Ask Kisan Mitra - AI Farming Assistant"
        description="Interact with Kisan Mitra AI assistant for multi-lingual crop disease detection, voice queries, weather advice, and APMC market guidance."
        canonicalPath="/chat"
      />

      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#002D1F] to-[#005A3C] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Bot className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold uppercase tracking-wider backdrop-blur-xs border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            AI Agronomic Companion
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ask Kisan Mitra
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
            Your dedicated agricultural AI assistant for {crop} farming. Ask questions in Malayalam, Hindi, Tamil, or English, attach leaf photos for pathology analysis, or tap the microphone to speak naturally.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-emerald-200/80">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
              <Mic className="w-3.5 h-3.5" /> Voice Input & Speech
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
              <Camera className="w-3.5 h-3.5" /> Leaf Photo Diagnosis
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
              <MessageSquare className="w-3.5 h-3.5" /> Multilingual Support
            </span>
          </div>
        </div>
      </div>

      {/* Chat Assistant Panel */}
      <ChatPanel user={user} initialPrompt={prompt} />
    </div>
  );
}
