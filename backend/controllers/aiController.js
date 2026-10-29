const Prediction = require('../models/Prediction');
const Inventory = require('../models/Inventory');

const config = require('../config/env');

let aiClient;
const aiModel = config.geminiModel;
const AI_TIMEOUT_MS = 20000;

// Initialise Gemini only when a key is configured; every AI feature degrades gracefully without it.
const initGenAI = async () => {
  if (!aiClient && config.geminiKey) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      aiClient = new GoogleGenAI({ apiKey: config.geminiKey });
    } catch (err) {
      console.error('[AI] Failed to initialise Gemini:', err.message);
    }
  }
};

/** Calls Gemini with a time limit so a slow AI response never hangs the request. */
const generate = (contents) => Promise.race([
  aiClient.models.generateContent({ model: aiModel, contents }),
  new Promise((_, reject) => setTimeout(() => reject(new Error('AI request timed out')), AI_TIMEOUT_MS)),
]);

/** Extracts the first JSON object/array from model text; returns null instead of throwing. */
const parseJsonFrom = (text, pattern) => {
  const match = (text || '').match(pattern);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
};

const predictProduction = async (req, res, next) => {
  try {
    const { chickens = 0, age = 0, feedQuality = 'Average', feedQty = 0, temperature = 25, humidity = 60, lighting = 12, breed = 'Unknown', farmId } = req.body;
    
    // Fallback to query if body is empty (compatible with old and new frontend)
    // farmId is accepted for compatibility with older clients (not used in the calculation).
    void farmId;

    let predictedEggs = 0;
    let idealProduction = 0;
    let overallEfficiency = 0;

    // breed-specific laying rates (ideal maximums)
    let layingRate = 0.90; // Default (Leghorn style)
    const b = (breed || '').toUpperCase();
    if (b.includes('DESI') || b.includes('COUNTRY')) layingRate = 0.55;
    else if (b.includes('KADAKNATH')) layingRate = 0.35;
    else if (b.includes('VANARAJA')) layingRate = 0.75;
    else if (b.includes('RIR') || b.includes('RED')) layingRate = 0.85;

    idealProduction = chickens * layingRate; 
    
    let ageFactor = 1.0;
    if (age < 18) ageFactor = 0; // Not laying yet
    else if (age < 24) ageFactor = (age - 18) / 6; // Ramp up
    else if (age > 72) ageFactor = Math.max(0.3, 0.9 - ((age - 72) * 0.02));
    
    let tempFactor = 1.0;
    if (temperature > 30) tempFactor = Math.max(0.5, 1.0 - (temperature - 30) * 0.05);
    if (temperature < 15) tempFactor = Math.max(0.6, 1.0 - (15 - temperature) * 0.03);
    
    let lightingFactor = (lighting >= 14 && lighting <= 16) ? 1.0 : (lighting < 14 ? 0.8 : 0.9);
    
    let feedQualityFactor = feedQuality === 'Good' ? 1.0 : feedQuality === 'Average' ? 0.85 : 0.7;
    
    let feedQtyPerBird = chickens > 0 ? (feedQty / chickens) : 0;
    let feedQtyFactor = feedQtyPerBird >= 0.11 ? 1.0 : Math.max(0.4, feedQtyPerBird / 0.11);
    overallEfficiency = Math.max(0, ageFactor * tempFactor * lightingFactor * feedQualityFactor * feedQtyFactor);
    predictedEggs = Math.floor(idealProduction * overallEfficiency);
    
    // Smart Insights Generation
    let insights = [];
    if (temperature > 30) insights.push(`High temperature (${temperature}°C) is reducing production significantly.`);
    if (temperature < 15) insights.push(`Low temperature (${temperature}°C) is forcing birds to use energy for heat rather than eggs.`);
    if (feedQuality !== 'Good') insights.push('Increase feed quality to "Good" for better yield.');
    if (age < 20) insights.push('Flock is too young for peak production (optimal is 20-70 weeks).');
    if (age > 70) insights.push('Flock is aging. Egg production naturally declines after 70 weeks.');
    if (lighting < 14) insights.push('Increase lighting to 14-16 hours per day to stimulate egg laying.');
    if (feedQtyPerBird < 0.11 && chickens > 0) insights.push(`Feed quantity is low (${(feedQtyPerBird*1000).toFixed(0)}g/bird). Target ~110g-120g per bird daily.`);

    // If we have AI, get a dynamic summary
    let aiSummary = "";
    await initGenAI();
    if (aiClient) {
      try {
        const aiPrompt = `Analyze this poultry data: ${chickens} birds, ${age} weeks old, ${predictedEggs} predicted eggs. 
        Efficiency: ${Math.round(overallEfficiency * 100)}%. Temp: ${temperature}C.
        Provide a 1-sentence expert recommendation.`;
        
        const result = await generate([{ role: 'user', parts: [{ text: aiPrompt }] }]);
        aiSummary = result.text || result.response?.text || "";
      } catch (e) {
        console.error("[AI Prediction Error]", e.message);
      }
    }

    if (aiSummary) insights.unshift(aiSummary);

    const prediction = new Prediction({
      farmer: req.user?._id || null,
      inputData: { chickens, age, feedQuality, feedQty, temperature, humidity, lighting, breed },
      predictedEggs,
      // The model is a rule-based estimate; we report how efficient the inputs are instead of a fake "confidence".
      confidence: Math.round(overallEfficiency * 100)
    });

    if (req.user) await prediction.save();
    
    res.json({
      prediction,
      idealProduction: Math.floor(idealProduction),
      efficiency: Math.round(overallEfficiency * 100),
      insights
    });
  } catch (error) {
    next(error);
  }
};

