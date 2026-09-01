import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Search, Trash2, Plus, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFarm } from "@/lib/farmContext";
import { useToast } from "@/components/ui/use-toast";

export default function ConversationHistory() {
  const { language } = useFarm();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const load = () => {
    base44.entities.Conversation.filter({}, "-created_date", 50).then(setConversations).catch(() => {});
  };
  useEffect(() => {
    load();
  }, []);

  const openConv = async (conv) => {
    setActiveConv(conv);
    setLoadingMsgs(true);
    try {
      const msgs = await base44.entities.Message.filter({ conversation_id: conv.id }, "created_date", 200);
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
    setLoadingMsgs(false);
  };

  const deleteConv = async (conv) => {
    if (!confirm("Delete this conversation and all its messages?")) return;
    try {
      await base44.entities.Message.deleteMany({ conversation_id: conv.id });
      await base44.entities.Conversation.delete(conv.id);
      if (activeConv?.id === conv.id) {
        setActiveConv(null);
        setMessages([]);
      }
      load();
      toast({ title: "Conversation deleted" });
    } catch (e) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  const filtered = conversations.filter((c) => (c.title || "").toLowerCase().includes(search.toLowerCase()));

  const grouped = {};
  filtered.forEach((c) => {
    const d = new Date(c.created_date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    (grouped[d] ||= []).push(c);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17201C] flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-[#005A3C]" />
            Conversations
          </h1>
          <p className="text-sm text-[#66736D] mt-1">Search, reopen, and manage your past AI farming consultations.</p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-[#005A3C] hover:bg-[#003F2B] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Consultation
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#66736D]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversation history by topic or question..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E1E8E4] bg-white text-sm text-[#17201C] focus:outline-none focus:ring-2 focus:ring-[#005A3C]/20 focus:border-[#0B8F62]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-1 space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E1E8E4] p-8 text-center text-[#66736D] text-sm shadow-sm">
              No conversations found.
            </div>
          ) : (
            Object.entries(grouped).map(([date, convs]) => (
              <div key={date} className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#66736D] px-1">{date}</p>
                <div className="space-y-2">
                  {convs.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => openConv(c)}
                      className={`bg-white rounded-2xl border p-4 flex items-center gap-3 cursor-pointer transition-all shadow-sm ${
                        activeConv?.id === c.id
                          ? "border-[#005A3C] ring-2 ring-[#005A3C]/20"
                          : "border-[#E1E8E4] hover:border-[#0B8F62]/40 hover:shadow-md"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#E8F8F1] flex items-center justify-center shrink-0 text-[#005A3C]">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#17201C] truncate">{c.title || "Untitled Chat"}</p>
                        <p className="text-xs text-[#66736D] mt-0.5">{c.language}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConv(c);
                        }}
                        className="text-[#66736D] hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Conversation Detail View */}
        <div className="lg:col-span-2">
          {!activeConv ? (
            <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-12 text-center text-[#66736D] space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F8F1] flex items-center justify-center mx-auto text-[#005A3C]">
                <MessageSquare className="w-7 h-7" />
              </div>
              <p className="text-sm font-medium text-[#17201C]">Select a conversation to review messages</p>
              <p className="text-xs text-[#66736D]">Choose any item from the left column to view the full dialogue thread.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E1E8E4]">
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveConv(null)} className="lg:hidden text-[#66736D]">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-base font-bold text-[#17201C] truncate">{activeConv.title}</h3>
                </div>
                <span className="text-xs font-semibold text-[#005A3C] bg-[#E8F8F1] px-2.5 py-1 rounded-full">
                  {activeConv.language}
                </span>
              </div>

              {loadingMsgs ? (
                <p className="text-sm text-[#66736D] py-8 text-center">Loading conversation history...</p>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto km-chat-scroll pr-1">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-[#005A3C] text-white rounded-br-md"
                            : "bg-[#F7F9F7] text-[#17201C] border border-[#E1E8E4] rounded-bl-md"
                        }`}
                      >
                        {m.content}
                        <div
                          className={`text-[10px] mt-1 ${
                            m.role === "user" ? "text-emerald-100/70" : "text-[#66736D]"
                          }`}
                        >
                          {new Date(m.created_date).toLocaleString([], {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}