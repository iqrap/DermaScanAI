import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
  Modal
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter, useLocalSearchParams } from "expo-router"
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import { apiService } from "../../../src/services/apiService"
import { ENV } from "../../../src/config/env"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function WeatherRecommendationScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()

  const defaultCity = (params?.city as string) || ""

  const [resolvedCity, setResolvedCity] = useState(defaultCity || "Rawalpindi")

  const [weatherData, setWeatherData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [llmLoading, setLlmLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<any>(null)
  const [category, setCategory] = useState<string>("NORMAL")
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null)
  
  const [bookmarkedTips, setBookmarkedTips] = useState<any[]>([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [uvIndex, setUvIndex] = useState<number | null>(null)
  const [timeOfDay, setTimeOfDay] = useState<string>("")
  const [randomTip, setRandomTip] = useState<any>(null)
  const [showRandomTip, setShowRandomTip] = useState(false)

  useEffect(() => {
    loadBookmarks()
    updateTimeOfDay()
    // Resolve city from geolocation if no city was passed via params
    if (!defaultCity) {
      getUserCity().then((city) => {
        setResolvedCity(city)
      })
    }
  }, [])

  useEffect(() => {
    if (resolvedCity) {
      loadCachedData()
      fetchWeatherData(false)
    }
  }, [resolvedCity])

  // Get user's city from device geolocation
  const getUserCity = async (): Promise<string> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return "Rawalpindi"

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const { latitude, longitude } = location.coords

      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&cnt=1&appid=${ENV.WEATHER_API_KEY}`
      )
      const geoData = await res.json()
      if (geoData?.[0]?.name) return geoData[0].name
      return "Rawalpindi"
    } catch (error) {
      console.log('Geolocation error:', error)
      return "Rawalpindi"
    }
  }

  useEffect(() => {
    const interval = setInterval(updateTimeOfDay, 60000)
    return () => clearInterval(interval)
  }, [])

  const updateTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) setTimeOfDay("MORNING")
    else if (hour < 17) setTimeOfDay("AFTERNOON")
    else if (hour < 20) setTimeOfDay("EVENING")
    else setTimeOfDay("NIGHT")
  }

  const loadBookmarks = async () => {
    try {
      const saved = await AsyncStorage.getItem('bookmarkedTips')
      if (saved) {
        setBookmarkedTips(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error)
    }
  }

  const loadCachedData = async () => {
    try {
      if (!resolvedCity) return
      
      const cached = await AsyncStorage.getItem(`weather_${resolvedCity}`)
      if (cached) {
        const { timestamp } = JSON.parse(cached)
        setLastRefreshTime(timestamp)
      }
    } catch (error) {
      console.error('Error loading cache:', error)
    }
  }

  const toggleBookmark = async (tip: any, section: string) => {
    const tipWithSection = { ...tip, section, savedAt: Date.now() }
    
    let newBookmarks
    const isBookmarked = bookmarkedTips.some(t => t.id === tip.id && t.title === tip.title)
    
    if (isBookmarked) {
      newBookmarks = bookmarkedTips.filter(t => !(t.id === tip.id && t.title === tip.title))
      Alert.alert('Removed', 'Tip removed from bookmarks')
    } else {
      newBookmarks = [...bookmarkedTips, tipWithSection]
      Alert.alert('Saved!', 'Tip added to bookmarks')
    }
    
    setBookmarkedTips(newBookmarks)
    await AsyncStorage.setItem('bookmarkedTips', JSON.stringify(newBookmarks))
  }

  const isTipBookmarked = (tip: any) => {
    return bookmarkedTips.some(t => t.id === tip.id && t.title === tip.title)
  }

  const getRandomTip = () => {
    if (!recommendations) return
    
    const allTips = [
      ...(recommendations.skincare?.map((t: any) => ({ ...t, section: 'skincare' })) || []),
      ...(recommendations.avoid?.map((t: any) => ({ ...t, section: 'avoid' })) || []),
      ...(recommendations.homeRemedies?.map((t: any) => ({ ...t, section: 'homeRemedies' })) || [])
    ]
    
    if (allTips.length > 0) {
      const random = allTips[Math.floor(Math.random() * allTips.length)]
      setRandomTip(random)
      setShowRandomTip(true)
    }
  }

  const fetchWeatherData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const cityName = resolvedCity as string
      
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(`weather_${cityName}`)
        if (cached) {
          const { weather, recommendations, category, uvIndex, timestamp } = JSON.parse(cached)
          const hoursSinceCache = (Date.now() - timestamp) / (1000 * 60 * 60)
          
          if (hoursSinceCache < 1) {
            console.log(`📦 Using cached data for ${cityName}`)
            setWeatherData(weather)
            setRecommendations(recommendations)
            setCategory(category)
            setUvIndex(uvIndex)
            setLastRefreshTime(timestamp)
            setLoading(false)
            return
          }
        }
      }
      
      const result = await apiService.getWeatherRecommendations(cityName, timeOfDay)
      
      setWeatherData(result.weather)
      setRecommendations(result.recommendations)
      setCategory(result.weatherCategory)
      setUvIndex(result.uvIndex)
      
      const timestamp = Date.now()
      const cacheData = {
        weather: result.weather,
        recommendations: result.recommendations,
        category: result.weatherCategory,
        uvIndex: result.uvIndex,
        timestamp
      }
      await AsyncStorage.setItem(`weather_${cityName}`, JSON.stringify(cacheData))
      setLastRefreshTime(timestamp)
      
    } catch (error: any) {
      // Show the in-app retry UI instead of logging an error
      setError(error.message || 'Weather service is unavailable. Please check your internet connection.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const getWeatherIcon = (temp: number, condition: string) => {
    const cond = condition.toLowerCase()
    if (temp > 34) return "sunny"
    if (temp <= 15) return "snow"
    if (cond.includes("rain") || cond.includes("drizzle")) return "rainy"
    if (cond.includes("thunder")) return "thunderstorm"
    if (cond.includes("cloud")) return "cloudy"
    return "partly-sunny"
  }

  const getUVWarning = (uv: number | null) => {
    if (!uv) return null
    if (uv <= 2) return { text: "Low UV", color: "#4CAF50" }
    if (uv <= 5) return { text: "Moderate UV", color: "#FFC107" }
    if (uv <= 7) return { text: "High UV", color: "#FF9800" }
    if (uv <= 10) return { text: "Very High UV", color: "#F44336" }
    return { text: "Extreme UV", color: "#9C27B0" }
  }

  // Map tip title keywords to relevant icons
  const getTipIcon = (title: string, section: string): string => {
    const t = title.toLowerCase()
    if (t.includes('water') || t.includes('hydrat') || t.includes('drink')) return 'water'
    if (t.includes('sun') || t.includes('spf') || t.includes('uv') || t.includes('sunscreen')) return 'sunny'
    if (t.includes('cream') || t.includes('moistur') || t.includes('lotion')) return 'hand-left'
    if (t.includes('wash') || t.includes('cleans') || t.includes('face')) return 'sparkles'
    if (t.includes('sleep') || t.includes('rest') || t.includes('night')) return 'moon'
    if (t.includes('avoid') || t.includes('dont') || t.includes('don\u2019t')) return 'close-circle'
    if (t.includes('hot') || t.includes('heat') || t.includes('shower')) return 'thermometer'
    if (t.includes('makeup') || t.includes('cosmetic')) return 'color-palette'
    if (t.includes('stress') || t.includes('calm') || t.includes('relax')) return 'happy'
    if (t.includes('exercise') || t.includes('walk') || t.includes('workout')) return 'bicycle'
    if (t.includes('diet') || t.includes('food') || t.includes('eat')) return 'nutrition'
    if (t.includes('pollution') || t.includes('dust') || t.includes('dirty')) return 'alert-circle'
    if (t.includes('touch') || t.includes('pick') || t.includes('scratch')) return 'hand-left'
    if (t.includes('aloe') || t.includes('gel')) return 'leaf'
    if (t.includes('honey')) return 'restaurant'
    if (t.includes('turmeric') || t.includes('mask')) return 'color-fill'
    if (t.includes('coconut') || t.includes('oil')) return 'water'
    if (t.includes('cucumber') || t.includes('cold')) return 'snow'
    if (t.includes('tea') || t.includes('green')) return 'cafe'
    if (t.includes('oat') || t.includes('milk')) return 'restaurant'
    // Section default icons
    if (section === 'skincare') return 'shield'
    if (section === 'avoid') return 'ban'
    return 'leaf'
  }

  const getLastRefreshText = () => {
    if (!lastRefreshTime) return "Never"
    
    const minutes = Math.floor((Date.now() - lastRefreshTime) / (1000 * 60))
    
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes} min ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    
    return new Date(lastRefreshTime).toLocaleDateString()
  }

  if (loading) {
    return (
      <ImageBackground
        source={require("../../../assets/images/background.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Fetching weather for {resolvedCity}...</Text>
        </View>
      </ImageBackground>
    )
  }

  if (error) {
    return (
      <ImageBackground
        source={require("../../../assets/images/background.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={80} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Weather Data Unavailable</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchWeatherData(true)}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    )
  }

  return (
    <ImageBackground
      source={require("../../../assets/images/background.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={Platform.OS === 'ios' ? 28 : 26} color="#2E7D32" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🌿 Complete Wellness</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setShowBookmarks(true)} style={styles.headerButton}>
            <Ionicons name="bookmark" size={22} color="#2E7D32" />
            {bookmarkedTips.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{bookmarkedTips.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              setIsRefreshing(true)
              fetchWeatherData(true)
            }} 
            style={styles.headerButton}
            disabled={llmLoading}
          >
            <Ionicons 
              name="refresh" 
              size={22} 
              color={llmLoading ? "#ccc" : "#2E7D32"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {lastRefreshTime && (
        <View style={styles.refreshInfo}>
          <Ionicons name="time-outline" size={14} color="#7F8C8D" />
          <Text style={styles.refreshText}>
            Last updated: {getLastRefreshText()}
            {isRefreshing ? ' • Refreshing...' : ''}
          </Text>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {weatherData && (
          <View style={styles.weatherCard}>
            <View style={styles.weatherHeader}>
              <View style={styles.weatherIconGlow}>
                <LinearGradient
                  colors={['#2E7D32', '#43A047']}
                  style={styles.weatherIconCircle}
                >
                  <Ionicons 
                    name={getWeatherIcon(weatherData.main.temp, weatherData.weather[0].main)} 
                    size={36} 
                    color="#FFFFFF" 
                  />
                </LinearGradient>
              </View>
              <View style={styles.weatherTextContainer}>
                <Text style={styles.cityText}>{weatherData.name}</Text>
                <Text style={styles.tempText}>{Math.round(weatherData.main.temp)}°C</Text>
              </View>
            </View>
            
            <View style={styles.timeBadge}>
              <Ionicons 
                name={timeOfDay === 'MORNING' ? 'sunny' : timeOfDay === 'NIGHT' ? 'moon' : 'partly-sunny'} 
                size={16} 
                color="#2E7D32" 
              />
              <Text style={styles.timeBadgeText}>{timeOfDay}</Text>
            </View>

            <Text style={styles.conditionText}>
              {weatherData.weather[0].description} • {category} Weather
            </Text>
            
            <View style={styles.weatherDetails}>
              <View style={styles.weatherDetailItem}>
                <Ionicons name="thermometer-outline" size={14} color="#2E7D32" />
                <Text style={styles.weatherDetailText}>Feels like: {Math.round(weatherData.main.feels_like || weatherData.main.temp)}°C</Text>
              </View>
              <View style={styles.weatherDetailItem}>
                <Ionicons name="water-outline" size={14} color="#2E7D32" />
                <Text style={styles.weatherDetailText}>Humidity: {weatherData.main.humidity}%</Text>
              </View>
            </View>

            {uvIndex !== null && (
              <View style={[styles.uvContainer, { backgroundColor: getUVWarning(uvIndex)?.color + '20' }]}>
                <Ionicons name="sunny" size={20} color={getUVWarning(uvIndex)?.color || '#2E7D32'} />
                <Text style={[styles.uvText, { color: getUVWarning(uvIndex)?.color || '#2E7D32' }]}>
                  UV Index: {uvIndex} • {getUVWarning(uvIndex)?.text}
                </Text>
              </View>
            )}
          </View>
        )}

        {!llmLoading && recommendations && (
          <TouchableOpacity style={styles.surpriseButton} onPress={getRandomTip}>
            <Ionicons name="dice" size={24} color="#fff" />
            <Text style={styles.surpriseButtonText}>Surprise Me with a Tip</Text>
          </TouchableOpacity>
        )}

        {llmLoading ? (
          <View style={styles.llmLoadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.llmLoadingText}>
              {isRefreshing ? '🔄 Refreshing' : '🧴 Creating'} wellness guide for {weatherData?.name || resolvedCity}...
            </Text>
          </View>
        ) : (
          recommendations && (
            <>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
                    <Ionicons name="shield-outline" size={20} color="#1976D2" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: '#1976D2' }]}>Skincare Tips</Text>
                </View>
                
                {recommendations.skincare?.slice(0, 3).map((tip: any, index: number) => (
                  <View key={index} style={styles.tipCard}>
                    <View style={[styles.tipNumberContainer, { backgroundColor: '#1976D2' }]}>
                      <Text style={styles.tipNumber}>{index + 1}</Text>
                    </View>
                    <View style={styles.tipContent}>
                      <View style={styles.tipTitleRow}>
                        <Text style={styles.tipTitle}>{tip.title}</Text>
                      </View>
                      <Text style={styles.tipText}>{tip.description}</Text>
                    </View>
                    <View style={styles.tipActions}>
                      <TouchableOpacity 
                        onPress={() => toggleBookmark(tip, 'skincare')}
                        style={styles.tipActionButton}
                      >
                        <Ionicons 
                          name={isTipBookmarked(tip) ? "bookmark" : "bookmark-outline"} 
                          size={18} 
                          color={isTipBookmarked(tip) ? "#1976D2" : "#95A5A6"} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(255, 69, 58, 0.1)' }]}>
                    <Ionicons name="ban-outline" size={20} color="#FF453A" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: '#FF453A' }]}>Things to Avoid</Text>
                </View>
                
                {recommendations.avoid?.slice(0, 3).map((item: any, index: number) => (
                  <View key={index} style={[styles.tipCard, { borderLeftColor: '#FF453A', borderLeftWidth: 3 }]}>
                    <View style={[styles.tipNumberContainer, { backgroundColor: '#FF453A' }]}>
                      <Text style={styles.tipNumber}>{index + 1}</Text>
                    </View>
                    <View style={styles.tipContent}>
                      <View style={styles.tipTitleRow}>
                        <Text style={styles.tipTitle}>{item.title}</Text>
                      </View>
                      <Text style={styles.tipText}>{item.description}</Text>
                    </View>
                    <View style={styles.tipActions}>
                      <TouchableOpacity 
                        onPress={() => toggleBookmark(item, 'avoid')}
                        style={styles.tipActionButton}
                      >
                        <Ionicons 
                          name={isTipBookmarked(item) ? "bookmark" : "bookmark-outline"} 
                          size={18} 
                          color={isTipBookmarked(item) ? "#FF453A" : "#95A5A6"} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(46, 125, 50, 0.1)' }]}>
                    <Ionicons name="leaf-outline" size={20} color="#2E7D32" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: '#2E7D32' }]}>Home Remedies</Text>
                </View>
                
                {recommendations.homeRemedies?.slice(0, 3).map((item: any, index: number) => (
                  <View key={index} style={styles.tipCard}>
                    <View style={[styles.tipNumberContainer, { backgroundColor: '#2E7D32' }]}>
                      <Text style={styles.tipNumber}>{index + 1}</Text>
                    </View>
                    <View style={styles.tipContent}>
                      <View style={styles.tipTitleRow}>
                        <Text style={styles.tipTitle}>{item.title}</Text>
                      </View>
                      <Text style={styles.tipText}>{item.description}</Text>
                    </View>
                    <View style={styles.tipActions}>
                      <TouchableOpacity 
                        onPress={() => toggleBookmark(item, 'homeRemedies')}
                        style={styles.tipActionButton}
                      >
                        <Ionicons 
                          name={isTipBookmarked(item) ? "bookmark" : "bookmark-outline"} 
                          size={18} 
                          color={isTipBookmarked(item) ? "#2E7D32" : "#95A5A6"} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )
        )}

        <View style={styles.aiDisclaimer}>
          <Ionicons name="medical" size={16} color="#2E7D32" />
          <Text style={styles.aiDisclaimerText}>
            Evidence-based tips for {weatherData?.name || resolvedCity} • {category} Weather
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showBookmarks}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookmarks(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📌 Saved Tips</Text>
              <TouchableOpacity onPress={() => setShowBookmarks(false)}>
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {bookmarkedTips.length === 0 ? (
                <View style={styles.emptyBookmarks}>
                  <Ionicons name="bookmark-outline" size={60} color="#BDC3C7" />
                  <Text style={styles.emptyBookmarksText}>No saved tips yet</Text>
                  <Text style={styles.emptyBookmarksSubtext}>Bookmark tips to save them here</Text>
                </View>
              ) : (
                bookmarkedTips.sort((a, b) => b.savedAt - a.savedAt).map((tip, index) => (
                  <View key={index} style={styles.bookmarkItem}>
                    <View style={styles.bookmarkContent}>
                      <Text style={styles.bookmarkTitle}>{tip.title}</Text>
                      <Text style={styles.bookmarkDescription}>{tip.description}</Text>
                      <View style={styles.bookmarkFooter}>
                        <Text style={styles.bookmarkSection}>{tip.section}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => toggleBookmark(tip, tip.section)}
                      style={styles.bookmarkRemove}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRandomTip}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRandomTip(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.randomTipModal]}>
            <View style={styles.randomTipHeader}>
              <Ionicons name="medical" size={30} color="#2E7D32" />
              <Text style={styles.randomTipTitle}>✨ Medical Tip</Text>
              <TouchableOpacity onPress={() => setShowRandomTip(false)}>
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>
            
            {randomTip && (
              <>
                <View style={styles.randomTipIcon}>
                  <Ionicons 
                    name={
                      randomTip.section === 'skincare' ? 'shield' :
                      randomTip.section === 'avoid' ? 'ban' :
                      randomTip.section === 'homeRemedies' ? 'leaf' : 'restaurant'
                    } 
                    size={50} 
                    color={
                      randomTip.section === 'skincare' ? '#1976D2' :
                      randomTip.section === 'avoid' ? '#FF453A' :
                      randomTip.section === 'homeRemedies' ? '#2E7D32' : '#FF9800'
                    } 
                  />
                </View>
                
                <Text style={styles.randomTipMainTitle}>{randomTip.title}</Text>
                <Text style={styles.randomTipDescription}>{randomTip.description}</Text>
                
                <View style={styles.randomTipActions}>
                  <TouchableOpacity 
                    style={[styles.randomTipButton, { backgroundColor: '#1976D2' }]}
                    onPress={() => {
                      toggleBookmark(randomTip, randomTip.section)
                      setShowRandomTip(false)
                    }}
                  >
                    <Ionicons 
                      name={isTipBookmarked(randomTip) ? "bookmark" : "bookmark-outline"} 
                      size={20} 
                      color="#fff" 
                    />
                    <Text style={styles.randomTipButtonText}>
                      {isTipBookmarked(randomTip) ? 'Saved' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.anotherTipButton}
                  onPress={getRandomTip}
                >
                  <Ionicons name="refresh" size={20} color="#2E7D32" />
                  <Text style={styles.anotherTipText}>Get Another Tip</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ImageBackground>
  )
}
const styles = StyleSheet.create({
  background: { 
    flex: 1, 
    width: '100%', 
    height: '100%' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'ios' ? 20 : 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: Platform.OS === 'ios' ? 15 : 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  backButton: {
    padding: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Platform.OS === 'ios' ? 20 : 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  refreshInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  refreshText: {
    fontSize: 12,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 20,
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    color: '#2E7D32',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B6B',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#5D6D7E',
    textAlign: 'center',
    marginBottom: 25,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 10,
  },
  scrollContainer: {
    paddingHorizontal: Platform.OS === 'ios' ? 20 : 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 30,
  },
  weatherIconGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  weatherIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherCard: {
    padding: Platform.OS === 'ios' ? 24 : 20,
    borderRadius: Platform.OS === 'ios' ? 24 : 20,
    marginBottom: Platform.OS === 'ios' ? 25 : 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 15 : 12,
  },
  weatherTextContainer: {
    marginLeft: Platform.OS === 'ios' ? 15 : 12,
    alignItems: 'flex-start',
  },
  cityText: { 
    fontSize: Platform.OS === 'ios' ? 24 : 22,
    fontWeight: "700", 
    color: "#2E7D32",
  },
  tempText: { 
    fontSize: Platform.OS === 'ios' ? 48 : 42,
    fontWeight: "800", 
    color: "#2E7D32",
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  timeBadgeText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  conditionText: {
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    color: "#5D6D7E",
    textAlign: 'center',
    marginBottom: Platform.OS === 'ios' ? 15 : 12,
    fontWeight: '500',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: Platform.OS === 'ios' ? 5 : 3,
  },
  weatherDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    paddingHorizontal: Platform.OS === 'ios' ? 14 : 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    borderRadius: Platform.OS === 'ios' ? 20 : 18,
    marginHorizontal: 5,
  },
  weatherDetailText: {
    fontSize: Platform.OS === 'ios' ? 14 : 13,
    color: '#2E7D32',
    marginLeft: 6,
    fontWeight: '500',
  },
  uvContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 20,
  },
  uvText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  surpriseButton: {
    flexDirection: 'row',
    backgroundColor: '#9C27B0',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  surpriseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: Platform.OS === 'ios' ? 24 : 20,
    padding: Platform.OS === 'ios' ? 20 : 16,
    marginBottom: Platform.OS === 'ios' ? 25 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  sectionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'ios' ? 22 : 20,
    fontWeight: "700",
    color: "#1976D2",
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: "#F8F9FA",
    borderRadius: Platform.OS === 'ios' ? 16 : 14,
    padding: Platform.OS === 'ios' ? 16 : 14,
    marginBottom: Platform.OS === 'ios' ? 12 : 10,
    alignItems: 'center',
  },
  tipNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  tipNumber: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  tipTitle: {
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    fontWeight: "700",
    color: "#2C3E50",
    flex: 1,
  },

  tipText: {
    fontSize: Platform.OS === 'ios' ? 14 : 13,
    color: "#5D6D7E",
    lineHeight: Platform.OS === 'ios' ? 20 : 18,
  },
  tipActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  tipActionButton: {
    padding: 6,
    marginHorizontal: 2,
  },
  llmLoadingContainer: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: Platform.OS === 'ios' ? 28 : 24,
    padding: Platform.OS === 'ios' ? 30 : 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    minHeight: 150,
  },
  llmLoadingText: {
    marginTop: 20,
    fontSize: Platform.OS === 'ios' ? 18 : 16,
    color: "#2E7D32",
    textAlign: 'center',
    fontWeight: '600',
  },
  aiDisclaimer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    borderRadius: Platform.OS === 'ios' ? 20 : 18,
    padding: Platform.OS === 'ios' ? 18 : 16,
    marginTop: Platform.OS === 'ios' ? 15 : 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  aiDisclaimerText: {
    fontSize: Platform.OS === 'ios' ? 13 : 12,
    color: "#1B5E20",
    marginLeft: 12,
    flex: 1,
    lineHeight: Platform.OS === 'ios' ? 18 : 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
  },
  emptyBookmarks: {
    alignItems: 'center',
    padding: 40,
  },
  emptyBookmarksText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#BDC3C7',
    marginTop: 10,
  },
  emptyBookmarksSubtext: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 5,
  },
  bookmarkItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  bookmarkContent: {
    flex: 1,
  },
  bookmarkTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  bookmarkDescription: {
    fontSize: 14,
    color: '#5D6D7E',
    marginBottom: 4,
  },
  bookmarkFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkSection: {
    fontSize: 12,
    color: '#95A5A6',
    textTransform: 'capitalize',
    marginRight: 8,
  },

  bookmarkRemove: {
    padding: 4,
  },
  randomTipModal: {
    margin: 20,
    borderRadius: 20,
    maxHeight: '70%',
  },
  randomTipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  randomTipTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E7D32',
    flex: 1,
    marginLeft: 10,
  },
  randomTipIcon: {
    alignItems: 'center',
    marginBottom: 20,
  },
  randomTipMainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 10,
  },

  randomTipDescription: {
    fontSize: 16,
    color: '#5D6D7E',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  randomTipActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  randomTipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  randomTipButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  anotherTipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  anotherTipText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
})
