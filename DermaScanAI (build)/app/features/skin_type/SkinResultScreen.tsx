"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Platform, 
  TouchableOpacity, 
  Alert, 
  Share,
  ActivityIndicator,
  StatusBar,
  Linking 
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Card, Button } from "react-native-paper"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import skinData from "../../data/skin_types.json"
import { saveSkinTypeResult, type SavedSkinTypeResult } from "../../../src/utils/storageUtils"
import { getLatestSkinResult, getSkinResultById } from "../../../src/utils/firestoreUtils"
import { auth } from "../../../src/config/firebase"

// Professional Medical Interface
interface Ingredient {
  name: string
  benefit: string
  mechanism?: string
  evidence_level?: 'Strong' | 'Moderate' | 'Limited'
  products?: string[]
}

interface ClinicalSkinData {
  // Basic Info
  skinType: string
  clinicalName: string
  prevalence?: string
  geneticFactor?: string
  
  // Section 1: Clinical Assessment
  clinicalDescription: string
  pathophysiology?: string
  clinicalPresentation: string[]
  
  // Section 2: Daily Medical Protocol
  dailyProtocol: {
    morning: Array<{ step: string, purpose: string, frequency: string }>
    evening: Array<{ step: string, purpose: string, frequency: string }>
    weekly?: Array<{ treatment: string, frequency: string, purpose: string }>
  }
  
  // Section 3: Prescriptive Ingredients
  prescriptiveIngredients: {
    essential: Array<{ name: string, concentration?: string, mechanism: string, evidence: string }>
    avoid: Array<{ name: string, reason: string, severity: 'High' | 'Moderate' | 'Low' }>
  }
  
  // Section 4: Formulation Guide
  formulationGuide: {
    cleanser: { type: string, rationale: string, pH?: string }
    moisturizer: { type: string, rationale: string, keyComponents: string[] }
    sunscreen: { type: string, spf_minimum: number, rationale: string }
    treatment: { type: string, rationale: string, frequency: string }
    toner?: { type: string, rationale: string }
  }
  
  // Section 5: Environmental Adaptation
  environmentalAdaptation: {
    summer: Array<{ recommendation: string, rationale: string }>
    winter: Array<{ recommendation: string, rationale: string }>
    humid: Array<{ recommendation: string, rationale: string }>
    dry: Array<{ recommendation: string, rationale: string }>
  }
  
  // Section 6: Clinical Contraindications
  contraindications: Array<{ 
    factor: string, 
    risk: 'High' | 'Moderate' | 'Low',
    management: string 
  }>
  
  // Section 7: Lifestyle & Systemic Factors
  systemicFactors: {
    diet: Array<{ recommendation: string, rationale: string, evidence: string }>
    supplements?: Array<{ name: string, dosage?: string, purpose: string }>
    sleep: { recommendation: string, rationale: string }
    hydration: { amount: string, rationale: string }
    exercise: { recommendation: string, precautions?: string[] }
    stress?: { impact: string, management: string[] }
  }
  
  // Section 8: Treatment Outcomes
  treatmentOutcomes: {
    expected_timeline: string
    monitoring_parameters: string[]
    when_to_escalate: string[]
    success_metrics?: string[]
  }
  
  // Section 9: Comorbidities & Associations
  comorbidities?: Array<{
    condition: string
    association: string
    screening?: string
  }>
  
  // Section 10: References & Evidence
  evidence?: {
    guidelines: string[]
    key_studies?: Array<{ title: string, findings: string, year: number }>
    expert_consensus: string
  }
  
  // Firestore reference
  firestoreId?: string
}

// Extended SavedSkinTypeResult to include clinical fields
interface ExtendedSavedResult extends SavedSkinTypeResult {
  clinicalName?: string
  clinicalDescription?: string
  clinicalPresentation?: string[]
  dailyProtocol?: ClinicalSkinData['dailyProtocol']
  prescriptiveIngredients?: ClinicalSkinData['prescriptiveIngredients']
  formulationGuide?: ClinicalSkinData['formulationGuide']
  environmentalAdaptation?: ClinicalSkinData['environmentalAdaptation']
  contraindications?: ClinicalSkinData['contraindications']
  systemicFactors?: ClinicalSkinData['systemicFactors']
  treatmentOutcomes?: ClinicalSkinData['treatmentOutcomes']
  firestoreId?: string
}

// Helper function to format skin type display - FIXES DUPLICATE "SKIN" ISSUE
const formatSkinTypeDisplay = (skinType: string): string => {
  let cleanSkinType = skinType.replace(/\s*Skin\s*/gi, '').trim()
  cleanSkinType = cleanSkinType.replace(/\s+/g, ' ').trim()
  if (!cleanSkinType) {
    return "Your Skin"
  }
  if (cleanSkinType.includes('/')) {
    return cleanSkinType + " Skin"
  }
  return `${cleanSkinType} Skin`
}

// Helper function to convert legacy params to clinical data
const convertLegacyToClinical = (params: any): ClinicalSkinData => {
  const skinType = Array.isArray(params.skinType) ? params.skinType[0] : params.skinType || "Unknown"
  
  let parsedTips: string[] = []
  let parsedAvoid: string[] = []
  let parsedIngredients: string[] = []
  let parsedMorningRoutine: string[] = []
  let parsedEveningRoutine: string[] = []
  
  try {
    if (params.tips) parsedTips = JSON.parse(params.tips as string)
    if (params.avoid) parsedAvoid = JSON.parse(params.avoid as string)
    if (params.recommendedIngredients) parsedIngredients = JSON.parse(params.recommendedIngredients as string)
    if (params.morningRoutine) parsedMorningRoutine = JSON.parse(params.morningRoutine as string)
    if (params.eveningRoutine) parsedEveningRoutine = JSON.parse(params.eveningRoutine as string)
  } catch (e) {
    console.log("Error parsing legacy data:", e)
  }

  const patientFriendlyDesc = getPatientFriendlyDescription(skinType)
  
  return {
    skinType: skinType,
    clinicalName: getClinicalName(skinType),
    clinicalDescription: patientFriendlyDesc,
    clinicalPresentation: getClinicalPresentation(skinType),
    firestoreId: params.firestoreId as string || "",
    
    dailyProtocol: {
      morning: getMorningRoutine(skinType, parsedMorningRoutine),
      evening: getEveningRoutine(skinType, parsedEveningRoutine),
      weekly: getWeeklyTreatments(skinType)
    },
    
    prescriptiveIngredients: {
      essential: getEssentialIngredients(skinType, parsedIngredients),
      avoid: getAvoidIngredients(skinType, parsedAvoid)
    },
    
    formulationGuide: getFormulationGuide(skinType),
    environmentalAdaptation: getEnvironmentalAdaptation(skinType),
    contraindications: getContraindications(skinType),
    systemicFactors: getSystemicFactors(skinType),
    treatmentOutcomes: getTreatmentOutcomes(skinType)
  }
}

// Helper functions for patient-friendly content
const getClinicalName = (skinType: string): string => {
  const names: {[key: string]: string} = {
    "Normal": "Balanced Skin Type",
    "Oily": "Sebaceous Skin Type (Oily)",
    "Dry": "Alipidic Skin Type (Dry)",
    "Combination": "Mixed Skin Type (Combination)",
    "Sensitive": "Reactive Skin Type (Sensitive)"
  }
  return names[skinType] || skinType + " Skin"
}

const getPatientFriendlyDescription = (skinType: string): string => {
  const descriptions: {[key: string]: string} = {
    "Normal": "Your skin has a healthy balance - not too oily and not too dry. The pores are small, texture is smooth, and there are few imperfections. This means your skin's protective barrier is working well to keep moisture in and irritants out. You're lucky to have this balanced skin type that handles most products well.",
    "Oily": "Your skin produces more natural oil (sebum) than other types. You might notice shine on your face, especially in the 'T-zone' (forehead, nose, and chin). Pores may look larger and you may be prone to blackheads or breakouts. This happens because your oil glands are more active. The good news is that oily skin tends to age slower and develop fewer wrinkles!",
    "Dry": "Your skin doesn't produce enough natural oils, which can make it feel tight, rough, or flaky. You might notice fine lines more easily and your skin may feel uncomfortable after washing. This means your skin's protective barrier needs extra help to lock in moisture. Dry skin needs gentle, nourishing products that add hydration without stripping.",
    "Combination": "Your skin has different needs in different areas. The center of your face (forehead, nose, chin) tends to be oily with visible pores, while your cheeks and outer areas are normal or dry. This is actually very common - about 70% of people have combination skin. The key is using the right products in the right areas.",
    "Sensitive": "Your skin reacts easily to products or environmental changes. You might experience redness, itching, burning, or stinging. This means your skin's protective barrier is easily triggered and needs gentle, calming ingredients to stay comfortable. Sensitive skin requires a 'less is more' approach with fragrance-free, soothing products."
  }
  return descriptions[skinType] || "Based on your assessment, here's a personalized skincare plan designed for your specific skin type."
}

