const axios = require('axios');
const { AVAILABLE_MODELS, QWEN_MODELS, QWEN_BASE_URL } = require('../config/constants');

function safeJsonParse(input) {
  try {
    return JSON.parse(input);
  } catch (err) {
    // First: strip trailing commas before ] or } (common LLM mistake)
    let fixed = input.replace(/,\s*([\]}])/g, '$1');
    try {
      return JSON.parse(fixed);
    } catch (_) {
      // Fall through to character-level repair
    }

    // Second: repair bad control characters inside string literals
    let out = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch === '"' && !escaped) {
        inString = !inString;
        out += ch;
        continue;
      }

      if (ch === '\\' && !escaped) {
        escaped = true;
        out += ch;
        continue;
      }

      if (escaped) {
        // just append next char after backslash
        out += ch;
        escaped = false;
        continue;
      }

      const code = ch.charCodeAt(0);
      if (inString && code >= 0 && code <= 31) {
        // common mappings for readability
        if (ch === '\n') out += '\\n';
        else if (ch === '\r') out += '\\r';
        else if (ch === '\t') out += '\\t';
        else {
          const hex = code.toString(16).padStart(4, '0');
          out += `\\u${hex}`;
        }
      } else {
        out += ch;
      }
    }

    return JSON.parse(out);
  }
}

async function findAvailableModel() {
  const qwenKey = process.env.QWEN_API_KEY;
  const geminiKey = process.env.GROQ_API_KEY;

  // Check Qwen first (Alibaba Cloud DashScope — primary provider)
  if (qwenKey) {
    try {
      console.log('🔍 Testing Qwen availability...');
      const response = await axios.post(
        `${QWEN_BASE_URL}/chat/completions`,
        {
          model: QWEN_MODELS[0],
          messages: [{ role: 'user', content: 'Say ok' }],
          max_tokens: 10,
          temperature: 0.1
        },
        {
          headers: { 'Authorization': `Bearer ${qwenKey}`, 'Content-Type': 'application/json' },
          timeout: 20000
        }
      );

      if (response.data?.choices) {
        console.log(`✅ Qwen ${QWEN_MODELS[0]} is available!`);
        return { provider: 'qwen', model: QWEN_MODELS[0] };
      }
    } catch (error) {
      console.log('❌ Qwen not available:', error.message);
    }
  }

  // Fallback: check Gemini models
  if (geminiKey) {
    console.log('🔍 Testing Gemini models...');
    for (const model of AVAILABLE_MODELS) {
      try {
        console.log(`Testing model: ${model}`);
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            contents: [{ role: 'user', parts: [{ text: 'Say ok' }] }],
            generationConfig: { maxOutputTokens: 10, temperature: 0.1 }
          },
          { timeout: 20000 }
        );

        if (response.data && response.data.candidates) {
          console.log(`✅ Gemini ${model} is available!`);
          return { provider: 'gemini', model };
        }
      } catch (error) {
        console.log(`❌ Error testing ${model}:`, error.message);
      }
    }
  }

  console.log('⚠️ No AI models available');
  return null;
}

/**
 * Call Alibaba Cloud Qwen (Tongyi Qianwen) API via DashScope.
 * Uses OpenAI-compatible chat completions endpoint.
 */
async function callQwenAPI(apiKey, requestBody, options = {}) {
  const { timeout = 30000 } = options;

  for (const model of QWEN_MODELS) {
    try {
      console.log(`🤖 [Qwen] Calling model: ${model}`);

      const response = await axios.post(
        `${QWEN_BASE_URL}/chat/completions`,
        {
          model: model,
          messages: requestBody.messages,
          temperature: requestBody.temperature ?? 0.7,
          max_tokens: requestBody.max_tokens ?? 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout
        }
      );

      console.log(`✅ [Qwen] Response from ${model}`);
      return {
        data: response.data,
        provider: 'qwen',
        model: model
      };
    } catch (error) {
      const status = error.response?.status;
      const isRateLimit = status === 429;
      const isServerError = status >= 500;

      if (isRateLimit || isServerError) {
        console.log(`⚠️ [Qwen] ${model} failed (${status || error.message}), trying next...`);
        continue;
      }
      throw error;
    }
  }

  throw new Error('All Qwen models are rate-limited or unavailable.');
}

