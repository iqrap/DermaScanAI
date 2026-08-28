"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  LayoutChangeEvent,
  Alert,
  Animated,
  FlatList,
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { DrawerActions, useNavigation, useFocusEffect } from "@react-navigation/native"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ENV } from '../../src/config/env'
import { apiService } from '../../src/services/apiService'
import * as Location from 'expo-location'

const { width } = Dimensions.get("window")

//  Import all images statically (9 images total)
const glowCardImages = {
  skin1: require('../../assets/images/skin1.jpg'),
  skin2: require('../../assets/images/skin2.jpg'),
  skin3: require('../../assets/images/skin3.jpg'),
  skin4: require('../../assets/images/skin4.jpg'),
  skin5: require('../../assets/images/skin5.jpg'),
  skin6: require('../../assets/images/skin6.jpg'),
  skin7: require('../../assets/images/skin7.jpg'),
  skin8: require('../../assets/images/skin8.jpg'),
  skin9: require('../../assets/images/skin9.jpg'), // Rose water image
  skin10: require('../../assets/images/skin10.jpg'), // Tea tree oil image
}

const glowModalImages = {
  skincare1: require('../../assets/images/skincare1.jpg'),
  skincare2: require('../../assets/images/skincare2.jpg'),
  skincare3: require('../../assets/images/skincare3.jpg'),
  skincare4: require('../../assets/images/skincare4.jpg'),
  skincare5: require('../../assets/images/skincare5.jpg'),
  skincare6: require('../../assets/images/skincare6.jpg'),
  skincare7: require('../../assets/images/skincare7.jpg'),
  skincare8: require('../../assets/images/skincare8.jpg'),
  skincare9: require('../../assets/images/skincare9.jpg'), // Rose water modal image
  skincare10: require('../../assets/images/skincare10.jpg'), // Tea tree oil modal image
}

//  Glow Up Tips Data with corresponding images (10 tips total)
const GLOW_UP_TIPS = [
  { id: 1, title: "Hydration Hero", subtitle: "Keep your skin plump & glowing", imageKey: "skin1", modalImageKey: "skincare1", tip: "hydration" },
  { id: 2, title: "Sunscreen Shield", subtitle: "Protect from UV damage", imageKey: "skin2", modalImageKey: "skincare2", tip: "sunscreen" },
  { id: 3, title: "Vitamin C Boost", subtitle: "Brighten & even skin tone", imageKey: "skin3", modalImageKey: "skincare3", tip: "vitamin c" },
  { id: 4, title: "Retinol Night", subtitle: "Anti-aging & renewal", imageKey: "skin4", modalImageKey: "skincare4", tip: "retinol" },
  { id: 5, title: "Exfoliation Time", subtitle: "Smooth & radiant skin", imageKey: "skin5", modalImageKey: "skincare5", tip: "exfoliation" },
  { id: 6, title: "Niacinamide Glow", subtitle: "Pores & texture control", imageKey: "skin6", modalImageKey: "skincare6", tip: "niacinamide" },
  { id: 7, title: "Ceramide Repair", subtitle: "Strengthen skin barrier", imageKey: "skin7", modalImageKey: "skincare7", tip: "ceramide" },
  { id: 8, title: "Hyaluronic Acid", subtitle: "Deep moisture boost", imageKey: "skin8", modalImageKey: "skincare8", tip: "hyaluronic acid" },
  { id: 9, title: "Rose Water Mist", subtitle: "Natural toner & refresher", imageKey: "skin9", modalImageKey: "skincare9", tip: "rose water" },
  { id: 10, title: "Tea Tree Oil", subtitle: "Natural acne fighter", imageKey: "skin10", modalImageKey: "skincare10", tip: "tea tree oil" },
]

// Type Definitions
type WeatherData = {
  main: {
    temp: number
  }
  weather: Array<{
    main: string
  }>
  cod: number
}

type WelcomeMessage = {
  greeting: string
  message: string
}

type StreakData = {
  streak: number
  bestStreak: number
  lastCheckin: string | null
}

type MoodOption = {
  id: number
  emoji: string
  label: string
  color: string
  description: string
}

type MoodEntry = {
  date: string
  mood: MoodOption
  timestamp: string
  aiMessage?: string
}

type CachedWelcomeMessage = {
  data: WelcomeMessage
  timestamp: number
}

type CachedMoodMessage = {
  [key: string]: {
    message: string
    timestamp: number
  }
}

type CachedGlowTip = {
  [key: string]: {
    content: {
      title: string
      description: string
      benefits: string[]
      howToUse: string
    }
    timestamp: number
  }
}

// Define valid Ionicons names
type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

const COLORS = {
  bgGradientTop: "#ffffffff",
  bgGradientBottom: "#cae2ceff",
  darkGreen: "#4e7565ff",
  mediumGreen: "#4A6B5D",
  lightGreenBorder: "#8EB29C",
  lightGreenFill: "rgba(230, 244, 235, 0.6)",
  white: "#FFFFFF",
  buttonGradientStart: "#558d74ff",
  buttonGradientEnd: "#3b6450ff",
  cardBorder: "#D1E3DA",
  cardBg: "#FFFFFF",
  cardShadow: "rgba(0, 0, 0, 0.08)",
  accent: "#834f2c",
  chatbotPurple: "#9C27B0",
  chatbotLightPurple: "#F3E5F5",
  orange: "#F39C12",
  orangeLight: "#FDEBD0",
  orangeDark: "#E67E22",
  sectionTitle: "#352755",
  blue: "#2196F3",
  blueLight: "#E3F2FD",
  red: "#F44336",
  redLight: "#FFEBEE",
  teal: "#009688",
  tealLight: "#E0F2F1",
  purple: "#9C27B0",
  purpleLight: "#F3E5F5",
  deepOrange: "#FF5722",
  deepOrangeLight: "#FBE9E7",
  diseaseAILight: "#BBDEFB",
  skinAnalysisLight: "#C8E6E0",
}

const getWeatherIcon = (condition: string): { name: IoniconsName; color: string } => {
  const conditionLower = condition?.toLowerCase() || ""
  if (conditionLower.includes("clear") || conditionLower.includes("sunny")) return { name: "sunny", color: "#FFB300" }
  if (conditionLower.includes("cloud")) return { name: "cloud", color: "#90A4AE" }
  if (conditionLower.includes("rain") || conditionLower.includes("drizzle")) return { name: "rainy", color: "#42A5F5" }
  return { name: "partly-sunny", color: "#FFA726" }
}

