import React, { useState, useEffect } from "react";
import { MessageSquare, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AdminConversations() {
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.entities.Conversation.filter({}, "-created_date", 100).then(setConversations).catch(() => {});
  }, []);

  const filtered = conversations.filter((c) => (c.title || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17201C] flex items-center gap-2.5">
          <MessageSquare className="w-6 h-6 text-[#005A3C]" />
          Platform Consultations &amp; Dialogues
        </h1>
        <p className="text-sm text-[#66736D] mt-1">{conversations.length} total conversations across all registered farmers.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#66736D]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversation topics or question threads…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E1E8E4] bg-white text-sm text-[#17201C] focus:outline-none focus:ring-2 focus:ring-[#005A3C]/20 focus:border-[#0B8F62]"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E1E8E4] p-8 text-center text-[#66736D] text-sm shadow-sm">
            No conversation records found matching your query.
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#E8F8F1] flex items-center justify-center shrink-0 text-[#005A3C]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#17201C] text-sm truncate">{c.title || "Untitled Consultation"}</p>
                <p className="text-xs text-[#66736D] mt-0.5">
                  Language: <span className="font-semibold text-[#005A3C]">{c.language}</span> •{" "}
                  {new Date(c.created_date).toLocaleString([], {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}