const getClinicalPresentation = (skinType: string): string[] => {
  const presentations: {[key: string]: string[]} = {
    "Normal": [
      "Your skin produces the right amount of oil in all areas",
      "Pores are barely visible and skin texture feels smooth",
      "You rarely experience breakouts or sensitivity",
      "Skin feels comfortable - not too oily, not too dry"
    ],
    "Oily": [
      "Excess shine appears within a few hours of washing",
      "Pores look larger, especially on nose, chin, and forehead",
      "You're prone to blackheads, whiteheads, and occasional breakouts",
      "Makeup may not stay in place as long as you'd like"
    ],
    "Dry": [
      "Skin feels tight, especially after washing",
      "You notice flakiness or rough patches on cheeks and around mouth",
      "Fine lines may appear more noticeable",
      "Skin can feel itchy or uncomfortable in dry environments"
    ],
    "Combination": [
      "T-zone (forehead, nose, chin) gets shiny during the day",
      "Cheeks feel normal or dry, especially in winter",
      "Pores are visible only in the center of your face",
      "You need different products for different areas"
    ],
    "Sensitive": [
      "Skin reacts to new products with redness or stinging",
      "You feel burning or itching with certain ingredients",
      "Weather changes, stress, or spicy foods can trigger reactions",
      "Skin may look flushed or blotchy at times"
    ]
  }
  return presentations[skinType] || [
    "Your skin has unique characteristics that require personalized care",
    "Understanding your skin's needs helps choose the right products",
    "Regular observation helps track what works best for you"
  ]
}

const getMorningRoutine = (skinType: string, fallback: string[] = []): Array<{ step: string, purpose: string, frequency: string }> => {
  if (fallback && fallback.length > 0) {
    return fallback.map(step => ({
      step: step,
      purpose: "Helps maintain healthy skin function",
      frequency: "Every morning"
    }))
  }

  const routines: {[key: string]: Array<{ step: string, purpose: string, frequency: string }>} = {
    "Normal": [
      { step: "Cleanse with a gentle, pH-balanced cleanser", purpose: "Remove overnight impurities without stripping natural oils", frequency: "Daily" },
      { step: "Apply vitamin C serum (optional but recommended)", purpose: "Protect against environmental damage and brighten skin", frequency: "Daily" },
      { step: "Use a lightweight moisturizer", purpose: "Maintain skin's natural moisture balance", frequency: "Daily" },
      { step: "Apply broad-spectrum sunscreen SPF 30+", purpose: "Protect from UV damage and prevent premature aging", frequency: "Daily - last step" }
    ],
    "Oily": [
      { step: "Cleanse with a gentle foaming or gel cleanser", purpose: "Remove excess oil without over-drying", frequency: "Daily" },
      { step: "Apply oil-free, lightweight moisturizer", purpose: "Hydrate without clogging pores", frequency: "Daily" },
      { step: "Use a mattifying sunscreen SPF 30+", purpose: "Control shine while protecting from sun damage", frequency: "Daily - last step" }
    ],
    "Dry": [
      { step: "Cleanse with a creamy, non-foaming cleanser", purpose: "Clean without stripping precious moisture", frequency: "Daily" },
      { step: "Apply hydrating serum with hyaluronic acid", purpose: "Attract moisture to the skin", frequency: "Daily" },
      { step: "Use a rich moisturizer with ceramides", purpose: "Lock in hydration and repair skin barrier", frequency: "Daily" },
      { step: "Apply moisturizing sunscreen SPF 30+", purpose: "Protect while keeping skin hydrated", frequency: "Daily - last step" }
    ],
    "Combination": [
      { step: "Cleanse with a gentle, balancing cleanser", purpose: "Clean T-zone without drying cheeks", frequency: "Daily" },
      { step: "Apply lightweight moisturizer all over", purpose: "Basic hydration for entire face", frequency: "Daily" },
      { step: "Use oil-controlling products on T-zone only if needed", purpose: "Target oily areas without disturbing cheeks", frequency: "As needed" },
      { step: "Apply sunscreen SPF 30+ to entire face", purpose: "Essential protection for all skin types", frequency: "Daily - last step" }
    ],
    "Sensitive": [
      { step: "Cleanse with a fragrance-free, gentle cleanser", purpose: "Remove impurities without irritation", frequency: "Daily" },
      { step: "Apply soothing serum with ingredients like niacinamide", purpose: "Calm inflammation and strengthen skin barrier", frequency: "Daily" },
      { step: "Use a simple, fragrance-free moisturizer", purpose: "Hydrate without triggering reactions", frequency: "Daily" },
      { step: "Apply mineral sunscreen (zinc oxide/titanium dioxide)", purpose: "Gentle protection that's less likely to irritate", frequency: "Daily - last step" }
    ]
  }
  return routines[skinType] || routines["Normal"]
}

const getEveningRoutine = (skinType: string, fallback: string[] = []): Array<{ step: string, purpose: string, frequency: string }> => {
  if (fallback && fallback.length > 0) {
    return fallback.map(step => ({
      step: step,
      purpose: "Supports skin's natural overnight repair process",
      frequency: "Every evening"
    }))
  }

  const routines: {[key: string]: Array<{ step: string, purpose: string, frequency: string }>} = {
    "Normal": [
      { step: "Double cleanse: oil-based then water-based cleanser", purpose: "Remove makeup, sunscreen, and daily buildup thoroughly", frequency: "Daily" },
      { step: "Apply treatment serum (retinol or peptides)", purpose: "Support collagen production and cell turnover while you sleep", frequency: "3-4 times weekly" },
      { step: "Use night moisturizer or cream", purpose: "Provide deeper hydration during overnight repair", frequency: "Daily" },
      { step: "Apply eye cream", purpose: "Target delicate under-eye area with extra moisture", frequency: "Daily" }
    ],
    "Oily": [
      { step: "Double cleanse to remove all oil and buildup", purpose: "Prevent clogged pores and breakouts", frequency: "Daily" },
      { step: "Use salicylic acid treatment 2-3 times weekly", purpose: "Gently exfoliate inside pores to prevent blackheads", frequency: "2-3 times weekly" },
      { step: "Apply oil-free, gel-based night moisturizer", purpose: "Hydrate without adding excess oil", frequency: "Daily" },
      { step: "Use clay mask once weekly", purpose: "Deep clean pores and absorb excess oil", frequency: "Weekly" }
    ],
    "Dry": [
      { step: "Cleanse with cream or milk cleanser", purpose: "Remove impurities while adding moisture", frequency: "Daily" },
      { step: "Apply hydrating serum or facial oil", purpose: "Provide intense moisture while you sleep", frequency: "Daily" },
      { step: "Use rich night cream with ceramides", purpose: "Repair skin barrier overnight", frequency: "Daily" },
      { step: "Apply overnight sleeping mask 2-3 times weekly", purpose: "Extra hydration boost for very dry skin", frequency: "2-3 times weekly" }
    ],
    "Combination": [
      { step: "Double cleanse or use micellar water", purpose: "Remove all traces of the day", frequency: "Daily" },
      { step: "Apply toner or essence", purpose: "Balance and prep skin for treatments", frequency: "Daily" },
      { step: "Use retinol or gentle exfoliant on T-zone only", purpose: "Target concerns without over-treating dry areas", frequency: "2-3 times weekly" },
      { step: "Apply night moisturizer - lighter on T-zone, richer on cheeks", purpose: "Customize hydration for different areas", frequency: "Daily" }
    ],
    "Sensitive": [
      { step: "Cleanse with ultra-gentle, milky cleanser", purpose: "Remove impurities without stripping", frequency: "Daily" },
      { step: "Apply calming ingredients (centella, green tea)", purpose: "Reduce redness and soothe irritation", frequency: "Daily" },
      { step: "Use barrier-repair night cream", purpose: "Strengthen skin's protective layer", frequency: "Daily" },
      { step: "Skip actives if skin feels irritated", purpose: "Listen to your skin and give it rest when needed", frequency: "As needed" }
    ]
  }
  return routines[skinType] || routines["Normal"]
}