export default function DashboardScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [scaleWidth, setScaleWidth] = useState(width - 80)
  const [showProjectInfo, setShowProjectInfo] = useState(false)
  
  // ScrollView ref to scroll to top
  const scrollViewRef = useRef<ScrollView>(null)

  // Animation values for bottom nav
  const [activeTab, setActiveTab] = useState('home')
  const tabAnimations = {
    home: useRef(new Animated.Value(1)).current,
    weather: useRef(new Animated.Value(1)).current,
    routine: useRef(new Animated.Value(1)).current,
    profile: useRef(new Animated.Value(1)).current,
  }

  // Reset active tab and scroll to top when Dashboard screen is focused
  useFocusEffect(
    useCallback(() => {
      // Reset active tab to 'home' whenever Dashboard screen is focused
      setActiveTab('home')
      
      // Reset the tab animations to normal scale
      Animated.timing(tabAnimations.home, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()

      // Scroll to top when screen is focused
      scrollViewRef.current?.scrollTo({ y: 0, animated: false })
    }, [])
  )

  // 🌟 State for model-generated welcome message
  const [welcomeMessage, setWelcomeMessage] = useState<WelcomeMessage>({ greeting: "", message: "" })
  const [loadingMessage, setLoadingMessage] = useState(true)

  // 🔥 SKIN STREAK COUNTER STATES
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [lastCheckin, setLastCheckin] = useState<string | null>(null)
  const [streakMessage, setStreakMessage] = useState("Start your glow journey today! ✨")
  const [checkedInToday, setCheckedInToday] = useState(false)

  // 🌸 SKIN MOOD TRACKER STATES
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null)
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([])
  const [showMoodModal, setShowMoodModal] = useState(false)
  const [loadingMoodMessage, setLoadingMoodMessage] = useState(false)
  const [currentMoodMessage, setCurrentMoodMessage] = useState<string>("")

  // ✨ GLOW UP TIPS MODAL STATES
  const [selectedTip, setSelectedTip] = useState<typeof GLOW_UP_TIPS[0] | null>(null)
  const [showTipModal, setShowTipModal] = useState(false)
  const [loadingTipInfo, setLoadingTipInfo] = useState(false)
  const [tipInfo, setTipInfo] = useState<{
    title: string
    description: string
    benefits: string[]
    howToUse: string
  } | null>(null)

  // Auto-sliding refs
  const flatListRef = useRef<FlatList>(null)
  const currentIndex = useRef(0)
  const autoSlideInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const [city, setCity] = useState("Rawalpindi")
  const API_KEY = ENV.WEATHER_API_KEY

  // Get user's city from device geolocation
  const getUserCity = async (): Promise<string> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return "Rawalpindi"

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const { latitude, longitude } = location.coords

      // Use OpenWeatherMap reverse geocoding to get city name
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&cnt=1&appid=${API_KEY}`
      )
      const geoData = await res.json()
      if (geoData?.[0]?.name) {
        return geoData[0].name
      }
      return "Rawalpindi"
    } catch (error) {
      console.log('Geolocation error:', error)
      return "Rawalpindi"
    }
  }

  // Mood options with emojis and colors
  const moodOptions: MoodOption[] = [
    { id: 1, emoji: '😊', label: 'Happy', color: '#F7DC6F', description: 'Skin feels great!' },
    { id: 2, emoji: '😐', label: 'Normal', color: '#AED6F1', description: 'Nothing special' },
    { id: 3, emoji: '😢', label: 'Dry', color: '#F5B7B1', description: 'Feeling tight & dry' },
    { id: 4, emoji: '🔥', label: 'Breakout', color: '#F1948A', description: 'Pimples & acne' },
    { id: 5, emoji: '✨', label: 'Glowing', color: '#F9E79F', description: 'Super glowing!' },
    { id: 6, emoji: '🌿', label: 'Sensitive', color: '#A9DFBF', description: 'Irritated & red' },
  ]

  // Auto-slide function
  const startAutoSlide = () => {
    if (autoSlideInterval.current) {
      clearInterval(autoSlideInterval.current)
    }
    autoSlideInterval.current = setInterval(() => {
      if (flatListRef.current && GLOW_UP_TIPS.length > 0) {
        let nextIndex = currentIndex.current + 1
        if (nextIndex >= GLOW_UP_TIPS.length) {
          nextIndex = 0
        }
        currentIndex.current = nextIndex
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        })
      }
    }, 3000) // Auto-slide every 3 seconds
  }

  const stopAutoSlide = () => {
    if (autoSlideInterval.current) {
      clearInterval(autoSlideInterval.current)
      autoSlideInterval.current = null
    }
  }

  // Animated tab press handler - FIXED to not navigate to DashboardScreen when already there
  const animateTab = (tabName: string, navigationPath: string) => {
    // If clicking the same tab we're currently on, just scroll to top and return
    if (tabName === activeTab) {
      if (tabName === 'home') {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true })
      } else {
        // For other tabs, we still navigate to their screens
        router.push(navigationPath as any)
      }
      return
    }

    Animated.sequence([
      Animated.timing(tabAnimations[tabName as keyof typeof tabAnimations], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tabAnimations[tabName as keyof typeof tabAnimations], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()

    setActiveTab(tabName)
    
    setTimeout(() => {
      router.push(navigationPath as any)
    }, 150)
  }

  //  Fetch welcome message via backend with 1-hour AsyncStorage cache
  const fetchWelcomeMessage = async () => {
    try {
      setLoadingMessage(true)

      const cached = await AsyncStorage.getItem('welcome_message')
      if (cached) {
        const { data, timestamp }: CachedWelcomeMessage = JSON.parse(cached)
        const hoursSinceCache = (Date.now() - timestamp) / (1000 * 60 * 60)
        if (hoursSinceCache < 1) {
          console.log('📦 Using cached welcome message')
          setWelcomeMessage(data)
          setLoadingMessage(false)
          return
        }
      }

      console.log('🤖 Fetching welcome message from backend...')
      const data = await apiService.fetchWelcomeMessage()

      if (data && data.greeting) {
        setWelcomeMessage(data)
        await AsyncStorage.setItem('welcome_message', JSON.stringify({ data, timestamp: Date.now() }))
        console.log('✅ Saved fresh welcome message to cache')
      } else {
        setWelcomeMessage(getFallbackWelcome())
      }
    } catch {
      // Backend offline — show the friendly fallback instead of an error
      setWelcomeMessage(getFallbackWelcome())
    } finally {
      setLoadingMessage(false)
    }
  }

  //  Fetch Glow Up Tip Info via backend with 48-hour AsyncStorage cache
  const fetchGlowTipInfo = async (tip: string): Promise<{
    title: string
    description: string
    benefits: string[]
    howToUse: string
  }> => {
    try {
      const cached = await AsyncStorage.getItem('glow_tips_cache')
      if (cached) {
        const cache: CachedGlowTip = JSON.parse(cached)
        const cachedTip = cache[tip]
        if (cachedTip) {
          const hoursSinceCache = (Date.now() - cachedTip.timestamp) / (1000 * 60 * 60)
          if (hoursSinceCache < 48) {
            console.log(`📦 Using cached glow tip for ${tip}`)
            return cachedTip.content
          }
        }
      }

      console.log(`🤖 Fetching glow tip info for ${tip} from backend...`)
      const parsed = await apiService.fetchGlowTipInfo(tip)

      const existingCache = await AsyncStorage.getItem('glow_tips_cache')
      const cache: CachedGlowTip = existingCache ? JSON.parse(existingCache) : {}
      cache[tip] = { content: parsed, timestamp: Date.now() }
      await AsyncStorage.setItem('glow_tips_cache', JSON.stringify(cache))

      return parsed
    } catch {
      // Backend offline — show the friendly fallback instead of an error
      return getFallbackTipInfo(tip)
    }
  }

  // Fallback tip info - SHORT & CLEAR (updated with new tips)
  const getFallbackTipInfo = (tip: string) => {
    const fallbacks: { [key: string]: any } = {
      'hydration': {
        title: "💧 Hydration Hero",
        description: "Locks in moisture for plump, glowing skin.",
        benefits: ["Plumps fine lines", "Improves elasticity", "Strengthens barrier"],
        howToUse: "Apply to damp skin, then moisturize."
      },
      'sunscreen': {
        title: "☀️ Sunscreen Shield",
        description: "Protects against UV damage and premature aging.",
        benefits: ["Prevents sunburn", "Reduces cancer risk", "Prevents dark spots"],
        howToUse: "Apply SPF 30+ as your last morning step."
      },
      'vitamin c': {
        title: "🍊 Vitamin C Boost",
        description: "Brightens skin and boosts collagen production.",
        benefits: ["Brightens complexion", "Fades dark spots", "Boosts collagen"],
        howToUse: "Apply in the morning before sunscreen."
      },
      'retinol': {
        title: "🌙 Retinol Night",
        description: "Speeds up cell turnover for smoother skin.",
        benefits: ["Reduces wrinkles", "Clears acne", "Improves texture"],
        howToUse: "Start with twice weekly at night."
      },
      'exfoliation': {
        title: "✨ Exfoliation Time",
        description: "Removes dead skin for fresh, radiant skin.",
        benefits: ["Smoother texture", "Brighter complexion", "Unclogs pores"],
        howToUse: "Use chemical exfoliants 2-3x weekly."
      },
      'niacinamide': {
        title: "🌟 Niacinamide Glow",
        description: "Regulates oil and strengthens skin barrier.",
        benefits: ["Controls oil", "Minimizes pores", "Reduces redness"],
        howToUse: "Use 2x daily after cleansing."
      },
      'ceramide': {
        title: "🧴 Ceramide Repair",
        description: "Restores your skin's natural protective barrier.",
        benefits: ["Repairs barrier", "Locks in moisture", "Soothes irritation"],
        howToUse: "Use ceramide moisturizer daily."
      },
      'hyaluronic acid': {
        title: "💦 Hyaluronic Acid",
        description: "Holds 1000x its weight in water for deep hydration.",
        benefits: ["Intense hydration", "Plumps fine lines", "Non-greasy"],
        howToUse: "Apply to damp skin, then moisturize."
      },
      'rose water': {
        title: "🌹 Rose Water Mist",
        description: "Natural toner that balances pH and refreshes skin.",
        benefits: ["Soothes irritation", "Balances pH", "Hydrates instantly"],
        howToUse: "Spray on face after cleansing or throughout the day."
      },
      'tea tree oil': {
        title: "🍃 Tea Tree Oil",
        description: "Natural antibacterial that fights acne and breakouts.",
        benefits: ["Kills acne bacteria", "Reduces inflammation", "Unclogs pores"],
        howToUse: "Dilute with carrier oil, apply only on blemishes."
      }
    }
    return fallbacks[tip] || fallbacks['hydration']
  }

  //  Fetch AI mood message via backend with 24-hour AsyncStorage cache
  const fetchMoodMessage = async (mood: MoodOption): Promise<string> => {
    try {
      const cached = await AsyncStorage.getItem('mood_messages')
      if (cached) {
        const cache: CachedMoodMessage = JSON.parse(cached)
        const cachedMessage = cache[mood.emoji]
        if (cachedMessage) {
          const hoursSinceCache = (Date.now() - cachedMessage.timestamp) / (1000 * 60 * 60)
          if (hoursSinceCache < 24) {
            console.log(`📦 Using cached mood message for ${mood.label}`)
            return cachedMessage.message
          }
        }
      }

      console.log(`🤖 Fetching mood message for ${mood.label} from backend...`)
      const message = await apiService.fetchMoodMessage({ emoji: mood.emoji, label: mood.label, description: mood.description })

      const existingCache = await AsyncStorage.getItem('mood_messages')
      const cache: CachedMoodMessage = existingCache ? JSON.parse(existingCache) : {}
      cache[mood.emoji] = { message, timestamp: Date.now() }
      await AsyncStorage.setItem('mood_messages', JSON.stringify(cache))

      console.log(`✅ Saved mood message for ${mood.label} to cache`)
      return message
    } catch {
      // Backend offline — show the friendly fallback instead of an error
      const fallbacks: { [key: string]: string } = {
        '😊': "Happy skin, happy you! Keep smiling! 🌸",
        '😐': "Normal is beautiful too! ✨",
        '😢': "Time for extra hydration! Drink water 💧",
        '🔥': "Don't worry, breakouts pass! Be gentle 🌿",
        '✨': "Glowing queen! Share your secrets! 👑",
        '🌿': "Sensitive today? Go for gentle products 🍃"
      }
      return fallbacks[mood.emoji] || 'Thanks for sharing! 💕'
    }
  }

  //  Fallback welcome message
  const getFallbackWelcome = (): WelcomeMessage => {
    return {
      greeting: "Hello, Glow Seeker! ✨",
      message: "Your skin is unique, just like you. Keep glowing with our daily care tips! 🌸💫"
    }
  }

  //  SKIN STREAK FUNCTIONS
  const loadStreakData = async () => {
    try {
      const streakData = await AsyncStorage.getItem('skin_streak')
      if (streakData) {
        const { streak: savedStreak, bestStreak: savedBest, lastCheckin: savedLast } = JSON.parse(streakData)
        
        const today = new Date().toDateString()
        const lastCheckinDate = savedLast ? new Date(savedLast).toDateString() : null
        
        if (lastCheckinDate === today) {
          setCheckedInToday(true)
          setStreak(savedStreak)
        } else {
          setCheckedInToday(false)
          
          if (savedLast) {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = yesterday.toDateString()
            
            if (lastCheckinDate === yesterdayStr) {
              setStreak(savedStreak)
              setStreakMessage(`🔥 ${savedStreak} day streak! Keep it up!`)
            } else {
              setStreak(0)
              setStreakMessage("Oh no! Streak broken. Start again today! 💪")
            }
          } else {
            setStreak(savedStreak || 0)
          }
        }
        
        setBestStreak(savedBest || 0)
        setLastCheckin(savedLast)
      }
    } catch (error) {
      console.error('Error loading streak:', error)
    }
  }

  // Helper: get last 7 days for weekly progress
  const getWeeklyDays = () => {
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        label: dayLabels[date.getDay()],
        isToday: i === 0,
        isCompleted: i === 0 ? checkedInToday : i < streak,
      });
    }
    return days;
  };

  const handleCheckIn = async () => {
    if (checkedInToday) {
      Alert.alert('Already Checked In!', 'You already checked in today. Come back tomorrow! 🌸')
      return
    }

    const today = new Date().toISOString()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()

    let newStreak = 1
    let newMessage = ""

    if (lastCheckin) {
      const lastCheckinDate = new Date(lastCheckin).toDateString()
      
      if (lastCheckinDate === yesterdayStr) {
        newStreak = streak + 1
        if (newStreak === 7) newMessage = "🌟 7 Day Streak! You're glowing!"
        else if (newStreak === 30) newMessage = "🏆 30 Days! Skin care pro!"
        else if (newStreak === 100) newMessage = "💫 100 Days! Absolute legend!"
        else newMessage = `🔥 ${newStreak} day streak! Keep it up!`
      } else {
        newStreak = 1
        newMessage = "✨ New streak started! Welcome back!"
      }
    } else {
      newStreak = 1
      newMessage = "🎉 First check-in! Your glow journey begins!"
    }

    const newBestStreak = Math.max(bestStreak, newStreak)

    setStreak(newStreak)
    setBestStreak(newBestStreak)
    setLastCheckin(today)
    setCheckedInToday(true)
    setStreakMessage(newMessage)

    await AsyncStorage.setItem('skin_streak', JSON.stringify({
      streak: newStreak,
      bestStreak: newBestStreak,
      lastCheckin: today
    }))

    Alert.alert('✅ Checked In!', newMessage)
  }

  // 🌸 SKIN MOOD FUNCTIONS
  const loadMoodData = async () => {
    try {
      const moodData = await AsyncStorage.getItem('skin_mood')
      if (moodData) {
        const { todayMood, history } = JSON.parse(moodData)
        
        const today = new Date().toDateString()
        if (todayMood && todayMood.date === today) {
          setSelectedMood(todayMood.mood)
          setCurrentMoodMessage(todayMood.aiMessage || "")
        }
        
        setMoodHistory(history || [])
      }
    } catch (error) {
      console.error('Error loading mood:', error)
    }
  }

  const handleMoodSelect = async (mood: MoodOption) => {
    setSelectedMood(mood)
    setShowMoodModal(false)
    setLoadingMoodMessage(true)
    
    const aiMessage = await fetchMoodMessage(mood)
    setCurrentMoodMessage(aiMessage)
    
    const today = new Date().toDateString()
    const newMoodEntry: MoodEntry = {
      date: today,
      mood: mood,
      timestamp: new Date().toISOString(),
      aiMessage: aiMessage
    }
    
    const updatedHistory = [newMoodEntry, ...moodHistory].slice(0, 30)
    setMoodHistory(updatedHistory)
    setLoadingMoodMessage(false)
    
    await AsyncStorage.setItem('skin_mood', JSON.stringify({
      todayMood: newMoodEntry,
      history: updatedHistory
    }))
    
    Alert.alert('Mood Recorded!', aiMessage)
  }

  // ✨ GLOW UP TIP HANDLER
  const handleTipPress = async (tip: typeof GLOW_UP_TIPS[0]) => {
    stopAutoSlide() // Stop auto-slide when user taps
    setSelectedTip(tip)
    setShowTipModal(true)
    setLoadingTipInfo(true)
    
    const info = await fetchGlowTipInfo(tip.tip)
    setTipInfo(info)
    setLoadingTipInfo(false)
  }

  const closeTipModal = () => {
    setShowTipModal(false)
    setTipInfo(null)
    startAutoSlide() // Restart auto-slide when modal closes
  }

  const getMoodEmoji = (): string => {
    return selectedMood ? selectedMood.emoji : '🤔'
  }

  const getScalePosition = (temp: number, currentWidth: number): number => {
    const min = 5, max = 35
    if (temp <= min) return 0
    if (temp >= max) return currentWidth
    return ((temp - min) / (max - min)) * currentWidth
  }

  const goToWeatherRecommendation = () => {
    if (!weather) return
    const temp = weather.main.temp
    const condition = weather.weather[0].main
    let skinType = "Normal"
    if (temp >= 5 && temp <= 15) skinType = "Dry"
    else if (temp >= 26) skinType = "Oily"

    router.push({
      pathname: "/features/weather/WeatherRecommendationScreen" as any,
      params: { skinType, temp, condition, city },
    })
  }

  // Render Glow Up Tip Item - WITH ARROW INDICATOR
  const renderGlowTipItem = ({ item }: { item: typeof GLOW_UP_TIPS[0] }) => (
    <TouchableOpacity
      style={styles.glowTipCard}
      onPress={() => handleTipPress(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#FFF9F0', '#FFF0E0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glowTipGradient}
      >
        <Image
          source={glowCardImages[item.imageKey as keyof typeof glowCardImages]}
          style={styles.glowTipImage}
          resizeMode="cover"
        />
        <View style={styles.glowTipOverlay}>
          <View style={styles.glowTipContent}>
            <View style={styles.glowTipTitleRow}>
              <Text style={styles.glowTipTitle}>{item.title}</Text>
              <View style={styles.clickableIndicator}>
                <Ionicons name="arrow-forward-circle" size={22} color="#E67E22" />
              </View>
            </View>
            <Text style={styles.glowTipSubtitle}>{item.subtitle}</Text>
            <View style={styles.glowTipBadge}>
              <Ionicons name="sparkles" size={12} color="#E67E22" />
              <Text style={styles.glowTipBadgeText}>Tap to learn more</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )

  useEffect(() => {
    getUserCity().then((detectedCity) => {
      setCity(detectedCity)
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${detectedCity}&appid=${API_KEY}&units=metric`)
        .then((res) => res.json())
        .then((data) => { if (data.cod === 200) setWeather(data) })
        .finally(() => setLoading(false))
    })
      
    fetchWelcomeMessage()
    loadStreakData()
    loadMoodData()
    startAutoSlide()

    return () => {
      stopAutoSlide()
    }
  }, [])

  const weatherIcon = weather ? getWeatherIcon(weather.weather[0].main) : { name: "sunny" as IoniconsName, color: "#FFB300" }

  const handleScaleLayout = (e: LayoutChangeEvent) => {
    setScaleWidth(e.nativeEvent.layout.width)
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />

      {/* MOOD SELECTOR MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMoodModal}
        onRequestClose={() => setShowMoodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.moodModalContent}>
            <View style={styles.moodModalHeader}>
              <Text style={styles.moodModalTitle}>How's your skin today? 🌸</Text>
              <TouchableOpacity onPress={() => setShowMoodModal(false)}>
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.moodGrid}>
              {moodOptions.map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  style={[styles.moodItem, { backgroundColor: mood.color + '30' }]}
                  onPress={() => handleMoodSelect(mood)}
                >
                  <Text style={styles.moodModalEmoji}>{mood.emoji}</Text>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                  <Text style={styles.moodDesc}>{mood.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* GLOW UP TIP MODAL - WIDER LEFT/RIGHT */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTipModal}
        onRequestClose={closeTipModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.tipModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedTip && (
                <>
                  <View style={styles.tipModalImageContainer}>
                    <Image
                      source={glowModalImages[selectedTip.modalImageKey as keyof typeof glowModalImages]}
                      style={styles.tipModalImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity 
                      style={styles.tipModalClose}
                      onPress={closeTipModal}
                    >
                      <Ionicons name="close-circle" size={36} color="#FFF" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.tipModalBody}>
                    {loadingTipInfo ? (
                      <View style={styles.tipLoadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.darkGreen} />
                        <Text style={styles.tipLoadingText}>Loading skincare wisdom...</Text>
                      </View>
                    ) : tipInfo ? (
                      <>
                        <Text style={styles.tipModalTitle}>{tipInfo.title}</Text>
                        <Text style={styles.tipModalDescription}>{tipInfo.description}</Text>
                        
                        <View style={styles.tipBenefitsSection}>
                          <View style={styles.tipSectionHeader}>
                            <Ionicons name="leaf" size={20} color={COLORS.darkGreen} />
                            <Text style={styles.tipSectionTitle}>Benefits</Text>
                          </View>
                          <View style={styles.tipBenefitsList}>
                            {tipInfo.benefits.map((benefit, index) => (
                              <View key={index} style={styles.tipBenefitItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.tipBenefitText}>{benefit}</Text>
                              </View>
                            ))}
                          </View>
                        </View>

                        <View style={styles.tipHowToSection}>
                          <View style={styles.tipSectionHeader}>
                            <Ionicons name="bulb-outline" size={20} color={COLORS.darkGreen} />
                            <Text style={styles.tipSectionTitle}>How To Use</Text>
                          </View>
                          <Text style={styles.tipHowToText}>{tipInfo.howToUse}</Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.tipErrorText}>Unable to load skincare information. Please try again.</Text>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* INSTRUCTION MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showProjectInfo}
        onRequestClose={() => setShowProjectInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={styles.modalHeaderIconBg}>
                  <Ionicons name="shield-checkmark" size={20} color={COLORS.accent} />
                </View>
                <Text style={styles.modalTitle}>About DermaScanAI</Text>
              </View>
              <TouchableOpacity onPress={() => setShowProjectInfo(false)}>
                <Ionicons name="close-circle-outline" size={32} color="#ccc" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.modalIntro}>
                DermaScanAI is your intelligent companion for skin health management. Our system uses advanced Neural Networks to analyze skin patterns and provide clinical-grade insights.
              </Text>

              <View style={styles.detailSection}>
                <Text style={styles.sectionHeading}>Platform Overview</Text>
                <Text style={styles.sectionText}>
                  Our application integrates Environmental Data (Weather), Ingredient Analysis, and Computer Vision to give you a 360-degree view of your dermatological health.
                </Text>
              </View>

              <Text style={[styles.sectionHeading, { marginTop: 15, marginBottom: 15 }]}>Core Instructions</Text>

              <View style={styles.instructionItem}>
                <View style={styles.stepCircle}><Text style={styles.stepText}>1</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.instructionHeading}>Precision Scanning</Text>
                  <Text style={styles.instructionDesc}>For AI Disease Analysis, ensure the lesion is centered. Use high-resolution mode and avoid using camera flash which can distort the natural color of skin tissues.</Text>
                </View>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.stepCircle}><Text style={styles.stepText}>2</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.instructionHeading}>Chemical Awareness</Text>
                  <Text style={styles.instructionDesc}>When scanning products, the AI looks for Parabens, Sulfates, and Comedogenic ingredients. Make sure the text on the bottle is flat and readable.</Text>
                </View>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.stepCircle}><Text style={styles.stepText}>3</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.instructionHeading}>Weather Adaptation</Text>
                  <Text style={styles.instructionDesc}>The dashboard monitors humidity and UV levels in {city}. Follow the "Environmental Suggestion" card to adjust your moisturizer or SPF usage based on daily fluctuations.</Text>
                </View>
              </View>

              <View style={styles.medicalNote}>
                <Ionicons name="warning" size={24} color="#D32F2F" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.medicalNoteText, { fontWeight: 'bold', color: '#D32F2F' }]}>Medical Disclaimer:</Text>
                  <Text style={styles.medicalNoteText}>This technology is designed for educational and screening purposes only. It is NOT a replacement for a biopsy or professional medical consultation.</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowProjectInfo(false)}>
              <Text style={styles.closeBtnText}>Continue to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HEADER */}
      <View style={styles.fixedHeader}>
        <LinearGradient colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]} style={styles.headerGradient}>
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuButton}>
                <Ionicons name="grid-outline" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>DermaScanAI</Text>
                <Text style={styles.headerSubtitle}>Advanced Skin Diagnostics</Text>
              </View>
              <TouchableOpacity onPress={() => setShowProjectInfo(true)} style={styles.menuButton}>
                <Ionicons name="information-circle-outline" size={26} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <LinearGradient colors={[COLORS.bgGradientTop, COLORS.bgGradientBottom]} style={StyleSheet.absoluteFillObject} />

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* 🌟 CUTE WELCOME MESSAGE */}
        <View style={styles.cuteWelcomeContainer}>
          <LinearGradient
            colors={['#FFF9F0', '#FFE9F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cuteWelcomeGradient}
          >
            {loadingMessage ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FF69B4" />
                <Text style={styles.loadingText}>Crafting your welcome message...</Text>
              </View>
            ) : (
              <View style={styles.cuteWelcomeContent}>
                <View style={styles.cuteEmojiContainer}>
                  <Ionicons name="heart-circle" size={24} color="#FF69B4" />
                  <Ionicons name="sparkles" size={18} color="#FFA500" style={styles.sparkleIcon} />
                  <Ionicons name="flower" size={20} color="#9B59B6" style={styles.flowerIcon} />
                </View>
                <View style={styles.cuteTextContainer}>
                  <Text style={styles.cuteGreeting}>{welcomeMessage.greeting}</Text>
                  <Text style={styles.cuteMessage}>
                    {welcomeMessage.message}
                  </Text>
                </View>
                <View style={styles.cuteDecoLine} />
              </View>
            )}
          </LinearGradient>
        </View>

        {/* ✨ GLOW UP TIPS CAROUSEL - WITH ARROW INDICATORS */}
        <View style={styles.glowTipsSection}>
          <FlatList
            ref={flatListRef}
            data={GLOW_UP_TIPS}
            renderItem={renderGlowTipItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.glowTipsList}
            snapToInterval={width * 0.85 + 16}
            decelerationRate="fast"
            pagingEnabled
            onScrollBeginDrag={stopAutoSlide}
            onScrollEndDrag={startAutoSlide}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (width * 0.85 + 16))
              currentIndex.current = index
              startAutoSlide()
            }}
          />
        </View>

        {/* PRODUCT SCANNER CARD */}
        <TouchableOpacity
          style={styles.productScannerCard}
          onPress={() => router.push("/features/Product_Scanner/ProductScannerScreen")}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FFF9E6', '#FFE4B5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.productCardGradient}
          >
            <View style={styles.productCardContent}>
              <View style={styles.productCardLeft}>
                <Text style={styles.productCardTitle}>Smart Ingredient Scanner</Text>
                <Text style={styles.productCardSubtitle}>Analyze ingredients for safety</Text>
                <View style={styles.productFeatures}>
                  <View style={styles.featurePill}>
                    <Ionicons name="checkmark-circle" size={12} color="#27AE60" />
                    <Text style={styles.featureText}>Analysis</Text>
                  </View>
                  <View style={styles.featurePill}>
                    <Ionicons name="warning" size={12} color="#F39C12" />
                    <Text style={styles.featureText}>Alerts</Text>
                  </View>
                  <View style={styles.featurePill}>
                    <Ionicons name="leaf" size={12} color="#2ECC71" />
                    <Text style={styles.featureText}>Natural</Text>
                  </View>
                </View>
              </View>
              <View style={styles.productCardRight}>
                <LinearGradient
                  colors={['#F39C12', '#E67E22']}
                  style={styles.productIconCircle}
                >
                  <Ionicons name="barcode-outline" size={26} color={COLORS.white} />
                </LinearGradient>
                <View style={styles.scanIndicator}>
                  <Ionicons name="camera" size={12} color="#E67E22" />
                  <Text style={styles.scanText}>Scan</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* SKIN ANALYSIS + DISEASE - 2 COLUMN GRID */}
        <View style={styles.twoColumnRow}>
          <TouchableOpacity 
            style={styles.gridCard} 
            onPress={() => router.push("/features/skin_type/SkintypeScreen")}
            activeOpacity={0.8}
          >
            <View style={[styles.gridCardIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="finger-print" size={22} color="#2E8B57" />
            </View>
            <Text style={styles.gridCardTitle}>Skin Type</Text>
            <Text style={styles.gridCardSubtitle}>AI Detection</Text>
            <Ionicons name="arrow-forward-circle" size={18} color="#2E8B57" style={styles.gridCardArrow} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push("/features/skin_disease/skindiseaseanalyzer")}
            activeOpacity={0.8}
          >
            <View style={[styles.gridCardIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="pulse" size={22} color="#1976D2" />
            </View>
            <Text style={styles.gridCardTitle}>Skin Disease</Text>
            <Text style={styles.gridCardSubtitle}>AI Analyzer</Text>
            <Ionicons name="arrow-forward-circle" size={18} color="#1976D2" style={styles.gridCardArrow} />
          </TouchableOpacity>
        </View>

        {/* CHATBOT BUTTON - WHITE BACKGROUND */}
        <TouchableOpacity
          style={styles.whiteToolButton}
          onPress={() => router.push("/features/chatbot/SkinChatbotScreen")}
          activeOpacity={0.8}
        >
          <View style={styles.whiteButtonContent}>
            <View style={styles.whiteButtonIcon}>
              <Ionicons name="chatbubble-ellipses" size={28} color={COLORS.chatbotPurple} />
            </View>
            <View style={styles.whiteButtonTextContainer}>
              <Text style={styles.whiteButtonTitle}>Skin Care Assistant</Text>
              <Text style={styles.whiteButtonSubtitle}>Ask about skincare, diet & products</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color={COLORS.chatbotPurple} />
          </View>
        </TouchableOpacity>

        {/* STREAK CARD - Clean Green Style */}
        <View style={styles.streakCard}>
          <View style={styles.streakCardTop}>
            <View style={styles.streakCardLeft}>
              <View style={styles.streakFlameIcon}>
                <Ionicons name="flame" size={18} color="#4CAF50" />
              </View>
              <View>
                <Text style={styles.streakCardCount}>{streak} Days</Text>
                <Text style={styles.streakCardSubtitle}>Great job! Keep it up 🔥</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.streakCheckInBtn, checkedInToday && styles.streakCheckedInBtn]}
              onPress={handleCheckIn}
              disabled={checkedInToday}
            >
              <Ionicons 
                name={checkedInToday ? "checkmark-circle" : "checkbox-outline"} 
                size={12} 
                color={checkedInToday ? "#27AE60" : "#4CAF50"} 
              />
              <Text style={[styles.streakCheckInText, checkedInToday && styles.streakCheckedInText]}>
                {checkedInToday ? "Checked" : "Check In"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Weekly Progress */}
          <View style={styles.streakWeeklyRow}>
            {getWeeklyDays().map((day, i) => (
              <View key={i} style={styles.streakDayItem}>
                <Text style={styles.streakDayLabel}>{day.label}</Text>
                {day.isCompleted ? (
                  <View style={styles.streakDayCheck}>
                    <Ionicons name="checkmark" size={10} color="#FFF" />
                  </View>
                ) : (
                  <View style={[styles.streakDayCircle, day.isToday && styles.streakDayToday]} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* MOOD CARD - Separate */}
        <View style={styles.moodCard}>
          <View style={styles.moodCardHeader}>
            <View style={styles.moodCardTitleRow}>
              <Ionicons name="heart" size={14} color="#FF69B4" />
              <Text style={styles.moodCardTitle}>Today's Mood</Text>
            </View>
            <TouchableOpacity onPress={() => setShowMoodModal(true)}>
              <View style={styles.moodChangeBtn}>
                <Text style={styles.moodChangeText}>{selectedMood ? 'Change' : 'Select'}</Text>
                <Ionicons name="chevron-forward" size={10} color="#FF69B4" />
              </View>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.moodDisplay}
            onPress={() => setShowMoodModal(true)}
          >
            <Text style={styles.moodEmoji}>{getMoodEmoji()}</Text>
            <View style={styles.moodTextContainer}>
              <Text style={styles.moodDisplayLabel}>
                {selectedMood ? selectedMood.label : 'How is your skin?'}
              </Text>
              {loadingMoodMessage ? (
                <ActivityIndicator size="small" color="#FF69B4" style={styles.moodMessageLoader} />
              ) : (
                currentMoodMessage ? (
                  <Text style={styles.moodAIMessage} numberOfLines={1}>{currentMoodMessage}</Text>
                ) : null
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color="#FF69B4" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FULL WIDTH BOTTOM NAVIGATION */}
      <View style={styles.fullWidthBottomNav}>
        <TouchableOpacity 
          style={styles.fullWidthNavItem} 
          onPress={() => animateTab('home', "/DashboardScreen")}
          activeOpacity={1}
        >
          <Animated.View style={{ transform: [{ scale: tabAnimations.home }] }}>
            <LinearGradient
              colors={activeTab === 'home' ? [COLORS.darkGreen, COLORS.mediumGreen] : ['#f5f5f5', '#e8e8e8']}
              style={styles.fullWidthNavIcon}
            >
              <Ionicons 
                name={activeTab === 'home' ? "home" : "home-outline"} 
                size={22} 
                color={activeTab === 'home' ? COLORS.white : "#666"} 
              />
            </LinearGradient>
          </Animated.View>
          <Text style={[styles.fullWidthNavLabel, activeTab === 'home' && styles.fullWidthNavLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.fullWidthNavItem} 
          onPress={() => animateTab('weather', "/features/weather/WeatherRecommendationScreen")}
          activeOpacity={1}
        >
          <Animated.View style={{ transform: [{ scale: tabAnimations.weather }] }}>
            <LinearGradient
              colors={activeTab === 'weather' ? [COLORS.darkGreen, COLORS.mediumGreen] : ['#f5f5f5', '#e8e8e8']}
              style={styles.fullWidthNavIcon}
            >
              <Ionicons 
                name={activeTab === 'weather' ? "cloud" : "cloud-outline"} 
                size={22} 
                color={activeTab === 'weather' ? COLORS.white : "#666"} 
              />
            </LinearGradient>
          </Animated.View>
          <Text style={[styles.fullWidthNavLabel, activeTab === 'weather' && styles.fullWidthNavLabelActive]}>Weather</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.fullWidthNavItem} 
          onPress={() => animateTab('routine', "/features/skin_routine/RoutineScheduler")}
          activeOpacity={1}
        >
          <Animated.View style={{ transform: [{ scale: tabAnimations.routine }] }}>
            <LinearGradient
              colors={activeTab === 'routine' ? [COLORS.darkGreen, COLORS.mediumGreen] : ['#f5f5f5', '#e8e8e8']}
              style={styles.fullWidthNavIcon}
            >
              <Ionicons 
                name={activeTab === 'routine' ? "calendar" : "calendar-outline"} 
                size={22} 
                color={activeTab === 'routine' ? COLORS.white : "#666"} 
              />
            </LinearGradient>
          </Animated.View>
          <Text style={[styles.fullWidthNavLabel, activeTab === 'routine' && styles.fullWidthNavLabelActive]}>Routine</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.fullWidthNavItem} 
          onPress={() => animateTab('profile', "/features/skin_type/saved-skin-results")}
          activeOpacity={1}
        >
          <Animated.View style={{ transform: [{ scale: tabAnimations.profile }] }}>
            <LinearGradient
              colors={activeTab === 'profile' ? [COLORS.darkGreen, COLORS.mediumGreen] : ['#f5f5f5', '#e8e8e8']}
              style={styles.fullWidthNavIcon}
            >
              <Ionicons 
                name={activeTab === 'profile' ? "person" : "person-outline"} 
                size={22} 
                color={activeTab === 'profile' ? COLORS.white : "#666"} 
              />
            </LinearGradient>
          </Animated.View>
          <Text style={[styles.fullWidthNavLabel, activeTab === 'profile' && styles.fullWidthNavLabelActive]}>Skin Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F5F9F6' },
  fixedHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000, elevation: 10 },
  headerGradient: { paddingBottom: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15, paddingTop: Platform.OS === "android" ? 40 : 10 },
  menuButton: { padding: 8 },
  titleContainer: { alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.white, letterSpacing: 1 },
  headerSubtitle: { fontSize: 11, color: "rgba(255, 255, 255, 0.8)", fontWeight: "600", textTransform: "uppercase", marginTop: 2 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingTop: Platform.OS === "ios" ? 140 : 130, paddingBottom: 20 },
  
  // Welcome Message
  cuteWelcomeContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 25,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: "#FF9AA2",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cuteWelcomeGradient: {
    borderRadius: 25,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFD1DC',
    minHeight: 70,
  },
  cuteWelcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cuteEmojiContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  sparkleIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  flowerIcon: {
    position: 'absolute',
    bottom: -5,
    left: -5,
  },
  cuteTextContainer: {
    flex: 1,
  },
  cuteGreeting: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D44B6B',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  cuteMessage: {
    fontSize: 11,
    color: '#7A5B6B',
    lineHeight: 15,
    fontWeight: '500',
  },
  cuteDecoLine: {
    width: 2,
    height: 30,
    backgroundColor: '#FFB6C1',
    borderRadius: 2,
    marginLeft: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 11,
    color: '#FF69B4',
    fontWeight: '500',
  },
  
  // Glow Tips Section
  glowTipsSection: {
    marginVertical: 5,
    paddingHorizontal: 16,
  },
  glowTipsList: {
    paddingRight: 8,
  },
  glowTipCard: {
    width: width * 0.85,
    marginRight: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  glowTipGradient: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  glowTipImage: {
    width: '100%',
    height: 220,
  },
  glowTipOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 16,
  },
  glowTipContent: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 14,
  },
  glowTipTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  glowTipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#33420f',
    flex: 1,
  },
  clickableIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(230, 126, 34, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowTipSubtitle: {
    fontSize: 12,
    color: '#7A5B6B',
    marginTop: 4,
  },
  glowTipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  glowTipBadgeText: {
    fontSize: 10,
    color: '#E67E22',
    marginLeft: 4,
    fontWeight: '600',
  },
  
  // Tip Modal Styles
  tipModalContent: {
    backgroundColor: "white",
    borderRadius: 30,
    width: "100%",
    maxHeight: "90%",
    overflow: 'hidden',
    elevation: 20,
  },
  tipModalImageContainer: {
    position: 'relative',
    width: '100%',
    height: 240,
  },
  tipModalImage: {
    width: '100%',
    height: '100%',
  },
  tipModalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  },
  tipModalBody: {
    padding: 20,
  },
  tipLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 70,
  },
  tipLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.darkGreen,
  },
  tipModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 10,
    textAlign: 'center',
  },
  tipModalDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 18,
    textAlign: 'center',
  },
  tipBenefitsSection: {
    marginBottom: 18,
  },
  tipSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginLeft: 8,
  },
  tipBenefitsList: {
    paddingLeft: 8,
  },
  tipBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipBenefitText: {
    fontSize: 13,
    color: '#555',
    marginLeft: 8,
    flex: 1,
  },
  tipHowToSection: {
    marginBottom: 18,
  },
  tipHowToText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
    paddingLeft: 8,
  },
  tipErrorText: {
    fontSize: 15,
    color: '#F44336',
    textAlign: 'center',
    paddingVertical: 50,
  },
  
  // Product Scanner Card
  productScannerCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: "#F39C12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  productCardGradient: {
    padding: 14,
    borderRadius: 20,
  },
  productCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productCardLeft: {
    flex: 1,
    marginRight: 16,
  },
  productBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  productBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#E67E22',
    marginLeft: 4,
  },
  productCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#3f5225',
    marginBottom: 4,
  },
  productCardSubtitle: {
    fontSize: 10,
    color: '#E67E22',
    marginBottom: 10,
  },
  productFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 10,
    color: '#D35400',
    marginLeft: 3,
    fontWeight: '600',
  },
  productCardRight: {
    alignItems: 'center',
  },
  productIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  scanIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  scanText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E67E22',
    marginLeft: 3,
  },
  
  // 2-Column Grid Cards
  twoColumnRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  gridCardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 1,
  },
  gridCardSubtitle: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  gridCardArrow: {
    marginTop: 6,
  },

  // White Background Tool Buttons
  whiteToolButton: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  whiteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
  },
  whiteButtonIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#F5F5F5',
  },
  whiteButtonTextContainer: {
    flex: 1,
  },
  whiteButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#333',
  },
  whiteButtonSubtitle: {
    fontSize: 11,
    color: '#666',
  },
  
  // Streak Card
  streakCard: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: '#F8FAF9',
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  streakCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  streakFlameIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  streakCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 1,
  },
  streakCardCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 0,
  },
  streakCardSubtitle: {
    fontSize: 10,
    color: '#888',
  },
  streakCardRight: {
    alignItems: 'flex-end',
  },
  streakBestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  streakBestText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E67E22',
    marginLeft: 3,
  },
  streakCheckInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  streakCheckedInBtn: {
    backgroundColor: '#E8F5E9',
    borderColor: '#27AE60',
  },
  streakCheckInText: {
    marginLeft: 3,
    fontSize: 10,
    fontWeight: '600',
    color: '#4CAF50',
  },
  streakCheckedInText: {
    color: '#27AE60',
  },
  streakWeeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  streakDayItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakDayLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#999',
    marginBottom: 3,
  },
  streakDayCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakDayCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
  },
  streakDayToday: {
    borderColor: '#4CAF50',
  },
  streakBottomMsg: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },

  // Mood Card
  moodCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  moodCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginLeft: 6,
  },
  moodChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  moodChangeText: {
    fontSize: 10,
    color: '#FF69B4',
    fontWeight: '600',
    marginRight: 2,
  },
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FFF5F8',
  },
  moodEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  moodTextContainer: {
    flex: 1,
  },
  moodDisplayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  moodAIMessage: {
    fontSize: 10,
    color: '#FF69B4',
    marginTop: 2,
    fontStyle: 'italic',
  },
  moodMessageLoader: {
    marginTop: 2,
  },
  
  // Full Width Bottom Navigation
  fullWidthBottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.98)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(78, 117, 101, 0.15)',
    shadowColor: "#4e7565",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 15,
  },
  fullWidthNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  fullWidthNavIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  fullWidthNavLabel: {
    fontSize: 11,
    marginTop: -8,
    marginBottom: 32,
    color: '#999',
    fontWeight: '500',
  },
  fullWidthNavLabelActive: {
    color: COLORS.darkGreen,
    fontWeight: '600',
  },
  
  // Modal Styles
  moodModalContent: {
    backgroundColor: "white",
    borderRadius: 30,
    padding: 24,
    width: "90%",
    maxHeight: "80%",
    elevation: 20,
  },
  moodModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 15,
  },
  moodModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.darkGreen,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodItem: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD1DC',
  },
  moodModalEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  moodDesc: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { backgroundColor: "white", borderRadius: 30, padding: 24, width: "100%", maxHeight: "85%", elevation: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 15 },
  modalHeaderIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F7F2', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  modalTitle: { fontSize: 19, fontWeight: "bold", color: COLORS.darkGreen },
  modalIntro: { fontSize: 14, color: COLORS.mediumGreen, lineHeight: 21, marginBottom: 15, fontWeight: '500' },
  detailSection: { backgroundColor: '#f4f9f6', padding: 15, borderRadius: 15, marginBottom: 15 },
  sectionHeading: { fontSize: 16, fontWeight: "bold", color: COLORS.darkGreen, marginBottom: 5 },
  sectionText: { fontSize: 13, color: COLORS.mediumGreen, lineHeight: 19 },
  instructionItem: { flexDirection: "row", marginBottom: 20 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accent, justifyContent: "center", alignItems: "center", marginRight: 15 },
  stepText: { fontSize: 13, fontWeight: "bold", color: "white" },
  instructionHeading: { fontSize: 15, fontWeight: "bold", color: COLORS.darkGreen, marginBottom: 2 },
  instructionDesc: { fontSize: 13, color: COLORS.mediumGreen, lineHeight: 18 },
  medicalNote: { backgroundColor: "#FFF2F2", padding: 15, borderRadius: 15, flexDirection: "row", marginTop: 10, borderWidth: 1, borderColor: '#FFDADA' },
  medicalNoteText: { fontSize: 12, color: "#B71C1C", lineHeight: 17 },
  closeBtn: { backgroundColor: COLORS.darkGreen, paddingVertical: 15, borderRadius: 18, alignItems: "center", marginTop: 20 },
  closeBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
})