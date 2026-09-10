const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { simulateGrowth } = require('../services/matlabBioGrowthEngine');

const LANG_INSTRUCTIONS = {
  English: 'Respond in clear, simple English.',
  Malayalam: 'മലയാളത്തിൽ ലളിതമായി മറുപടി നൽകുക.',
  Hindi: 'सरल हिंदी में उत्तर दें।',
  Tamil: 'எளிய தமிழில் பதிலளிக்கவும்.',
};

const LANG_INSTRUCTIONS_CROP = {
  English: 'Write all fields in clear English.',
  Malayalam: 'എല്ലാ ഫീൽഡുകളും മലയാളത്തിൽ എഴുതുക.',
  Hindi: 'सभी फ़ील्ड हिंदी में लिखें।',
  Tamil: 'அனைத்து புலங்களையும் தமிழில் எழுதவும்.',
};

// ── Image loading helper ───────────────────────────────────────────────────────
async function loadImageAsBase64(imageUrl) {
  const path = require('path');
  const fs = require('fs');

  if (!imageUrl || typeof imageUrl !== 'string') return null;

  if (imageUrl.startsWith('data:image/')) {
    const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], data: match[2] };
    }
  }

  if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('uploads/')) {
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    const filePath = path.join(__dirname, '..', cleanPath);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath).toString('base64');
      const ext = path.extname(filePath).toLowerCase();
      let mimeType = 'image/jpeg';
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.webp') mimeType = 'image/webp';
      return { data, mimeType };
    }
  } else if (imageUrl.startsWith('http')) {
    try {
      const imgRes = await fetch(imageUrl);
      const ct = imgRes.headers.get('content-type') || 'image/jpeg';
      const mimeType = ct.split(';')[0].trim();
      const buf = await imgRes.arrayBuffer();
      const data = Buffer.from(buf).toString('base64');
      return { data, mimeType };
    } catch (e) {
      console.warn('[functions] Could not fetch image:', e.message);
    }
  }
  return null;
}

// ── Extract first JSON object from a string (handles markdown fences) ──────────
function extractJson(text) {
  // Strip markdown code fences
  let cleaned = text.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/m, '').trim();

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  // Try to find first {...} block
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch (_) {}
  }

  throw new Error('Could not parse JSON from model response: ' + text.slice(0, 200));
}

// ── Gemini helper & Client Cache ─────────────────────────────────────────────
const { GoogleGenerativeAI } = require('@google/generative-ai');

let cachedGenAI = null;
let cachedApiKey = null;

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  if (!cachedGenAI || cachedApiKey !== apiKey) {
    cachedGenAI = new GoogleGenerativeAI(apiKey);
    cachedApiKey = apiKey;
  }
  return cachedGenAI;
}

async function callGemini({ prompt, imageBase64, imageMimeType, jsonSchema, maxTokens = 600, temperature = 0.7 }) {
  const genAI = getGenAI();
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  // Pool of high-quota, verified models for seamless automatic failover
  const fallbackPool = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'];
  const modelsToTry = [primaryModel, ...fallbackPool.filter(m => m !== primaryModel)];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: temperature,
        },
      });

      // Build prompt text — embed JSON schema instructions inline
      let promptText = prompt;
      if (jsonSchema) {
        promptText += '\n\nRespond ONLY with a valid JSON object exactly matching this schema (no markdown, no extra text):\n' +
          JSON.stringify(jsonSchema, null, 2);
      }

      const parts = [{ text: promptText }];

      if (imageBase64) {
        parts.push({ inlineData: { mimeType: imageMimeType || 'image/jpeg', data: imageBase64 } });
      }

      console.log(`[functions] Calling Gemini model: ${modelName}, parts: ${parts.length}, maxTokens: ${maxTokens}`);

      const result = await model.generateContent(parts);
      const text = result.response.text().trim();

      console.log(`[functions] Gemini response received from ${modelName}, length:`, text.length);

      if (jsonSchema) {
        return extractJson(text);
      }
      return text;
    } catch (err) {
      lastError = err;
      const errMsg = err.message || '';
      const isTransientOrQuota = (
        errMsg.includes('429') ||
        errMsg.includes('Quota exceeded') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('503') ||
        errMsg.includes('Service Unavailable') ||
        errMsg.includes('high demand') ||
        errMsg.includes('500') ||
        errMsg.includes('404')
      );

      if (isTransientOrQuota) {
        console.warn(`[functions] Model ${modelName} encountered error: ${errMsg.slice(0, 100)}. Failing over to next model in pool...`);
        continue;
      }
      // Re-throw fatal client errors (e.g. invalid syntax)
      throw err;
    }
  }

  throw lastError;
}

