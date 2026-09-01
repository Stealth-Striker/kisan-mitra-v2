import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Settings, Save, Loader2, Bell, User, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFarm } from "@/lib/farmContext";
import { LANGUAGES } from "@/lib/translations";
import { useToast } from "@/components/ui/use-toast";

const CROPS = ["Rice", "Tomato", "Wheat", "Cotton", "Onion", "Banana", "Pepper", "Mango", "Other"];
const UNITS = ["Acre", "Acres", "Hectares", "Bigha", "Cents"];

export default function Preferences() {
  const { user } = useOutletContext();
  const { farm, language, setLanguage, refresh } = useFarm();
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ harvest: true, disease: true, market: true, diagnosis: true });

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "Ramesh");
      setPhone(user.phone || "+91 98765 43210");
    }
    if (farm) {
      setForm({
        location: farm.location || "Varikoli",
        state: farm.state || "Kerala",
        district: farm.district || "Ernakulam",
        primary_crop: farm.primary_crop || "Rice",
        farm_size: farm.farm_size || 1,
        farm_size_unit: farm.farm_size_unit || "Acre",
        language: farm.language || "English",
        farmer_since: farm.farmer_since || "2018",
      });
    } else {
      setForm({
        location: "Varikoli",
        state: "Kerala",
        district: "Ernakulam",
        primary_crop: "Rice",
        farm_size: 1,
        farm_size_unit: "Acre",
        language: "English",
        farmer_since: "2018",
      });
    }
  }, [farm, user]);

  const save = async () => {
    setSaving(true);
    try {
      if (farm) {
        await base44.entities.Farm.update(farm.id, form);
      } else {
        await base44.entities.Farm.create(form);
      }
      setLanguage(form.language);
      await base44.auth.updateMe({ full_name: fullName, phone, notification_prefs: notifPrefs });
      refresh();
      toast({ title: "Preferences Saved Successfully" });
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (!form) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#005A3C]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17201C] flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[#005A3C]" />
          Preferences &amp; Settings
        </h1>
        <p className="text-sm text-[#66736D] mt-1">
          Manage your personal farmer identity, farm parameters, and alert notification settings.
        </p>
      </div>

      {/* Personal Identity Card */}
      <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-[#17201C] text-sm uppercase tracking-wider flex items-center gap-2 border-b border-[#E1E8E4] pb-3">
          <User className="w-4 h-4 text-[#005A3C]" /> Personal Farmer Identity
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <Field label="Farmer Full Name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="km-input"
              placeholder="e.g. Ramesh"
            />
          </Field>
          <Field label="Mobile Phone Number">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="km-input"
              placeholder="e.g. +91 98765 43210"
            />
          </Field>
        </div>
      </div>

      {/* Farm Profile Card */}
      <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-[#17201C] text-sm uppercase tracking-wider flex items-center gap-2 border-b border-[#E1E8E4] pb-3">
          <MapPin className="w-4 h-4 text-[#005A3C]" /> Farm Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <Field label="Location / Village">
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="km-input"
              placeholder="e.g. Varikoli"
            />
          </Field>
          <Field label="District">
            <input
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              className="km-input"
              placeholder="e.g. Ernakulam"
            />
          </Field>
          <Field label="State">
            <input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="km-input"
            />
          </Field>
          <Field label="Primary Crop">
            <select
              value={form.primary_crop}
              onChange={(e) => setForm({ ...form, primary_crop: e.target.value })}
              className="km-input"
            >
              {CROPS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Preferred Interface Language">
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="km-input"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native} ({l.label})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Farmer Since Year">
            <input
              value={form.farmer_since}
              onChange={(e) => setForm({ ...form, farmer_since: e.target.value })}
              className="km-input"
              placeholder="e.g. 2018"
            />
          </Field>
          <Field label="Farm Size">
            <input
              type="number"
              step="0.1"
              value={form.farm_size}
              onChange={(e) => setForm({ ...form, farm_size: Number(e.target.value) })}
              className="km-input"
            />
          </Field>
          <Field label="Farm Size Unit">
            <select
              value={form.farm_size_unit}
              onChange={(e) => setForm({ ...form, farm_size_unit: e.target.value })}
              className="km-input"
            >
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Notifications Card */}
      <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-[#17201C] text-sm uppercase tracking-wider flex items-center gap-2 border-b border-[#E1E8E4] pb-3">
          <Bell className="w-4 h-4 text-[#005A3C]" /> Notification Preferences
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {[
            { key: "harvest", label: "Harvest readiness alerts" },
            { key: "disease", label: "Regional pest & disease advisories" },
            { key: "market", label: "Market price shift notifications" },
            { key: "diagnosis", label: "Leaf disease diagnosis completion" },
          ].map((n) => (
            <label
              key={n.key}
              className="flex items-center justify-between p-3.5 rounded-xl border border-[#E1E8E4] hover:bg-[#E8F8F1]/40 cursor-pointer transition-colors"
            >
              <span className="text-sm font-medium text-[#17201C]">{n.label}</span>
              <input
                type="checkbox"
                checked={notifPrefs[n.key]}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, [n.key]: e.target.checked })}
                className="w-4 h-4 accent-[#005A3C] rounded cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={save}
        disabled={saving}
        className="bg-[#005A3C] hover:bg-[#003F2B] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" /> Save All Preferences
          </>
        )}
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#17201C] uppercase tracking-wider mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}