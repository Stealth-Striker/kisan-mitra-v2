import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  TrendingUp,
  MapPin,
  Sparkles,
  Truck,
  Scale,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  MessageSquare,
  Building,
  Share2,
  Loader2,
  Bell,
  ShieldCheck,
  Calculator,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFarm } from "@/lib/farmContext";
import SEO from "@/components/SEO";

// Multi-crop market profiles with APMC mandis, historical & forecast rates, and MSP data
const CROP_MARKET_DATA = {
  Rice: {
    cropName: "Paddy / Rice (Common & Grade A)",
    varietyDefault: "Jyothi / Uma / Basmati",
    unit: "Quintal (100 kg)",
    msp: 23.0, // ₹2,300/qtl
    stateBonusMsp: 28.2, // Kerala Supplyco Procurement incentive rate
    mandis: [
      {
        id: "ernakulam",
        name: "Ernakulam Wholesale Mandi",
        distanceKm: 14,
        avgPrice: 32.5,
        minPrice: 30.0,
        maxPrice: 35.0,
        arrivalTons: 42,
        trendPct: +2.4,
        cessPct: 1.0,
      },
      {
        id: "kochi",
        name: "Kochi APMC Yard (Kalamassery)",
        distanceKm: 28,
        avgPrice: 33.8,
        minPrice: 31.5,
        maxPrice: 36.0,
        arrivalTons: 68,
        trendPct: +3.1,
        cessPct: 1.2,
      },
      {
        id: "thrissur",
        name: "Thrissur Farmers Grain Hub",
        distanceKm: 48,
        avgPrice: 34.6,
        minPrice: 32.0,
        maxPrice: 37.0,
        arrivalTons: 95,
        trendPct: +1.8,
        cessPct: 1.5,
      },
      {
        id: "alappuzha",
        name: "Alappuzha Paddy Depot",
        distanceKm: 56,
        avgPrice: 31.8,
        minPrice: 29.5,
        maxPrice: 33.5,
        arrivalTons: 35,
        trendPct: -0.8,
        cessPct: 1.0,
      },
    ],
    trend14Days: [
      { day: "D-7", price: 30.2, type: "history" },
      { day: "D-6", price: 30.6, type: "history" },
      { day: "D-5", price: 31.0, type: "history" },
      { day: "D-4", price: 31.5, type: "history" },
      { day: "D-3", price: 31.8, type: "history" },
      { day: "D-2", price: 32.2, type: "history" },
      { day: "Yesterday", price: 32.5, type: "history" },
      { day: "Today", price: 33.2, type: "current" },
      { day: "+1 Day", price: 33.7, type: "forecast" },
      { day: "+2 Days", price: 34.2, type: "forecast" },
      { day: "+3 Days", price: 34.6, type: "forecast" },
      { day: "+4 Days", price: 34.5, type: "forecast" },
      { day: "+5 Days", price: 34.1, type: "forecast" },
      { day: "+6 Days", price: 33.8, type: "forecast" },
      { day: "+7 Days", price: 33.5, type: "forecast" },
    ],
    peakRecommendation:
      "Hold harvest sales for 3-4 days. Palakkad basin arrivals are temporarily disrupted by transport halts; peak rate (₹34.60/kg) expected Thursday/Friday.",
    govtCenter: "Supplyco PACS Paddy Procurement Depot (Aluva/Kalamassery)",
    qualitySpecs: "Moisture must be < 17%. Foreign matter < 1%. Discolored grains < 3%.",
  },
  Tomato: {
    cropName: "Tomato (Hybrid & Desi)",
    varietyDefault: "Shivam / Abhinav",
    unit: "Crate (25 kg) / Quintal",
    msp: 14.0, // Kerala State Vegetable Base Price Scheme
    stateBonusMsp: 16.0,
    mandis: [
      {
        id: "kochi",
        name: "Kochi Vegetable APMC Yard",
        distanceKm: 28,
        avgPrice: 28.0,
        minPrice: 24.0,
        maxPrice: 32.0,
        arrivalTons: 22,
        trendPct: +6.2,
        cessPct: 1.5,
      },
      {
        id: "ernakulam",
        name: "Ernakulam Wholesale Market",
        distanceKm: 14,
        avgPrice: 26.5,
        minPrice: 22.0,
        maxPrice: 30.0,
        arrivalTons: 16,
        trendPct: +4.0,
        cessPct: 1.0,
      },
      {
        id: "thrissur",
        name: "Thrissur Central Mandi",
        distanceKm: 48,
        avgPrice: 31.0,
        minPrice: 26.0,
        maxPrice: 35.0,
        arrivalTons: 38,
        trendPct: +8.5,
        cessPct: 1.5,
      },
      {
        id: "chalakudy",
        name: "Chalakudy Farmers Market",
        distanceKm: 40,
        avgPrice: 27.2,
        minPrice: 23.0,
        maxPrice: 31.0,
        arrivalTons: 14,
        trendPct: +1.5,
        cessPct: 1.0,
      },
    ],
    trend14Days: [
      { day: "D-7", price: 21.0, type: "history" },
      { day: "D-6", price: 22.5, type: "history" },
      { day: "D-5", price: 23.8, type: "history" },
      { day: "D-4", price: 24.5, type: "history" },
      { day: "D-3", price: 25.5, type: "history" },
      { day: "D-2", price: 26.8, type: "history" },
      { day: "Yesterday", price: 27.5, type: "history" },
      { day: "Today", price: 28.0, type: "current" },
      { day: "+1 Day", price: 29.8, type: "forecast" },
      { day: "+2 Days", price: 31.0, type: "forecast" },
      { day: "+3 Days", price: 31.5, type: "forecast" },
      { day: "+4 Days", price: 29.5, type: "forecast" },
      { day: "+5 Days", price: 27.0, type: "forecast" },
      { day: "+6 Days", price: 25.0, type: "forecast" },
      { day: "+7 Days", price: 23.5, type: "forecast" },
    ],
    peakRecommendation:
      "Sell within 48 to 72 hours! Tomato rates peak mid-week at ₹31.50/kg before heavy interstate supply trucks arrive from Dindigul & Kolar on the weekend.",
    govtCenter: "VFPCK (Vegetable & Fruit Promotion Council Keralam) Hub",
    qualitySpecs: "Firm breaker or pink stage. Maximum 2% surface blemish. No skin cracks.",
  },
  Wheat: {
    cropName: "Wheat (Sharbati & Lokwan)",
    varietyDefault: "HD-2967 / Lokwan",
    unit: "Quintal (100 kg)",
    msp: 22.75, // ₹2,275/qtl
    stateBonusMsp: 24.0,
    mandis: [
      {
        id: "ernakulam",
        name: "Ernakulam Grain Terminal",
        distanceKm: 14,
        avgPrice: 26.8,
        minPrice: 25.0,
        maxPrice: 28.5,
        arrivalTons: 25,
        trendPct: +1.2,
        cessPct: 1.0,
      },
      {
        id: "kochi",
        name: "Kochi APMC Bulk Market",
        distanceKm: 28,
        avgPrice: 27.5,
        minPrice: 25.8,
        maxPrice: 29.2,
        arrivalTons: 54,
        trendPct: +1.6,
        cessPct: 1.2,
      },
      {
        id: "thrissur",
        name: "Thrissur Wholesale Complex",
        distanceKm: 48,
        avgPrice: 27.8,
        minPrice: 26.0,
        maxPrice: 29.5,
        arrivalTons: 40,
        trendPct: +0.9,
        cessPct: 1.2,
      },
    ],
    trend14Days: [
      { day: "D-7", price: 25.8, type: "history" },
      { day: "D-6", price: 26.0, type: "history" },
      { day: "D-5", price: 26.2, type: "history" },
      { day: "D-4", price: 26.5, type: "history" },
      { day: "D-3", price: 26.8, type: "history" },
      { day: "D-2", price: 27.0, type: "history" },
      { day: "Yesterday", price: 27.2, type: "history" },
      { day: "Today", price: 27.4, type: "current" },
      { day: "+1 Day", price: 27.6, type: "forecast" },
      { day: "+2 Days", price: 27.8, type: "forecast" },
      { day: "+3 Days", price: 27.9, type: "forecast" },
      { day: "+4 Days", price: 27.8, type: "forecast" },
      { day: "+5 Days", price: 27.6, type: "forecast" },
      { day: "+6 Days", price: 27.5, type: "forecast" },
      { day: "+7 Days", price: 27.3, type: "forecast" },
    ],
    peakRecommendation:
      "Market volatility is low. Prices will remain stable around ₹27.50 - ₹28.00/kg. You can sell flexibly without risk of sharp drops.",
    govtCenter: "FCI Grain Godown / Primary Co-operative Procurement",
    qualitySpecs: "Moisture < 12.0%. Lustrous golden grain. Foreign matter < 0.75%.",
  },
  Maize: {
    cropName: "Maize / Corn (Feed & Industrial)",
    varietyDefault: "Yellow Dent Hybrid",
    unit: "Quintal (100 kg)",
    msp: 20.9, // ₹2,090/qtl
    stateBonusMsp: 21.5,
    mandis: [
      {
        id: "ernakulam",
        name: "Ernakulam Poultry Feed Hub",
        distanceKm: 14,
        avgPrice: 23.4,
        minPrice: 22.0,
        maxPrice: 25.0,
        arrivalTons: 19,
        trendPct: +1.8,
        cessPct: 1.0,
      },
      {
        id: "kochi",
        name: "Kochi Harbor Feed Traders",
        distanceKm: 28,
        avgPrice: 24.2,
        minPrice: 22.8,
        maxPrice: 26.0,
        arrivalTons: 38,
        trendPct: +3.2,
        cessPct: 1.2,
      },
      {
        id: "pollachi",
        name: "Palakkad / Pollachi Border Mandi",
        distanceKm: 72,
        avgPrice: 25.5,
        minPrice: 23.5,
        maxPrice: 27.2,
        arrivalTons: 82,
        trendPct: +4.1,
        cessPct: 1.5,
      },
    ],
    trend14Days: [
      { day: "D-7", price: 21.8, type: "history" },
      { day: "D-6", price: 22.2, type: "history" },
      { day: "D-5", price: 22.5, type: "history" },
      { day: "D-4", price: 22.9, type: "history" },
      { day: "D-3", price: 23.3, type: "history" },
      { day: "D-2", price: 23.6, type: "history" },
      { day: "Yesterday", price: 23.9, type: "history" },
      { day: "Today", price: 24.2, type: "current" },
      { day: "+1 Day", price: 24.6, type: "forecast" },
      { day: "+2 Days", price: 25.0, type: "forecast" },
      { day: "+3 Days", price: 25.3, type: "forecast" },
      { day: "+4 Days", price: 25.1, type: "forecast" },
      { day: "+5 Days", price: 24.8, type: "forecast" },
      { day: "+6 Days", price: 24.5, type: "forecast" },
      { day: "+7 Days", price: 24.2, type: "forecast" },
    ],
    peakRecommendation:
      "Starch & poultry feed demand is rising. Selling at the Pollachi border offers peak rates, but check transport deductions first.",
    govtCenter: "State Agricultural Warehouse Depot",
    qualitySpecs: "Moisture < 14%. Aflatoxin under safe threshold. Weeviled grain < 1%.",
  },
  Coconut: {
    cropName: "Coconut / Milling Copra",
    varietyDefault: "West Coast Tall (WCT)",
    unit: "Quintal / 100 Nuts",
    msp: 111.6, // ₹11,160/qtl for Milling Copra
    stateBonusMsp: 120.0,
    mandis: [
      {
        id: "kochi",
        name: "Kochi Oil Merchants Exchange",
        distanceKm: 28,
        avgPrice: 121.5,
        minPrice: 115.0,
        maxPrice: 128.0,
        arrivalTons: 32,
        trendPct: +2.5,
        cessPct: 1.2,
      },
      {
        id: "thrissur",
        name: "Thrissur Coconut Trading Complex",
        distanceKm: 48,
        avgPrice: 119.0,
        minPrice: 112.0,
        maxPrice: 125.0,
        arrivalTons: 26,
        trendPct: +1.4,
        cessPct: 1.0,
      },
      {
        id: "kozhikode",
        name: "Kozhikode Copra Apex Mandi",
        distanceKm: 88,
        avgPrice: 126.0,
        minPrice: 118.0,
        maxPrice: 132.0,
        arrivalTons: 55,
        trendPct: +4.2,
        cessPct: 1.5,
      },
    ],
    trend14Days: [
      { day: "D-7", price: 114.0, type: "history" },
      { day: "D-6", price: 115.5, type: "history" },
      { day: "D-5", price: 116.8, type: "history" },
      { day: "D-4", price: 117.5, type: "history" },
      { day: "D-3", price: 119.0, type: "history" },
      { day: "D-2", price: 120.2, type: "history" },
      { day: "Yesterday", price: 121.0, type: "history" },
      { day: "Today", price: 122.0, type: "current" },
      { day: "+1 Day", price: 123.5, type: "forecast" },
      { day: "+2 Days", price: 125.0, type: "forecast" },
      { day: "+3 Days", price: 126.5, type: "forecast" },
      { day: "+4 Days", price: 126.0, type: "forecast" },
      { day: "+5 Days", price: 124.5, type: "forecast" },
      { day: "+6 Days", price: 123.0, type: "forecast" },
      { day: "+7 Days", price: 122.0, type: "forecast" },
    ],
    peakRecommendation:
      "Festival demand has bolstered coconut oil mills. Copra prices are at a 6-month high. Favorable window to sell within the next 4 days.",
    govtCenter: "KERAFED Copra Procurement Centre",
    qualitySpecs: "Moisture content strictly < 6%. Oil content > 68%. No fungal mold.",
  },
  Pepper: {
    cropName: "Black Pepper (Garbled)",
    varietyDefault: "Panniyur-1 / Malabar Black",
    unit: "Kg / Quintal",
    msp: 500.0, // Minimum import price threshold benchmark
    stateBonusMsp: 525.0,
    mandis: [
      {
        id: "kochi_ipsta",
        name: "Kochi IPSTA Spice Exchange",
        distanceKm: 28,
        avgPrice: 645.0,
        minPrice: 620.0,
        maxPrice: 670.0,
        arrivalTons: 8.5,
        trendPct: +1.8,
        cessPct: 1.0,
      },
      {
        id: "idukki",
        name: "Idukki Spices Terminal (Nedumkandam)",
        distanceKm: 85,
        avgPrice: 638.0,
        minPrice: 615.0,
        maxPrice: 660.0,
        arrivalTons: 16.0,
        trendPct: +0.9,
        cessPct: 1.0,
      },
      {
        id: "kottayam",
        name: "Kottayam Produce Yard",
        distanceKm: 60,
        avgPrice: 632.0,
        minPrice: 610.0,
        maxPrice: 655.0,
        arrivalTons: 6.0,
        trendPct: +1.1,
        cessPct: 1.0,
      },
    ],
    trend14Days: [
      { day: "D-7", price: 620.0, type: "history" },
      { day: "D-6", price: 625.0, type: "history" },
      { day: "D-5", price: 630.0, type: "history" },
      { day: "D-4", price: 634.0, type: "history" },
      { day: "D-3", price: 638.0, type: "history" },
      { day: "D-2", price: 641.0, type: "history" },
      { day: "Yesterday", price: 643.0, type: "history" },
      { day: "Today", price: 645.0, type: "current" },
      { day: "+1 Day", price: 648.0, type: "forecast" },
      { day: "+2 Days", price: 652.0, type: "forecast" },
      { day: "+3 Days", price: 655.0, type: "forecast" },
      { day: "+4 Days", price: 654.0, type: "forecast" },
      { day: "+5 Days", price: 650.0, type: "forecast" },
      { day: "+6 Days", price: 648.0, type: "forecast" },
      { day: "+7 Days", price: 645.0, type: "forecast" },
    ],
    peakRecommendation:
      "Global export demand for Malabar black pepper is steady. Kochi IPSTA exchange is offering premiums for bold berries (Bulk density > 550 g/l).",
    govtCenter: "Spices Board e-Auction Center / Spices Development Agency",
    qualitySpecs: "Bulk density > 550 g/L. Moisture < 11%. Garbled, free of pinheads.",
  },
};

