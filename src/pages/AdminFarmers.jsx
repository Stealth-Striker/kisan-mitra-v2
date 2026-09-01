import React, { useState, useEffect } from "react";
import { Users, Search, Trash2, MapPin, Sprout } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function AdminFarmers() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.User.list().catch(() => []),
      base44.entities.Farm.list().catch(() => []),
    ]).then(([u, f]) => {
      setUsers(u.filter((x) => x.role !== "admin"));
      setFarms(f);
      setLoading(false);
    });
  };
  useEffect(() => {
    load();
  }, []);

  const farmFor = (userId) => farms.find((f) => f.created_by_id === userId);

  const filtered = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const removeFarmer = async (u) => {
    if (!confirm(`Delete farmer ${u.full_name}? This cannot be undone.`)) return;
    try {
      const f = farmFor(u.id);
      if (f) await base44.entities.Farm.delete(f.id);
      await base44.entities.User.delete(u.id);
      load();
      toast({ title: "Farmer removed" });
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17201C] flex items-center gap-2.5">
          <Users className="w-6 h-6 text-[#005A3C]" />
          Registered Farmers
        </h1>
        <p className="text-sm text-[#66736D] mt-1">{users.length} registered accounts on platform</p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#66736D]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or village…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E1E8E4] bg-white text-sm text-[#17201C] focus:outline-none focus:ring-2 focus:ring-[#005A3C]/20 focus:border-[#0B8F62]"
        />
      </div>

      {loading ? (
        <p className="text-sm text-[#66736D]">Loading farmer records…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E1E8E4] p-8 text-center text-[#66736D] text-sm shadow-sm">
          No farmers found matching your search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u) => {
            const f = farmFor(u.id);
            return (
              <div
                key={u.id}
                className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="w-11 h-11 rounded-full bg-[#005A3C] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {(u.full_name || "F").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#17201C] truncate">{u.full_name || "Unnamed Farmer"}</p>
                      <p className="text-xs text-[#66736D] truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-[#17201C] bg-[#F7F9F7] p-3 rounded-xl border border-[#E1E8E4]">
                    {f ? (
                      <>
                        <p className="flex items-center gap-2 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#005A3C]" /> {f.location || "—"}, {f.district || ""}
                        </p>
                        <p className="flex items-center gap-2 font-medium">
                          <Sprout className="w-3.5 h-3.5 text-[#005A3C]" /> {f.primary_crop || "—"} • {f.farm_size}{" "}
                          {f.farm_size_unit}
                        </p>
                      </>
                    ) : (
                      <p className="italic text-[#66736D]">No farm profile configured yet</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => removeFarmer(u)}
                  className="w-full mt-4 border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 rounded-xl py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Farmer
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}