const getWeeklyTreatments = (skinType: string): Array<{ treatment: string, frequency: string, purpose: string }> => {
  const treatments: {[key: string]: Array<{ treatment: string, frequency: string, purpose: string }>} = {
    "Normal": [
      { treatment: "Gentle exfoliation", frequency: "1-2 times weekly", purpose: "Remove dead skin cells for brighter complexion" },
      { treatment: "Hydrating sheet mask", frequency: "1 time weekly", purpose: "Boost moisture and relaxation" }
    ],
    "Oily": [
      { treatment: "Salicylic acid or clay mask", frequency: "1-2 times weekly", purpose: "Deep clean pores and control excess oil" },
      { treatment: "Gentle physical scrub", frequency: "1 time weekly", purpose: "Smooth skin texture" }
    ],
    "Dry": [
      { treatment: "Hydrating mask", frequency: "2-3 times weekly", purpose: "Intense moisture boost" },
      { treatment: "Facial oil massage", frequency: "1-2 times weekly", purpose: "Improve circulation and moisture retention" }
    ],
    "Combination": [
      { treatment: "Multi-mask: clay on T-zone, hydrating on cheeks", frequency: "1-2 times weekly", purpose: "Address different needs in different areas" },
      { treatment: "Gentle exfoliation", frequency: "1 time weekly", purpose: "Smooth overall texture" }
    ],
    "Sensitive": [
      { treatment: "Soothing mask (aloe, oatmeal, centella)", frequency: "1-2 times weekly", purpose: "Calm and comfort reactive skin" },
      { treatment: "Skip actives and focus on hydration", frequency: "As needed", purpose: "Give skin a break when irritated" }
    ]
  }
  return treatments[skinType] || treatments["Normal"]
}

const getEssentialIngredients = (skinType: string, fallback: string[] = []): Array<{ name: string, concentration?: string, mechanism: string, evidence: string }> => {
  if (fallback && fallback.length > 0) {
    return fallback.slice(0, 4).map(ing => ({
      name: ing,
      mechanism: "Supports healthy skin function",
      evidence: "Clinically studied"
    }))
  }

  const ingredients: {[key: string]: Array<{ name: string, concentration?: string, mechanism: string, evidence: string }>} = {
    "Normal": [
      { name: "Vitamin C", concentration: "10-15%", mechanism: "Brightens skin and protects from environmental damage", evidence: "Strong" },
      { name: "Hyaluronic Acid", concentration: "1-2%", mechanism: "Holds up to 1000x its weight in water for deep hydration", evidence: "Strong" },
      { name: "Niacinamide", concentration: "4-5%", mechanism: "Improves skin barrier and evens skin tone", evidence: "Strong" },
      { name: "Peptides", mechanism: "Signal skin to produce more collagen", evidence: "Moderate" }
    ],
    "Oily": [
      { name: "Salicylic Acid", concentration: "0.5-2%", mechanism: "Penetrates pores to clear clogs and prevent breakouts", evidence: "Strong" },
      { name: "Niacinamide", concentration: "4-5%", mechanism: "Regulates oil production and calms inflammation", evidence: "Strong" },
      { name: "Retinoids", concentration: "0.3-1%", mechanism: "Speeds cell turnover to keep pores clear", evidence: "Strong" },
      { name: "Zinc", mechanism: "Soothes inflammation and controls oil", evidence: "Moderate" }
    ],
    "Dry": [
      { name: "Ceramides", mechanism: "Restore and maintain skin's protective barrier", evidence: "Strong" },
      { name: "Hyaluronic Acid", concentration: "1-2%", mechanism: "Attracts moisture like a sponge", evidence: "Strong" },
      { name: "Shea Butter", mechanism: "Provides rich nourishment and locks in moisture", evidence: "Moderate" },
      { name: "Squalane", mechanism: "Mimics skin's natural oils for deep hydration", evidence: "Strong" }
    ],
    "Combination": [
      { name: "Niacinamide", concentration: "4-5%", mechanism: "Balances oil in T-zone while supporting barrier on cheeks", evidence: "Strong" },
      { name: "Hyaluronic Acid", mechanism: "Provides hydration without feeling heavy", evidence: "Strong" },
      { name: "Gentle AHAs", concentration: "5-7%", mechanism: "Smooth texture without irritation", evidence: "Moderate" },
      { name: "Green Tea Extract", mechanism: "Antioxidant protection for all areas", evidence: "Moderate" }
    ],
    "Sensitive": [
      { name: "Centella Asiatica", mechanism: "Calms irritation and supports healing", evidence: "Strong" },
      { name: "Ceramides", mechanism: "Repair and strengthen sensitive skin barrier", evidence: "Strong" },
      { name: "Oat Extract", mechanism: "Soothes itching and reduces redness", evidence: "Moderate" },
      { name: "Niacinamide", concentration: "2-4%", mechanism: "Gentle barrier support without irritation", evidence: "Strong" }
    ]
  }
  return ingredients[skinType] || ingredients["Normal"]
}

const getAvoidIngredients = (skinType: string, fallback: string[] = []): Array<{ name: string, reason: string, severity: 'High' | 'Moderate' | 'Low' }> => {
  if (fallback && fallback.length > 0) {
    return fallback.slice(0, 4).map(ing => ({
      name: ing,
      reason: "May irritate your skin type",
      severity: "Moderate" as 'High' | 'Moderate' | 'Low'
    }))
  }

  const avoid: {[key: string]: Array<{ name: string, reason: string, severity: 'High' | 'Moderate' | 'Low' }>} = {
    "Normal": [
      { name: "Denatured Alcohol", reason: "Can strip natural oils over time", severity: "Low" },
      { name: "Harsh Sulfates (SLS)", reason: "May be too drying with frequent use", severity: "Low" }
    ],
    "Oily": [
      { name: "Heavy oils (coconut oil, mineral oil)", reason: "Can clog pores and cause breakouts", severity: "High" },
      { name: "Denatured Alcohol", reason: "Dries out skin temporarily but can cause rebound oil production", severity: "Moderate" },
      { name: "Comedogenic ingredients", reason: "Specifically formulated to avoid pore-clogging", severity: "High" }
    ],
    "Dry": [
      { name: "Denatured Alcohol", reason: "Extremely drying and strips essential moisture", severity: "High" },
      { name: "Sulfates (SLS)", reason: "Strip natural oils and worsen dryness", severity: "High" },
      { name: "Fragrance", reason: "Can irritate already compromised skin barrier", severity: "Moderate" },
      { name: "High-concentration AHAs", reason: "May over-exfoliate and increase dryness", severity: "Moderate" }
    ],
    "Combination": [
      { name: "Denatured Alcohol", reason: "Can over-dry cheeks while T-zone compensates with more oil", severity: "Moderate" },
      { name: "Heavy creams on T-zone", reason: "May clog pores in oily areas", severity: "Moderate" },
      { name: "Harsh astringents", reason: "Disrupt natural balance", severity: "Moderate" }
    ],
    "Sensitive": [
      { name: "Fragrance/Parfum", reason: "Common cause of allergic reactions and irritation", severity: "High" },
      { name: "Essential Oils", reason: "Can be irritating even though natural", severity: "High" },
      { name: "Denatured Alcohol", reason: "Burns and strips sensitive skin", severity: "High" },
      { name: "Harsh preservatives", reason: "May trigger contact dermatitis", severity: "Moderate" },
      { name: "Physical scrubs", reason: "Can cause micro-tears in sensitive skin", severity: "Moderate" }
    ]
  }
  return avoid[skinType] || [
    { name: "Denatured Alcohol", reason: "Can be drying for many skin types", severity: "Moderate" },
    { name: "Harsh fragrances", reason: "May cause unnecessary irritation", severity: "Low" }
  ]
}

