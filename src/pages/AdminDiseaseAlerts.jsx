import React, { useState, useEffect } from "react";
import { Bug, Plus, Trash2, Edit, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const SEVERITY = ["Low", "Moderate", "High", "Severe"];
const TYPES = ["Disease", "Pest"];

export default function AdminDiseaseAlerts() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    disease: "",
    alert_type: "Disease",
    location: "",
    severity: "Moderate",
    crop: "Rice",
    report_date: new Date().toISOString().slice(0, 10),
    recommended_action: "",
    active: true,
  });

  const load = () => {
    base44.entities.DiseaseAlert.filter({}, "-report_date", 100).then(setAlerts).catch(() => {});
  };
  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing("new");
    setForm({
      disease: "",
      alert_type: "Disease",
      location: "",
      severity: "Moderate",
      crop: "Rice",
      report_date: new Date().toISOString().slice(0, 10),
      recommended_action: "",
      active: true,
    });
  };

  const save = async () => {
    if (!form.disease || !form.location) {
      toast({ title: "Required", description: "Disease and location are required.", variant: "destructive" });
      return;
    }
    try {
      if (editing === "new") {
        await base44.entities.DiseaseAlert.create(form);
      } else {
        await base44.entities.DiseaseAlert.update(editing, form);
      }
      setEditing(null);
      load();
      toast({ title: "Alert saved" });
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (a) => {
    if (!confirm("Delete this alert?")) return;
    await base44.entities.DiseaseAlert.delete(a.id);
    load();
    toast({ title: "Alert deleted" });
  };

  const sevColor = {
    Low: "text-emerald-700 bg-emerald-50 border border-emerald-200",
    Moderate: "text-amber-700 bg-amber-50 border border-amber-200",
    High: "text-orange-700 bg-orange-50 border border-orange-200",
    Severe: "text-red-700 bg-red-50 border border-red-200",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17201C] flex items-center gap-2.5">
            <Bug className="w-6 h-6 text-[#005A3C]" />
            Disease Alerts Management
          </h1>
          <p className="text-sm text-[#66736D] mt-1">
            {alerts.length} active advisories — changes sync live to farmer Outbreak Radars.
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-[#005A3C] hover:bg-[#003F2B] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Advisory Alert
        </button>
      </div>

      {editing && (
        <div className="bg-white rounded-2xl border-2 border-[#005A3C] shadow-md p-6 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1E8E4]">
            <h3 className="font-bold text-[#17201C] text-base">
              {editing === "new" ? "New Disease Advisory Alert" : "Edit Advisory Alert"}
            </h3>
            <button onClick={() => setEditing(null)} className="text-[#66736D] hover:text-[#17201C]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#17201C] uppercase tracking-wider mb-1 block">
                Disease / Pest Name
              </label>
              <input
                value={form.disease}
                onChange={(e) => setForm({ ...form, disease: e.target.value })}
                className="km-input"
                placeholder="e.g. Stem Borer"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#17201C] uppercase tracking-wider mb-1 block">
                Target Location / District
              </label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="km-input"
                placeholder="e.g. Varikoli, Ernakulam"
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
              <label className="text-xs font-semibold text-[#17201C] uppercase tracking-wider mb-1 block">Type</label>
              <select
                value={form.alert_type}
                onChange={(e) => setForm({ ...form, alert_type: e.target.value })}
                className="km-input"
              >
                {TYPES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#17201C] uppercase tracking-wider mb-1 block">
                Severity Level
              </label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="km-input"
              >
                {SEVERITY.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
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
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#17201C] uppercase tracking-wider mb-1 block">
                Recommended Farmer Action
              </label>
              <textarea
                value={form.recommended_action}
                onChange={(e) => setForm({ ...form, recommended_action: e.target.value })}
                className="km-input"
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              className="bg-[#005A3C] hover:bg-[#003F2B] text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Save Advisory
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

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E1E8E4] p-8 text-center text-[#66736D] text-sm shadow-sm">
            No active disease alerts created yet.
          </div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-4 flex items-center justify-between gap-4 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Bug className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-[#17201C] text-sm">{a.disease}</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${sevColor[a.severity]}`}>
                      {a.severity} Severity
                    </span>
                  </div>
                  <p className="text-xs text-[#66736D] mt-0.5">
                    {a.location} • Affects: {a.crop} •{" "}
                    {a.report_date ? new Date(a.report_date).toLocaleDateString() : "Today"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    setEditing(a.id);
                    setForm(a);
                  }}
                  className="p-2 text-[#66736D] hover:text-[#005A3C] rounded-lg hover:bg-[#E8F8F1] transition-colors cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(a)}
                  className="p-2 text-[#66736D] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}