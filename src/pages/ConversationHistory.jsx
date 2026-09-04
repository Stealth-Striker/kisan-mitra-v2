import React, { useState, useEffect } from "react";
import { MessageSquare, Search, Trash2, ArrowLeft, AlertTriangle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFarm } from "@/lib/farmContext";
import { useToast } from "@/components/ui/use-toast";
import SEO from "@/components/SEO";

export default function ConversationHistory() {
  const { language } = useFarm();
  const { toast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

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

  const confirmDeleteConv = (conv) => {
    setConfirmModal({
      title: "Delete Conversation?",
      description: `Are you sure you want to delete "${conv.title || "Untitled Chat"}" and its messages? This action cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
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
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const confirmClearAll = () => {
    if (conversations.length === 0) return;
    setConfirmModal({
      title: "Clear All Conversations?",
      description: "Are you sure you want to delete your entire consultation history? All past conversations and messages will be permanently removed. This action cannot be undone.",
      confirmLabel: "Clear All",
      onConfirm: async () => {
        try {
          await Promise.all(
            conversations.map(async (c) => {
              try {
                await base44.entities.Message.deleteMany({ conversation_id: c.id });
              } catch (_) {}
              try {
                await base44.entities.Conversation.delete(c.id);
              } catch (_) {}
            })
          );
          setActiveConv(null);
          setMessages([]);
          load();
          toast({ title: "History cleared", description: "All past consultations have been deleted." });
        } catch (e) {
          toast({ title: "Clear failed", description: e.message, variant: "destructive" });
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && confirmModal) {
        setConfirmModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmModal]);

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
      <SEO 
        title="Consultation History - AI Farming Assistant" 
        description="Search, reopen, and manage your past AI farming consultations with Kisan Mitra."
        canonicalPath="/conversations"
      />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17201C] flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-[#005A3C]" />
            Conversations
          </h1>
          <p className="text-sm text-[#66736D] mt-1">Search, reopen, and manage your past AI farming consultations.</p>
        </div>
        {conversations.length > 0 && (
          <button
            type="button"
            onClick={confirmClearAll}
            className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            title="Clear all conversation history"
          >
            <Trash2 className="w-4 h-4 text-red-600" /> Clear All
          </button>
        )}
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
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDeleteConv(c);
                        }}
                        className="text-[#66736D] hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete conversation"
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

      {/* Themed Confirmation Modal */}
      {confirmModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmModal(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            className="bg-white border border-[#E1E8E4] rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#17201C]">{confirmModal.title}</h3>
                <p className="text-sm text-[#66736D] mt-1.5 leading-relaxed">
                  {confirmModal.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="text-[#66736D] hover:text-[#17201C] p-1 rounded-lg hover:bg-[#F7F9F7] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E1E8E4]/70">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E1E8E4] bg-white text-sm font-medium text-[#17201C] hover:bg-[#F7F9F7] hover:border-[#CED7D2] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {confirmModal.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}