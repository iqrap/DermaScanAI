// src/store/useAppStore.ts
import { create } from 'zustand';

// ============================================
// TYPES
// ============================================

export type SkinType = 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal' | null;

export interface UserProfile {
  uid: string | null;
  email: string | null;
  displayName: string | null;
  skinType: SkinType;
}

export interface DiseaseResult {
  id: string;
  diseaseName: string;
  confidence: number;
  imageUrl: string;
  timestamp: number;
  message: string;
  recommendation: string;
}

export interface MoodEntry {
  date: string;
  mood: { emoji: string; label: string; description: string };
  timestamp: string;
  aiMessage?: string;
}

export interface StreakData {
  streak: number;
  bestStreak: number;
  lastCheckin: string | null;
}

// ============================================
// STORE INTERFACE
// ============================================

interface AppState {
  // Auth
  user: UserProfile;
  setUser: (user: Partial<UserProfile>) => void;
  clearUser: () => void;

  // Skin type
  skinType: SkinType;
  setSkinType: (type: SkinType) => void;

  // Disease results history
  diseaseResults: DiseaseResult[];
  addDiseaseResult: (result: DiseaseResult) => void;
  clearDiseaseResults: () => void;

  // Mood tracking
  moodHistory: MoodEntry[];
  setMoodHistory: (entries: MoodEntry[]) => void;
  addMoodEntry: (entry: MoodEntry) => void;

  // Streak
  streak: StreakData;
  setStreak: (data: Partial<StreakData>) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  globalError: string | null;
  setGlobalError: (error: string | null) => void;
}

// ============================================
// INITIAL VALUES
// ============================================

const initialUser: UserProfile = {
  uid: null,
  email: null,
  displayName: null,
  skinType: null,
};

const initialStreak: StreakData = {
  streak: 0,
  bestStreak: 0,
  lastCheckin: null,
};

// ============================================
// STORE
// ============================================

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: { ...initialUser },
  setUser: (partial) =>
    set((state) => ({
      user: { ...state.user, ...partial },
    })),
  clearUser: () => set({ user: { ...initialUser } }),

  // Skin type
  skinType: null,
  setSkinType: (type) => set({ skinType: type }),

  // Disease results
  diseaseResults: [],
  addDiseaseResult: (result) =>
    set((state) => ({
      diseaseResults: [result, ...state.diseaseResults].slice(0, 50), // keep last 50
    })),
  clearDiseaseResults: () => set({ diseaseResults: [] }),

  // Mood
  moodHistory: [],
  setMoodHistory: (entries) => set({ moodHistory: entries }),
  addMoodEntry: (entry) =>
    set((state) => ({
      moodHistory: [entry, ...state.moodHistory].slice(0, 30), // keep last 30
    })),

  // Streak
  streak: { ...initialStreak },
  setStreak: (partial) =>
    set((state) => ({
      streak: { ...state.streak, ...partial },
    })),

  // UI state
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  globalError: null,
  setGlobalError: (error) => set({ globalError: error }),
}));
