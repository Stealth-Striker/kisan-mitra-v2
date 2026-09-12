import React, { useState, useEffect, useRef } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Settings, Save, Loader2, Bell, User, MapPin, Camera, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFarm } from "@/lib/farmContext";
import { LANGUAGES } from "@/lib/translations";
import { useToast } from "@/components/ui/use-toast";
import SEO from "@/components/SEO";

const CROPS = ["Rice", "Tomato", "Wheat", "Cotton", "Onion", "Banana", "Pepper", "Mango", "Other"];
const UNITS = ["Acre", "Acres", "Hectares", "Bigha", "Cents"];

export default function Preferences() {
  const context = useOutletContext() || {};
  const { farm, user: farmUser, setUser: setFarmUser, setLanguage, refresh } = useFarm();
  const user = context.user || farmUser;
  const setUser = context.setUser || setFarmUser;
  const { toast } = useToast();
  const photoFileRef = useRef(null);
  const [form, setForm] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ harvest: true, disease: true, market: true, diagnosis: true });
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "farm" | "notifications"

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "Ramesh");
      setPhone(user.phone || "+91 98765 43210");
      setAvatarUrl(user.avatar_url || user.photo_url || "");
      if (user.notification_prefs) {
        try {
          const parsed = typeof user.notification_prefs === "string" ? JSON.parse(user.notification_prefs) : user.notification_prefs;
          if (parsed && typeof parsed === "object") {
            setNotifPrefs((prev) => ({ ...prev, ...parsed }));
          }
        } catch (_) {}
      }
    }
  }, [user]);

  useEffect(() => {
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
  }, [farm]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      toast({ title: "Invalid file", description: "Please upload a JPG, PNG, or WEBP image.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Profile photo must be less than 5MB.", variant: "destructive" });
      return;
    }
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAvatarUrl(file_url);
      const updatedUser = await base44.auth.updateMe({ avatar_url: file_url });
      if (updatedUser && setUser) setUser(updatedUser);
      refresh();
      toast({ title: "Photo Updated", description: "Profile photo uploaded and saved successfully." });
    } catch (err) {
      toast({ title: "Upload Failed", description: err.message || "Failed to upload photo", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setUploadingPhoto(true);
    try {
      setAvatarUrl("");
      const updatedUser = await base44.auth.updateMe({ avatar_url: "" });
      if (updatedUser && setUser) setUser(updatedUser);
      refresh();
      toast({ title: "Photo Removed", description: "Profile photo reset to initials avatar." });
    } catch (err) {
      toast({ title: "Failed to remove photo", description: err.message || "Could not remove photo", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      if (farm) {
        await base44.entities.Farm.update(farm.id, form);
      } else {
        await base44.entities.Farm.create(form);
      }
      setLanguage(form.language);
      const updatedUser = await base44.auth.updateMe({
        full_name: fullName,
        phone,
        avatar_url: avatarUrl,
        notification_prefs: notifPrefs,
      });
      if (updatedUser) {
        if (setUser) setUser(updatedUser);
        setFullName(updatedUser.full_name || fullName);
        setPhone(updatedUser.phone || phone);
        setAvatarUrl(updatedUser.avatar_url || avatarUrl);
      }
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
        <Loader2 className="w-6 h-6 animate-spin text-[#063F2E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <SEO 
        title="Settings & Farm Preferences" 
        description="Configure your farm size, crop selection, regional language, and notification alerts."
        canonicalPath="/preferences"
      />
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#E1E8E4] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17211D] flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-[#063F2E]" />
            Preferences &amp; Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#65736C] mt-0.5">
            Manage your farmer profile, agricultural parameters, and notification alerts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="px-3.5 py-2 rounded-xl border border-[#E1E8E4] bg-white hover:bg-[#F6F8F5] text-xs font-bold text-[#17211D] transition-colors"
          >
            Farmer Profile
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="km-btn-primary px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Preferences
              </>
            )}
          </button>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-2 bg-[#F6F8F5] p-1.5 rounded-2xl border border-[#E1E8E4] w-fit">
        {[
          { id: "profile", label: "Farmer Identity", icon: User },
          { id: "farm", label: "Farm Information", icon: MapPin },
          { id: "notifications", label: "Notification Alerts", icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-[#063F2E] shadow-xs border border-[#E1E8E4]"
                  : "text-[#65736C] hover:text-[#17211D]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#087F5B]" : "text-[#65736C]"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Personal Identity Card */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-xs p-6 space-y-5">
          <div className="border-b border-[#E1E8E4] pb-3">
            <h3 className="font-bold text-[#17211D] text-sm uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[#063F2E]" /> Personal Farmer Identity
            </h3>
            <p className="text-xs text-[#65736C] mt-0.5">Your personal credentials and display photo.</p>
          </div>

          {/* Profile Photo Upload Zone */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Farmer Profile"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs ring-2 ring-[#DDF5EA]"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#087F5B] text-white flex items-center justify-center text-2xl font-bold border-2 border-white shadow-xs ring-2 ring-[#DDF5EA]">
                  {(fullName || "F").charAt(0).toUpperCase()}
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <h4 className="text-xs font-bold text-[#17211D]">Profile Photo</h4>
              <p className="text-[11px] text-[#65736C]">
                Upload JPG, PNG, or WEBP photo up to 5MB.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  ref={photoFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <button
                  type="button"
                  onClick={() => !uploadingPhoto && photoFileRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="px-3 py-1.5 rounded-lg bg-[#DDF5EA] hover:bg-[#cceede] text-[#063F2E] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5 text-[#087F5B]" />
                  <span>{avatarUrl ? "Change Photo" : "Upload Photo"}</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    className="px-3 py-1.5 rounded-lg border border-[#E1E8E4] hover:bg-red-50 text-red-600 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

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
      )}

      {/* Tab 2: Farm Profile Card */}
      {activeTab === "farm" && (
        <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-xs p-6 space-y-4">
          <div className="border-b border-[#E1E8E4] pb-3">
            <h3 className="font-bold text-[#17211D] text-sm uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#063F2E]" /> Farm Information
            </h3>
            <p className="text-xs text-[#65736C] mt-0.5">Agricultural landholding, crop, and location parameters.</p>
          </div>
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
            <Field label="Preferred Language">
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
      )}

      {/* Tab 3: Notifications Card */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-xs p-6 space-y-4">
          <div className="border-b border-[#E1E8E4] pb-3">
            <h3 className="font-bold text-[#17211D] text-sm uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#063F2E]" /> Notification Preferences
            </h3>
            <p className="text-xs text-[#65736C] mt-0.5">Configure which operational alerts you receive.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[
              { key: "harvest", label: "Harvest readiness alerts" },
              { key: "disease", label: "Regional pest & disease advisories" },
              { key: "market", label: "Market price shift notifications" },
              { key: "diagnosis", label: "Leaf disease diagnosis completion" },
            ].map((n) => (
              <label
                key={n.key}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[#E1E8E4] hover:bg-[#DDF5EA]/30 cursor-pointer transition-colors"
              >
                <span className="text-sm font-medium text-[#17211D]">{n.label}</span>
                <input
                  type="checkbox"
                  checked={notifPrefs[n.key]}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, [n.key]: e.target.checked })}
                  className="w-4 h-4 accent-[#063F2E] rounded cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#17211D] uppercase tracking-wider mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}