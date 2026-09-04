const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

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

  if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('uploads/')) {
    const filePath = path.join(__dirname, '..', imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl);
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

// ── Gemini helper ─────────────────────────────────────────────────────────────
async function callGemini({ prompt, imageBase64, imageMimeType, jsonSchema }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const model = genAI.getGenerativeModel({ model: modelName });

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

  console.log(`[functions] Calling Gemini model: ${modelName}, parts:`, parts.length);

  const result = await model.generateContent(parts);
  const text = result.response.text().trim();

  console.log('[functions] Gemini raw response (first 300 chars):', text.slice(0, 300));

  if (jsonSchema) {
    return extractJson(text);
  }
  return text;
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
    const prompt = `You are Kisan Mitra's Crop Doctor, an expert plant pathologist for Indian farmers. Analyze the uploaded leaf/crop image (crop: ${crop}). Identify the most likely disease or condition, or state if the plant looks healthy. ${langInstr} Be realistic and practical. If the image is unclear or not a plant, say so in the disease field.`;

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
    });

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
      language = 'English',
      farmerContext = {},
      history = [],
    } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'question is required' });
    }

    const ctxParts = [];
    if (farmerContext.crop) ctxParts.push(`Primary crop: ${farmerContext.crop}`);
    if (farmerContext.location) ctxParts.push(`Location: ${farmerContext.location}`);
    if (farmerContext.farmSize) ctxParts.push(`Farm size: ${farmerContext.farmSize} ${farmerContext.farmSizeUnit || 'Acres'}`);
    const contextStr = ctxParts.length ? `Farmer context: ${ctxParts.join(', ')}.` : '';

    const langInstr = LANG_INSTRUCTIONS[language] || LANG_INSTRUCTIONS.English;
    const systemPrompt = `You are Kisan Mitra, a friendly, knowledgeable AI farming assistant for Indian farmers. Give practical, actionable advice on crops, diseases, pests, harvest timing, market prices, and farming practices. Keep answers concise (3-6 sentences) unless the farmer asks for detail. ${langInstr} ${contextStr}`;

    const historyText = history
      .slice(-10)
      .map(m => `${m.role === 'assistant' ? 'assistant' : 'user'}: ${m.content}`)
      .join('\n\n');

    const fullPrompt = [systemPrompt, historyText, `user: ${question.slice(0, 2000)}`]
      .filter(Boolean)
      .join('\n\n');

    const answer = await callGemini({ prompt: fullPrompt });
    res.json({ answer });
  } catch (err) {
    console.error('[functions/askKisanMitra] ERROR:', err.message);
    res.status(500).json({ error: err.message || 'AI service unavailable' });
  }
});

module.exports = router;
