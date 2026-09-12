import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Filter,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Wind,
  Droplets,
  Thermometer,
  Share2,
  PlusCircle,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Bug,
  Activity,
  Navigation,
  LocateFixed,
} from "lucide-react";
import { useFarm } from "@/lib/farmContext";
import SEO from "@/components/SEO";

// Initial realistic outbreak threat data with real geographic coordinates around central Kerala
const INITIAL_OUTBREAKS = [
  {
    id: "ob-1",
    disease_name: "Brown Plant Hopper (Nilaparvata lugens)",
    crop: "Rice",
    severity: "High",
    category: "Pest / Hopper",
    location: "Kalamassery / Aluva Belt",
    lat: 10.0543,
    lng: 76.3264,
    distance_km: 14,
    reported_date: "Today, 08:30 AM",
    affected_acres: "35 acres",
    weather_trigger: "High humidity (88%) + dense canopy shade",
    spread_vector: "Expanding south-east with 12 km/h local breeze",
    description:
      "Heavy nymph clustering observed at base of paddy tillers. Symptoms of hopper burn (circular yellow drying patches) spreading rapidly.",
    cultural_actions: [
      "Immediate drain-down: Stop irrigation and drain standing water for 3 to 4 days to disrupt reproductive humidity.",
      "Avoid excessive urea / nitrogenous fertilizer top-dressing which makes plant tissue soft and succulent.",
      "Clear weed hosts (Echinochloa grass) along field bunds.",
    ],
    bio_remedies: [
      "Foliar spray of Beauveria bassiana @ 5g/L or 1 kg/acre in evening hours.",
      "Neem seed kernel extract (NSKE 5%) or cold-pressed Neem Oil (3000 ppm) @ 3 ml/L.",
    ],
    chemical_ipm: {
      molecule: "Pymetrozine 50% WDG @ 0.6 g/L OR Dinotefuran 20% SG @ 0.4 g/L",
      method: "Direct spray nozzle strictly at the base of tillers, not just top leaves.",
      waiting_period: "Pre-harvest interval: 14 days minimum.",
    },
  },
  {
    id: "ob-2",
    disease_name: "Rice Blast (Magnaporthe oryzae)",
    crop: "Rice",
    severity: "High",
    category: "Fungal",
    location: "Chalakudy River Basin",
    lat: 10.307,
    lng: 76.333,
    distance_km: 38,
    reported_date: "Yesterday",
    affected_acres: "50+ acres",
    weather_trigger: "Morning dew > 10 hours + cool nighttime temp (22°C)",
    spread_vector: "Airborne fungal conidia drifting southward",
    description:
      "Spindle-shaped lesions with grayish-white centers and brown margins detected on upper flag leaves and neck nodes.",
    cultural_actions: [
      "Avoid field-to-field water flow from affected plots to healthy neighboring fields.",
      "Split nitrogen application into 3 smaller doses instead of single heavy basal dose.",
      "Collect and safely burn severely infected straw debris post-harvest.",
    ],
    bio_remedies: [
      "Pseudomonas fluorescens foliar spray @ 20 g/L (mix with jaggery water for adhesion).",
      "Trichoderma viride soil application enriched in farmyard manure.",
    ],
    chemical_ipm: {
      molecule: "Tricyclazole 75% WP @ 0.6 g/L OR Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L",
      method: "Thorough wetting of crop foliage at early morning before dew dries completely.",
      waiting_period: "Pre-harvest interval: 21 days.",
    },
  },
  {
    id: "ob-3",
    disease_name: "Tomato Early Blight & Fruit Borer",
    crop: "Tomato",
    severity: "Moderate",
    category: "Fungal & Pest",
    location: "Angamaly Horticulture Zone",
    lat: 10.196,
    lng: 76.386,
    distance_km: 26,
    reported_date: "2 days ago",
    affected_acres: "15 acres",
    weather_trigger: "Intermittent light drizzle followed by intense sun",
    spread_vector: "Soil splash and adult moth oviposition",
    description:
      "Target-board concentric rings on lower leaves. Early instar borers boring circular holes into green developing tomatoes.",
    cultural_actions: [
      "Prune and safely discard all bottom leaves touching damp soil.",
      "Install Helilure pheromone traps @ 5 traps per acre for male moth mass trapping.",
      "Mulch beds with straw or silver-black plastic to prevent fungal soil splash.",
    ],
    bio_remedies: [
      "Bacillus thuringiensis (Bt) kurstaki formulation @ 2 g/L.",
      "Neem oil (1500 ppm) emulsified with mild soap @ 5 ml/L.",
    ],
    chemical_ipm: {
      molecule: "Chlorantraniliprole 18.5% SC @ 0.3 ml/L (Borer) + Mancozeb 75% WP @ 2.5 g/L (Blight)",
      method: "Spray under leaf surfaces during late afternoon.",
      waiting_period: "Pre-harvest interval: 3 days.",
    },
  },
  {
    id: "ob-4",
    disease_name: "Coconut Rhinoceros Beetle & Bud Rot",
    crop: "Coconut",
    severity: "Moderate",
    category: "Pest / Beetle",
    location: "Tripunithura / Maradu",
    lat: 9.948,
    lng: 76.34,
    distance_km: 11,
    reported_date: "Today, 11:00 AM",
    affected_acres: "Scattered plantations",
    weather_trigger: "High soil moisture favoring compost breeding",
    spread_vector: "Flying adult beetles emerging from unmanaged coir pith/cowdung heaps",
    description:
      "V-shaped cuts on newly opened fronds; spindle dying with foul odor in young palms.",
    cultural_actions: [
      "Drench rotting cattle manure and compost pits with Metarhizium anisopliae fungus.",
      "Clean palm crown axils and hook out adult beetles using a hooked wire needle.",
      "Dispose of dead standing coconut trunks that harbor grubs.",
    ],
    bio_remedies: [
      "Fill innermost 2-3 leaf axils with a 1:1 mixture of fine river sand and Neem cake (250g per palm).",
      "Release of baculovirus-infected rhinoceros beetles for biological control.",
    ],
    chemical_ipm: {
      molecule: "Naphthalene balls (3 to 4 balls) placed in topmost leaf axil covered with sand",
      method: "Apply twice a year (pre-monsoon and post-monsoon periods).",
      waiting_period: "Safe, no chemical residue in nuts.",
    },
  },
  {
    id: "ob-5",
    disease_name: "Black Pepper Quick Wilt (Foot Rot)",
    crop: "Pepper",
    severity: "High",
    category: "Fungal (Phytophthora)",
    location: "Muvattupuzha Foothills",
    lat: 9.98,
    lng: 76.578,
    distance_km: 18,
    reported_date: "3 days ago",
    affected_acres: "20 acres",
    weather_trigger: "Continuous soil saturation + root temperature ~24°C",
    spread_vector: "Water runoff channels down slope terraces",
    description:
      "Sudden foliar yellowing followed by rapid leaf drop. Collar region shows black wet rot when scraped.",
    cultural_actions: [
      "Open drainage trenches between pepper standard rows to clear stagnant water.",
      "Loosen hard pan soil around root zone without damaging tender feeding roots.",
      "Uproot and burn dead infected vines; do not replant in same pit immediately.",
    ],
    bio_remedies: [
      "Soil drenching with Trichoderma harzianum (50g per vine mixed with compost).",
      "Foliar spray with 1% Bordeaux mixture on leaves and climbing standards.",
    ],
    chemical_ipm: {
      molecule: "Metalaxyl 8% + Mancozeb 64% WP @ 2 g/L (Soil basin drench 5-10 L per vine)",
      method: "Drench thoroughly in a 45cm radius around the vine base.",
      waiting_period: "Pre-harvest interval: 30 days.",
    },
  },
  {
    id: "ob-6",
    disease_name: "Fall Armyworm (Spodoptera frugiperda)",
    crop: "Maize",
    severity: "Low",
    category: "Pest / Caterpillar",
    location: "Perumbavoor Agricultural Belt",
    lat: 10.11,
    lng: 76.475,
    distance_km: 17,
    reported_date: "Yesterday",
    affected_acres: "12 acres",
    weather_trigger: "Warm evening temperatures (28°C)",
    spread_vector: "Migratory night-flying moths",
    description:
      "Pin-hole shot leaf windows with coarse sawdust-like frass inside central whorls.",
    cultural_actions: [
      "Hand-picking and crushing of egg masses and early instars.",
      "Intercropping with cowpea or pulses as barrier deterrents.",
      "Drop dry sand mixed with wood ash (9:1) directly into central whorls.",
    ],
    bio_remedies: [
      "Release Trichogramma pretiosum egg parasitoid cards @ 50,000 wasps per acre.",
      "Nomuraea rileyi or Metarhizium rileyi foliar spray @ 4 g/L.",
    ],
    chemical_ipm: {
      molecule: "Emamectin benzoate 5% SG @ 0.4 g/L OR Chlorantraniliprole 18.5% SC @ 0.3 ml/L",
      method: "Apply direct knapsack spray into plant whorl cone.",
      waiting_period: "Pre-harvest interval: 10 days.",
    },
  },
];

