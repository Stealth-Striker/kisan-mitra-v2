import React, { useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { Loader2, Stethoscope, Image as ImageIcon, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFarm } from "@/lib/farmContext";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";

const CROPS = ["Tomato", "Rice", "Wheat", "Cotton", "Onion", "Banana", "Pepper", "Mango", "Other"];

export default function CropDoctor() {
  const { user } = useOutletContext();
  const { farm, language } = useFarm();
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState(farm?.primary_crop || "Rice");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  React.useEffect(() => {
    base44.entities.CropDiagnosis.filter({}, "-created_date", 5).then(setHistory).catch(() => {});
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      toast({ title: "Invalid file", description: "JPG, PNG, or WEBP only.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB.", variant: "destructive" });
      return;
    }
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImage(file_url);
      setResult(null);
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const analyze = async () => {
    if (!image) {
      toast({ title: "No image", description: "Please upload a leaf photo first.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("analyzeCrop", { image_url: image, crop, language });
      const diag = res.data?.diagnosis;
      if (!diag) throw new Error("No diagnosis returned");
      setResult(diag);
      const record = await base44.entities.CropDiagnosis.create({
        crop,
        image_url: image,
        disease_name: diag.disease,
        confidence: diag.confidence,
        severity: diag.severity,
        symptoms: diag.symptoms,
        recommended_actions: diag.recommended_actions,
        prevention: diag.prevention,
      });
      setHistory((h) => [record, ...h.slice(0, 4)]);
    } catch (err) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    }
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17201C] flex items-center gap-2.5">
          <Stethoscope className="w-6 h-6 text-[#005A3C]" />
          Crop Doctor
        </h1>
        <p className="text-sm text-[#66736D] mt-1">
          Upload a leaf photo to diagnose diseases, assess severity, and get actionable treatment plans.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upload Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-6 space-y-5">
            {/* Select Crop */}
            <div>
              <label className="block text-xs font-semibold text-[#17201C] uppercase tracking-wider mb-2">
                Select Crop Type
              </label>
              <div className="flex flex-wrap gap-2">
                {CROPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCrop(c)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      crop === c
                        ? "bg-[#005A3C] text-white border-[#005A3C] shadow-sm"
                        : "bg-white text-[#17201C] border-[#E1E8E4] hover:bg-[#E8F8F1] hover:border-[#0B8F62]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop Zone */}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[#E1E8E4] hover:border-[#0B8F62] hover:bg-[#E8F8F1]/40 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px]"
            >
              {image ? (
                <div className="space-y-3 w-full flex flex-col items-center">
                  <div className="w-44 h-44 rounded-xl overflow-hidden shadow-sm border border-[#E1E8E4] relative group">
                    <Image src={image} className="w-full h-full object-cover" fittingType="fill" />
                  </div>
                  <p className="text-xs text-[#005A3C] font-semibold">Click to change leaf photo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#E8F8F1] flex items-center justify-center mx-auto text-[#005A3C]">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#17201C]">Upload leaf photo</p>
                    <p className="text-xs text-[#66736D] mt-0.5">Drag &amp; drop or click to select file</p>
                  </div>
                  <span className="inline-block text-[11px] text-[#66736D] bg-[#F7F9F7] px-3 py-1 rounded-full border border-[#E1E8E4]">
                    JPG, PNG or WEBP up to 10MB
                  </span>
                </div>
              )}
            </div>

            {/* Action button */}
            <button
              onClick={analyze}
              disabled={!image || analyzing}
              className="w-full bg-[#005A3C] hover:bg-[#003F2B] text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing plant leaf...</span>
                </>
              ) : (
                <>
                  <Stethoscope className="w-4 h-4" />
                  <span>Run AI Disease Diagnosis</span>
                </>
              )}
            </button>
          </div>

          {/* Diagnosis Result Card */}
          {result && (
            <div className="bg-white rounded-2xl border border-[#005A3C]/30 shadow-md p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start justify-between border-b border-[#E1E8E4] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#005A3C] bg-[#E8F8F1] px-2.5 py-1 rounded-full">
                      Diagnosis Result
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        result.severity === "High" || result.severity === "Severe"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : result.severity === "Moderate"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {result.severity} Severity
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#17201C] mt-2">{result.disease}</h2>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-[#005A3C]">{result.confidence}%</div>
                  <p className="text-[11px] text-[#66736D]">Confidence</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="space-y-4 text-sm text-[#17201C]">
                {result.symptoms && (
                  <div>
                    <h3 className="font-semibold text-xs text-[#66736D] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Symptoms Detected
                    </h3>
                    <p className="bg-[#F7F9F7] p-3 rounded-xl border border-[#E1E8E4] text-[#17201C] leading-relaxed">
                      {result.symptoms}
                    </p>
                  </div>
                )}

                {result.recommended_actions && (
                  <div>
                    <h3 className="font-semibold text-xs text-[#66736D] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-[#005A3C]" /> Recommended Actions
                    </h3>
                    <p className="bg-[#E8F8F1] p-3 rounded-xl border border-[#005A3C]/20 text-[#005A3C] font-medium leading-relaxed">
                      {result.recommended_actions}
                    </p>
                  </div>
                )}

                {result.prevention && (
                  <div>
                    <h3 className="font-semibold text-xs text-[#66736D] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-500" /> Prevention &amp; Control
                    </h3>
                    <p className="bg-[#F7F9F7] p-3 rounded-xl border border-[#E1E8E4] text-[#17201C] leading-relaxed">
                      {result.prevention}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#17201C] mb-3 uppercase tracking-wider">Recent Diagnoses</h2>
            {history.length === 0 ? (
              <p className="text-xs text-[#66736D] italic py-2">No previous scans found.</p>
            ) : (
              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#F7F9F7] border border-[#E1E8E4] text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-[#17201C]">
                      <span>{h.crop}</span>
                      <span className="text-[#005A3C]">{h.confidence}%</span>
                    </div>
                    <p className="text-[#66736D] font-medium truncate">{h.disease_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}