// All function routes require auth
router.use(requireAuth);

// ── POST /api/functions/analyzeCrop ──────────────────────────────────────────
router.post('/analyzeCrop', async (req, res) => {
  try {
    const { image_url, crop = 'Tomato', language = 'English' } = req.body;
    if (!image_url) return res.status(400).json({ error: 'image_url is required' });

    // Load image
    const imageData = await loadImageAsBase64(image_url);
    if (!imageData) {
      return res.status(400).json({ error: 'Could not load image from URL: ' + image_url });
    }

    const langInstr = LANG_INSTRUCTIONS_CROP[language] || LANG_INSTRUCTIONS_CROP.English;
    const prompt = `You are Kisan Mitra's Crop Doctor, an expert plant pathologist for Indian farmers. Analyze the uploaded leaf/crop image (crop: ${crop}). Identify the most likely disease or condition, or state if the plant looks healthy. ${langInstr} Be realistic and practical. Do not include meta-notes, disclaimers, or parenthetical commentary like '(Note: Image shows ...)' in the disease name. Only return the pure disease name (e.g. 'Late Blight' or 'Healthy Plant'). If the image is unclear or not a plant, say so in the disease field.`;

    const jsonSchema = {
      type: 'object',
      properties: {
        disease: { type: 'string', description: 'Likely disease or condition name' },
        confidence: { type: 'number', description: 'Confidence percentage 0-100' },
        severity: { type: 'string', enum: ['Low', 'Moderate', 'High', 'Severe', 'Healthy'] },
        symptoms: { type: 'string' },
        recommended_actions: { type: 'string' },
        prevention: { type: 'string' },
        seek_expert: { type: 'string', description: 'When to seek expert help' },
      },
      required: ['disease', 'confidence', 'severity', 'symptoms', 'recommended_actions', 'prevention'],
    };

    const diagnosis = await callGemini({
      prompt,
      imageBase64: imageData.data,
      imageMimeType: imageData.mimeType,
      jsonSchema,
      maxTokens: 2048,
      temperature: 0.2,
    });

    if (diagnosis && typeof diagnosis.disease === 'string') {
      diagnosis.disease = diagnosis.disease
        .replace(/\s*\([^)]*note:[^)]*\)/gi, '')
        .replace(/\s*note:.*$/gi, '')
        .trim();
    }

    console.log('[functions/analyzeCrop] diagnosis:', JSON.stringify(diagnosis).slice(0, 200));
    res.json({ diagnosis });
  } catch (err) {
    console.error('[functions/analyzeCrop] ERROR:', err.message);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// ── POST /api/functions/askKisanMitra ─────────────────────────────────────────
router.post('/askKisanMitra', async (req, res) => {
  try {
    const {
      question,
      image_url,
      language = 'English',
      farmerContext = {},
      history = [],
    } = req.body;

    if ((!question || !question.trim()) && !image_url) {
      return res.status(400).json({ error: 'question or image_url is required' });
    }

    const isFirstTurn = !history || history.length === 0;
    const greetingRule = isFirstTurn
      ? 'Start with a warm traditional greeting like "Namaste!" only once at the beginning of this new conversation.'
      : 'CRITICAL RULE: This is an ongoing conversation. Do NOT say "Namaste!", "Hello!", or any greetings. Answer directly without any introductory greeting.';

    const ctxParts = [];
    if (farmerContext.crop) ctxParts.push(`Primary crop: ${farmerContext.crop}`);
    if (farmerContext.location) ctxParts.push(`Location: ${farmerContext.location}`);
    if (farmerContext.farmSize) ctxParts.push(`Farm size: ${farmerContext.farmSize} ${farmerContext.farmSizeUnit || 'Acres'}`);
    const contextStr = ctxParts.length ? `Farmer context: ${ctxParts.join(', ')}.` : '';

    const langInstr = LANG_INSTRUCTIONS[language] || LANG_INSTRUCTIONS.English;
    const systemPrompt = `You are Kisan Mitra, a friendly, knowledgeable AI farming assistant for Indian farmers. Give practical, actionable advice on crops, diseases, pests, harvest timing, market prices, and farming practices. Keep answers concise (3-6 sentences) unless the farmer asks for detail. ${greetingRule} ${langInstr} ${contextStr}`;

    let imageData = null;
    if (image_url) {
      imageData = await loadImageAsBase64(image_url);
      if (!imageData) {
        console.warn('[functions/askKisanMitra] Could not process image_url:', image_url);
      }
    }

    const historyText = history
      .slice(-6)
      .map(m => `${m.role === 'assistant' ? 'assistant' : 'user'}: ${m.content}`)
      .join('\n\n');

    const promptQuestion = question && question.trim()
      ? question.slice(0, 2000)
      : (imageData ? 'Please inspect this attached crop/leaf photo and provide your farming diagnosis and recommendations.' : '');

    const fullPrompt = [systemPrompt, historyText, `user: ${promptQuestion}`]
      .filter(Boolean)
      .join('\n\n');

    const answer = await callGemini({
      prompt: fullPrompt,
      imageBase64: imageData ? imageData.data : undefined,
      imageMimeType: imageData ? imageData.mimeType : undefined,
      maxTokens: 1500,
      temperature: 0.7,
    });
    res.json({ answer });
  } catch (err) {
    console.error('[functions/askKisanMitra] ERROR:', err.message);
    res.status(500).json({ error: err.message || 'AI service unavailable' });
  }
});

// ── POST /api/functions/simulateHarvestGuardian ──────────────────────────────
router.post('/simulateHarvestGuardian', async (req, res) => {
  try {
    const {
      crop = 'Rice',
      sowingDate,
      weatherForecast = [],
      farmSize = 1,
      location = 'Field',
      customMoisture = null,
      language = 'English',
    } = req.body;

    // 1. Calculate average weather metrics from forecast
    let avgTemp = 29.5;
    let avgHumidity = 62.0;
    if (Array.isArray(weatherForecast) && weatherForecast.length > 0) {
      const temps = weatherForecast
        .map(f => parseFloat(String(f.temp).replace(/[^\d.-]/g, '')))
        .filter(n => !isNaN(n));
      const hums = weatherForecast
        .map(f => parseFloat(String(f.humidity).replace(/[^\d.-]/g, '')))
        .filter(n => !isNaN(n));

      if (temps.length) avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      if (hums.length) avgHumidity = hums.reduce((a, b) => a + b, 0) / hums.length;
    }

    // 2. Execute MATLAB Bio-Growth ODE Simulation
    const matlabSimulation = simulateGrowth({
      crop,
      sowingDate,
      avgTempC: avgTemp,
      avgRelHumidity: avgHumidity,
      customMoisture,
    });

    // 3. Build synthesis prompt for Google Gemini 2.5
    const forecastSummary = Array.isArray(weatherForecast) && weatherForecast.length > 0
      ? weatherForecast.map(f => `${f.day}: Temp ${f.temp}, Rain ${f.rainPct}, Humidity ${f.humidity} (${f.condition})`).join('; ')
      : 'Days 1-4 clear dry (5-20% rain risk), Day 6 showers (70% rain risk)';

    const langInstr = LANG_INSTRUCTIONS[language] || LANG_INSTRUCTIONS.English;

    const geminiPrompt = `You are Kisan Mitra's Agronomic Intelligence Engine. 
You are synthesizing a quantitative MATLAB bio-growth differential equation simulation with real-time 7-day meteorological forecast data for an Indian farmer.

SIMULATION TELEMETRY (MATLAB ODE Engine):
- Crop: ${matlabSimulation.crop}
- Sowing Date: ${sowingDate || 'Not specified'} (${matlabSimulation.daysSinceSowing} days elapsed)
- Thermal GDD: ${matlabSimulation.accumulatedGDD} / ${matlabSimulation.targetGDD} GDD (${matlabSimulation.maturityIndexPct}% physiological maturity)
- Current Simulated Grain Moisture: ${matlabSimulation.currentMoisturePct}%
- Equilibrium Moisture Content (M_eq): ${matlabSimulation.equilibriumMoisturePct}%
- Target Safe Harvest Moisture (M_safe): ${matlabSimulation.targetSafeMoisturePct}%
- Spoilage Threshold: ${matlabSimulation.storageCriticalPct}%
- Drying Rate k: ${matlabSimulation.dryingRateK} day^-1
- MATLAB Recommended Harvest Window: Day +${matlabSimulation.optimalDayOffset} (${matlabSimulation.optimalDateStr})
- Farm Size: ${farmSize} Acres, Location: ${location}

METEOROLOGICAL FORECAST (Next 7 Days):
${forecastSummary}

LANGUAGE REQUIREMENT:
${langInstr}

TASK:
Synthesize the MATLAB quantitative calculation with the impending rain risks. Provide actionable operational logistics.
Respond in JSON strictly following this schema:
{
  "summaryHeadline": "One clear, decisive headline summarizing the harvest decision",
  "rainGuardedPlan": "How to reconcile MATLAB's optimal window with the impending rain forecast (e.g. harvesting before Day 6 showers)",
  "storageRiskAnalysis": "Detailed analysis of mold, aflatoxin, or moisture-rebound risks based on simulated moisture vs safe moisture",
  "machineryLogistics": "Concrete timeline for booking combine harvesters, tarpaulins, and sun-drying yard preparations",
  "actionChecklist": ["Action 1", "Action 2", "Action 3", "Action 4"]
}`;

    const jsonSchema = {
      type: 'object',
      properties: {
        summaryHeadline: { type: 'string' },
        rainGuardedPlan: { type: 'string' },
        storageRiskAnalysis: { type: 'string' },
        machineryLogistics: { type: 'string' },
        actionChecklist: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['summaryHeadline', 'rainGuardedPlan', 'storageRiskAnalysis', 'machineryLogistics', 'actionChecklist'],
    };

    let geminiAdvisory = null;
    try {
      geminiAdvisory = await callGemini({
        prompt: geminiPrompt,
        jsonSchema,
        maxTokens: 1800,
        temperature: 0.3,
      });
    } catch (aiErr) {
      console.warn('[functions/simulateHarvestGuardian] Gemini call failed, generating deterministic fallback:', aiErr.message);
      // High-precision deterministic fallback so the user always receives intelligent advice
      geminiAdvisory = {
        summaryHeadline: `MATLAB Model confirms optimal harvest readiness at ${matlabSimulation.currentMoisturePct}% moisture.`,
        rainGuardedPlan: `MATLAB ODE simulation predicts safe target moisture (${matlabSimulation.targetSafeMoisturePct}%) in Day +${matlabSimulation.optimalDayOffset}. Capitalize on the 4-day dry window now to complete cutting and threshing before humidity spikes and showers arrive on Day 6.`,
        storageRiskAnalysis: `Current moisture is ${matlabSimulation.currentMoisturePct}%. Grains stored above ${matlabSimulation.storageCriticalPct}% risk fungal mold (Aspergillus) and heating. Plan 2 sunny days of sun-drying on raised tarpaulins to stabilize grain below ${matlabSimulation.targetSafeMoisturePct}%.`,
        machineryLogistics: `Dry ground conditions over the next 72 hours are ideal for heavy combine harvesters. Book custom hiring centers today for Day +${Math.max(1, matlabSimulation.optimalDayOffset - 1)} to avoid equipment shortages before rain.`,
        actionChecklist: [
          'Drain remaining field standing water 3 days before harvester entry to firm soil',
          `Pre-book combine harvester for Day +${matlabSimulation.optimalDayOffset}`,
          'Prepare waterproof tarpaulins and clean gunny bags on raised wooden pallets',
          'Test moisture sample in afternoon sun after morning dew dissipates'
        ]
      };
    }

    res.json({
      matlabSimulation,
      geminiAdvisory,
    });
  } catch (err) {
    console.error('[functions/simulateHarvestGuardian] ERROR:', err.message);
    res.status(500).json({ error: err.message || 'Simulation failed' });
  }
});

module.exports = router;