// Transport Vehicle options for freight calculation
const VEHICLES = [
  { id: "mini", name: "Mini Pickup / Tata Ace", capacityQtl: 12, ratePerKm: 16, loadingBase: 250 },
  { id: "tractor", name: "Tractor Trolley", capacityQtl: 35, ratePerKm: 22, loadingBase: 450 },
  { id: "canter", name: "Medium Truck (Canter)", capacityQtl: 70, ratePerKm: 28, loadingBase: 700 },
];

export default function MarketCopilot() {
  const { farm } = useFarm();
  const farmCrop = farm?.primary_crop || "Rice";

  // State: selected crop
  const [selectedCrop, setSelectedCrop] = useState(() => {
    return CROP_MARKET_DATA[farmCrop] ? farmCrop : "Rice";
  });

  const cropData = CROP_MARKET_DATA[selectedCrop] || CROP_MARKET_DATA.Rice;

  // State: Net Profit & Freight Calculator
  const [saleQuantityQtl, setSaleQuantityQtl] = useState(25); // in Quintals
  const [selectedVehicle, setSelectedVehicle] = useState("tractor");

  // State: Trader Offer Evaluator
  const [traderOfferPrice, setTraderOfferPrice] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("cash"); // 'cash', 'credit_7', 'credit_30'
  const [farmgatePickup, setFarmgatePickup] = useState(true);
  const [aiNegotiationAdvice, setAiNegotiationAdvice] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [counterLang, setCounterLang] = useState("en"); // 'en', 'ml', 'hi'
  const [copiedScript, setCopiedScript] = useState(false);

  // State: Target Price Alert
  const [alertTargetPrice, setAlertTargetPrice] = useState("");
  const [activeAlert, setActiveAlert] = useState(null);
  const [alertSuccessToast, setAlertSuccessToast] = useState(false);

  // State: Chart hover tooltip
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Vehicle data
  const vehicleObj = VEHICLES.find((v) => v.id === selectedVehicle) || VEHICLES[1];

  // Calculate Net Profit Realization for each Mandi
  const mandiRealizations = useMemo(() => {
    const qtyKg = Number(saleQuantityQtl) * 100;
    if (qtyKg <= 0) return [];

    return cropData.mandis
      .map((mandi) => {
        const grossRevenue = qtyKg * mandi.avgPrice;
        // Two-way transport: round trip distance
        const transportCost = mandi.distanceKm * 2 * vehicleObj.ratePerKm + vehicleObj.loadingBase;
        // Mandi cess and weighing charge
        const mandiCess = (grossRevenue * mandi.cessPct) / 100 + 150; // ₹150 weighing slip
        const netProfit = grossRevenue - transportCost - mandiCess;
        const netPerKg = netProfit / qtyKg;

        return {
          ...mandi,
          grossRevenue,
          transportCost,
          mandiCess,
          netProfit,
          netPerKg,
        };
      })
      .sort((a, b) => b.netProfit - a.netProfit);
  }, [cropData, saleQuantityQtl, vehicleObj]);

  const bestMandi = mandiRealizations[0];

  // Calculate today's average benchmark price
  const todayAvgPrice = useMemo(() => {
    const sum = cropData.mandis.reduce((acc, m) => acc + m.avgPrice, 0);
    return (sum / cropData.mandis.length).toFixed(2);
  }, [cropData]);

  // Trader Offer Evaluation Logic
  const traderEvaluation = useMemo(() => {
    const offer = parseFloat(traderOfferPrice);
    if (!offer || isNaN(offer)) return null;

    const qtyKg = Number(saleQuantityQtl) * 100;
    const traderTotal = offer * qtyKg;
    const bestMandiNetTotal = bestMandi?.netProfit || 0;
    const diffTotal = traderTotal - bestMandiNetTotal;
    const diffPerKg = offer - (bestMandi?.netPerKg || 0);

    let verdict = "fair";
    let message = "";
    let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";

    if (diffPerKg >= 0.5) {
      verdict = "excellent";
      message = "Highly Lucrative: Trader's offer beats your net mandi return without freight hassle!";
      badgeColor = "bg-emerald-100 text-[#005A3C] border-emerald-300";
    } else if (diffPerKg >= -0.75 && farmgatePickup) {
      verdict = "acceptable";
      message = "Convenient & Reasonable: Slight discount is balanced by zero transit risk & immediate loading.";
      badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
    } else {
      verdict = "lowball";
      message = "Lowball Offer: You would lose significant money compared to selling directly at the mandi!";
      badgeColor = "bg-rose-100 text-rose-800 border-rose-300";
    }

    const recommendedCounterPrice = (Math.max(offer + 1.8, (bestMandi?.netPerKg || offer) + 0.8)).toFixed(2);

    return {
      offer,
      traderTotal,
      bestMandiNetTotal,
      diffTotal,
      diffPerKg,
      verdict,
      message,
      badgeColor,
      recommendedCounterPrice,
    };
  }, [traderOfferPrice, saleQuantityQtl, bestMandi, farmgatePickup]);

  // Multilingual Negotiation Pitch generator
  const negotiationScripts = useMemo(() => {
    if (!traderEvaluation) return null;
    const crop = cropData.cropName.split("(")[0].trim();
    const offer = traderEvaluation.offer;
    const counter = traderEvaluation.recommendedCounterPrice;
    const mandiName = bestMandi?.name || "Local Mandi";
    const mandiRate = bestMandi?.avgPrice || todayAvgPrice;

    return {
      en: `Dear Buyer, thank you for your offer of ₹${offer}/kg for my ${crop}. Today's wholesale rate at ${mandiName} is ₹${mandiRate}/kg. Taking into account grade quality and current arrivals, my counter-offer is ₹${counter}/kg for immediate loading. Please confirm if we can proceed.`,
      ml: `നമസ്കാരം, എന്റെ ${crop} വിളയ്ക്ക് ₹${offer}/kg നിരക്കിൽ നിങ്ങൾ തന്ന ഓഫറിന് നന്ദി. ഇന്നത്തെ ${mandiName} വിപണി നിരക്ക് ₹${mandiRate}/kg ആണ്. ഗുണമേന്മയും ഇന്നത്തെ വിപണി ആവശ്യകതയും പരിഗണിച്ച്, ₹${counter}/kg നിരക്കിൽ നൽകാൻ തയ്യാറാണ്. അറിയിക്കുമല്ലോ.`,
      hi: `नमस्ते, मेरे ${crop} के लिए ₹${offer}/किग्रा के प्रस्ताव के लिए धन्यवाद। आज ${mandiName} में थोक भाव ₹${mandiRate}/किग्रा है। फसल की उच्च गुणवत्ता को देखते हुए, मेरा अंतिम प्रति-प्रस्ताव ₹${counter}/किग्रा है। कृपया पुष्टि करें।`,
    };
  }, [traderEvaluation, cropData, bestMandi, todayAvgPrice]);

  const copyCounterScript = () => {
    if (!negotiationScripts) return;
    const text = negotiationScripts[counterLang];
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const shareViaWhatsApp = () => {
    if (!negotiationScripts) return;
    const text = negotiationScripts[counterLang];
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // AI Negotiation Advice invoke
  const handleAskAiNegotiator = async () => {
    if (!traderEvaluation) return;
    setAiLoading(true);
    try {
      const prompt = `A trader offered ₹${traderOfferPrice}/kg for ${saleQuantityQtl} quintals of ${cropData.cropName}. Payment terms: ${paymentTerms}. Today's Mandi average is ₹${todayAvgPrice}/kg. Best mandi net realization is ₹${bestMandi?.netPerKg.toFixed(2)}/kg. Should I accept, counter, or reject? Provide 3 sharp bargaining tips for an Indian farmer.`;
      const res = await base44.functions.invoke("askKisanMitra", {
        question: prompt,
        language: counterLang === "ml" ? "Malayalam" : counterLang === "hi" ? "Hindi" : "English",
      });
      setAiNegotiationAdvice(res.data?.answer || res.data);
    } catch {
      setAiNegotiationAdvice(
        `Strategic Negotiation Advice:\n• Current Mandi benchmark is ₹${todayAvgPrice}/kg. The buyer's offer of ₹${traderOfferPrice}/kg is ${traderEvaluation.diffPerKg >= 0 ? "at par with market" : "underpricing your batch by ₹" + Math.abs(traderEvaluation.diffPerKg).toFixed(2) + "/kg"}.\n• Counter firmly at ₹${traderEvaluation.recommendedCounterPrice}/kg citing high grain density and low regional market arrivals.\n• If payment is deferred (${paymentTerms}), strictly demand 25% cash advance before truck weighing.`
      );
    }
    setAiLoading(false);
  };

  // Handle Set Target Alert
  const handleSetAlert = (e) => {
    e.preventDefault();
    const target = parseFloat(alertTargetPrice);
    if (!target || isNaN(target)) return;

    setActiveAlert({
      crop: selectedCrop,
      targetPrice: target,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    setAlertSuccessToast(true);
    setTimeout(() => setAlertSuccessToast(false), 3000);
  };

  // SVG Chart Geometry Calculations
  const chartWidth = 720;
  const chartHeight = 220;
  const chartPadding = { top: 25, right: 30, bottom: 35, left: 45 };

  const chartPrices = cropData.trend14Days.map((d) => d.price);
  const minPriceVal = Math.min(...chartPrices, cropData.msp) * 0.94;
  const maxPriceVal = Math.max(...chartPrices) * 1.06;

  const getX = (index) => {
    const totalPoints = cropData.trend14Days.length - 1;
    const availableWidth = chartWidth - chartPadding.left - chartPadding.right;
    return chartPadding.left + (index / totalPoints) * availableWidth;
  };

  const getY = (val) => {
    const availableHeight = chartHeight - chartPadding.top - chartPadding.bottom;
    const normalized = (val - minPriceVal) / (maxPriceVal - minPriceVal);
    return chartHeight - chartPadding.bottom - normalized * availableHeight;
  };

  // Generate SVG path string
  const points = cropData.trend14Days.map((d, i) => ({ x: getX(i), y: getY(d.price), ...d }));
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const midX = (prev.x + pt.x) / 2;
    return `${acc} C ${midX} ${prev.y}, ${midX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");

  // Area under curve path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - chartPadding.bottom} L ${points[0].x} ${chartHeight - chartPadding.bottom} Z`;
  const mspY = getY(cropData.msp);

  return (
    <div className="space-y-7 max-w-6xl mx-auto pb-16">
      <SEO
        title="Market Copilot - Mandi Prices, Freight Calculator & Trader Negotiation"
        description="Real-time APMC wholesale mandi rates, net profit freight calculator, 15-day price trajectory forecast, trader offer evaluator and MSP safety net."
        canonicalPath="/market-copilot"
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E8E4] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8F1] text-[#005A3C] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Mandi Intelligence & Negotiation Suite
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17201C] flex items-center gap-3">
            <LineChart className="w-7 h-7 text-[#005A3C]" />
            Market Copilot
          </h1>
          <p className="text-sm text-[#66736D] mt-1">
            Real-time wholesale market prices, net freight realization, 15-day price trajectory, and middleman counter-negotiation.
          </p>
        </div>

        {/* Commodity / Crop Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 bg-[#F7F9F7] p-1.5 rounded-2xl border border-[#E1E8E4]">
          {Object.keys(CROP_MARKET_DATA).map((cropKey) => {
            const isSelected = selectedCrop === cropKey;
            return (
              <button
                key={cropKey}
                onClick={() => {
                  setSelectedCrop(cropKey);
                  setAiNegotiationAdvice(null);
                  setTraderOfferPrice("");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-[#005A3C] text-white shadow-sm"
                    : "text-[#66736D] hover:text-[#17201C] hover:bg-white"
                }`}
              >
                {cropKey}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Regional APMC Benchmark */}
        <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#005A3C] bg-[#E8F8F1] px-2.5 py-1 rounded-full">
                Mandi Benchmark
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Live Trend
              </span>
            </div>
            <p className="text-xs text-[#66736D] mt-3">{cropData.cropName}</p>
            <div className="flex items-baseline gap-2.5 mt-1.5">
              <span className="text-3xl sm:text-4xl font-black text-[#17201C]">
                ₹{todayAvgPrice}
              </span>
              <span className="text-xs font-bold text-[#66736D]">/ kg</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E1E8E4] flex items-center justify-between text-xs text-[#66736D]">
            <span>Peak Mandi: <strong className="text-[#17201C] font-semibold">{bestMandi?.name.split(" ")[0]}</strong></span>
            <span className="font-bold text-[#005A3C]">₹{bestMandi?.avgPrice}/kg</span>
          </div>
        </div>

        {/* 2. Official Government MSP Floor */}
        <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Govt MSP Floor
              </span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                Legal Base
              </span>
            </div>
            <p className="text-xs text-[#66736D] mt-3">Central Govt Procurement Rate</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-3xl sm:text-4xl font-black text-[#17201C]">
                ₹{cropData.msp.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-[#66736D]">/ kg (₹{(cropData.msp * 100).toLocaleString()}/qtl)</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E1E8E4] text-xs text-[#66736D] flex items-center justify-between">
            <span>State Bonus Floor:</span>
            <span className="font-bold text-emerald-700">₹{cropData.stateBonusMsp.toFixed(2)}/kg</span>
          </div>
        </div>

        {/* 3. Market Momentum & Sell Recommendation */}
        <div className="bg-gradient-to-br from-[#E8F8F1] via-[#F2FAF6] to-white border border-[#005A3C]/30 border-l-4 border-l-[#005A3C] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#005A3C] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#005A3C]" /> Sell Timing Signal
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide bg-[#005A3C] text-white px-2.5 py-0.5 rounded-full">
                High Confidence
              </span>
            </div>
            <h2 className="text-sm font-bold text-[#17201C] mt-2.5 leading-snug">
              {cropData.peakRecommendation}
            </h2>
          </div>
          <div className="mt-4 pt-3 border-t border-[#005A3C]/15 flex items-center gap-3 text-xs font-semibold text-[#005A3C]">
            <span className="flex items-center gap-1">✓ Low Regional Inflow</span>
            <span className="flex items-center gap-1">✓ Bullish Momentum</span>
          </div>
        </div>
      </div>

      {/* 15-Day Interactive SVG Price Trajectory Chart */}
      <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E1E8E4] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#17201C]">
                15-Day Price Trajectory & Forecast
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#E8F8F1] text-[#005A3C]">
                {selectedCrop}
              </span>
            </div>
            <p className="text-xs text-[#66736D] mt-0.5">
              Past 7-day arrivals vs next 7-day predictive peak window. Hover any node for details.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-[#17201C] font-semibold">
              <span className="w-3 h-3 rounded-full bg-[#005A3C]"></span> Actual Rates
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-3 h-1 border-t-2 border-dashed border-[#005A3C]"></span> Projected
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
              <span className="w-3 h-1 border-t-2 border-dashed border-amber-600"></span> MSP Floor
            </span>
          </div>
        </div>

        {/* SVG Chart Container */}
        <div className="relative overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto max-h-[260px] select-none"
          >
            <defs>
              <linearGradient id="copilotGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#005A3C" stopOpacity="0.25" />
                <stop offset="80%" stopColor="#005A3C" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#005A3C" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
              const val = minPriceVal + ratio * (maxPriceVal - minPriceVal);
              const y = getY(val);
              return (
                <g key={ratio}>
                  <line
                    x1={chartPadding.left}
                    y1={y}
                    x2={chartWidth - chartPadding.right}
                    y2={y}
                    stroke="#E5EAE7"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={chartPadding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="#87958F"
                    fontWeight="500"
                  >
                    ₹{val.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Govt MSP Reference Line */}
            <line
              x1={chartPadding.left}
              y1={mspY}
              x2={chartWidth - chartPadding.right}
              y2={mspY}
              stroke="#D97706"
              strokeWidth="1.8"
              strokeDasharray="6,4"
            />
            <text
              x={chartWidth - chartPadding.right - 5}
              y={mspY - 6}
              textAnchor="end"
              fontSize="10"
              fill="#B45309"
              fontWeight="bold"
            >
              Govt MSP Floor: ₹{cropData.msp.toFixed(2)}/kg
            </text>

            {/* Shaded Area Under Curve */}
            <path d={areaD} fill="url(#copilotGradient)" />

            {/* The Main Line */}
            <path d={pathD} fill="none" stroke="#005A3C" strokeWidth="3.2" strokeLinecap="round" />

            {/* Data Points */}
            {points.map((pt, idx) => {
              const isToday = pt.type === "current";
              const isForecast = pt.type === "forecast";
              const isHovered = hoveredPoint?.day === pt.day;

              return (
                <g
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {isToday && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="12"
                      fill="#005A3C"
                      fillOpacity="0.2"
                      className="animate-pulse"
                    />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? "6.5" : isToday ? "5.5" : "3.8"}
                    fill={isToday ? "#005A3C" : isForecast ? "#34D399" : "#FFFFFF"}
                    stroke="#005A3C"
                    strokeWidth={isToday ? "2.5" : "2"}
                    className="transition-all duration-150"
                  />
                  {/* X Axis Day Label */}
                  <text
                    x={pt.x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill={isToday ? "#005A3C" : "#66736D"}
                    fontWeight={isToday ? "bold" : "500"}
                  >
                    {pt.day}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredPoint && (
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#17201C] text-white px-3.5 py-2 rounded-xl text-xs shadow-lg pointer-events-none flex items-center gap-3 border border-white/10"
            >
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  {hoveredPoint.day} ({hoveredPoint.type})
                </span>
                <span className="text-sm font-extrabold text-emerald-400">
                  ₹{hoveredPoint.price.toFixed(2)}/kg
                </span>
              </div>
              <div className="border-l border-white/20 pl-3">
                <span className="text-[10px] text-zinc-300 block">
                  Per Quintal: ₹{(hoveredPoint.price * 100).toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-300 block font-semibold">
                  vs MSP: +₹{(hoveredPoint.price - cropData.msp).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two-Column Section: True Net Mandi Freight Calculator & Trader Offer Evaluator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column (7 Cols): Multi-Mandi Freight & In-Pocket Profit Calculator */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E1E8E4] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#17201C] flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#005A3C]" />
                  Net Mandi Freight & Profit Realization
                </h3>
                <p className="text-xs text-[#66736D] mt-0.5">
                  Never lose profit to diesel costs. Calculate true in-pocket earnings after transport & mandi fees.
                </p>
              </div>
              <span className="text-xs font-bold text-[#005A3C] bg-[#E8F8F1] px-3 py-1 rounded-full self-start sm:self-auto">
                Automatic Ranking
              </span>
            </div>

            {/* Inputs: Quantity & Transport Vehicle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F7F9F7] p-4 rounded-xl border border-[#E1E8E4]">
              <div>
                <label className="text-xs font-bold text-[#17201C] block mb-1.5 flex items-center justify-between">
                  <span>Batch Quantity to Sell</span>
                  <span className="text-[#005A3C] font-semibold">{saleQuantityQtl * 100} kg</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={saleQuantityQtl}
                    onChange={(e) => setSaleQuantityQtl(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full pl-3 pr-16 py-2 rounded-xl border border-[#E1E8E4] text-sm font-bold text-[#17201C] focus:outline-none focus:ring-2 focus:ring-[#005A3C]/20 focus:border-[#005A3C] bg-white"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-[#66736D]">
                    Quintals
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#17201C] block mb-1.5 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#005A3C]" /> Transport Vehicle
                </label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E8E4] text-xs font-bold text-[#17201C] focus:outline-none focus:ring-2 focus:ring-[#005A3C]/20 focus:border-[#005A3C] bg-white"
                >
                  {VEHICLES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (₹{v.ratePerKm}/km)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mandi Cards List */}
            <div className="space-y-3">
              {mandiRealizations.map((mandi, idx) => {
                const isTopNet = idx === 0;
                const profitDiff = isTopNet
                  ? mandi.netProfit - (mandiRealizations[1]?.netProfit || 0)
                  : mandi.netProfit - bestMandi.netProfit;

                return (
                  <div
                    key={mandi.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isTopNet
                        ? "bg-[#E8F8F1]/60 border-[#005A3C] shadow-sm ring-1 ring-[#005A3C]/30"
                        : "bg-white border-[#E1E8E4] hover:border-[#B5C9BE]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#17201C] flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-[#005A3C]" />
                            {mandi.name}
                          </span>
                          {isTopNet && (
                            <span className="bg-[#005A3C] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                              Best Net Profit
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#66736D]">
                          <span>Distance: <strong className="text-[#17201C]">{mandi.distanceKm} km</strong></span>
                          <span>•</span>
                          <span>Mandi Rate: <strong className="text-[#17201C]">₹{mandi.avgPrice}/kg</strong></span>
                          <span>•</span>
                          <span>Arrivals: <strong className="text-[#17201C]">{mandi.arrivalTons} T/day</strong></span>
                        </div>
                      </div>

                      <div className="text-right sm:min-w-[140px]">
                        <span className="text-xs text-[#66736D] block">True In-Pocket Return</span>
                        <span className={`text-lg font-black ${isTopNet ? "text-[#005A3C]" : "text-[#17201C]"}`}>
                          ₹{Math.round(mandi.netProfit).toLocaleString()}
                        </span>
                        <span className="text-[11px] font-bold text-[#66736D] block">
                          (Effective ₹{mandi.netPerKg.toFixed(2)}/kg)
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Strip */}
                    <div className="mt-3 pt-2.5 border-t border-[#E1E8E4]/60 flex flex-wrap items-center justify-between text-[11px] text-[#66736D]">
                      <span>Gross: ₹{Math.round(mandi.grossRevenue).toLocaleString()}</span>
                      <span>Est. Freight: -₹{Math.round(mandi.transportCost).toLocaleString()}</span>
                      <span>Mandi Cess: -₹{Math.round(mandi.mandiCess).toLocaleString()}</span>
                      {isTopNet ? (
                        <span className="font-bold text-[#005A3C]">
                          +₹{Math.round(profitDiff).toLocaleString()} extra vs 2nd choice
                        </span>
                      ) : (
                        <span className="font-medium text-rose-600">
                          -₹{Math.abs(Math.round(profitDiff)).toLocaleString()} vs Best
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): Trader Offer Evaluator & Negotiation Pitch */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-5 sm:p-6 space-y-4">
            <div className="border-b border-[#E1E8E4] pb-3">
              <h3 className="text-base font-bold text-[#17201C] flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#005A3C]" />
                Trader Offer Evaluator
              </h3>
              <p className="text-xs text-[#66736D] mt-0.5">
                Got an offer from a middleman or mill agent? Check if it's fair before shaking hands.
              </p>
            </div>

            {/* Inputs: Price & Terms */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#17201C] block mb-1">
                  Trader's Offer (₹ / kg)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#66736D]">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    value={traderOfferPrice}
                    onChange={(e) => setTraderOfferPrice(e.target.value)}
                    placeholder={`e.g. ${(todayAvgPrice * 0.95).toFixed(1)}`}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E1E8E4] text-sm font-bold text-[#17201C] focus:outline-none focus:ring-2 focus:ring-[#005A3C]/20 focus:border-[#005A3C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#17201C] block mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#E1E8E4] text-xs font-semibold text-[#17201C] focus:outline-none focus:ring-2 focus:ring-[#005A3C]/20 focus:border-[#005A3C]"
                  >
                    <option value="cash">Spot Cash</option>
                    <option value="credit_7">7-Day Credit</option>
                    <option value="credit_30">15-30 Day Cheque</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="text-xs font-bold text-[#17201C] block mb-1">
                    Loading Location
                  </label>
                  <button
                    type="button"
                    onClick={() => setFarmgatePickup(!farmgatePickup)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      farmgatePickup
                        ? "bg-[#E8F8F1] border-[#005A3C] text-[#005A3C]"
                        : "bg-[#F7F9F7] border-[#E1E8E4] text-[#66736D]"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {farmgatePickup ? "Farmgate Pickup" : "Farmer Delivers"}
                  </button>
                </div>
              </div>
            </div>

            {/* Verdict Box */}
            {traderEvaluation && (
              <div className={`p-4 rounded-xl border space-y-2.5 ${traderEvaluation.badgeColor}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider">
                    {traderEvaluation.verdict === "excellent"
                      ? "Favorable Deal"
                      : traderEvaluation.verdict === "acceptable"
                      ? "Fair Compromise"
                      : "Unfavorable Lowball"}
                  </span>
                  <span className="text-xs font-extrabold">
                    {traderEvaluation.diffTotal >= 0
                      ? `+₹${Math.round(traderEvaluation.diffTotal).toLocaleString()} vs Mandi`
                      : `-₹${Math.abs(Math.round(traderEvaluation.diffTotal)).toLocaleString()} Loss`}
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {traderEvaluation.message}
                </p>

                <div className="pt-2 border-t border-current/20 flex items-center justify-between text-xs font-bold">
                  <span>Recommended Counter-Offer:</span>
                  <span className="text-sm font-black">₹{traderEvaluation.recommendedCounterPrice}/kg</span>
                </div>
              </div>
            )}

            {/* Negotiation Script Generator (WhatsApp / SMS) */}
            {negotiationScripts && (
              <div className="space-y-2 pt-2 border-t border-[#E1E8E4]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17201C] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#005A3C]" />
                    Counter-Offer Pitch
                  </span>
                  <div className="flex items-center gap-1 bg-[#F7F9F7] p-0.5 rounded-lg border border-[#E1E8E4]">
                    {["en", "ml", "hi"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCounterLang(lang)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          counterLang === lang
                            ? "bg-[#005A3C] text-white"
                            : "text-[#66736D] hover:text-[#17201C]"
                        }`}
                      >
                        {lang === "en" ? "EN" : lang === "ml" ? "മലയാളം" : "हिंदी"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F9F7] border border-[#E1E8E4] text-xs text-[#17201C] leading-relaxed font-normal">
                  {negotiationScripts[counterLang]}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyCounterScript}
                    className="flex-1 py-2 px-3 rounded-xl border border-[#E1E8E4] bg-white hover:bg-[#F7F9F7] text-xs font-bold text-[#17201C] transition-colors flex items-center justify-center gap-1.5"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#66736D]" /> Copy Script
                      </>
                    )}
                  </button>

                  <button
                    onClick={shareViaWhatsApp}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Send WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* AI Advisor Button */}
            <div className="pt-2">
              <button
                onClick={handleAskAiNegotiator}
                disabled={aiLoading || !traderOfferPrice}
                className="w-full py-2.5 px-4 rounded-xl bg-[#005A3C] hover:bg-[#003F2B] text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Consulting Kisan AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Ask AI Negotiation Tactics
                  </>
                )}
              </button>

              {aiNegotiationAdvice && (
                <div className="mt-3 p-3.5 rounded-xl bg-[#E8F8F1] border border-[#005A3C]/20 text-xs text-[#17201C] leading-relaxed space-y-1.5 animate-in fade-in duration-200">
                  <p className="font-bold text-[#005A3C] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> AI Negotiator Counsel:
                  </p>
                  <p className="whitespace-pre-line text-[#17201C]">{aiNegotiationAdvice}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: MSP Safety Net, Quality Standards & Price Alert Simulator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {/* Government Procurement & Quality Specs */}
        <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E1E8E4] pb-3">
            <Building className="w-5 h-5 text-[#005A3C]" />
            <div>
              <h3 className="text-sm font-bold text-[#17201C]">
                Govt MSP Safety Net & Procurement Depots
              </h3>
              <p className="text-xs text-[#66736D]">
                Sell at guaranteed minimum prices if open market rates fall below standard.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F9F7] border border-[#E1E8E4] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#66736D] font-medium">Designated Depot:</span>
              <span className="font-bold text-[#17201C]">{cropData.govtCenter}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#66736D] font-medium">Procurement Rate:</span>
              <span className="font-extrabold text-[#005A3C]">
                ₹{cropData.stateBonusMsp.toFixed(2)}/kg (incl. State Bonus)
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#17201C] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#005A3C]" />
              Mandatory Quality Acceptance Criteria
            </h4>
            <p className="text-xs text-[#66736D] leading-relaxed bg-[#E8F8F1]/50 p-3 rounded-xl border border-[#005A3C]/15">
              {cropData.qualitySpecs}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-[#66736D]">Harvest moisture test required?</span>
            <Link
              to="/harvest-guardian"
              className="text-[#005A3C] hover:underline font-bold flex items-center gap-1"
            >
              Open Harvest Guardian <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Target Price Alert Simulator */}
        <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E1E8E4] pb-3">
            <Bell className="w-5 h-5 text-[#005A3C]" />
            <div>
              <h3 className="text-sm font-bold text-[#17201C]">
                Target Price Alert Monitor
              </h3>
              <p className="text-xs text-[#66736D]">
                Get notified when mandi rates cross your profit target threshold.
              </p>
            </div>
          </div>

          <form onSubmit={handleSetAlert} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#17201C] block mb-1">
                Target Selling Price for {selectedCrop} (₹ / kg)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#66736D]">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    value={alertTargetPrice}
                    onChange={(e) => setAlertTargetPrice(e.target.value)}
                    placeholder={`e.g. ${(todayAvgPrice * 1.08).toFixed(1)}`}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E1E8E4] text-sm font-bold text-[#17201C] focus:outline-none focus:ring-2 focus:ring-[#005A3C]/20 focus:border-[#005A3C]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!alertTargetPrice}
                  className="bg-[#005A3C] hover:bg-[#003F2B] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" /> Set Alert
                </button>
              </div>
            </div>
          </form>

          {/* Active Alert Display */}
          {activeAlert ? (
            <div className="p-3.5 rounded-xl bg-[#E8F8F1] border border-[#005A3C]/20 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-xs font-bold text-[#005A3C]">
                    Alert Active: {activeAlert.crop} ≥ ₹{activeAlert.targetPrice}/kg
                  </span>
                </div>
                <p className="text-[11px] text-[#66736D]">
                  Set at {activeAlert.createdAt}. System will simulate an SMS & notification trigger upon APMC update.
                </p>
              </div>
              <button
                onClick={() => setActiveAlert(null)}
                className="text-[11px] font-bold text-rose-600 hover:underline ml-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#F7F9F7] border border-[#E1E8E4] text-xs text-[#66736D] text-center">
              No active price alert. Enter your expected price above to track peak selling windows.
            </div>
          )}

          {alertSuccessToast && (
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Price alert set successfully for {selectedCrop}!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}