/**
 * Call Gemini API with automatic model fallback.
 * Translates OpenAI-style request/response to/from native Gemini format
 * so callers can use familiar response.data.choices[0].message.content pattern.
 */
async function callGeminiAPI(apiKey, requestBody, options = {}) {
  const { timeout = 30000 } = options;

  // Convert OpenAI messages → Gemini contents
  const contents = (requestBody.messages || []).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }]
  }));

  const generationConfig = {};
  if (requestBody.temperature !== undefined) generationConfig.temperature = requestBody.temperature;
  if (requestBody.max_tokens) generationConfig.maxOutputTokens = requestBody.max_tokens;

  for (const model of AVAILABLE_MODELS) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { contents, generationConfig },
        { timeout }
      );

      // Convert Gemini response → OpenAI format
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        data: {
          choices: [{ message: { content: text } }],
          model: model
        }
      };
    } catch (error) {
      const status = error.response?.status;
      const isRateLimit = status === 429;
      const isServerError = status >= 500;
      const isPayloadTooLarge = status === 413;

      if (isRateLimit || isServerError || isPayloadTooLarge) {
        console.log(`⚠️ Model ${model} failed (${status || error.message}), trying next...`);
        continue;
      }
      throw error;
    }
  }

  throw new Error('All Gemini models are rate-limited or unavailable. Please try again later.');
}

/**
 * Unified AI caller — tries Qwen (Alibaba) first, falls back to Gemini.
 * Returns response in OpenAI-compatible format: { data: { choices: [...] } }
 */
async function callGroqAPI(requestBody, options = {}) {
  const qwenKey = process.env.QWEN_API_KEY;
  const geminiKey = process.env.GROQ_API_KEY;

  // Try Qwen first (Alibaba Cloud DashScope — primary for hackathon)
  if (qwenKey) {
    try {
      return await callQwenAPI(qwenKey, requestBody, options);
    } catch (error) {
      console.log(`⚠️ [Qwen] All models failed, falling back to Gemini...`);
    }
  }

  // Fallback to Gemini
  if (geminiKey) {
    return await callGeminiAPI(geminiKey, requestBody, options);
  }

  throw new Error('No AI provider configured. Set QWEN_API_KEY or GROQ_API_KEY in .env');
}

