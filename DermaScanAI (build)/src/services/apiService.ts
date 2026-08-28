// src/services/apiService.ts
import { API_CONFIG, getEndpointUrl } from '../config/apiconfig';
import { ENV } from '../config/env';

// ============================================
// SIMPLE IN-MEMORY CACHE
// ============================================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL: number; // in milliseconds

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // default 5 minutes
    this.defaultTTL = defaultTTL;
  }

  get<T>(key: string, ttl: number = this.defaultTTL): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const apiCache = new ApiCache();

// ============================================
// OFFLINE FALLBACKS
// Used when the backend is unreachable so the app
// keeps working quietly instead of throwing errors.
// ============================================

const OFFLINE_WEATHER_RECOMMENDATIONS: Record<string, WeatherResult['recommendations']> = {
  HOT: {
    skincare: [
      { id: 1, title: 'Lightweight Gel Moisturizer', description: 'Switch to an oil-free, gel-based moisturizer so pores stay clear in the heat.', ref: 'AAD' },
      { id: 2, title: 'Reapply Sunscreen', description: 'Use SPF 30+ and reapply every 2 hours — UV damage is highest in hot weather.', ref: 'WHO' },
      { id: 3, title: 'Double Cleanse at Night', description: 'Remove sweat, sunscreen and pollution with a gentle cleanser every evening.', ref: 'AAD' },
    ],
    avoid: [
      { id: 1, title: 'Heavy Oils & Butters', description: 'Thick occlusives trap sweat and can trigger breakouts in high heat.', ref: 'AAD' },
      { id: 2, title: 'Long Hot Showers', description: 'Hot water strips the skin barrier — keep showers lukewarm and short.', ref: 'AAD' },
    ],
    homeRemedies: [
      { id: 1, title: 'Chilled Aloe Vera Gel', description: 'Refrigerate pure aloe vera gel and apply to soothe heat-stressed skin.', ref: 'Traditional' },
      { id: 2, title: 'Cucumber Slices', description: 'Place cold cucumber slices on the skin for instant cooling relief.', ref: 'Traditional' },
    ],
    diet: [
      { id: 1, title: 'Increase Water Intake', description: 'Drink 8–10 glasses of water daily to offset fluid loss in the heat.', ref: 'NHS' },
      { id: 2, title: 'Water-Rich Foods', description: 'Eat watermelon, cucumber and oranges to stay hydrated from within.', ref: 'NHS' },
    ],
  },
  RAINY: {
    skincare: [
      { id: 1, title: 'Gentle Non-Foaming Cleanser', description: 'Humidity increases oil and sweat — cleanse twice daily without stripping skin.', ref: 'AAD' },
      { id: 2, title: 'Lightweight Hydrating Serum', description: 'A hyaluronic acid serum keeps skin balanced in damp, humid air.', ref: 'AAD' },
      { id: 3, title: 'Keep Skin Dry', description: 'Pat skin dry after getting wet — dampness invites fungal issues.', ref: 'WHO' },
    ],
    avoid: [
      { id: 1, title: 'Heavy Occlusive Creams', description: 'Thick creams plus humidity can clog pores and cause fungal acne.', ref: 'AAD' },
      { id: 2, title: 'Skipping Cleansing', description: 'Rain water carries pollutants — never skip your evening cleanse.', ref: 'AAD' },
    ],
    homeRemedies: [
      { id: 1, title: 'Green Tea Toner', description: 'Cooled green tea works as an antioxidant toner for humid-weather skin.', ref: 'Traditional' },
      { id: 2, title: 'Oatmeal Compress', description: 'A colloidal oatmeal compress calms irritation caused by dampness.', ref: 'Traditional' },
    ],
    diet: [
      { id: 1, title: 'Warm Soups & Broths', description: 'Warm foods support circulation without dehydrating the skin.', ref: 'NHS' },
      { id: 2, title: 'Vitamin C Rich Foods', description: 'Citrus and berries boost immunity and skin repair in changing weather.', ref: 'NHS' },
    ],
  },
  COLD: {
    skincare: [
      { id: 1, title: 'Cream-Based Moisturizer', description: 'Switch to a richer cream to protect the skin barrier in cold, dry air.', ref: 'AAD' },
      { id: 2, title: 'Use a Humidifier', description: 'Indoor heating dries the air — a humidifier keeps skin from cracking.', ref: 'AAD' },
      { id: 3, title: 'Daily Sunscreen', description: 'UV rays reflect off surfaces even in winter — SPF is still essential.', ref: 'WHO' },
    ],
    avoid: [
      { id: 1, title: 'Long Hot Showers', description: 'Hot water worsens dryness and eczema flare-ups in cold weather.', ref: 'AAD' },
      { id: 2, title: 'Over-Exfoliation', description: 'Cold-weather skin is fragile — exfoliate at most once a week.', ref: 'AAD' },
    ],
    homeRemedies: [
      { id: 1, title: 'Honey Hydration Mask', description: 'Apply raw honey for 10 minutes to naturally moisturize dry patches.', ref: 'Traditional' },
      { id: 2, title: 'Milk Cream Massage', description: 'A thin layer of fresh milk cream softens rough, chapped skin.', ref: 'Traditional' },
    ],
    diet: [
      { id: 1, title: 'Warm Fluids', description: 'Herbal teas and warm water keep skin hydrated from the inside.', ref: 'NHS' },
      { id: 2, title: 'Omega-3 Foods', description: 'Nuts, seeds and fish strengthen the skin barrier against cold.', ref: 'NHS' },
    ],
  },
  NORMAL: {
    skincare: [
      { id: 1, title: 'Daily Sunscreen SPF 30+', description: 'Apply every morning as the final step — even on cloudy days.', ref: 'WHO' },
      { id: 2, title: 'Gentle Cleanser Twice Daily', description: 'Cleanse morning and night to remove oil, dirt and buildup.', ref: 'AAD' },
      { id: 3, title: 'Hydrating Toner', description: 'An alcohol-free toner rebalances the skin after cleansing.', ref: 'AAD' },
    ],
    avoid: [
      { id: 1, title: 'Harsh Physical Scrubs', description: 'Abrasive scrubs cause micro-tears — choose chemical exfoliants instead.', ref: 'AAD' },
      { id: 2, title: 'Too Many New Products', description: 'Introduce one product at a time so you can spot reactions early.', ref: 'AAD' },
    ],
    homeRemedies: [
      { id: 1, title: 'Rose Water Mist', description: 'A natural mist that refreshes and balances skin pH anytime.', ref: 'Traditional' },
      { id: 2, title: 'Yogurt & Honey Mask', description: 'Mix equal parts for a soothing, brightening 15-minute mask.', ref: 'Traditional' },
    ],
    diet: [
      { id: 1, title: 'Balanced Diet', description: 'Fruits, vegetables and lean protein give skin its building blocks.', ref: 'NHS' },
      { id: 2, title: 'Adequate Water', description: 'Aim for 8 glasses a day to maintain natural skin moisture.', ref: 'NHS' },
    ],
  },
};

