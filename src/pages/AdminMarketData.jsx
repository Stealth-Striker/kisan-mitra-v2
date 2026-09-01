import React, { useState, useEffect } from "react";
import { TrendingUp, Plus, Trash2, Edit, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function AdminMarketData() {
  const { toast } = useToast();
  const [prices, setPrices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    market: "",
    location: "",
    crop: "Rice",
    min_price: 28,
    max_price: 35,
    avg_price: 31,
    report_date: new Date().toISOString().slice(0, 10),
  });

  const load = () => {
    base44.entities.MarketPrice.filter({}, "-report_date", 100).then(setPrices).catch(() => {});
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.market || !form.location) {
      toast({ title: "Required", description: "Market and location required.", variant: "destructive" });
      return;
    }
    try {
      if (editing === "new") await base44.entities.MarketPrice.create(form);
      else await base44.entities.MarketPrice.update(editing, form);
      setEditing(null);
      load();
      toast({ title: "Price data saved" });
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (p) => {
    if (!confirm("Delete this price entry?")) return;
    await base44.entities.MarketPrice.delete(p.id);
    load();
    toast({ title: "Price entry deleted" });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17201C] flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-[#005A3C]" />
            Wholesale Market Data Management
          </h1>
          <p className="text-sm text-[#66736D] mt-1">
            {prices.length} market price entries — consumed by farmer Market Copilots.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing("new");
            setForm({
              market: "",
              location: "",
              crop: "Rice",
              min_price: 28,
              max_price: 35,
              avg_price: 31,
              report_date: new Date().toISOString().slice(0, 10),
            });
          }}
          className="bg-[#005A3C] hover:bg-[#003F2B] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Market Price Entry
        </button>
      </div>

      {editing && (
        <div className="bg-white rounded-2xl border-2 border-[#005A3C] shadow-md p-6 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1E8E4]">
            <h3 className="font-bold text-[#17201C] text-base">
              {editing === "new" ? "New Market Price Record" : "Edit Market Record"}
            </h3>
            <button onClick={() => setEditing(null)} className="text-[#66736D] hover:text-[#17201C]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#17201C] uppercase tracking-wider mb-1 block">
                Mandi / Market Name
              </label>
              <input
                value={form.market}
                onChange={(e) => setForm({ ...form, market: e.target.value })}
                className="km-input"
                placeholder="e.g. Kochi APMC Market"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#17201C] uppercase tracking-wider mb-1 block">
                Location
              </label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="km-input"
                placeholder="e.g. Kochi, Kerala"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#17201C] uppercase tracking-wider mb-1 block">Crop</label>
              <input
                value={form.crop}
                onChange={(e) => setForm({ ...form, crop: e.target.value })}
                className="km-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#17201C] uppercase tracking-wider mb-1 block">Date</label>
              <input
                type="date"
                value={form.report_date}
                onChange={(e) => setForm({ ...form, report_date: e.target.value })}
                className="km-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#17201C] uppercase tracking-wider mb-1 block">
                Min Price (₹/kg)
              </label>
              <input
                type="number"
                value={form.min_price}
                onChange={(e) => setForm({ ...form, min_price: Number(e.target.value) })}
                className="km-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#17201C] uppercase tracking-wider mb-1 block">
                Max Price (₹/kg)
              </label>
              <input
                type="number"
                value={form.max_price}
                onChange={(e) => setForm({ ...form, max_price: Number(e.target.value) })}
                className="km-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#17201C] uppercase tracking-wider mb-1 block">
                Average Price (₹/kg)
              </label>
              <input
                type="number"
                value={form.avg_price}
                onChange={(e) => setForm({ ...form, avg_price: Number(e.target.value) })}
                className="km-input"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              className="bg-[#005A3C] hover:bg-[#003F2B] text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Save Record
            </button>
            <button
              onClick={() => setEditing(null)}
              className="border border-[#E1E8E4] bg-white text-[#17201C] hover:bg-gray-50 px-5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#F7F9F7] text-[#66736D] border-b border-[#E1E8E4]">
            <tr>
              <th className="p-4 text-xs uppercase tracking-wider font-bold">Market / Mandi</th>
              <th className="p-4 text-xs uppercase tracking-wider font-bold hidden sm:table-cell">Crop</th>
              <th className="p-4 text-xs uppercase tracking-wider font-bold">Min</th>
              <th className="p-4 text-xs uppercase tracking-wider font-bold">Max</th>
              <th className="p-4 text-xs uppercase tracking-wider font-bold">Average</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E1E8E4]">
            {prices.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#66736D]">
                  No market price data uploaded yet.
                </td>
              </tr>
            ) : (
              prices.map((p) => (
                <tr key={p.id} className="hover:bg-[#E8F8F1]/30 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-[#17201C]">{p.market}</p>
                    <p className="text-xs text-[#66736D]">{p.location}</p>
                  </td>
                  <td className="p-4 hidden sm:table-cell font-medium text-[#17201C]">{p.crop}</td>
                  <td className="p-4 text-[#66736D]">₹{p.min_price}</td>
                  <td className="p-4 text-[#66736D]">₹{p.max_price}</td>
                  <td className="p-4 font-extrabold text-[#005A3C]">₹{p.avg_price}/kg</td>
                  <td className="p-4 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => {
                          setEditing(p.id);
                          setForm(p);
                        }}
                        className="p-2 text-[#66736D] hover:text-[#005A3C] rounded-lg hover:bg-[#E8F8F1] transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => remove(p)}
                        className="p-2 text-[#66736D] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}