const getFormulationGuide = (skinType: string): ClinicalSkinData['formulationGuide'] => {
  const guides: {[key: string]: ClinicalSkinData['formulationGuide']} = {
    "Normal": {
      cleanser: { type: "Gentle, pH-balanced cleanser", rationale: "Cleans without stripping", pH: "5.5" },
      moisturizer: { type: "Lightweight lotion", rationale: "Maintains natural balance", keyComponents: ["Ceramides", "Glycerin"] },
      sunscreen: { type: "Any broad-spectrum", spf_minimum: 30, rationale: "Daily protection" },
      treatment: { type: "Vitamin C serum", rationale: "Antioxidant protection", frequency: "Morning" }
    },
    "Oily": {
      cleanser: { type: "Gel or foaming cleanser", rationale: "Removes excess oil effectively", pH: "5.0-5.5" },
      moisturizer: { type: "Oil-free gel or lotion", rationale: "Hydrates without clogging pores", keyComponents: ["Hyaluronic Acid", "Niacinamide"] },
      sunscreen: { type: "Oil-free, mattifying", spf_minimum: 30, rationale: "Protects without adding shine" },
      treatment: { type: "Salicylic acid or retinoid", rationale: "Keeps pores clear", frequency: "Evening, 2-3x weekly" }
    },
    "Dry": {
      cleanser: { type: "Cream or milk cleanser", rationale: "Cleans while adding moisture", pH: "5.5-6.0" },
      moisturizer: { type: "Rich cream or balm", rationale: "Locks in moisture all day", keyComponents: ["Ceramides", "Shea Butter", "Squalane"] },
      sunscreen: { type: "Hydrating sunscreen", spf_minimum: 30, rationale: "Protects without drying" },
      treatment: { type: "Hydrating serum", rationale: "Deep moisture boost", frequency: "Morning and evening" }
    },
    "Combination": {
      cleanser: { type: "Gentle, balancing cleanser", rationale: "Cleans without over-drying any area", pH: "5.5" },
      moisturizer: { type: "Lightweight but nourishing", rationale: "Balances different zones", keyComponents: ["Niacinamide", "Hyaluronic Acid"] },
      sunscreen: { type: "Universal formula", spf_minimum: 30, rationale: "Works for all areas" },
      treatment: { type: "Targeted treatments", rationale: "Different products for different zones", frequency: "As needed" }
    },
    "Sensitive": {
      cleanser: { type: "Fragrance-free, gentle cleanser", rationale: "Cleans without irritation", pH: "5.5" },
      moisturizer: { type: "Simple, soothing moisturizer", rationale: "Hydrates without triggering reactions", keyComponents: ["Ceramides", "Centella", "Oat"] },
      sunscreen: { type: "Mineral sunscreen (zinc oxide)", spf_minimum: 30, rationale: "Less irritating than chemical sunscreens" },
      treatment: { type: "Barrier repair cream", rationale: "Strengthens sensitive skin", frequency: "Daily" }
    }
  }
  return guides[skinType] || guides["Normal"]
}

const getEnvironmentalAdaptation = (skinType: string): ClinicalSkinData['environmentalAdaptation'] => {
  const base: ClinicalSkinData['environmentalAdaptation'] = {
    summer: [
      { recommendation: "Use lighter, gel-based moisturizers", rationale: "Prevents feeling heavy in humidity" },
      { recommendation: "Apply water-resistant sunscreen", rationale: "Stays on longer with sweat" }
    ],
    winter: [
      { recommendation: "Switch to richer moisturizers", rationale: "Combat dry indoor heating and cold wind" },
      { recommendation: "Use humidifier at night", rationale: "Adds moisture back to dry winter air" }
    ],
    humid: [
      { recommendation: "Choose oil-free products", rationale: "Prevents clogged pores in humidity" },
      { recommendation: "Cleanse twice daily", rationale: "Removes sweat and buildup" }
    ],
    dry: [
      { recommendation: "Layer hydrating products", rationale: "Multiple thin layers hold more moisture" },
      { recommendation: "Avoid hot showers", rationale: "Hot water strips natural oils" }
    ]
  }

  if (skinType === "Oily") {
    base.summer.push({ recommendation: "Use blotting papers during the day", rationale: "Removes excess oil without disturbing makeup" })
    base.winter.push({ recommendation: "Don't skip moisturizer in winter", rationale: "Oily skin can still get dehydrated in cold" })
  } else if (skinType === "Dry") {
    base.summer.push({ recommendation: "Don't switch to too-light products in summer", rationale: "Dry skin needs moisture year-round" })
    base.winter.push({ recommendation: "Apply moisturizer to damp skin", rationale: "Locks in more moisture" })
  } else if (skinType === "Sensitive") {
    base.summer.push({ recommendation: "Avoid direct sun during peak hours", rationale: "Sensitive skin burns more easily" })
    base.winter.push({ recommendation: "Protect face with scarf in wind", rationale: "Prevents windburn" })
  }

  return base
}

const getContraindications = (skinType: string): Array<{ factor: string, risk: 'High' | 'Moderate' | 'Low', management: string }> => {
  const base: Array<{ factor: string, risk: 'High' | 'Moderate' | 'Low', management: string }> = [
    { factor: "Active acne breakouts", risk: "Moderate", management: "Consult dermatologist for prescription options" },
    { factor: "Pregnancy/breastfeeding", risk: "Moderate", management: "Avoid retinoids and high-dose salicylic acid" }
  ]

  if (skinType === "Oily") {
    base.push(
      { factor: "Severe cystic acne", risk: "High", management: "Seek professional treatment - over-the-counter may not be enough" },
      { factor: "Using heavy, pore-clogging products", risk: "High", management: "Check labels for 'non-comedogenic' products" }
    )
  } else if (skinType === "Dry") {
    base.push(
      { factor: "Eczema or atopic dermatitis", risk: "High", management: "Use gentle, fragrance-free products and see a dermatologist" },
      { factor: "Over-exfoliation", risk: "Moderate", management: "Limit exfoliation to 1-2 times weekly" }
    )
  } else if (skinType === "Sensitive") {
    base.push(
      { factor: "Rosacea", risk: "High", management: "Avoid triggers like spicy food, alcohol, and extreme temperatures" },
      { factor: "Contact dermatitis history", risk: "High", management: "Patch test all new products for 24-48 hours" },
      { factor: "Multiple product allergies", risk: "High", management: "Keep a skincare diary to identify triggers" }
    )
  }

  return base
}

const getSystemicFactors = (skinType: string): ClinicalSkinData['systemicFactors'] => {
  const base: ClinicalSkinData['systemicFactors'] = {
    diet: [
      { recommendation: "Eat a balanced diet with plenty of vegetables", rationale: "Provides vitamins for skin health", evidence: "Strong" },
      { recommendation: "Include healthy fats (avocado, nuts, fish)", rationale: "Supports skin barrier function", evidence: "Moderate" }
    ],
    sleep: { recommendation: "Aim for 7-9 hours of quality sleep", rationale: "Skin repairs itself while you sleep" },
    hydration: { amount: "8-10 glasses of water daily", rationale: "Helps maintain skin moisture from within" },
    exercise: { 
      recommendation: "Regular physical activity (30 minutes, 3-5 times weekly)", 
      precautions: ["Shower soon after sweating to prevent clogged pores"]
    }
  }

  if (skinType === "Oily") {
    base.diet.push(
      { recommendation: "Consider reducing high-glycemic foods (sugar, white bread, sugary drinks)", rationale: "May help control oil production and reduce breakouts", evidence: "Moderate" }
    )
    base.exercise.precautions = ["Shower immediately after exercise", "Use oil-control wipes if you can't shower right away"]
  } else if (skinType === "Dry") {
    base.diet.push(
      { recommendation: "Increase omega-3 fatty acids (salmon, walnuts, flaxseed, fish oil)", rationale: "Helps skin retain moisture and reduces inflammation", evidence: "Moderate" }
    )
    base.supplements = [
      { name: "Fish oil or Omega-3", dosage: "1000mg daily", purpose: "Supports skin hydration and reduces inflammation" },
      { name: "Vitamin D", dosage: "600-800 IU daily", purpose: "Supports skin barrier function" }
    ]
    base.exercise.precautions = ["Apply moisturizer before exercise in dry/cold weather", "Use gentle, hydrating cleanser post-workout"]
  } else if (skinType === "Sensitive") {
    base.diet.push(
      { recommendation: "Keep a food diary to identify potential triggers", rationale: "Some foods (spicy foods, alcohol, histamine-rich foods) may cause flare-ups", evidence: "Limited" }
    )
    base.stress = {
      impact: "Stress can trigger inflammation, sensitivity, and flare-ups",
      management: ["Meditation (10-15 minutes daily)", "Deep breathing exercises", "Adequate sleep (7-9 hours)", "Gentle yoga or stretching"]
    }
    base.exercise.precautions = ["Avoid overheating during exercise", "Choose cool environments for working out", "Rinse face with cool water after sweating", "Use gentle, fragrance-free products post-exercise"]
  } else if (skinType === "Combination") {
    base.exercise.precautions = ["Cleanse face thoroughly after sweating", "Pay attention to how different areas react to sweat"]
  }

  return base
}