// Helper: Custom Leaflet Marker Icons using L.divIcon
const createThreatIcon = (severity, isSelected) => {
  const isHigh = severity === "High";
  const isMod = severity === "Moderate";

  const colorBg = isHigh ? "bg-rose-600 shadow-rose-600/50" : isMod ? "bg-amber-500 shadow-amber-500/50" : "bg-emerald-600 shadow-emerald-600/50";
  const borderRing = isSelected ? "ring-4 ring-white ring-offset-2 ring-offset-black scale-125" : "border-2 border-white shadow-lg";

  const pingEffect = isHigh ? `<span class="absolute -inset-1.5 rounded-full bg-rose-500 opacity-60 animate-ping"></span>` : "";

  return L.divIcon({
    className: "leaflet-custom-threat-marker",
    html: `
      <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200">
        ${pingEffect}
        <div class="w-8 h-8 rounded-full ${colorBg} ${borderRing} flex items-center justify-center text-white">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m8 2 1.88 1.88"/>
            <path d="M14.12 3.88 16 2"/>
            <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
            <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/>
            <path d="M12 20v-9"/>
            <path d="M6.53 9C4.6 8.8 3 7.1 3 5"/>
            <path d="M6 13H2"/>
            <path d="M3 21c0-2.1 1.7-3.9 3.8-4"/>
            <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/>
            <path d="M22 13h-4"/>
            <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

const farmCenterIcon = L.divIcon({
  className: "leaflet-custom-farm-marker",
  html: `
    <div class="relative flex items-center justify-center cursor-pointer">
      <span class="absolute -inset-2 rounded-full bg-[#063F2E] opacity-40 animate-ping"></span>
      <div class="w-10 h-10 rounded-full bg-[#063F2E] text-white shadow-xl flex items-center justify-center border-2 border-white ring-4 ring-[#063F2E]/30">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22],
});

