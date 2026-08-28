import AsyncStorage from "@react-native-async-storage/async-storage"

// Interface for a single step in a skincare routine
export interface RoutineStep {
  id: string
  name: string
  duration: number // in minutes
}

// Interface for a complete skincare routine (morning or night)
export interface SkinRoutine {
  id: string
  type: "morning" | "night"
  title: string
  description: string
  steps: RoutineStep[]
  reminderTime: string // HH:MM format
  isEnabled: boolean
  createdAt: number
  updatedAt: number
}

// Default morning skincare routine template
export const DEFAULT_MORNING_ROUTINE: SkinRoutine = {
  id: "morning_default",
  type: "morning",
  title: "Morning Routine",
  description: "Start your day with a refreshing skincare routine",
  steps: [
    { id: "1", name: "Cleanse", duration: 2 },
    { id: "2", name: "Tone", duration: 1 },
    { id: "3", name: "Moisturize", duration: 2 },
  ],
  reminderTime: "08:00",
  isEnabled: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

// Default night skincare routine template
export const DEFAULT_NIGHT_ROUTINE: SkinRoutine = {
  id: "night_default",
  type: "night",
  title: "Night Routine",
  description: "Wind down with a relaxing skincare routine",
  steps: [
    { id: "1", name: "Cleanse", duration: 3 },
    { id: "2", name: "Apply Mask", duration: 15 },
    { id: "3", name: "Moisturize", duration: 2 },
  ],
  reminderTime: "22:00",
  isEnabled: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

// Get all skincare routines from storage (initializes with defaults if empty)
export const getSkinRoutines = async (): Promise<SkinRoutine[]> => {
  try {
    const routines = await AsyncStorage.getItem("skinRoutines")
    if (!routines) {
      // Initialize with default routines on first load
      const defaults = [DEFAULT_MORNING_ROUTINE, DEFAULT_NIGHT_ROUTINE]
      await AsyncStorage.setItem("skinRoutines", JSON.stringify(defaults))
      return defaults
    }
    return JSON.parse(routines)
  } catch (error) {
    console.log("Error getting routines:", error)
    return [DEFAULT_MORNING_ROUTINE, DEFAULT_NIGHT_ROUTINE]
  }
}

// Save or update a skincare routine in storage
export const saveRoutine = async (routine: SkinRoutine) => {
  try {
    const routines = await getSkinRoutines()
    const existingIndex = routines.findIndex((r) => r.id === routine.id)

    if (existingIndex > -1) {
      // Update existing routine
      routines[existingIndex] = { ...routine, updatedAt: Date.now() }
    } else {
      // Add new routine with timestamps
      routines.push({ ...routine, createdAt: Date.now(), updatedAt: Date.now() })
    }

    await AsyncStorage.setItem("skinRoutines", JSON.stringify(routines))
    return routine.id
  } catch (error) {
    console.log("Error saving routine:", error)
    throw error
  }
}

// Get a specific routine by type (morning or night)
export const getRoutineByType = async (type: "morning" | "night"): Promise<SkinRoutine | null> => {
  try {
    const routines = await getSkinRoutines()
    return routines.find((r) => r.type === type) || null
  } catch (error) {
    console.log("Error getting routine by type:", error)
    return null
  }
}

// Update the steps of a specific routine
export const updateRoutineStep = async (routineId: string, steps: RoutineStep[]) => {
  try {
    const routines = await getSkinRoutines()
    const routine = routines.find((r) => r.id === routineId)

    if (routine) {
      routine.steps = steps
      routine.updatedAt = Date.now()
      await AsyncStorage.setItem("skinRoutines", JSON.stringify(routines))
    }
  } catch (error) {
    console.log("Error updating routine steps:", error)
    throw error
  }
}

// Toggle routine enabled/disabled status
export const toggleRoutine = async (routineId: string, isEnabled: boolean) => {
  try {
    const routines = await getSkinRoutines()
    const routine = routines.find((r) => r.id === routineId)

    if (routine) {
      routine.isEnabled = isEnabled
      routine.updatedAt = Date.now()
      await AsyncStorage.setItem("skinRoutines", JSON.stringify(routines))
    }
  } catch (error) {
    console.log("Error toggling routine:", error)
    throw error
  }
}

// Update the reminder time for a specific routine
export const updateReminderTime = async (routineId: string, reminderTime: string) => {
  try {
    const routines = await getSkinRoutines()
    const routine = routines.find((r) => r.id === routineId)

    if (routine) {
      routine.reminderTime = reminderTime
      routine.updatedAt = Date.now()
      await AsyncStorage.setItem("skinRoutines", JSON.stringify(routines))
    }
  } catch (error) {
    console.log("Error updating reminder time:", error)
    throw error
  }
}