async function analyzeIngredients(ingredientText, ocrProvider = null, ocrConfidence = 1.0) {
  const available = await findAvailableModel();

  if (!available) {
    throw new Error("No AI models available");
  }

  const prompt = `You are a skincare expert. Analyze these ingredients in simple, easy-to-understand language:

INGREDIENTS: ${ingredientText}

Provide analysis in this EXACT JSON structure:
{
  "compatibility": {
    "status": "Compatibility level (Excellent/Good/Okay/Careful)",
    "icon": "checkmark-circle",
    "score": 0-100
  },
  "key_insights": {
    "pros": [
      {
        "text": "Simple benefit description",
        "icon": "checkmark-circle",
        "scientific_name": "Scientific name if relevant"
      }
    ],
    "cons": [
      {
        "text": "Simple concern description",
        "icon": "warning",
        "scientific_name": "Scientific name if relevant"
      }
    ]
  },
  "full_ingredients": ["List all ingredients"],
  "recommendation": {
    "text": "Simple recommendation in everyday language",
    "skin_type": "sensitive/dry/oily/combination/normal",
    "patch_test": true/false,
    "usage_tips": [
      "Simple tip 1",
      "Simple tip 2"
    ]
  },
  "warnings": ["Simple warnings in everyday language"],
  "interactions": ["Simple interactions in everyday language"]
}

Important rules:
- Use simple, everyday language that anyone can understand
- Avoid complex medical terms
- Explain any scientific terms in simple words
- Focus on practical advice

Return ONLY the JSON object, no other text.`;

  const response = await callGroqAPI({
    messages: [
      {
        role: 'system',
        content: 'You are a skincare expert who explains ingredients in simple, everyday language. Always respond with valid JSON only, no markdown or explanatory text.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1,
    max_tokens: 4000
  });

  let analysisText = response.data.choices[0].message.content || '{}';

  let cleaned = analysisText
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/^\s*[\w\s]*\{/, '{')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  const analysis = safeJsonParse(cleaned);

  analysis.metadata = {
    analyzed_at: new Date().toISOString(),
    ocr_provider: ocrProvider || 'manual',
    confidence_score: ocrConfidence || 1.0,
    analysis_version: '2.0',
    model_used: `${available.provider}/${available.model}`
  };

  return analysis;
}

async function analyzeSkinQuiz(userAnswers) {
  const available = await findAvailableModel();

  if (!available) {
    throw new Error("No AI models available");
  }

  const prompt = `Based on these quiz answers, determine the skin type and provide SHORT, professional tips.

Quiz Answers:
${userAnswers.map((qa, index) => `${index + 1}. Q: ${qa.question}\n   A: ${qa.answer}`).join('\n\n')}

Return ONLY this JSON (ALL text must be SHORT and CLEAR):

{
  "skinType": "Oily/Dry/Combination/Sensitive/Normal",
  "clinicalDescription": "One short sentence about this skin type (max 15 words)",
  "dailyRoutine": {
    "morning": ["Step 1 - product (5 words)", "Step 2 - product (5 words)", "Step 3 - product (5 words)", "Step 4 - SPF (5 words)"],
    "evening": ["Step 1 - cleanser (5 words)", "Step 2 - treatment (5 words)", "Step 3 - moisturizer (5 words)"]
  },
  "ingredients": {
    "lookFor": ["Ingredient - benefit (6 words)", "Ingredient - benefit (6 words)", "Ingredient - benefit (6 words)"],
    "avoid": ["Ingredient - reason (6 words)", "Ingredient - reason (6 words)", "Ingredient - reason (6 words)"]
  },
  "productTextures": {
    "cleanser": "Texture type (4 words)",
    "moisturizer": "Texture type (4 words)",
    "sunscreen": "Texture type (4 words)",
    "serum": "Texture type (4 words)",
    "toner": "Texture type (4 words)"
  },
  "mistakes": ["Mistake + fix (8 words)", "Mistake + fix (8 words)", "Mistake + fix (8 words)", "Mistake + fix (8 words)"],
  "lifestyle": {
    "diet": ["Eat this - why (6 words)", "Avoid this - why (6 words)"],
    "habits": ["Habit + benefit (6 words)", "Habit + benefit (6 words)"],
    "sleep": "Short sleep tip (8 words)",
    "water": "Short water tip (8 words)",
    "exercise": "Short exercise tip (8 words)"
  }
}

Keep EVERYTHING very short and professional. No long sentences.`;

  const response = await callGroqAPI({
    messages: [
      {
        role: 'system',
        content: 'You are a clinical dermatologist. Give SHORT, clear, professional skincare advice. All tips must be under 8 words. Return valid JSON only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  }, { timeout: 15000 });

  let textResponse = response.data.choices[0].message.content;
  textResponse = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid response format from API");
  }

  const parsed = safeJsonParse(jsonMatch[0]);
  if (!parsed.skinType || !parsed.clinicalDescription) {
    throw new Error("Missing required fields in response");
  }

  return parsed;
}

async function skinChatbotResponse(messages, userInput) {
  const available = await findAvailableModel();

  if (!available) {
    throw new Error("No AI models available");
  }

  const response = await callGroqAPI({
    messages: [
      {
        role: 'system',
        content: `You are a friendly skincare assistant. Keep responses VERY short and clear (1-2 sentences, max 25 words). Use 1 emoji max.
        Give direct, helpful skincare advice. No long explanations.
        Suggest a dermatologist only for serious concerns.`
      },
      ...messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      })),
      { role: 'user', content: userInput }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  let botReply = response.data.choices[0].message.content;

  // Don't strip medical disclaimers - they're important for user safety
  return botReply;
}

async function getWeatherRecommendations(weatherData, weatherCategory, timeOfDay, uvIndex) {
  const available = await findAvailableModel();

  if (!available) {
    throw new Error("No AI models available");
  }

  const temp = Math.round(weatherData.main.temp);
  const condition = weatherData.weather[0].description;
  const city = weatherData.name;
  const humidity = weatherData.main.humidity || 50;

  const prompt = `
    You are a professional dermatologist and nutritionist. 
    
    CURRENT CONDITIONS:
    - City: ${city}
    - Temperature: ${temp}°C
    - Condition: ${condition}
    - Humidity: ${humidity}%
    - Category: ${weatherCategory} Weather
    - Time: ${timeOfDay}
    - UV Index: ${uvIndex || 'N/A'}
    
    TASK: Give EXACTLY 3 professional medical tips for each category with SHORT references.
    
    IMPORTANT: Do NOT use any emojis in the tip titles. Use only plain text.
    
    GUIDELINES:
    - Each tip title: 2-3 words only (NO EMOJIS)
    - Each description: 4-6 words max - ultra short, clear, medically accurate
    - Each reference: REMOVE (no ref field)
    
    Return ONLY this JSON format (NO diet section, NO ref field):
    {
      "skincare": [
        { "id": 1, "title": "Short title", "description": "4-6 word tip" },
        { "id": 2, "title": "Short title", "description": "4-6 word tip" },
        { "id": 3, "title": "Short title", "description": "4-6 word tip" }
      ],
      "avoid": [
        { "id": 1, "title": "Short title", "description": "4-6 word tip" },
        { "id": 2, "title": "Short title", "description": "4-6 word tip" },
        { "id": 3, "title": "Short title", "description": "4-6 word tip" }
      ],
      "homeRemedies": [
        { "id": 1, "title": "Short title", "description": "4-6 word tip" },
        { "id": 2, "title": "Short title", "description": "4-6 word tip" },
        { "id": 3, "title": "Short title", "description": "4-6 word tip" }
      ]
    }
  `;

  const response = await callGroqAPI({
    messages: [
      {
        role: 'system',
        content: 'You are a medical expert. Return ONLY valid JSON. Each description 4-6 words MAX. Each title 2-3 words. No ref field. Do NOT use emojis.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1500
  });

  const aiContent = response.data.choices[0].message.content;
  let cleanedContent = aiContent.replace(/```json|```javascript|```js|```/g, '').trim();
  const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : cleanedContent;

  return safeJsonParse(jsonString);
}

async function analyzeDisease(diseaseName) {
  const available = await findAvailableModel();

  if (!available) {
    throw new Error("No AI models available");
  }

  // If the "disease" is "No Disease", we provide a generic healthy skin advice
  let prompt;
  if (diseaseName.toLowerCase() === 'no disease') {
    prompt = `You are a professional dermatologist. The user's skin scan shows "No Disease".
    
    TASK: Provide a positive and encouraging assessment, along with general advice for maintaining healthy skin.
    
    Return ONLY this JSON format:
    {
      "description": "Short encouraging assessment of healthy skin (2-3 sentences).",
      "causes": "N/A - Healthy skin",
      "treatments": "Format exactly as 3 short, actionable bullet points (using markdown '-'). Keep each point very short and practical (max 10-12 words). Focus on basic daily skincare.",
      "showDoctorNote": false
    }`;
  } else {
    prompt = `You are a professional dermatologist. The user's skin scan detected a potential condition: "${diseaseName}".
    
    TASK: Provide a clinical description, common causes, and standard treatment recommendations.
    
    Return ONLY this JSON format:
    {
      "description": "A clear, clinical description of ${diseaseName} (2-3 sentences).",
      "causes": "Common causes or triggers for ${diseaseName}. Keep it brief.",
      "treatments": "Format exactly as 3-4 short, actionable bullet points (using markdown '-'). Keep each point very concise, clear, and practical (max 12-15 words). Mention key ingredients or habits to follow.",
      "showDoctorNote": true
    }`;
  }

  const response = await callGroqAPI({
    messages: [
      {
        role: 'system',
        content: 'You are a medical expert dermatologist. Return valid JSON only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 1000
  });

  const aiContent = response.data.choices[0].message.content;
  let cleanedContent = aiContent.replace(/```json|```javascript|```js|```/g, '').trim();
  const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : cleanedContent;

  return safeJsonParse(jsonString);
}

async function generateWelcomeMessage() {
  const available = await findAvailableModel();
  if (!available) throw new Error('No AI models available');

  const prompt = `Generate a very short welcome message for a skincare app.

Return ONLY this JSON:
{
  "greeting": "2-3 words with 1 emoji",
  "message": "6-8 words about skin positivity with 1 emoji"
}`;

  const response = await callGroqAPI({
    messages: [
      { role: 'system', content: 'You are a friendly, positive skincare expert. Generate cute, inspiring welcome messages with emojis.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 500
  }, { timeout: 10000 });

  const content = response.data.choices[0].message.content;
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return { greeting: 'Welcome Back!', message: 'Your skin deserves the best care today!' };
}

async function generateMoodMessage(mood) {
  const available = await findAvailableModel();
  if (!available) throw new Error('No AI models available');

  const prompt = `Generate a very short, encouraging message (max 8 words, 1 emoji) for someone who selected "${mood.label}" as their skin mood.

Mood: ${mood.emoji} ${mood.label}

Keep it short, sweet, and specific to this mood.
Return ONLY the message text.`;

  const response = await callGroqAPI({
    messages: [
      { role: 'system', content: 'You are a caring skincare assistant. Generate VERY short messages (max 8 words, 1 emoji).' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 300
  }, { timeout: 10000 });

  return response.data.choices[0].message.content.trim();
}

async function generateGlowTipInfo(tip) {
  const available = await findAvailableModel();
  if (!available) throw new Error('No AI models available');

  const prompt = `Generate SHORT skincare info about "${tip.toUpperCase()}" for a skincare app.

Return ONLY this JSON:
{
  "title": "3-4 word title with 1 emoji",
  "description": "One sentence, max 20 words",
  "benefits": ["5 words", "5 words", "5 words"],
  "howToUse": "One sentence, max 20 words"
}`;

  const response = await callGroqAPI({
    messages: [
      { role: 'system', content: 'You are a dermatology expert. Provide VERY CONCISE, clear skincare information. Always return valid JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 500
  }, { timeout: 10000 });

  const content = response.data.choices[0].message.content;
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  throw new Error('Invalid response format');
}

async function generateMythsAndFacts() {
  const available = await findAvailableModel();
  if (!available) throw new Error('No AI models available');

  const prompt = `Generate 2 skincare myths and facts for each of these 3 categories:

CATEGORIES: WATER, ACNE, SKIN (2 myths each = 6 total)

REQUIREMENTS:
- Each myth: 8-10 words, common misconception
- Each fact: 8-10 words, clear correction
- Simple, professional language

Return ONLY this JSON format with EXACTLY 6 items:
{
  "myths": [
    { "category": "Water", "myth": "...", "fact": "..." },
    { "category": "Water", "myth": "...", "fact": "..." },
    { "category": "Acne", "myth": "...", "fact": "..." },
    { "category": "Acne", "myth": "...", "fact": "..." },
    { "category": "Skin", "myth": "...", "fact": "..." },
    { "category": "Skin", "myth": "...", "fact": "..." }
  ]
}`;

  const response = await callGroqAPI({
    messages: [
      { role: 'system', content: 'You are a dermatology expert. Generate concise skincare myths and facts. Each myth and fact MUST be 8-10 words only. Return valid JSON only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.4,
    max_tokens: 2000
  }, { timeout: 15000 });

  const content = response.data.choices[0].message.content;
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  throw new Error('Invalid myths response format');
}

module.exports = {
  findAvailableModel,
  analyzeIngredients,
  analyzeSkinQuiz,
  skinChatbotResponse,
  getWeatherRecommendations,
  analyzeDisease,
  generateWelcomeMessage,
  generateMoodMessage,
  generateGlowTipInfo,
  generateMythsAndFacts
};