const chatWithAssistant = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    await initGenAI();

    if (!aiClient) {
      return res.json({ 
        offline: true,
        reply: "Namaste! I am **Kisan Mitra**, your smart farming assistant. The AI service is not switched on for this site yet, so I can't answer live questions right now. Please try again later.\n\n[[Suggest: How to increase yield?]] [[Suggest: Disease prevention tips]]"
      });
    }

    const systemInstruction = `You are **Kisan Mitra**, an elite Smart Farming AI Advisor for the PoultrySmart ecosystem. 
    **Your Mission:**
    Provide expert agricultural advice covering poultry, livestock, crops, and government schemes.
    
    **Instructions:**
    1. Be professional, direct, and actionable. 
    2. Use Markdown (headers, bold, bullet points).
    3. Respond in the user's language (Hindi or English).
    4. At the end, provide 3 suggestions like: [[Suggest: Topic]]`;

    const contents = [
      { role: 'user', parts: [{ text: systemInstruction }] },
      { role: 'model', parts: [{ text: "Understood. I am Kisan Mitra. How can I help you today?" }] },
      ...history
        .map(h => ({ role: h.role === 'user' ? 'user' : 'model', text: String(h.content ?? h.text ?? '').slice(0, 4000) }))
        .filter(h => h.text)
        .map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const result = await generate(contents);

    let replyText = result.text || "";
    if (!replyText && result.response) {
      replyText = typeof result.response.text === 'function' ? result.response.text() : result.response.text;
    }

    res.json({ reply: replyText || "I'm thinking... please ask again." });
  } catch (error) {
    console.error('[AI Chat Error]', error.message);
    res.json({ error: true, reply: "Sorry, I couldn't reach the AI service just now. Please try again in a minute.\n\n[[Suggest: Check feed prices]] [[Suggest: Poultry vaccination schedule]]" });
  }
};

const processPhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No photo uploaded' });

    await initGenAI();
    if (!aiClient) return res.status(503).json({ message: 'Photo scanning needs the AI service, which is not switched on for this site. Please add the item by hand.' });

    const prompt = `Extract feeding or inventory data from this image. Return JSON: { "itemName": string, "quantity": number, "unit": string, "category": "Feed" | "Medicine" | "Other" }`;

    const imageParts = [{
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype
      }
    }];

    const result = await generate([{ role: 'user', parts: [{ text: prompt }, ...imageParts] }]);
    const data = parseJsonFrom(result.text, /\{[\s\S]*\}/);
    if (!data) return res.status(422).json({ message: "Couldn't read any stock details from that photo. Try a clearer photo or add the item by hand." });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getSmartAlerts = async (req, res, next) => {
  try {
    const lowStock = await Inventory.find({ 
      farmer: req.user._id,
      $expr: { $lte: ["$quantity", "$lowStockThreshold"] }
    });

    const inventoryData = lowStock.map(i => `${i.itemName}: ${i.quantity} ${i.unit} left`).join(', ');
    
    let alerts = lowStock.map(item => `Low stock warning: **${item.itemName}** (${item.quantity} ${item.unit} remaining).`);

    await initGenAI();
    if (aiClient && lowStock.length > 0) {
      try {
        const prompt = `Based on these low stock items: ${inventoryData}, provide 2 very short, proactive poultry farming tips in a JSON array of strings. Format: ["Tip 1", "Tip 2"]`;
        const result = await generate([{ role: 'user', parts: [{ text: prompt }] }]);
        const aiTips = parseJsonFrom(result.text, /\[[\s\S]*\]/);
        if (Array.isArray(aiTips)) alerts = [...alerts, ...aiTips.filter(t => typeof t === 'string')];
      } catch (e) {
        console.error("[AI Alerts Error]", e.message);
      }
    }

    if (alerts.length === 0) alerts.push("All stocks are stable.");
    res.json({ alerts: alerts.slice(0, 5) });
  } catch (error) {
    next(error);
  }
};

module.exports = { predictProduction, chatWithAssistant, getSmartAlerts, processPhoto };
