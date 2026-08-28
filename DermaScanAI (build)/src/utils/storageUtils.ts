import AsyncStorage from "@react-native-async-storage/async-storage"
import { auth } from "../config/firebase"

// Interface for saved skin disease detection results
export interface SavedDiseaseResult {
  id: string
  timestamp: number
  concern: {
    name: string
    matchPercentage: number
  }
  imageUrl?: string
}

// Updated interface for saved skin type analysis results with 6 sections
export interface SavedSkinTypeResult {
  id: string
  timestamp: number
  skinType: string
  description: string
  sideEffects: string[]
  avoid: string[]
  tips: string[]
  recommendedIngredients?: string[]
  
  // 6 New Sections
  clinicalDescription?: string
  
  dailyRoutine?: {
    morning: string[]
    evening: string[]
  }
  
  ingredients?: {
    lookFor: string[]
    avoid: string[]
  }
  
  productTextures?: {
    cleanser: string
    moisturizer: string
    sunscreen: string
    serum: string
    toner?: string
  }
  
  seasonalCare?: {
    summer: string[]
    winter: string[]
    monsoon: string[]
  }
  
  mistakes?: string[]
  
  lifestyle?: {
    diet: string[]
    habits: string[]
    sleep: string
    water: string
    exercise: string
  }
    firestoreId?: string; 
}

// Get current authenticated user ID (throws error if not authenticated)
const getCurrentUserId = (): string => {
  const user = auth.currentUser
  if (!user) throw new Error("User not authenticated")
  return user.uid
}

// Generate storage key for disease results based on user ID
const getDiseaseResultsKey = (userId: string): string => `diseaseResults_${userId}`
// Generate storage key for skin type results based on user ID
const getSkinTypeResultsKey = (userId: string): string => `skinTypeResults_${userId}`

// Save a new disease detection result to user's storage (most recent first)
export const saveDiseaseResult = async (result: SavedDiseaseResult) => {
  try {
    const userId = getCurrentUserId()
    const key = getDiseaseResultsKey(userId)
    const existingResults = await AsyncStorage.getItem(key)
    const parsedResults = existingResults ? JSON.parse(existingResults) : []
    const updatedResults = [result, ...parsedResults] // Add new result to beginning
    await AsyncStorage.setItem(key, JSON.stringify(updatedResults))
    return result.id
  } catch (error) {
    console.log("Error saving disease result:", error)
    throw error
  }
}

// Get all saved disease detection results for current user
export const getDiseaseResults = async (): Promise<SavedDiseaseResult[]> => {
  try {
    const userId = getCurrentUserId()
    const key = getDiseaseResultsKey(userId)
    const results = await AsyncStorage.getItem(key)
    return results ? JSON.parse(results) : []
  } catch (error) {
    console.log("Error getting disease results:", error)
    return []
  }
}

// Delete a specific disease result by ID
export const deleteDiseaseResult = async (id: string) => {
  try {
    const userId = getCurrentUserId()
    const key = getDiseaseResultsKey(userId)
    const results = await AsyncStorage.getItem(key)
    const parsedResults = results ? JSON.parse(results) : []
    const filtered = parsedResults.filter((r: SavedDiseaseResult) => r.id !== id)
    await AsyncStorage.setItem(key, JSON.stringify(filtered))
  } catch (error) {
    console.log("Error deleting disease result:", error)
    throw error
  }
}

// Get the most recent disease detection result (first in list)
export const getLatestDiseaseResult = async (): Promise<SavedDiseaseResult | null> => {
  try {
    const userId = getCurrentUserId()
    const key = getDiseaseResultsKey(userId)
    const results = await AsyncStorage.getItem(key)
    const parsedResults = results ? JSON.parse(results) : []
    return parsedResults.length > 0 ? parsedResults[0] : null
  } catch (error) {
    console.log("Error getting latest disease result:", error)
    return null
  }
}

// Save or update a skin type analysis result (updates existing same type)
export const saveSkinTypeResult = async (result: SavedSkinTypeResult) => {
  try {
    const userId = getCurrentUserId()
    const key = getSkinTypeResultsKey(userId)
    const existingResults = await AsyncStorage.getItem(key)
    const parsedResults: SavedSkinTypeResult[] = existingResults ? JSON.parse(existingResults) : []
    
    // Normalize skin type for comparison (remove "Skin" suffix and case differences)
    const normalizeType = (type: string) => type.toLowerCase().replace(/\s*skin\s*/gi, "").trim()
    const newSkinTypeNormalized = normalizeType(result.skinType)
    
    // Check if a result with the same skin type already exists
    const existingIndex = parsedResults.findIndex(
      (r) => normalizeType(r.skinType) === newSkinTypeNormalized
    )
    
    let updatedResults: SavedSkinTypeResult[]
    
    if (existingIndex >= 0) {
      // Update existing result with new data and timestamp
      updatedResults = [...parsedResults]
      updatedResults[existingIndex] = {
        ...result,
        id: parsedResults[existingIndex].id, // Keep the original ID
        timestamp: Date.now(), // Update timestamp
      }
      console.log(`Updated existing skin type result: ${result.skinType}`)
    } else {
      // Add new result
      updatedResults = [result, ...parsedResults]
      console.log(`Added new skin type result: ${result.skinType}`)
    }
    
    await AsyncStorage.setItem(key, JSON.stringify(updatedResults))
    
    // Also save full result separately for 6 sections
    await AsyncStorage.setItem("lastFullResult_" + userId, JSON.stringify(result))
    
    return result.id
  } catch (error) {
    console.log("Error saving skin type result:", error)
    throw error
  }
}

// Get all saved skin type analysis results for current user
export const getSkinTypeResults = async (): Promise<SavedSkinTypeResult[]> => {
  try {
    const userId = getCurrentUserId()
    const key = getSkinTypeResultsKey(userId)
    const results = await AsyncStorage.getItem(key)
    return results ? JSON.parse(results) : []
  } catch (error) {
    console.log("Error getting skin type results:", error)
    return []
  }
}

// Delete a specific skin type result by ID
export const deleteSkinTypeResult = async (id: string) => {
  try {
    const userId = getCurrentUserId()
    const key = getSkinTypeResultsKey(userId)
    const results = await AsyncStorage.getItem(key)
    const parsedResults = results ? JSON.parse(results) : []
    const filtered = parsedResults.filter((r: SavedSkinTypeResult) => r.id !== id)
    await AsyncStorage.setItem(key, JSON.stringify(filtered))
  } catch (error) {
    console.log("Error deleting skin type result:", error)
    throw error
  }
}

// Get the most recent skin type analysis result (first in list)
export const getLatestSkinTypeResult = async (): Promise<SavedSkinTypeResult | null> => {
  try {
    const userId = getCurrentUserId()
    const key = getSkinTypeResultsKey(userId)
    const results = await AsyncStorage.getItem(key)
    const parsedResults = results ? JSON.parse(results) : []
    
    if (parsedResults.length === 0) return null
    
    // Try to get full result with 6 sections
    try {
      const fullResult = await AsyncStorage.getItem("lastFullResult_" + userId)
      if (fullResult) {
        const parsedFull = JSON.parse(fullResult)
        // Merge full data with basic data
        return {
          ...parsedResults[0],
          ...parsedFull
        }
      }
    } catch (e) {
      console.log("Error loading full result:", e)
    }
    
    return parsedResults[0]
  } catch (error) {
    console.log("Error getting latest skin type result:", error)
    return null
  }
}