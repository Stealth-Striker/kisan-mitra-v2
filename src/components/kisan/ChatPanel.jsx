import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Paperclip, Mic, Send, Sprout, Volume2, Loader2, X, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFarm } from "@/lib/farmContext";
import { t } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";

const SUGGESTED = [
  "What disease is affecting my rice?",
  "When should I harvest?",
  "What is today's rice price?",
  "How to control stem borer?",
];

function formatTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatPanel({ user, initialPrompt }) {
  const { farm, language } = useFarm();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);

  const crop = farm?.primary_crop || "Rice";
  const farmerContext = {
    crop,
    location: farm ? `${farm.location || "Varikoli"}, ${farm.state || "Kerala"}` : "Varikoli, Kerala",
    farmSize: farm?.farm_size || 1,
    farmSizeUnit: farm?.farm_size_unit || "Acre",
  };

  const ensureConversation = useCallback(async () => {
    if (conversationId) return conversationId;
    const conv = await base44.entities.Conversation.create({
      title: "New Conversation",
      language,
    });
    setConversationId(conv.id);
    return conv.id;
  }, [conversationId, language]);

  const send = async (text, imageUrl) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");
    const userMsg = { role: "user", content, image_url: imageUrl, created_date: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const convId = await ensureConversation();
      await base44.entities.Message.create({
        conversation_id: convId,
        role: "user",
        content,
        language,
      });

      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      const res = await base44.functions.invoke("askKisanMitra", {
        question: content,
        language,
        farmerContext,
        history,
      });

      const answer = res.data?.answer || "I'm sorry, I couldn't generate a response right now. Please try again.";
      const aiMsg = { role: "assistant", content: answer, created_date: new Date().toISOString() };
      setMessages((m) => [...m, aiMsg]);
      await base44.entities.Message.create({
        conversation_id: convId,
        role: "assistant",
        content: answer,
        language,
      });

      const title = content.slice(0, 40);
      await base44.entities.Conversation.update(convId, { title });
    } catch (e) {
      const fallback =
        "I'm having trouble connecting to the AI service. Please check your crop for any visual symptoms or try again shortly.";
      setMessages((m) => [...m, { role: "assistant", content: fallback, created_date: new Date().toISOString() }]);
      toast({ title: "AI unavailable", description: "Showing a fallback response.", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (initialPrompt) {
      send(initialPrompt);
      navigate("/dashboard", { replace: true });
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      toast({ title: "Invalid file", description: "Please upload JPG, PNG, or WEBP images.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 10MB.", variant: "destructive" });
      return;
    }
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachedImage(file_url);
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast({
        title: "Voice input unavailable",
        description: "Your browser doesn't support speech recognition. Please type instead.",
      });
      return;
    }
    const rec = new SR();
    rec.lang =
      language === "Malayalam"
        ? "ml-IN"
        : language === "Hindi"
        ? "hi-IN"
        : language === "Tamil"
        ? "ta-IN"
        : "en-IN";
    rec.interimResults = false;
    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang =
      language === "Malayalam"
        ? "ml-IN"
        : language === "Hindi"
        ? "hi-IN"
        : language === "Tamil"
        ? "ta-IN"
        : "en-IN";
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm overflow-hidden flex flex-col">
      {/* Top Header if messages exist */}
      {messages.length > 0 && (
        <div className="px-6 py-3.5 border-b border-[#E1E8E4] bg-[#E8F8F1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#005A3C] flex items-center justify-center">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#17201C]">{t(language, "askKisanMitra")}</h2>
              <p className="text-[11px] text-[#66736D]">Active conversation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setConversationId(null);
            }}
            className="text-xs text-[#005A3C] hover:underline font-medium cursor-pointer"
          >
            {t(language, "newConversation")}
          </button>
        </div>
      )}

      {/* Messages area */}
      {messages.length > 0 && (
        <div
          ref={scrollRef}
          className="km-chat-scroll flex-1 overflow-y-auto px-6 py-5 space-y-4 max-h-[380px] bg-[#F7F9F7]"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {m.image_url && (
                  <div className="w-32 h-32 rounded-xl overflow-hidden ring-1 ring-border mb-1">
                    <Image src={m.image_url} className="w-full h-full object-cover" fittingType="fill" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#005A3C] text-white rounded-br-md"
                      : "bg-white text-[#17201C] border border-[#E1E8E4] rounded-bl-md shadow-sm"
                  }`}
                >
                  {m.content}
                  {m.role === "assistant" && (
                    <button onClick={() => speak(m.content)} className="ml-2 align-middle opacity-60 hover:opacity-100 cursor-pointer">
                      <Volume2 className="w-3.5 h-3.5 inline" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-[#66736D] px-1">{formatTime(m.created_date)}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#E1E8E4] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-[#005A3C]" />
                <span className="text-sm text-[#66736D]">Kisan Mitra is thinking…</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input section matching reference exact layout */}
      <div className="p-4 sm:p-5 bg-white">
        {attachedImage && (
          <div className="mb-3 inline-flex items-center gap-2 bg-[#E8F8F1] border border-[#E1E8E4] rounded-xl p-1.5 pr-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden">
              <Image src={attachedImage} className="w-full h-full object-cover" fittingType="fill" />
            </div>
            <span className="text-xs text-[#005A3C] font-medium">Photo attached</span>
            <button onClick={() => setAttachedImage(null)} className="text-[#66736D] hover:text-[#17201C]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#005A3C] flex items-center justify-center shrink-0 shadow-sm">
            <Sprout className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={t(language, "askKisanMitra")}
              className="w-full pl-0 pr-4 py-1 text-base font-semibold text-[#17201C] placeholder:text-[#17201C] placeholder:font-bold bg-transparent focus:outline-none"
            />
            <p className="text-xs text-[#66736D] hidden sm:block font-medium">
              {t(language, "typeInAnyLanguage")}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={startListening}
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-colors cursor-pointer ${
                listening
                  ? "bg-red-50 border-red-200 text-red-500"
                  : "border-[#E1E8E4] text-[#66736D] hover:bg-[#E8F8F1] hover:text-[#005A3C]"
              }`}
              title="Voice input"
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-full bg-[#005A3C] hover:bg-[#003F2B] text-white flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggested Prompts Pills */}
        <div className="mt-4 pt-3 border-t border-[#E1E8E4]/60 flex flex-wrap items-center gap-2">
          {SUGGESTED.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="text-xs px-3.5 py-1.5 rounded-full border border-[#E1E8E4] bg-white text-[#17201C] hover:border-[#005A3C] hover:text-[#005A3C] hover:bg-[#E8F8F1] transition-all font-medium cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}