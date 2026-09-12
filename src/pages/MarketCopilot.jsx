import React, { useState, useMemo } from "react";
import {
  LineChart,
  MapPin,
  Sparkles,
  Truck,
  Scale,
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  Building,
  Share2,
  Loader2,
  Bell,
  Calculator,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFarm } from "@/lib/farmContext";
import { t } from "@/lib/translations";
import SEO from "@/components/SEO";
import MetricCard from "@/components/ui/MetricCard";
import RecommendationBanner from "@/components/ui/RecommendationBanner";
import ReactMarkdown from "react-markdown";
import { cleanAiText } from "@/lib/cleanAiText";

// Multi-crop market profiles with APMC markets, historical & forecast rates, and MSP data
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
        name: "Ernakulam Wholesale Market",
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
        name: "Thrissur Central Market",
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
        name: "Palakkad / Pollachi Border Market",
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
        name: "Kozhikode Copra Apex Market",
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
  const { farm, language } = useFarm();
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

  const langToCounterCode = (l) => {
    if (l === "Malayalam" || l === "ml") return "ml";
    if (l === "Hindi" || l === "hi") return "hi";
    if (l === "Tamil" || l === "ta") return "ta";
    return "en";
  };
  const [counterLang, setCounterLang] = useState(() => langToCounterCode(language));

  React.useEffect(() => {
    setCounterLang(langToCounterCode(language));
  }, [language]);

  const [copiedScript, setCopiedScript] = useState(false);

  // State: Target Price Alert
  const [alertTargetPrice, setAlertTargetPrice] = useState("");
  const [activeAlert, setActiveAlert] = useState(null);
  const [alertSuccessToast, setAlertSuccessToast] = useState(false);

  // State: Chart hover tooltip
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [activeTab, setActiveTab] = useState("forecast"); // "forecast" | "freight" | "trader"

  // Vehicle data
  const vehicleObj = VEHICLES.find((v) => v.id === selectedVehicle) || VEHICLES[1];

  // Calculate Net Profit Realization for each Market
  const mandiRealizations = useMemo(() => {
    const qtyKg = Number(saleQuantityQtl) * 100;
    if (qtyKg <= 0) return [];

    return cropData.mandis
      .map((mandi) => {
        const grossRevenue = qtyKg * mandi.avgPrice;
        // Two-way transport: round trip distance
        const transportCost = mandi.distanceKm * 2 * vehicleObj.ratePerKm + vehicleObj.loadingBase;
        // Market cess and weighing charge
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
      message = "Highly Lucrative: Trader's offer beats your net market return without freight hassle!";
      badgeColor = "bg-emerald-100 text-[#005A3C] border-emerald-300";
    } else if (diffPerKg >= -0.75 && farmgatePickup) {
      verdict = "acceptable";
      message = "Convenient & Reasonable: Slight discount is balanced by zero transit risk & immediate loading.";
      badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
    } else {
      verdict = "lowball";
      message = "Lowball Offer: You would lose significant money compared to selling directly at the market!";
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
    const mandiName = bestMandi?.name || "Local Market";
    const mandiRate = bestMandi?.avgPrice || todayAvgPrice;

    return {
      en: `Dear Buyer, thank you for your offer of ₹${offer}/kg for my ${crop}. Today's wholesale rate at ${mandiName} is ₹${mandiRate}/kg. Taking into account grade quality and current arrivals, my counter-offer is ₹${counter}/kg for immediate loading. Please confirm if we can proceed.`,
      ml: `നമസ്കാരം, എന്റെ ${crop} വിളയ്ക്ക് ₹${offer}/kg നിരക്കിൽ നിങ്ങൾ തന്ന ഓഫറിന് നന്ദി. ഇന്നത്തെ ${mandiName} വിപണി നിരക്ക് ₹${mandiRate}/kg ആണ്. ഗുണമേന്മയും ഇന്നത്തെ വിപണി ആവശ്യകതയും പരിഗണിച്ച്, ₹${counter}/kg നിരക്കിൽ നൽകാൻ തയ്യാറാണ്. അറിയിക്കുമല്ലോ.`,
      hi: `नमस्ते, मेरे ${crop} के लिए ₹${offer}/किग्रा के प्रस्ताव के लिए धन्यवाद। आज ${mandiName} में थोक भाव ₹${mandiRate}/किग्रा है। फसल की उच्च गुणवत्ता को देखते हुए, मेरा अंतिम प्रति-प्रस्ताव ₹${counter}/किग्रा है। कृपया पुष्टि करें।`,
      ta: `வணக்கம், எனது ${crop} விளைச்சலுக்கு ₹${offer}/கிலோ வீதம் நீங்கள் அளித்த விலைக்கு நன்றி. இன்றைய ${mandiName} சந்தை மொத்த விலை ₹${mandiRate}/கிலோ. பயிரின் தரம் மற்றும் குறைவான வரத்தைக் கருத்தில் கொண்டு, எனது எதிர் விலை ₹${counter}/கிலோ. ஏற்றுமதி செய்ய உறுதிப்படுத்தவும்.`,
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
      const prompt = `A trader offered ₹${traderOfferPrice}/kg for ${saleQuantityQtl} quintals of ${cropData.cropName}. Payment terms: ${paymentTerms}. Today's Market average is ₹${todayAvgPrice}/kg. Best market net realization is ₹${bestMandi?.netPerKg.toFixed(2)}/kg. Should I accept, counter, or reject? Provide 3 sharp bargaining tips for an Indian farmer.`;
      const langParam =
        counterLang === "ml"
          ? "Malayalam"
          : counterLang === "hi"
          ? "Hindi"
          : counterLang === "ta"
          ? "Tamil"
          : "English";
      const res = await base44.functions.invoke("askKisanMitra", {
        question: prompt,
        language: langParam,
      });
      const rawAdvice = res.data?.answer || res.data;
      setAiNegotiationAdvice(cleanAiText(rawAdvice));
    } catch {
      setAiNegotiationAdvice(
        `Strategic Negotiation Advice:\n• Current Market benchmark is ₹${todayAvgPrice}/kg. The buyer's offer of ₹${traderOfferPrice}/kg is ${traderEvaluation.diffPerKg >= 0 ? "at par with market" : "underpricing your batch by ₹" + Math.abs(traderEvaluation.diffPerKg).toFixed(2) + "/kg"}.\n• Counter firmly at ₹${traderEvaluation.recommendedCounterPrice}/kg citing high grain density and low regional market arrivals.\n• If payment is deferred (${paymentTerms}), strictly demand 25% cash advance before truck weighing.`
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
        title="Market Copilot - Market Prices, Freight Calculator & Trader Negotiation"
        description="Real-time APMC wholesale market rates, net profit freight calculator, 15-day price trajectory forecast, trader offer evaluator and MSP safety net."
        canonicalPath="/market-copilot"
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E8E4] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17211D] flex items-center gap-3">
            <LineChart className="w-7 h-7 text-[#063F2E]" />
            Market Copilot
          </h1>
          <p className="text-sm text-[#65736C] mt-1">
            Real-time wholesale market prices, net freight realization, 15-day price trajectory, and middleman counter-negotiation.
          </p>
        </div>

        {/* Commodity / Crop Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 bg-[#F6F8F5] p-1.5 rounded-2xl border border-[#E1E8E4]">
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-[#063F2E] text-white shadow-xs"
                    : "text-[#65736C] hover:text-[#17211D] hover:bg-white"
                }`}
              >
                {cropKey}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top 3 Bento Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Regional APMC Benchmark */}
        <MetricCard
          label="Market Benchmark"
          value={`₹${todayAvgPrice}`}
          unit="/ kg"
          trend="+2.4% this week"
          trendType="positive"
          subtext={`Average across ${cropData.mandis.length} regional markets`}
        />

        {/* 2. Peak Market Opportunity */}
        <MetricCard
          label="Peak Market Rate"
          value={`₹${bestMandi?.avgPrice.toFixed(2)}`}
          unit="/ kg"
          trend={`${bestMandi?.trendPct > 0 ? "+" : ""}${bestMandi?.trendPct}% trend`}
          trendType={bestMandi?.trendPct >= 0 ? "positive" : "negative"}
          subtext={`${bestMandi?.name} (${bestMandi?.distanceKm} km)`}
          icon={MapPin}
        />

        {/* 3. Net In-Pocket Realization */}
        <MetricCard
          label="Est. Net In-Pocket Return"
          value={`₹${Math.round(bestMandi?.netProfit || 0).toLocaleString()}`}
          unit={`/ ${saleQuantityQtl * 100} kg`}
          trend={`Effective ₹${bestMandi?.netPerKg.toFixed(2)}/kg`}
          trendType="neutral"
          subtext={`After freight (-₹${Math.round(bestMandi?.transportCost || 0)}) & cess`}
          icon={Truck}
        />
      </div>
      {/* ── Segmented Navigation Tabs ── */}
      <div className="flex items-center gap-1 bg-[#F6F8F5] p-1 rounded-xl border border-[#E1E8E4] text-xs max-w-xl">
        <button
          type="button"
          onClick={() => setActiveTab("forecast")}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
            activeTab === "forecast"
              ? "bg-white text-[#063F2E] shadow-xs"
              : "text-[#65736C] hover:text-[#17211D]"
          }`}
        >
          Prices &amp; Forecast
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("freight")}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
            activeTab === "freight"
              ? "bg-white text-[#063F2E] shadow-xs"
              : "text-[#65736C] hover:text-[#17211D]"
          }`}
        >
          Net Freight Calculator
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("trader")}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
            activeTab === "trader"
              ? "bg-white text-[#063F2E] shadow-xs"
              : "text-[#65736C] hover:text-[#17211D]"
          }`}
        >
          Trader Offer Evaluator
        </button>
      </div>

      {/* ── TAB 1: PRICES & FORECAST ── */}
      {activeTab === "forecast" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Recommendation Banner */}
          <RecommendationBanner
            headline={`Market Strategy: ${cropData.cropName.split("(")[0].trim()}`}
            whyItMatters={cropData.peakRecommendation}
            recommendedAction={`Target ₹${bestMandi?.avgPrice.toFixed(2)}/kg or higher at ${bestMandi?.name}. Maintain moisture under standard limits before dispatch.`}
            ctaText="Open Transport Calculator"
            onCtaClick={() => setActiveTab("freight")}
            variant="primary"
          />

          {/* 15-Day Interactive SVG Price Trajectory Chart */}
          <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E1E8E4] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#17211D]">
                    15-Day Price Trajectory &amp; Forecast
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#DDF5EA] text-[#063F2E]">
                    {selectedCrop}
                  </span>
                </div>
                <p className="text-xs text-[#65736C] mt-0.5">
                  Past 7-day arrivals vs next 7-day predictive window. Hover nodes for details.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-[#17211D] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#063F2E]"></span> Actual Rates
                </span>
                <span className="flex items-center gap-1.5 text-[#087F5B] font-semibold">
                  <span className="w-2.5 h-0.5 border-t-2 border-dashed border-[#087F5B]"></span> Projected
                </span>
                <span className="flex items-center gap-1.5 text-[#92540C] font-semibold">
                  <span className="w-2.5 h-0.5 border-t-2 border-dashed border-[#E99B16]"></span> MSP Floor
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
                    <stop offset="0%" stopColor="#087F5B" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="#087F5B" stopOpacity="0.01" />
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
                        stroke="#E1E8E4"
                        strokeDasharray="4,4"
                      />
                      <text
                        x={chartPadding.left - 8}
                        y={y + 3}
                        textAnchor="end"
                        fontSize="10"
                        fill="#65736C"
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
                  stroke="#E99B16"
                  strokeWidth="1.8"
                  strokeDasharray="6,4"
                />
                <text
                  x={chartWidth - chartPadding.right - 5}
                  y={mspY - 6}
                  textAnchor="end"
                  fontSize="10"
                  fill="#92540C"
                  fontWeight="bold"
                >
                  Govt MSP Floor: ₹{cropData.msp.toFixed(2)}/kg
                </text>

                {/* Shaded Area Under Curve */}
                <path d={areaD} fill="url(#copilotGradient)" />

                {/* Main Line */}
                <path d={pathD} fill="none" stroke="#087F5B" strokeWidth="3" strokeLinecap="round" />

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
                          fill="#063F2E"
                          fillOpacity="0.2"
                          className="animate-pulse"
                        />
                      )}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? "6" : isToday ? "5" : "3.5"}
                        fill={isToday ? "#063F2E" : isForecast ? "#16A36F" : "#FFFFFF"}
                        stroke="#063F2E"
                        strokeWidth={isToday ? "2.5" : "2"}
                        className="transition-all duration-150"
                      />
                      <text
                        x={pt.x}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        fontSize="9.5"
                        fill={isToday ? "#063F2E" : "#65736C"}
                        fontWeight={isToday ? "bold" : "500"}
                      >
                        {pt.day}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip */}
              {hoveredPoint && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#17211D] text-white px-3.5 py-2 rounded-xl text-xs shadow-lg pointer-events-none flex items-center gap-3 border border-white/10">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                      {hoveredPoint.day} ({hoveredPoint.type})
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
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

          {/* MSP Safety Net & Price Alert Simulator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Government Procurement */}
            <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E1E8E4] pb-3">
                <Building className="w-4 h-4 text-[#063F2E]" />
                <h3 className="text-sm font-bold text-[#17211D]">
                  Govt MSP Safety Net
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#65736C]">Depot:</span>
                  <span className="font-bold text-[#17211D]">{cropData.govtCenter}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#65736C]">Procurement Rate:</span>
                  <span className="font-bold text-[#063F2E]">
                    ₹{cropData.stateBonusMsp.toFixed(2)}/kg
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#65736C] bg-[#DDF5EA]/50 p-2.5 rounded-xl border border-[#063F2E]/15">
                {cropData.qualitySpecs}
              </p>
            </div>

            {/* Target Price Alert Monitor */}
            <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E1E8E4] pb-3">
                <Bell className="w-4 h-4 text-[#063F2E]" />
                <h3 className="text-sm font-bold text-[#17211D]">
                  Target Price Alert
                </h3>
              </div>

              <form onSubmit={handleSetAlert} className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs font-bold text-[#65736C]">₹</span>
                    <input
                      type="number"
                      step="0.5"
                      value={alertTargetPrice}
                      onChange={(e) => setAlertTargetPrice(e.target.value)}
                      placeholder={`Target rate (e.g. ${(parseFloat(todayAvgPrice) * 1.08).toFixed(1)})`}
                      className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-[#E1E8E4] text-xs font-bold text-[#17211D] focus:outline-none focus:border-[#063F2E] bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!alertTargetPrice}
                    className="bg-[#063F2E] hover:bg-[#032C21] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" /> Set
                  </button>
                </div>
              </form>

              {activeAlert ? (
                <div className="p-3 rounded-xl bg-[#DDF5EA] border border-[#063F2E]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="font-bold text-[#063F2E]">
                      Alert: {activeAlert.crop} ≥ ₹{activeAlert.targetPrice}/kg
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveAlert(null)}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#65736C] text-center pt-1">
                  Enter target price to track peak arrival windows.
                </p>
              )}

              {alertSuccessToast && (
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Alert active for {selectedCrop}!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: NET FREIGHT CALCULATOR ── */}
      {activeTab === "freight" && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-xs p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E1E8E4] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#17211D] flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#063F2E]" />
                  Net Market Freight &amp; Profit Realization
                </h3>
                <p className="text-xs text-[#65736C] mt-0.5">
                  Compare true take-home earnings across regional mandis after transport and market cess.
                </p>
              </div>
              <span className="text-xs font-bold text-[#063F2E] bg-[#DDF5EA] px-3 py-1 rounded-full self-start sm:self-auto">
                Ranked by Real Net Return
              </span>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F6F8F5] p-4 rounded-xl border border-[#E1E8E4]">
              <div>
                <label className="text-xs font-bold text-[#17211D] block mb-1.5 flex items-center justify-between">
                  <span>Batch Quantity</span>
                  <span className="text-[#063F2E] font-semibold">{saleQuantityQtl * 100} kg</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={saleQuantityQtl}
                    onChange={(e) => setSaleQuantityQtl(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full pl-3 pr-16 py-2 rounded-xl border border-[#E1E8E4] text-xs font-bold text-[#17211D] focus:outline-none focus:border-[#063F2E] bg-white"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-[#65736C]">
                    Quintals
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#17211D] block mb-1.5 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#063F2E]" /> Transport Vehicle
                </label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E1E8E4] text-xs font-bold text-[#17211D] focus:outline-none focus:border-[#063F2E] bg-white"
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
                        ? "bg-[#DDF5EA]/50 border-[#063F2E] shadow-xs ring-1 ring-[#063F2E]/20"
                        : "bg-white border-[#E1E8E4] hover:border-[#087F5B]/30"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#17211D] flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-[#063F2E]" />
                            {mandi.name}
                          </span>
                          {isTopNet && (
                            <span className="bg-[#063F2E] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                              Top Choice
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#65736C]">
                          <span>Distance: <strong className="text-[#17211D]">{mandi.distanceKm} km</strong></span>
                          <span>•</span>
                          <span>Market Rate: <strong className="text-[#17211D]">₹{mandi.avgPrice}/kg</strong></span>
                          <span>•</span>
                          <span>Arrivals: <strong className="text-[#17211D]">{mandi.arrivalTons} T/day</strong></span>
                        </div>
                      </div>

                      <div className="text-right sm:min-w-[140px]">
                        <span className="text-[11px] text-[#65736C] block">In-Pocket Return</span>
                        <span className={`text-base font-bold ${isTopNet ? "text-[#063F2E]" : "text-[#17211D]"}`}>
                          ₹{Math.round(mandi.netProfit).toLocaleString()}
                        </span>
                        <span className="text-[11px] font-semibold text-[#65736C] block">
                          (₹{mandi.netPerKg.toFixed(2)}/kg)
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#E1E8E4]/60 flex flex-wrap items-center justify-between text-[11px] text-[#65736C]">
                      <span>Gross: ₹{Math.round(mandi.grossRevenue).toLocaleString()}</span>
                      <span>Freight: -₹{Math.round(mandi.transportCost).toLocaleString()}</span>
                      <span>Cess: -₹{Math.round(mandi.mandiCess).toLocaleString()}</span>
                      {isTopNet ? (
                        <span className="font-bold text-[#063F2E]">
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
      )}

      {/* ── TAB 3: TRADER OFFER EVALUATOR ── */}
      {activeTab === "trader" && (
        <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-xs p-5 sm:p-6 space-y-4">
            <div className="border-b border-[#E1E8E4] pb-3">
              <h3 className="text-base font-bold text-[#17211D] flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#063F2E]" />
                Trader Offer Evaluator
              </h3>
              <p className="text-xs text-[#65736C] mt-0.5">
                Evaluate middleman or mill offers against prevailing APMC realizations before committing.
              </p>
            </div>

            {/* Inputs: Price & Terms */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#17211D] block mb-1">
                  Trader's Offer Price (₹ / kg)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#65736C]">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    value={traderOfferPrice}
                    onChange={(e) => setTraderOfferPrice(e.target.value)}
                    placeholder={`e.g. ${(parseFloat(todayAvgPrice) * 0.95).toFixed(1)}`}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E1E8E4] text-sm font-bold text-[#17211D] focus:outline-none focus:border-[#063F2E] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#17211D] block mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#E1E8E4] text-xs font-semibold text-[#17211D] focus:outline-none focus:border-[#063F2E] bg-white"
                  >
                    <option value="cash">Spot Cash</option>
                    <option value="credit_7">7-Day Credit</option>
                    <option value="credit_30">15-30 Day Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#17211D] block mb-1">
                    Loading Mode
                  </label>
                  <button
                    type="button"
                    onClick={() => setFarmgatePickup(!farmgatePickup)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      farmgatePickup
                        ? "bg-[#DDF5EA] border-[#063F2E] text-[#063F2E]"
                        : "bg-[#F6F8F5] border-[#E1E8E4] text-[#65736C]"
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
              <div className={`p-4 rounded-xl border space-y-2 ${traderEvaluation.badgeColor}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {traderEvaluation.verdict === "excellent"
                      ? "Favorable Deal"
                      : traderEvaluation.verdict === "acceptable"
                      ? "Fair Compromise"
                      : "Unfavorable Lowball"}
                  </span>
                  <span className="text-xs font-bold">
                    {traderEvaluation.diffTotal >= 0
                      ? `+₹${Math.round(traderEvaluation.diffTotal).toLocaleString()} vs Market`
                      : `-₹${Math.abs(Math.round(traderEvaluation.diffTotal)).toLocaleString()} Loss`}
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {traderEvaluation.message}
                </p>

                <div className="pt-2 border-t border-current/20 flex items-center justify-between text-xs font-bold">
                  <span>Suggested Counter:</span>
                  <span className="text-sm font-extrabold">₹{traderEvaluation.recommendedCounterPrice}/kg</span>
                </div>
              </div>
            )}

            {/* Negotiation Script Generator */}
            {negotiationScripts && (
              <div className="space-y-2.5 pt-2 border-t border-[#E1E8E4]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17211D] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#063F2E]" />
                    {t(language, "counterOfferPitch")}
                  </span>
                  <div className="flex items-center gap-1 bg-[#F6F8F5] p-0.5 rounded-lg border border-[#E1E8E4]">
                    {[
                      { code: "en", label: "EN" },
                      { code: "ml", label: "മലയാളം" },
                      { code: "hi", label: "हिंदी" },
                      { code: "ta", label: "தமிழ்" },
                    ].map((item) => (
                      <button
                        key={item.code}
                        onClick={() => setCounterLang(item.code)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                          counterLang === item.code
                            ? "bg-[#063F2E] text-white"
                            : "text-[#65736C] hover:text-[#17211D]"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F6F8F5] border border-[#E1E8E4] text-xs text-[#17211D] leading-relaxed">
                  {negotiationScripts[counterLang]}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyCounterScript}
                    className="flex-1 py-2 px-3 rounded-xl border border-[#E1E8E4] bg-white hover:bg-[#F6F8F5] text-xs font-bold text-[#17211D] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> {t(language, "copied")}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#65736C]" /> {t(language, "copyPitch")}
                      </>
                    )}
                  </button>

                  <button
                    onClick={shareViaWhatsApp}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#16A36F] hover:bg-[#087F5B] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" /> {t(language, "sendWhatsApp")}
                  </button>
                </div>
              </div>
            )}

            {/* AI Advisor Button */}
            <div className="pt-2">
              <button
                onClick={handleAskAiNegotiator}
                disabled={aiLoading || !traderOfferPrice}
                className="w-full py-2 px-4 rounded-xl bg-[#063F2E] hover:bg-[#032C21] text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Consulting Kisan AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> {t(language, "aiBargainingAdvice")}
                  </>
                )}
              </button>

              {aiNegotiationAdvice && (
                <div className="mt-3 p-3.5 rounded-xl bg-[#DDF5EA] border border-[#063F2E]/20 text-xs text-[#17211D] leading-relaxed space-y-2 animate-in fade-in">
                  <p className="font-bold text-[#063F2E] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" /> AI Negotiator Counsel:
                  </p>
                  <div className="text-xs text-[#17211D] leading-relaxed">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1.5 last:mb-0 text-[#17211D] leading-relaxed">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-[#063F2E]">{children}</strong>,
                        em: ({ children }) => <em className="italic text-[#063F2E] font-medium">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1">{children}</ol>,
                        li: ({ children }) => <li className="text-[#17211D]">{children}</li>,
                      }}
                    >
                      {cleanAiText(aiNegotiationAdvice)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}