interface OCRResult {
  text: string | null;
  provider: string;
  confidence?: number;
}

interface AnalysisResult {
  compatibility: {
    status: string;
    icon: string;
    score: number;
  };
  key_insights: {
    pros: Array<{
      text: string;
      icon: string;
      scientific_name: string;
    }>;
    cons: Array<{
      text: string;
      icon: string;
      scientific_name: string;
    }>;
  };
  full_ingredients: string[];
  recommendation: {
    text: string;
    skin_type: string;
    patch_test: boolean;
    usage_tips: string[];
  };
  warnings: string[];
  interactions: string[];
  metadata?: any;
}

interface SkinQuizResult {
  skinType: string;
  clinicalDescription: string;
  dailyRoutine: {
    morning: string[];
    evening: string[];
  };
  ingredients: {
    lookFor: string[];
    avoid: string[];
  };
  productTextures: {
    cleanser: string;
    moisturizer: string;
    sunscreen: string;
    serum: string;
    toner: string;
  };
  seasonalCare: {
    summer: string[];
    winter: string[];
    monsoon: string[];
  };
  mistakes: string[];
  lifestyle: {
    diet: string[];
    habits: string[];
    sleep: string;
    water: string;
    exercise: string;
  };
}

interface WeatherResult {
  weather: any;
  uvIndex: number | null;
  weatherCategory: string;
  recommendations: {
    skincare: Array<{
      id: number;
      title: string;
      description: string;
      ref: string;
    }>;
    avoid: Array<{
      id: number;
      title: string;
      description: string;
      ref: string;
    }>;
    homeRemedies: Array<{
      id: number;
      title: string;
      description: string;
      ref: string;
    }>;
    diet: Array<{
      id: number;
      title: string;
      description: string;
      ref: string;
    }>;
  };
}

interface DiseaseResult {
  description: string;
  causes: string;
  treatments: string;
  showDoctorNote: boolean;
}