const getTreatmentOutcomes = (skinType: string): ClinicalSkinData['treatmentOutcomes'] => {
  const outcomes: {[key: string]: ClinicalSkinData['treatmentOutcomes']} = {
    "Normal": {
      expected_timeline: "2-4 weeks to see maintenance results",
      monitoring_parameters: [
        "Overall skin comfort",
        "Any changes in texture",
        "Reaction to new products"
      ],
      when_to_escalate: [
        "If you develop unusual breakouts",
        "If skin becomes irritated or reactive"
      ]
    },
    "Oily": {
      expected_timeline: "4-6 weeks to see improvement in oil control",
      monitoring_parameters: [
        "Shine levels throughout the day",
        "Frequency of breakouts",
        "Pore appearance"
      ],
      when_to_escalate: [
        "If breakouts become cystic or painful",
        "If over-the-counter products aren't helping after 8 weeks"
      ]
    },
    "Dry": {
      expected_timeline: "2-3 weeks to feel improvement in comfort",
      monitoring_parameters: [
        "Tightness after washing",
        "Flakiness or rough patches",
        "Fine line appearance"
      ],
      when_to_escalate: [
        "If skin becomes cracked or painful",
        "If redness or itching develops"
      ]
    },
    "Combination": {
      expected_timeline: "3-4 weeks to find the right balance",
      monitoring_parameters: [
        "How T-zone and cheeks feel differently",
        "Breakouts in oily areas",
        "Dryness in cheek areas"
      ],
      when_to_escalate: [
        "If one area becomes significantly worse",
        "If balancing products aren't helping"
      ]
    },
    "Sensitive": {
      expected_timeline: "2-3 weeks to see reduced reactivity",
      monitoring_parameters: [
        "Redness after product application",
        "Stinging or burning sensations",
        "Reactions to environmental triggers"
      ],
      when_to_escalate: [
        "If reactions become more frequent or severe",
        "If you develop rashes or hives"
      ]
    }
  }
  return outcomes[skinType] || outcomes["Normal"]
}

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [clinicalData, setClinicalData] = useState<ClinicalSkinData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    clinical: true,
    protocol: false,
    ingredients: false,
    formulation: false,
    environment: false,
    contraindications: false,
    systemic: false,
    outcomes: false
  })
  const [isSaving, setIsSaving] = useState(false)
  const hasSavedRef = useRef(false)

  // Save function that won't cause infinite loops
  const saveClinicalData = useCallback(async (data: ClinicalSkinData) => {
    if (isSaving || hasSavedRef.current) return
    
    hasSavedRef.current = true
    setIsSaving(true)
    
    try {
      await AsyncStorage.setItem("lastClinicalSkinResult", JSON.stringify({
        ...data,
        timestamp: Date.now(),
        id: Date.now().toString()
      }))

      const savedResult: ExtendedSavedResult = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        skinType: data.skinType,
        clinicalName: data.clinicalName,
        clinicalDescription: data.clinicalDescription,
        clinicalPresentation: data.clinicalPresentation,
        description: data.clinicalDescription,
        tips: data.clinicalPresentation,
        avoid: data.prescriptiveIngredients.avoid.map(a => a.name),
        recommendedIngredients: data.prescriptiveIngredients.essential.map(e => e.name),
        sideEffects: [],
        dailyProtocol: data.dailyProtocol,
        prescriptiveIngredients: data.prescriptiveIngredients,
        formulationGuide: data.formulationGuide,
        environmentalAdaptation: data.environmentalAdaptation,
        contraindications: data.contraindications,
        systemicFactors: data.systemicFactors,
        treatmentOutcomes: data.treatmentOutcomes,
        firestoreId: data.firestoreId
      }
      
      await saveSkinTypeResult(savedResult)
      console.log("Successfully saved skin type result:", data.skinType)
    } catch (error) {
      console.error("Error saving clinical data:", error)
      hasSavedRef.current = false
    } finally {
      setIsSaving(false)
    }
  }, [isSaving])

  // Convert Firestore document to ClinicalSkinData format - USING EXACT DATA FROM FIRESTORE
  const convertFirestoreToClinical = (firestoreDoc: any): ClinicalSkinData => {
    const skinType = firestoreDoc.skinType?.replace(" Skin", "") || "Normal"
    
    // Parse stored JSON data
    let dailyRoutine = firestoreDoc.dailyRoutine || { morning: [], evening: [] }
    let ingredients = firestoreDoc.ingredients || { lookFor: [], avoid: [] }
    let productTextures = firestoreDoc.productTextures || {}
    let seasonalCare = firestoreDoc.seasonalCare || { summer: [], winter: [], monsoon: [] }
    let mistakes = firestoreDoc.mistakes || []
    let lifestyle = firestoreDoc.lifestyle || {}
    
    // Handle string parsing if needed
    if (typeof dailyRoutine === 'string') {
      try { dailyRoutine = JSON.parse(dailyRoutine) } catch(e) { dailyRoutine = { morning: [], evening: [] } }
    }
    if (typeof ingredients === 'string') {
      try { ingredients = JSON.parse(ingredients) } catch(e) { ingredients = { lookFor: [], avoid: [] } }
    }
    if (typeof productTextures === 'string') {
      try { productTextures = JSON.parse(productTextures) } catch(e) { productTextures = {} }
    }
    if (typeof seasonalCare === 'string') {
      try { seasonalCare = JSON.parse(seasonalCare) } catch(e) { seasonalCare = { summer: [], winter: [], monsoon: [] } }
    }
    if (typeof mistakes === 'string') {
      try { mistakes = JSON.parse(mistakes) } catch(e) { mistakes = [] }
    }
    if (typeof lifestyle === 'string') {
      try { lifestyle = JSON.parse(lifestyle) } catch(e) { lifestyle = {} }
    }
    
    // Convert Firestore data to ClinicalSkinData format - USE EXACT DATA FROM FIRESTORE
    return {
      skinType: skinType,
      clinicalName: getClinicalName(skinType),
      clinicalDescription: firestoreDoc.clinicalDescription || getPatientFriendlyDescription(skinType),
      clinicalPresentation: getClinicalPresentation(skinType),
      firestoreId: firestoreDoc.id,
      
      dailyProtocol: {
        morning: (dailyRoutine.morning || []).map((step: string) => ({
          step: step,
          purpose: "Helps maintain healthy skin function",
          frequency: "Daily"
        })),
        evening: (dailyRoutine.evening || []).map((step: string) => ({
          step: step,
          purpose: "Supports skin's natural repair process",
          frequency: "Daily"
        })),
        weekly: getWeeklyTreatments(skinType)
      },
      
      prescriptiveIngredients: {
        essential: (ingredients.lookFor || []).map((ing: string) => {
          const parts = typeof ing === 'string' ? ing.split(" - ") : [ing, ""]
          return {
            name: parts[0],
            mechanism: parts[1] || "Supports healthy skin function",
            evidence: "Strong"
          }
        }),
        avoid: (ingredients.avoid || []).map((ing: string) => {
          const parts = typeof ing === 'string' ? ing.split(" - ") : [ing, ""]
          return {
            name: parts[0],
            reason: parts[1] || "May irritate your skin",
            severity: "Moderate" as 'High' | 'Moderate' | 'Low'
          }
        })
      },
      
      //  USE EXACT DATA FROM FIRESTORE FOR PRODUCT TEXTURES
      formulationGuide: {
        cleanser: {
          type: productTextures.cleanser || getFormulationGuide(skinType).cleanser.type,
          rationale: productTextures.cleanser ? "Based on your skin analysis" : getFormulationGuide(skinType).cleanser.rationale,
          pH: getFormulationGuide(skinType).cleanser.pH
        },
        moisturizer: {
          type: productTextures.moisturizer || getFormulationGuide(skinType).moisturizer.type,
          rationale: productTextures.moisturizer ? "Based on your skin analysis" : getFormulationGuide(skinType).moisturizer.rationale,
          keyComponents: getFormulationGuide(skinType).moisturizer.keyComponents
        },
        sunscreen: {
          type: productTextures.sunscreen || getFormulationGuide(skinType).sunscreen.type,
          spf_minimum: 30,
          rationale: productTextures.sunscreen ? "Based on your skin analysis" : getFormulationGuide(skinType).sunscreen.rationale
        },
        treatment: {
          type: productTextures.serum || getFormulationGuide(skinType).treatment.type,
          rationale: "Based on your skin analysis",
          frequency: getFormulationGuide(skinType).treatment.frequency
        }
      },
      
      // USE EXACT DATA FROM FIRESTORE FOR SEASONAL CARE
      environmentalAdaptation: {
        summer: (seasonalCare.summer || []).map((rec: string) => ({
          recommendation: rec,
          rationale: "Based on your skin analysis"
        })),
        winter: (seasonalCare.winter || []).map((rec: string) => ({
          recommendation: rec,
          rationale: "Based on your skin analysis"
        })),
        humid: (seasonalCare.monsoon || []).map((rec: string) => ({
          recommendation: rec,
          rationale: "Based on your skin analysis"
        })),
        dry: getEnvironmentalAdaptation(skinType).dry
      },
      
      //  USE EXACT DATA FROM FIRESTORE FOR MISTAKES
      contraindications: (mistakes || []).map((mistake: string) => ({
        factor: mistake,
        risk: "Moderate" as 'High' | 'Moderate' | 'Low',
        management: "Follow the skincare routine recommended above"
      })),
      
      //  USE EXACT DATA FROM FIRESTORE FOR LIFESTYLE
      systemicFactors: {
        diet: (lifestyle.diet || []).map((item: string) => ({
          recommendation: item,
          rationale: "Based on your skin analysis",
          evidence: "Moderate"
        })),
        sleep: {
          recommendation: lifestyle.sleep || "7-9 hours of quality sleep",
          rationale: "Skin repairs itself during sleep"
        },
        hydration: {
          amount: lifestyle.water || "8-10 glasses daily",
          rationale: "Maintains skin hydration from within"
        },
        exercise: {
          recommendation: lifestyle.exercise || "Regular physical activity 3-5 times weekly",
          precautions: ["Cleanse face after sweating"]
        }
      },
      
      treatmentOutcomes: getTreatmentOutcomes(skinType)
    }
  }

  // Load data from Firestore or params
  useEffect(() => {
    let isMounted = true
    
    const loadData = async () => {
      setLoading(true)
      
      try {
        let parsedData: ClinicalSkinData | null = null
        
        // Check if we have a firestoreId in params
        const firestoreId = params.firestoreId as string
        
        if (firestoreId && firestoreId.length > 0) {
          console.log("📡 Loading from Firestore with ID:", firestoreId)
          const firestoreResult = await getSkinResultById(firestoreId)
          
          if (firestoreResult && isMounted) {
            console.log("✅ Loaded data from Firestore")
            // Convert Firestore data to ClinicalSkinData format
            parsedData = convertFirestoreToClinical(firestoreResult)
          }
        }
        
        // If no Firestore data or Firestore failed, try params
        if (!parsedData && params.clinicalData) {
          parsedData = JSON.parse(params.clinicalData as string)
        } else if (!parsedData) {
          parsedData = convertLegacyToClinical(params)
        }
        
        if (isMounted && parsedData) {
          setClinicalData(parsedData)
          await saveClinicalData(parsedData)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        const legacyData = convertLegacyToClinical(params)
        if (isMounted && legacyData) {
          setClinicalData(legacyData)
          await saveClinicalData(legacyData)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    loadData()
    
    return () => {
      isMounted = false
    }
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const getRiskColor = (risk: 'High' | 'Moderate' | 'Low') => {
    switch(risk) {
      case 'High': return '#D32F2F'
      case 'Moderate': return '#F57C00'
      case 'Low': return '#4CAF50'
      default: return '#757575'
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006B5F" />
        <Text style={styles.loadingText}>Loading your skin analysis...</Text>
      </View>
    )
  }

  if (!clinicalData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No data available. Please take the quiz first.</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.push("/features/skin_type/SkinQuizScreen")}
        >
          <Text style={styles.retryButtonText}>Take Quiz</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#006B5F" />
      
      {/* Professional Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Your Skin Analysis</Text>
          <Text style={styles.headerSubtitle}>Personalized Care Plan</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Medical Disclaimer Banner */}
      <View style={styles.disclaimerBanner}>
        <Ionicons name="information-circle" size={16} color="#006B5F" />
        <Text style={styles.disclaimerText}>
          This is a personalized guide based on your answers. For medical concerns, please consult a dermatologist.
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Skin Type Header Card */}
        <View style={styles.skinTypeHeader}>
          <Text style={styles.skinTypeTitle}>{formatSkinTypeDisplay(clinicalData.skinType)}</Text>
          <Text style={styles.skinTypeSubtitle}>Your Personalized Skin Profile</Text>
          {clinicalData.firestoreId && (
            <View style={styles.savedBadge}>
              <Ionicons name="cloud-done" size={12} color="#4CAF50" />
              <Text style={styles.savedBadgeText}>Saved to cloud</Text>
            </View>
          )}
        </View>

        {/* SECTION 1: CLINICAL ASSESSMENT */}
        <Card style={styles.clinicalCard}>
          <TouchableOpacity onPress={() => toggleSection('clinical')} style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#006B5F' }]}>
                <Ionicons name="medical" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.sectionTag}>ABOUT YOUR SKIN</Text>
                <Text style={styles.sectionTitle}>What This Means For You</Text>
              </View>
            </View>
            <Ionicons 
              name={expandedSections['clinical'] ? 'chevron-up' : 'chevron-down'} 
              size={22} 
              color="#006B5F" 
            />
          </TouchableOpacity>

          {expandedSections['clinical'] && (
            <View style={styles.cardContent}>
              <Text style={styles.clinicalDesc}>{clinicalData.clinicalDescription}</Text>
              
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>What You Might Notice:</Text>
                {clinicalData.clinicalPresentation.map((item, idx) => (
                  <View key={idx} style={styles.bulletPoint}>
                    <Ionicons name="checkmark-circle" size={16} color="#006B5F" />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* SECTION 2: DAILY MEDICAL PROTOCOL */}
        <Card style={styles.protocolCard}>
          <TouchableOpacity onPress={() => toggleSection('protocol')} style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFA500' }]}>
                <Ionicons name="sunny" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.sectionTag}>YOUR DAILY ROUTINE</Text>
                <Text style={styles.sectionTitle}>Morning & Evening Care</Text>
              </View>
            </View>
            <Ionicons 
              name={expandedSections['protocol'] ? 'chevron-up' : 'chevron-down'} 
              size={22} 
              color="#006B5F" 
            />
          </TouchableOpacity>

          {expandedSections['protocol'] && (
            <View style={styles.cardContent}>
              {/* Morning Protocol */}
              <Text style={styles.routineTitle}>🌅 Morning Routine</Text>
              <Text style={styles.routineIntro}>Start your day with these steps:</Text>
              
              {clinicalData.dailyProtocol.morning.map((step, idx) => (
                <View key={`am-${idx}`} style={styles.protocolStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.stepDetails}>
                    <Text style={styles.stepText}>{step.step}</Text>
                    <Text style={styles.purposeText}>💡 {step.purpose}</Text>
                    <Text style={styles.frequencyText}>⏰ {step.frequency}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.divider} />

              {/* Evening Protocol */}
              <Text style={styles.routineTitle}>🌙 Evening Routine</Text>
              <Text style={styles.routineIntro}>Wind down with these steps:</Text>
              
              {clinicalData.dailyProtocol.evening.map((step, idx) => (
                <View key={`pm-${idx}`} style={styles.protocolStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.stepDetails}>
                    <Text style={styles.stepText}>{step.step}</Text>
                    <Text style={styles.purposeText}>💡 {step.purpose}</Text>
                    <Text style={styles.frequencyText}>⏰ {step.frequency}</Text>
                  </View>
                </View>
              ))}

              {/* Weekly Treatments */}
              {clinicalData.dailyProtocol.weekly && clinicalData.dailyProtocol.weekly.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.routineTitle}>📅 Weekly Treatments</Text>
                  <Text style={styles.routineIntro}>Add these 1-2 times per week:</Text>
                  
                  {clinicalData.dailyProtocol.weekly.map((item, idx) => (
                    <View key={`weekly-${idx}`} style={styles.weeklyItem}>
                      <View style={styles.weeklyIcon}>
                        <Ionicons name="calendar" size={16} color="#fff" />
                      </View>
                      <View style={styles.weeklyDetails}>
                        <Text style={styles.weeklyText}>{item.treatment}</Text>
                        <Text style={styles.weeklyPurpose}>{item.purpose}</Text>
                        <Text style={styles.weeklyFrequency}>{item.frequency}</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}
        </Card>

        {/* SECTION 3: PRESCRIPTIVE INGREDIENTS */}
        <Card style={styles.ingredientCard}>
          <TouchableOpacity onPress={() => toggleSection('ingredients')} style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#9C27B0' }]}>
                <Ionicons name="flask" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.sectionTag}>WHAT TO LOOK FOR</Text>
                <Text style={styles.sectionTitle}>Best Ingredients For You</Text>
              </View>
            </View>
            <Ionicons 
              name={expandedSections['ingredients'] ? 'chevron-up' : 'chevron-down'} 
              size={22} 
              color="#006B5F" 
            />
          </TouchableOpacity>

          {expandedSections['ingredients'] && (
            <View style={styles.cardContent}>
              {/* Essential Ingredients */}
              <Text style={styles.ingredientCategory}>✅ Look For These Ingredients</Text>
              <Text style={styles.categoryHint}>These ingredients are especially good for your skin type:</Text>
              
              {clinicalData.prescriptiveIngredients.essential.map((item, idx) => (
                <View key={`essential-${idx}`} style={styles.ingredientItem}>
                  <View style={styles.ingredientHeader}>
                    <Text style={styles.ingredientName}>{item.name}</Text>
                    {item.concentration && (
                      <View style={styles.concentrationBadge}>
                        <Text style={styles.concentrationText}>Try: {item.concentration}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.ingredientMechanism}>How it helps: {item.mechanism}</Text>
                  <View style={styles.evidenceRow}>
                    <Ionicons name="flask" size={12} color="#006B5F" />
                    <Text style={styles.evidenceText}>Science says: {item.evidence} evidence</Text>
                  </View>
                </View>
              ))}

              <View style={styles.divider} />

              {/* Ingredients to Avoid */}
              <Text style={[styles.ingredientCategory, { color: '#D32F2F' }]}>❌ Ingredients To Be Careful With</Text>
              <Text style={styles.categoryHint}>These might not be the best choice for your skin:</Text>
              
              {clinicalData.prescriptiveIngredients.avoid.map((item, idx) => (
                <View key={`avoid-${idx}`} style={styles.avoidItem}>
                  <View style={styles.avoidHeader}>
                    <Text style={styles.avoidName}>{item.name}</Text>
                    <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.severity) + '20' }]}>
                      <Text style={[styles.riskText, { color: getRiskColor(item.severity) }]}>
                        {item.severity} risk
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.avoidReason}>Why: {item.reason}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* SECTION 4: FORMULATION GUIDE */}
        <Card style={styles.formulationCard}>
          <TouchableOpacity onPress={() => toggleSection('formulation')} style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FF6B6B' }]}>
                <Ionicons name="cube" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.sectionTag}>PRODUCT TYPES</Text>
                <Text style={styles.sectionTitle}>What To Look For</Text>
              </View>
            </View>
            <Ionicons 
              name={expandedSections['formulation'] ? 'chevron-up' : 'chevron-down'} 
              size={22} 
              color="#006B5F" 
            />
          </TouchableOpacity>

          {expandedSections['formulation'] && (
            <View style={styles.cardContent}>
              <View style={styles.formulationGrid}>
                <View style={styles.formulationItem}>
                  <View style={styles.formulationIcon}>
                    <Ionicons name="water" size={22} color="#006B5F" />
                  </View>
                  <View style={styles.formulationContent}>
                    <Text style={styles.formulationLabel}>Cleanser</Text>
                    <Text style={styles.formulationValue}>{clinicalData.formulationGuide.cleanser.type}</Text>
                    <Text style={styles.formulationRationale}>{clinicalData.formulationGuide.cleanser.rationale}</Text>
                    {clinicalData.formulationGuide.cleanser.pH && (
                      <Text style={styles.pHText}>Ideal pH: {clinicalData.formulationGuide.cleanser.pH}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.formulationItem}>
                  <View style={styles.formulationIcon}>
                    <Ionicons name="leaf" size={22} color="#006B5F" />
                  </View>
                  <View style={styles.formulationContent}>
                    <Text style={styles.formulationLabel}>Moisturizer</Text>
                    <Text style={styles.formulationValue}>{clinicalData.formulationGuide.moisturizer.type}</Text>
                    <Text style={styles.formulationRationale}>{clinicalData.formulationGuide.moisturizer.rationale}</Text>
                  </View>
                </View>

                <View style={styles.formulationItem}>
                  <View style={styles.formulationIcon}>
                    <Ionicons name="sunny" size={22} color="#006B5F" />
                  </View>
                  <View style={styles.formulationContent}>
                    <Text style={styles.formulationLabel}>Sunscreen</Text>
                    <Text style={styles.formulationValue}>{clinicalData.formulationGuide.sunscreen.type}</Text>
                    <Text style={styles.formulationRationale}>SPF {clinicalData.formulationGuide.sunscreen.spf_minimum}+ • {clinicalData.formulationGuide.sunscreen.rationale}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* SECTION 6: CLINICAL CONTRAINDICATIONS */}
        <Card style={styles.contraindicationCard}>
          <TouchableOpacity onPress={() => toggleSection('contraindications')} style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#D32F2F' }]}>
                <Ionicons name="warning" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.sectionTag}>WHEN TO BE CAREFUL</Text>
                <Text style={styles.sectionTitle}>Special Considerations</Text>
              </View>
            </View>
            <Ionicons 
              name={expandedSections['contraindications'] ? 'chevron-up' : 'chevron-down'} 
              size={22} 
              color="#006B5F" 
            />
          </TouchableOpacity>

          {expandedSections['contraindications'] && (
            <View style={styles.cardContent}>
              {clinicalData.contraindications.map((item, idx) => (
                <View key={idx} style={styles.contraindicationItem}>
                  <View style={styles.contraindicationHeader}>
                    <Text style={styles.contraindicationFactor}>{item.factor}</Text>
                    <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.risk) + '20' }]}>
                      <Text style={[styles.riskText, { color: getRiskColor(item.risk) }]}>
                        {item.risk} concern
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.managementText}>What to do: {item.management}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* SECTION 7: SYSTEMIC FACTORS */}
        <Card style={styles.systemicCard}>
          <TouchableOpacity onPress={() => toggleSection('systemic')} style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#E91E63' }]}>
                <Ionicons name="heart" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.sectionTag}>LIFESTYLE & HEALTH</Text>
                <Text style={styles.sectionTitle}>Whole-Body Wellness</Text>
              </View>
            </View>
            <Ionicons 
              name={expandedSections['systemic'] ? 'chevron-up' : 'chevron-down'} 
              size={22} 
              color="#006B5F" 
            />
          </TouchableOpacity>

          {expandedSections['systemic'] && (
            <View style={styles.cardContent}>
              {/* Diet */}
              <View style={styles.systemicBlock}>
                <Text style={styles.systemicCategory}>🥗 Diet & Nutrition</Text>
                {clinicalData.systemicFactors.diet.map((item, idx) => (
                  <View key={`diet-${idx}`} style={styles.systemicItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <View style={styles.systemicContent}>
                      <Text style={styles.systemicText}>{item.recommendation}</Text>
                      <Text style={styles.systemicRationale}>{item.rationale}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Sleep & Hydration */}
              <View style={styles.systemicGrid}>
                <View style={styles.systemicGridItem}>
                  <Ionicons name="moon" size={22} color="#006B5F" />
                  <Text style={styles.gridLabel}>Sleep</Text>
                  <Text style={styles.gridValue}>{clinicalData.systemicFactors.sleep.recommendation}</Text>
                  <Text style={styles.gridRationale}>{clinicalData.systemicFactors.sleep.rationale}</Text>
                </View>
                <View style={styles.systemicGridItem}>
                  <Ionicons name="water" size={22} color="#006B5F" />
                  <Text style={styles.gridLabel}>Hydration</Text>
                  <Text style={styles.gridValue}>{clinicalData.systemicFactors.hydration.amount}</Text>
                  <Text style={styles.gridRationale}>{clinicalData.systemicFactors.hydration.rationale}</Text>
                </View>
              </View>

              {/* Exercise */}
              <View style={styles.systemicBlock}>
                <Text style={styles.systemicCategory}>🏃‍♀️ Exercise</Text>
                <View style={styles.systemicItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <View style={styles.systemicContent}>
                    <Text style={styles.systemicText}>{clinicalData.systemicFactors.exercise.recommendation}</Text>
                    {clinicalData.systemicFactors.exercise.precautions && clinicalData.systemicFactors.exercise.precautions.length > 0 && (
                      <>
                        <Text style={[styles.systemicRationale, { marginTop: 4, fontWeight: '500' }]}>Tips for your skin type:</Text>
                        {clinicalData.systemicFactors.exercise.precautions.map((precaution, idx) => (
                          <Text key={`precaution-${idx}`} style={[styles.systemicRationale, { marginLeft: 4 }]}>• {precaution}</Text>
                        ))}
                      </>
                    )}
                  </View>
                </View>
              </View>

              {/* Supplements */}
              {clinicalData.systemicFactors.supplements && clinicalData.systemicFactors.supplements.length > 0 && (
                <View style={styles.systemicBlock}>
                  <Text style={styles.systemicCategory}>💊 Supplements</Text>
                  {clinicalData.systemicFactors.supplements.map((item, idx) => (
                    <View key={`supp-${idx}`} style={styles.systemicItem}>
                      <Ionicons name="medical" size={16} color="#006B5F" />
                      <View style={styles.systemicContent}>
                        <Text style={styles.systemicText}>{item.name} {item.dosage ? `- ${item.dosage}` : ''}</Text>
                        <Text style={styles.systemicRationale}>{item.purpose}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Stress Management */}
              {clinicalData.systemicFactors.stress && (
                <View style={styles.systemicBlock}>
                  <Text style={styles.systemicCategory}>🧘 Stress Management</Text>
                  <Text style={styles.systemicText}>{clinicalData.systemicFactors.stress.impact}</Text>
                  <View style={{ marginTop: 8 }}>
                    {clinicalData.systemicFactors.stress.management.map((item, idx) => (
                      <View key={`stress-${idx}`} style={styles.systemicItem}>
                        <Ionicons name="leaf" size={14} color="#006B5F" />
                        <Text style={[styles.systemicText, { flex: 1 }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* SECTION 8: TREATMENT OUTCOMES */}
        <Card style={styles.outcomeCard}>
          <TouchableOpacity onPress={() => toggleSection('outcomes')} style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="trending-up" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.sectionTag}>WHAT TO EXPECT</Text>
                <Text style={styles.sectionTitle}>Your Skin Journey</Text>
              </View>
            </View>
            <Ionicons 
              name={expandedSections['outcomes'] ? 'chevron-up' : 'chevron-down'} 
              size={22} 
              color="#006B5F" 
            />
          </TouchableOpacity>

          {expandedSections['outcomes'] && (
            <View style={styles.cardContent}>
              <View style={styles.timelineCard}>
                <Ionicons name="calendar" size={22} color="#006B5F" />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Expected timeline:</Text>
                  <Text style={styles.timelineText}>{clinicalData.treatmentOutcomes.expected_timeline}</Text>
                </View>
              </View>

              <View style={styles.outcomeBlock}>
                <Text style={styles.outcomeSubtitle}>Things to notice:</Text>
                {clinicalData.treatmentOutcomes.monitoring_parameters.map((param, idx) => (
                  <View key={`monitor-${idx}`} style={styles.monitorItem}>
                    <Ionicons name="eye" size={16} color="#006B5F" />
                    <Text style={styles.monitorText}>{param}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.outcomeBlock}>
                <Text style={[styles.outcomeSubtitle, { color: '#D32F2F' }]}>When to see a doctor:</Text>
                {clinicalData.treatmentOutcomes.when_to_escalate.map((item, idx) => (
                  <View key={`escalate-${idx}`} style={styles.warningItem}>
                    <Ionicons name="alert-circle" size={16} color="#D32F2F" />
                    <Text style={styles.warningText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* Medical Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.consultBtn}
            onPress={() => router.push("../../drawer/dashboard")}
          >
            <Ionicons name="home" size={20} color="#fff" />
            <Text style={styles.consultBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>

        {/* Full Medical Disclaimer */}
        <View style={styles.fullDisclaimer}>
          <Ionicons name="information-circle" size={20} color="#757575" />
          <Text style={styles.disclaimerFullText}>
            This guide is created based on your answers. Everyone's skin is unique, so results may vary. 
            If you have specific skin concerns or conditions, please consult with a dermatologist.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#006B5F',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#006B5F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#006B5F',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
  },
  headerBack: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 40,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#006B5F',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  skinTypeHeader: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skinTypeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#006B5F',
    marginBottom: 4,
    textAlign: 'center',
  },
  skinTypeSubtitle: {
    fontSize: 13,
    color: '#757575',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
    gap: 4,
  },
  savedBadgeText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
  },
  clinicalCard: {
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  protocolCard: {
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  ingredientCard: {
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  formulationCard: {
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  environmentCard: {
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  contraindicationCard: {
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  systemicCard: {
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  outcomeCard: {
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006B5F',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  cardContent: {
    padding: 16,
  },
  clinicalDesc: {
    fontSize: 15,
    lineHeight: 24,
    color: '#424242',
    marginBottom: 16,
  },
  subSection: {
    marginTop: 8,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  routineTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 4,
  },
  routineIntro: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  protocolStep: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#006B5F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  stepDetails: {
    flex: 1,
  },
  stepText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  purposeText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  frequencyText: {
    fontSize: 12,
    color: '#999',
  },
  weeklyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  weeklyIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#006B5F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklyDetails: {
    flex: 1,
  },
  weeklyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  weeklyPurpose: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  weeklyFrequency: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  ingredientCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 4,
  },
  categoryHint: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 12,
  },
  ingredientItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },
  concentrationBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 16,
  },
  concentrationText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
  ingredientMechanism: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  evidenceText: {
    fontSize: 12,
    color: '#006B5F',
    fontWeight: '500',
  },
  avoidItem: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  avoidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  avoidName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D32F2F',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 16,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '600',
  },
  avoidReason: {
    fontSize: 13,
    color: '#B71C1C',
    lineHeight: 18,
  },
  formulationGrid: {
    gap: 12,
  },
  formulationItem: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  formulationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formulationContent: {
    flex: 1,
  },
  formulationLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 2,
  },
  formulationValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  formulationRationale: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  pHText: {
    fontSize: 12,
    color: '#006B5F',
    marginTop: 2,
    fontWeight: '500',
  },
  seasonBlock: {
    marginBottom: 20,
  },
  seasonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 10,
  },
  recommendationItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  rationaleText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  contraindicationItem: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  contraindicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  contraindicationFactor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D32F2F',
  },
  managementText: {
    fontSize: 13,
    color: '#B71C1C',
    lineHeight: 18,
  },
  systemicBlock: {
    marginBottom: 16,
  },
  systemicCategory: {
    fontSize: 15,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 8,
  },
  systemicItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  systemicContent: {
    flex: 1,
  },
  systemicText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  systemicRationale: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  systemicGrid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  systemicGridItem: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#006B5F',
    marginTop: 6,
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  gridRationale: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 13,
    color: '#2E7D32',
    marginBottom: 2,
  },
  timelineText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
  },
  outcomeBlock: {
    marginBottom: 16,
  },
  outcomeSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 10,
  },
  monitorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  monitorText: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#D32F2F',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  actionButtons: {
    marginVertical: 20,
    gap: 12,
  },
  consultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006B5F',
    padding: 16,
    borderRadius: 30,
    gap: 8,
  },
  consultBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  newAssessmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#006B5F',
    gap: 8,
  },
  newAssessmentText: {
    color: '#006B5F',
    fontSize: 16,
    fontWeight: '600',
  },
  fullDisclaimer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  disclaimerFullText: {
    flex: 1,
    fontSize: 12,
    color: '#757575',
    lineHeight: 18,
  },
})