// Map recentering controller component that binds the live map instance and triggers smooth animations
function MapController({ target, mapRef }) {
  const map = useMap();

  useEffect(() => {
    if (mapRef) {
      mapRef.current = map;
    }
  }, [map, mapRef]);

  useEffect(() => {
    if (target && target.coords) {
      map.flyTo(target.coords, target.zoom || 11, {
        animate: true,
        duration: 1.0,
      });
    }
  }, [target, map]);

  return null;
}

export default function OutbreakRadar() {
  const { farm } = useFarm();
  const farmCrop = farm?.primary_crop || "Rice";
  const farmLocation = farm?.location || "Varikoli / Ernakulam";

  // Coordinates: Default to Varikoli, Ernakulam [9.9678, 76.4182]
  const farmCoords = useMemo(() => [9.9678, 76.4182], []);

  // State: Alerts list
  const [alerts, setAlerts] = useState(INITIAL_OUTBREAKS);
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [filterMyCropOnly, setFilterMyCropOnly] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null); // for detail modal
  const [advisoryTab, setAdvisoryTab] = useState("containment"); // "containment" | "organic" | "chemical"

  // State: Map controls
  const mapRef = useRef(null);
  const [mapTarget, setMapTarget] = useState({ coords: farmCoords, zoom: 10, key: 0 });
  const [mapCenter, setMapCenter] = useState(farmCoords);
  const [mapZoom, setMapZoom] = useState(10);
  const [showRings, setShowRings] = useState(true);
  const [showHeatzones, setShowHeatzones] = useState(true);

  // State: Community Sighting Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [newSighting, setNewSighting] = useState({
    crop: farmCrop,
    disease_name: "",
    severity: "Moderate",
    location: "",
    distance_km: "10",
    description: "",
  });
  const [reportSuccessToast, setReportSuccessToast] = useState(false);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (filterSeverity !== "All" && a.severity !== filterSeverity) return false;
      if (filterMyCropOnly && a.crop.toLowerCase() !== farmCrop.toLowerCase()) return false;
      return true;
    });
  }, [alerts, filterSeverity, filterMyCropOnly, farmCrop]);

  // Farm Exposure Index Calculation
  const exposureStats = useMemo(() => {
    const nearbyAlerts = alerts.filter((a) => a.distance_km <= 25);
    const cropAlerts = nearbyAlerts.filter(
      (a) => a.crop.toLowerCase() === farmCrop.toLowerCase()
    );

    let score = "Low / Guarded";
    let scoreColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
    let summaryText = "No immediate high-severity threat targeting your crop within 15 km.";

    const highThreats = cropAlerts.filter((a) => a.severity === "High");
    if (highThreats.length > 0) {
      score = "High Alert";
      scoreColor = "text-rose-700 bg-rose-50 border-rose-200";
      summaryText = `Urgent: ${highThreats.length} high-severity outbreak(s) affecting ${farmCrop} within 25 km. Pre-emptive biocontrol advised.`;
    } else if (cropAlerts.length > 0) {
      score = "Moderate Exposure";
      scoreColor = "text-amber-700 bg-amber-50 border-amber-200";
      summaryText = `Notice: ${cropAlerts.length} active pest alert(s) for ${farmCrop} in adjacent blocks. Inspect fields this week.`;
    }

    return {
      score,
      scoreColor,
      summaryText,
      totalNearby: nearbyAlerts.length,
      cropSpecificCount: cropAlerts.length,
    };
  }, [alerts, farmCrop]);

  // Handle Focus On Threat
  const handleFocusThreat = (alert) => {
    setSelectedAlert(alert);
    const coords = [alert.lat, alert.lng];
    if (mapRef.current) {
      mapRef.current.flyTo(coords, 12, { animate: true, duration: 1.0 });
    }
    setMapCenter(coords);
    setMapZoom(12);
    setMapTarget({ coords, zoom: 12, key: Date.now() });
  };

  // Handle Recenter to Farm
  const handleRecenterFarm = () => {
    setSelectedAlert(null);
    if (mapRef.current) {
      mapRef.current.flyTo(farmCoords, 10, { animate: true, duration: 1.0 });
    }
    setMapCenter([...farmCoords]);
    setMapZoom(10);
    setMapTarget({ coords: farmCoords, zoom: 10, key: Date.now() });
  };

  // Handle Community Sighting Submit
  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!newSighting.disease_name.trim() || !newSighting.location.trim()) return;

    // Small random offset around farm for community report
    const dist = Number(newSighting.distance_km) || 10;
    const angle = Math.random() * Math.PI * 2;
    const latOffset = (dist / 111) * Math.cos(angle);
    const lngOffset = (dist / (111 * Math.cos((farmCoords[0] * Math.PI) / 180))) * Math.sin(angle);

    const created = {
      id: `ob-user-${Date.now()}`,
      disease_name: newSighting.disease_name,
      crop: newSighting.crop,
      severity: newSighting.severity,
      category: "Community Sighting",
      location: newSighting.location,
      lat: farmCoords[0] + latOffset,
      lng: farmCoords[1] + lngOffset,
      distance_km: dist,
      reported_date: "Just now (Verified Grower)",
      affected_acres: "Local plot",
      weather_trigger: "Reported by local farmer",
      spread_vector: "Field observation pending Krishi Bhavan lab test",
      description: newSighting.description || "Suspect pest symptoms reported by neighboring farmer.",
      cultural_actions: [
        "Isolate suspect plants immediately.",
        "Perform crop survey with hand lens to check egg clusters.",
      ],
      bio_remedies: ["Prophylactic cold-pressed Neem oil spray (3000 ppm) @ 3 ml/L."],
      chemical_ipm: {
        molecule: "Consult local Agricultural Officer before chemical spraying",
        method: "Avoid broad-spectrum spraying until pathogen is confirmed.",
        waiting_period: "N/A",
      },
    };

    const targetCoords = [created.lat, created.lng];
    setAlerts([created, ...alerts]);
    setShowReportModal(false);
    setSelectedAlert(created);
    if (mapRef.current) {
      mapRef.current.flyTo(targetCoords, 12, { animate: true, duration: 1.0 });
    }
    setMapCenter(targetCoords);
    setMapZoom(12);
    setMapTarget({ coords: targetCoords, zoom: 12, key: Date.now() });

    setNewSighting({
      crop: farmCrop,
      disease_name: "",
      severity: "Moderate",
      location: "",
      distance_km: "10",
      description: "",
    });
    setReportSuccessToast(true);
    setTimeout(() => setReportSuccessToast(false), 3500);
  };

  // WhatsApp Alert Share
  const handleShareWhatsApp = (alert) => {
    const text = `[KISAN MITRA OUTBREAK ADVISORY]\n\n` +
      `Threat: ${alert.disease_name}\n` +
      `Crop: ${alert.crop}\n` +
      `Location: ${alert.location} (${alert.distance_km} km away)\n` +
      `Severity: ${alert.severity}\n\n` +
      `Immediate Preventive Action: ${alert.cultural_actions[0]}\n` +
      `Bio-Remedy: ${alert.bio_remedies[0]}\n\n` +
      `Stay alert. Track live via Kisan Mitra Outbreak Radar.`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <SEO
        title="Outbreak Radar - Interactive Geospatial Pest & Disease Map"
        description="Live OpenStreetMap agricultural pest and disease monitoring map. Track outbreak hotspots, 10km/25km/50km perimeter zones, and preventive IPM protocols."
        canonicalPath="/outbreak-radar"
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E8E4] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17211D] flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-[#063F2E]" />
            Outbreak Radar
          </h1>
          <p className="text-xs sm:text-sm text-[#65736C] mt-0.5">
            Real-time interactive GPS monitoring map tracking pest clusters within a 50 km radius of your farm.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="km-btn-primary"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report a Sighting</span>
          </button>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Farm Exposure Risk Index */}
        <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-xs p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#063F2E] bg-[#DDF5EA] px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Threat Level
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${exposureStats.scoreColor}`}>
                {exposureStats.score}
              </span>
            </div>
            <p className="text-base font-bold text-[#17211D]">
              {exposureStats.totalNearby} threats within 25km
            </p>
            <p className="text-xs text-[#65736C]">
              Monitoring {farmCrop} for {farmLocation}
            </p>
          </div>
        </div>

        {/* 2. Microclimate Weather Vector */}
        <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-xs p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#92540C] bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#E99B16]" /> Microclimate
              </span>
              <span className="text-[10px] font-bold text-[#92540C] bg-amber-50 px-2 py-0.5 rounded-md">
                High Dampness
              </span>
            </div>
            <p className="text-base font-bold text-[#17211D]">
              86% RH • 28.4°C
            </p>
            <p className="text-xs text-[#65736C]">
              Persistent leaf dampness favors fungal spores
            </p>
          </div>
        </div>

        {/* 3. Spore & Insect Wind Drift */}
        <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-xs p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#063F2E] bg-[#DDF5EA] px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-[#087F5B]" /> Wind Vector
              </span>
              <span className="text-[10px] font-bold uppercase bg-[#063F2E] text-white px-2 py-0.5 rounded-full">
                12 km/h NW
              </span>
            </div>
            <p className="text-base font-bold text-[#17211D]">
              North-West to South-East
            </p>
            <p className="text-xs text-[#65736C]">
              Spore drift along river basin corridor
            </p>
          </div>
        </div>
      </div>

      {/* Main Map + Outbreak Threat Cards Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left (7 Cols): Real Leaflet OpenStreetMap View */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-4 space-y-3">
            {/* Map Top Toolbar */}
            <div className="flex flex-wrap items-center justify-end gap-2 border-b border-[#E1E8E4] pb-3">
              {/* Map Layer & Recenter Controls */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setShowRings(!showRings)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                    showRings
                      ? "bg-[#DDF5EA] text-[#063F2E] border-[#063F2E]"
                      : "bg-[#F6F8F5] text-[#65736C] border-[#E1E8E4]"
                  }`}
                >
                  {showRings ? "Zones: Visible" : "Zones: Hidden"}
                </button>

                <button
                  onClick={() => setShowHeatzones(!showHeatzones)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                    showHeatzones
                      ? "bg-[#DDF5EA] text-[#063F2E] border-[#063F2E]"
                      : "bg-[#F6F8F5] text-[#65736C] border-[#E1E8E4]"
                  }`}
                >
                  {showHeatzones ? "Heatzones: On" : "Heatzones: Off"}
                </button>

                <button
                  onClick={handleRecenterFarm}
                  className="bg-[#063F2E] hover:bg-[#032C21] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs"
                  title="Recenter to Your Farm"
                >
                  <LocateFixed className="w-3 h-3" /> Center Farm
                </button>
              </div>
            </div>

            {/* Leaflet Map Frame */}
            <div className="relative rounded-xl overflow-hidden border border-[#E1E8E4] h-[480px] w-full z-0">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                className="h-full w-full"
              >
                <MapController target={mapTarget} mapRef={mapRef} />

                {/* OpenStreetMap Standard Tiles */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* 10 km, 25 km, 50 km Perimeter Circles centered on Farm */}
                {showRings && (
                  <>
                    {/* 10 km Danger Zone */}
                    <Circle
                      center={farmCoords}
                      radius={10000}
                      pathOptions={{
                        color: "#DC2626",
                        weight: 1.5,
                        dashArray: "4,4",
                        fillColor: "#DC2626",
                        fillOpacity: 0.04,
                      }}
                    />
                    {/* 25 km Watch Zone */}
                    <Circle
                      center={farmCoords}
                      radius={25000}
                      pathOptions={{
                        color: "#D97706",
                        weight: 1.2,
                        dashArray: "5,5",
                        fillColor: "#D97706",
                        fillOpacity: 0.02,
                      }}
                    />
                    {/* 50 km Regional Perimeter */}
                    <Circle
                      center={farmCoords}
                      radius={50000}
                      pathOptions={{
                        color: "#059669",
                        weight: 1.2,
                        dashArray: "6,6",
                        fillColor: "#059669",
                        fillOpacity: 0.01,
                      }}
                    />
                  </>
                )}

                {/* Farm Center Location Marker */}
                <Marker position={farmCoords} icon={farmCenterIcon}>
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <p className="font-bold text-[#063F2E] text-sm flex items-center gap-1">
                        Your Farm
                      </p>
                      <p className="text-[#65736C] font-medium">{farmLocation}</p>
                      <p className="text-[11px] text-[#65736C]">Center point for 50km pest radar.</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Mapped Outbreak Threat Markers & Heat Circles */}
                {filteredAlerts.map((item) => {
                  const isSelected = selectedAlert?.id === item.id;
                  const isHigh = item.severity === "High";
                  const heatColor = isHigh ? "#DC2626" : item.severity === "Moderate" ? "#D97706" : "#059669";

                  return (
                    <React.Fragment key={item.id}>
                      {/* Optional Translucent Threat Heatzone */}
                      {showHeatzones && (
                        <Circle
                          center={[item.lat, item.lng]}
                          radius={isHigh ? 4500 : 3000}
                          pathOptions={{
                            color: heatColor,
                            weight: 1,
                            fillColor: heatColor,
                            fillOpacity: 0.15,
                          }}
                        />
                      )}

                      {/* Custom DivIcon Pin */}
                      <Marker
                        position={[item.lat, item.lng]}
                        icon={createThreatIcon(item.severity, isSelected)}
                        eventHandlers={{
                          click: () => {
                            setSelectedAlert(item);
                          },
                        }}
                      >
                        <Popup>
                          <div className="p-1.5 space-y-2 text-xs min-w-[200px]">
                            <div>
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  isHigh
                                    ? "bg-rose-100 text-rose-800"
                                    : item.severity === "Moderate"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {item.severity} Severity
                              </span>
                              <h4 className="font-bold text-[#17201C] text-sm mt-1">
                                {item.disease_name}
                              </h4>
                              <p className="text-[11px] text-[#063F2E] font-semibold">
                                Crop: {item.crop} • {item.distance_km} km away
                              </p>
                            </div>

                            <p className="text-[11px] text-[#65736C] line-clamp-2">
                              {item.description}
                            </p>

                            <button
                              onClick={() => setSelectedAlert(item)}
                              className="w-full bg-[#063F2E] hover:bg-[#032C21] text-white py-1.5 px-3 rounded-lg text-xs font-bold transition-colors text-center"
                            >
                              View Treatment Advisory
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}
              </MapContainer>
            </div>

            {/* Map Legend Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                  <span className="w-3 h-3 rounded-full bg-rose-600"></span> High Severity
                </span>
                <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span> Moderate
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span> Low
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#65736C] text-[11px]">
                <span>Dotted Rings: <strong>10km</strong>, <strong>25km</strong>, <strong>50km</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right (5 Cols): Threat List, Filters & Quick Action Cards */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E1E8E4] shadow-xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#17211D]">
                <Filter className="w-3.5 h-3.5 text-[#063F2E]" /> Severity:
              </div>
              <div className="flex items-center gap-1">
                {["All", "High", "Moderate", "Low"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterSeverity(s)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      filterSeverity === s
                        ? "bg-[#063F2E] text-white shadow-xs"
                        : "text-[#65736C] hover:bg-[#DDF5EA] hover:text-[#063F2E]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Farm Crop Only Toggle */}
            <button
              onClick={() => setFilterMyCropOnly(!filterMyCropOnly)}
              className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                filterMyCropOnly
                  ? "bg-[#DDF5EA] border-[#063F2E] text-[#063F2E]"
                  : "bg-[#F6F8F5] border-[#E1E8E4] text-[#65736C] hover:text-[#17211D]"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Only My Crop ({farmCrop})
            </button>
          </div>

          {/* Threats List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredAlerts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E1E8E4] p-8 text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-[#17201C]">No Threats in Selected Filter</h3>
                <p className="text-xs text-[#66736D]">
                  No active outbreak reports match the current filter.
                </p>
              </div>
            ) : (
              filteredAlerts.map((item) => {
                const isHigh = item.severity === "High";
                const isModerate = item.severity === "Moderate";
                const isSelected = selectedAlert?.id === item.id;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-4 transition-all space-y-2.5 ${
                      isSelected
                        ? "border-[#063F2E] ring-2 ring-[#063F2E]/20 shadow-md bg-[#DDF5EA]/20"
                        : "border-[#E1E8E4] hover:border-[#087F5B]/30 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isHigh
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : isModerate
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {item.severity}
                          </span>
                          <span className="text-[11px] font-bold text-[#063F2E] bg-[#DDF5EA] px-2 py-0.5 rounded-md">
                            {item.crop}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-[#17211D] flex items-center gap-1.5">
                          <Bug className="w-3.5 h-3.5 text-[#063F2E]" />
                          {item.disease_name}
                        </h3>

                        <p className="text-[11px] text-[#65736C] mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#063F2E]" />
                          {item.location} ({item.distance_km} km away)
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleFocusThreat(item)}
                          className="bg-[#063F2E] hover:bg-[#032C21] text-white p-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
                          title="Center on Map & View"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleShareWhatsApp(item)}
                          className="bg-[#16A36F] hover:bg-[#087F5B] text-white p-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
                          title="Share to WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#65736C] leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    <div className="pt-2 border-t border-[#E1E8E4] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#65736C] truncate max-w-[70%]">
                        <strong>Defense:</strong> {item.cultural_actions[0]}
                      </span>
                      <button
                        onClick={() => setSelectedAlert(item)}
                        className="text-[#063F2E] font-bold hover:underline flex items-center gap-0.5 text-xs whitespace-nowrap"
                      >
                        Advisory <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Detail & Treatment Advisory Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-[#E1E8E4] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-[#063F2E] text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                    {selectedAlert.severity} Severity Threat
                  </span>
                  <span className="text-xs font-bold bg-white/10 text-white px-2.5 py-0.5 rounded-full">
                    Crop: {selectedAlert.crop}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{selectedAlert.disease_name}</h2>
                <p className="text-xs text-white/80 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                  {selectedAlert.location} • {selectedAlert.distance_km} km from your farm • {selectedAlert.reported_date}
                </p>
              </div>

              <button
                onClick={() => setSelectedAlert(null)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {/* Field Symptoms & Microclimate Trigger */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
                  <span className="font-bold text-[#17211D] block mb-0.5">Symptoms:</span>
                  <span className="text-[#65736C]">{selectedAlert.description}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4]">
                  <span className="font-bold text-[#17211D] block mb-0.5">Vector Drift:</span>
                  <span className="text-[#65736C]">{selectedAlert.spread_vector}</span>
                </div>
              </div>

              {/* Segmented Advisory Tabs */}
              <div className="flex items-center gap-1 bg-[#F6F8F5] p-1 rounded-xl border border-[#E1E8E4] text-xs">
                <button
                  type="button"
                  onClick={() => setAdvisoryTab("containment")}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                    advisoryTab === "containment"
                      ? "bg-white text-[#063F2E] shadow-xs"
                      : "text-[#65736C] hover:text-[#17211D]"
                  }`}
                >
                  Containment
                </button>
                <button
                  type="button"
                  onClick={() => setAdvisoryTab("organic")}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                    advisoryTab === "organic"
                      ? "bg-white text-[#063F2E] shadow-xs"
                      : "text-[#65736C] hover:text-[#17211D]"
                  }`}
                >
                  Bio-Control
                </button>
                {selectedAlert.chemical_ipm && (
                  <button
                    type="button"
                    onClick={() => setAdvisoryTab("chemical")}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                      advisoryTab === "chemical"
                        ? "bg-white text-[#063F2E] shadow-xs"
                        : "text-[#65736C] hover:text-[#17211D]"
                    }`}
                  >
                    Chemical IPM
                  </button>
                )}
              </div>

              {/* TAB 1: Cultural Containment */}
              {advisoryTab === "containment" && (
                <div className="space-y-2 animate-in fade-in">
                  <ul className="space-y-1.5">
                    {selectedAlert.cultural_actions.map((act, i) => (
                      <li key={i} className="text-xs text-[#17211D] flex items-start gap-2 bg-[#F6F8F5] p-2.5 rounded-xl border border-[#E1E8E4]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#063F2E] mt-1.5 shrink-0" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* TAB 2: Organic & Bio-Control */}
              {advisoryTab === "organic" && (
                <div className="space-y-2 animate-in fade-in">
                  <div className="space-y-1.5">
                    {selectedAlert.bio_remedies.map((bio, i) => (
                      <div key={i} className="text-xs text-[#063F2E] bg-[#DDF5EA] p-2.5 rounded-xl border border-[#063F2E]/20 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                        <span>{bio}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: Chemical IPM */}
              {advisoryTab === "chemical" && selectedAlert.chemical_ipm && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs animate-in fade-in">
                  <p className="font-bold text-[#17211D]">
                    Active Molecule: <span className="font-normal text-slate-800">{selectedAlert.chemical_ipm.molecule}</span>
                  </p>
                  <p className="text-slate-600">
                    <strong>Application Protocol:</strong> {selectedAlert.chemical_ipm.method}
                  </p>
                  <p className="text-amber-800 font-semibold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-600" />
                    {selectedAlert.chemical_ipm.waiting_period}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 bg-[#F6F8F5] border-t border-[#E1E8E4] flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                to="/disease-doctor"
                className="text-xs text-[#063F2E] hover:underline font-bold flex items-center gap-1.5"
              >
                Suspect this on your plants? Open Disease Doctor <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleShareWhatsApp(selectedAlert)}
                  className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-[#16A36F] hover:bg-[#087F5B] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" /> Broadcast to WhatsApp
                </button>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="py-2 px-4 rounded-xl border border-[#E1E8E4] bg-white text-xs font-bold text-[#17211D] hover:bg-zinc-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Field Sighting Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-[#E1E8E4] shadow-2xl overflow-hidden">
            <div className="p-5 bg-[#063F2E] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <PlusCircle className="w-5 h-5" /> Report a Field Sighting
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  Protect your farming community by alerting neighbors to early outbreaks.
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#17211D] block mb-1">
                  Crop Affected
                </label>
                <select
                  value={newSighting.crop}
                  onChange={(e) => setNewSighting({ ...newSighting, crop: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E8E4] text-xs font-bold text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#063F2E]/20 focus:border-[#063F2E]"
                >
                  <option value="Rice">Paddy / Rice</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Coconut">Coconut</option>
                  <option value="Pepper">Black Pepper</option>
                  <option value="Maize">Maize</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Pulses">Pulses / Vegetables</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#17211D] block mb-1">
                  Suspect Pest or Disease Name
                </label>
                <input
                  type="text"
                  required
                  value={newSighting.disease_name}
                  onChange={(e) => setNewSighting({ ...newSighting, disease_name: e.target.value })}
                  placeholder="e.g. Leaf Folder, Sheath Blight, Whitefly"
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E8E4] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#063F2E]/20 focus:border-[#063F2E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#17211D] block mb-1">
                    Severity Observed
                  </label>
                  <select
                    value={newSighting.severity}
                    onChange={(e) => setNewSighting({ ...newSighting, severity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E1E8E4] text-xs font-semibold text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#063F2E]/20 focus:border-[#063F2E]"
                  >
                    <option value="High">High (Spreading fast)</option>
                    <option value="Moderate">Moderate (Cluster patches)</option>
                    <option value="Low">Low (Isolated plants)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#17211D] block mb-1">
                    Distance from your farm
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={newSighting.distance_km}
                      onChange={(e) => setNewSighting({ ...newSighting, distance_km: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#E1E8E4] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#063F2E]/20 focus:border-[#063F2E]"
                    />
                    <span className="absolute right-3 top-2 text-xs text-[#65736C] font-bold">km</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#17211D] block mb-1">
                  Panchayat / Location
                </label>
                <input
                  type="text"
                  required
                  value={newSighting.location}
                  onChange={(e) => setNewSighting({ ...newSighting, location: e.target.value })}
                  placeholder="e.g. Aluva East, Kalady canal area"
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E8E4] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#063F2E]/20 focus:border-[#063F2E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#17211D] block mb-1">
                  Field Observations & Symptoms
                </label>
                <textarea
                  rows={2}
                  value={newSighting.description}
                  onChange={(e) => setNewSighting({ ...newSighting, description: e.target.value })}
                  placeholder="Describe leaf yellowing, caterpillar webs, hopper counts per hill..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E8E4] text-xs text-[#17211D] focus:outline-none focus:ring-2 focus:ring-[#063F2E]/20 focus:border-[#063F2E]"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E1E8E4] text-xs font-bold text-[#65736C] hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#063F2E] hover:bg-[#032C21] text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Publish Sighting Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {reportSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <div className="text-xs">
            <p className="font-bold">Sighting Alert Published!</p>
            <p className="text-emerald-100">Added to live radar and shared with neighborhood monitoring.</p>
          </div>
        </div>
      )}
    </div>
  );
}