class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  }

  async performOCR(imageBase64: string): Promise<OCRResult> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/ingredients/ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 }),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('OCR API Error:', error);
      throw error;
    }
  }

  async analyzeIngredients(
    ingredientText: string,
    ocrProvider?: string,
    ocrConfidence?: number
  ): Promise<AnalysisResult> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/ingredients/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredientText,
          ocrProvider,
          ocrConfidence,
        }),
      });
      return await this.handleResponse(response);
    } catch (error: any) {
      console.error('Analysis API Error:', error);
      if (error.message === 'Invalid Product Type') {
        throw new Error('Invalid Product Type');
      }
      throw error;
    }
  }

  async analyzeSkinQuiz(
    userAnswers: Array<{ question: string; answer: string }>
  ): Promise<SkinQuizResult> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/quiz/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAnswers }),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Quiz API Error:', error);
      throw error;
    }
  }

  async sendChatMessage(message: string, messages: any[]): Promise<string> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, messages }),
      });
      const result = await this.handleResponse(response);
      return result.reply || result;
    } catch (error) {
      console.error('Chat API Error:', error);
      throw error;
    }
  }

  async getWeatherRecommendations(city: string, timeOfDay: string): Promise<WeatherResult> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/weather/weather`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city, timeOfDay }),
      });
      return await this.handleResponse(response);
    } catch {
      // Backend unreachable — fall back to OpenWeatherMap directly with standard advice
      return this.getOfflineWeatherResult(city);
    }
  }

  // Direct OpenWeatherMap fallback so weather still works without the backend
  private async getOfflineWeatherResult(city: string): Promise<WeatherResult> {
    const response = await this.fetchWithTimeout(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${ENV.WEATHER_API_KEY}&units=metric`,
      { method: 'GET' }
    );
    const weather = await response.json();
    if (weather?.cod !== 200) throw new Error(weather?.message || 'City not found');
    const temp = weather.main?.temp ?? 25;
    const condition = weather.weather?.[0]?.main ?? 'Clear';
    const category = this.categorizeWeather(temp, condition);
    return {
      weather,
      uvIndex: null,
      weatherCategory: category,
      recommendations: OFFLINE_WEATHER_RECOMMENDATIONS[category],
    };
  }

  // Same categorization logic as the backend (weatherService.getWeatherCategory)
  private categorizeWeather(temp: number, condition: string): string {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle') || c.includes('thunderstorm')) return 'RAINY';
    if (temp <= 15) return 'COLD';
    if (temp >= 30) return 'HOT';
    return 'NORMAL';
  }

  async analyzeSkinDisease(diseaseName: string): Promise<DiseaseResult> {
    // Errors propagate silently — the result screen shows an offline fallback
    const response = await this.fetchWithTimeout(`${this.baseUrl}/disease/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ diseaseName }),
    });
    return await this.handleResponse(response);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // ============================================
  // DASHBOARD ENDPOINTS
  // ============================================

  async fetchWelcomeMessage(): Promise<{ greeting: string; message: string }> {
    const cacheKey = 'welcome_message';
    const cached = apiCache.get<{ greeting: string; message: string }>(cacheKey, 10 * 60 * 1000); // 10 min
    if (cached) return cached;

    // Errors propagate silently — the dashboard shows an offline fallback
    const response = await this.fetchWithTimeout(`${this.baseUrl}/dashboard/welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await this.handleResponse(response);
    apiCache.set(cacheKey, data);
    return data;
  }

  async fetchMoodMessage(mood: { emoji: string; label: string; description: string }): Promise<string> {
    const cacheKey = `mood_${mood.label}`;
    const cached = apiCache.get<string>(cacheKey, 15 * 60 * 1000); // 15 min
    if (cached) return cached;

    // Errors propagate silently — the dashboard shows an offline fallback
    const response = await this.fetchWithTimeout(`${this.baseUrl}/dashboard/mood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood }),
    });
    const result = await this.handleResponse(response);
    const message = result.message || result;
    apiCache.set(cacheKey, message);
    return message;
  }

  async fetchGlowTipInfo(tip: string): Promise<{
    title: string;
    description: string;
    benefits: string[];
    howToUse: string;
  }> {
    const cacheKey = `glow_tip_${tip}`;
    const cached = apiCache.get<any>(cacheKey, 30 * 60 * 1000); // 30 min
    if (cached) return cached;

    // Errors propagate silently — the dashboard shows an offline fallback
    const response = await this.fetchWithTimeout(`${this.baseUrl}/dashboard/glow-tip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tip }),
    });
    const data = await this.handleResponse(response);
    apiCache.set(cacheKey, data);
    return data;
  }

  async fetchMythsAndFacts(): Promise<{
    myths: Array<{ category: string; myth: string; fact: string }>;
  }> {
    const cacheKey = 'myths_and_facts';
    const cached = apiCache.get<any>(cacheKey, 60 * 60 * 1000); // 1 hour
    if (cached) return cached;

    // Errors propagate silently — the screen shows an offline fallback
    const response = await this.fetchWithTimeout(`${this.baseUrl}/dashboard/myths`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await this.handleResponse(response);
    apiCache.set(cacheKey, data);
    return data;
  }

  // Cache management
  clearCache(): void {
    apiCache.clear();
  }
}

export const apiService = new ApiService();