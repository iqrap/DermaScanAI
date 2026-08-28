"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from "expo-linear-gradient"
import { colors, typography, spacing, borderRadius, shadows } from "../../src/styles/theme"
import { apiService } from '../../src/services/apiService'

interface MythFact {
  id: number
  category: string
  myth: string
  fact: string
  icon: string
  color: string
}

// Dashboard Colors
const DASHBOARD_COLORS = {
  buttonGradientStart: "#558d74ff",
  buttonGradientEnd: "#3b6450ff",
  white: "#FFFFFF",
}

export default function MythsAndFacts() {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [mythsAndFacts, setMythsAndFacts] = useState<MythFact[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Colors for different sections
  const sectionColors = {
    Water: "#3498db", // Blue
    Acne: colors.accent.amber, // Orange
    Skin: "#9B59B6"   // Purple
  }

  // Icons for different sections
  const sectionIcons = {
    Water: "water",
    Acne: "bug",
    Skin: "sparkles"
  }

  //  Load data on mount
  useEffect(() => {
    loadMythsAndFacts()
  }, [])

  //  Load from cache or fetch fresh
  const loadMythsAndFacts = async (forceRefresh = false) => {
    try {
      setLoading(true)
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem('myths_and_facts')
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          const hoursSinceCache = (Date.now() - timestamp) / (1000 * 60 * 60)
          
          // Use cache if less than 24 hours old
          if (hoursSinceCache < 24) {
            console.log('📦 Using cached myths & facts')
            setMythsAndFacts(data)
            setLoading(false)
            return
          }
        }
      }
      
      // Fetch fresh data
      await fetchMythsFromGroq()
      
    } catch {
      // Backend offline — show the friendly fallback instead of an error
      setMythsAndFacts(getFallbackMyths())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  //  Fetch myths from backend API
  const fetchMythsFromGroq = async () => {
    try {
      console.log('🤖 Fetching professional myths from backend...')

      const result = await apiService.fetchMythsAndFacts()
      const parsed = result.myths || result

      // Add IDs, icons, and colors
      const mythsWithMetadata = (Array.isArray(parsed) ? parsed : []).map((item: any, index: number) => ({
        id: index + 1,
        category: item.category,
        myth: item.myth,
        fact: item.fact,
        icon: sectionIcons[item.category as keyof typeof sectionIcons] || "sparkles",
        color: sectionColors[item.category as keyof typeof sectionColors] || "#3498db"
      }))

      // Verify we have exactly 2 per category
      const categories = ['Water', 'Acne', 'Skin']
      let valid = true

      for (const cat of categories) {
        const count = mythsWithMetadata.filter((m: MythFact) => m.category === cat).length
        if (count !== 2) {
          console.log(`⚠️ Category ${cat} has ${count} items, expected 2`)
          valid = false
        }
      }

      if (valid && mythsWithMetadata.length === 8) {
        setMythsAndFacts(mythsWithMetadata)
        await AsyncStorage.setItem('myths_and_facts', JSON.stringify({
          data: mythsWithMetadata,
          timestamp: Date.now()
        }))
        console.log('✅ Saved fresh professional myths to cache')
      } else {
        const fallback = getFallbackMyths()
        setMythsAndFacts(fallback)
        await AsyncStorage.setItem('myths_and_facts', JSON.stringify({
          data: fallback,
          timestamp: Date.now()
        }))
      }
    } catch {
      // Backend offline — show the friendly fallback instead of an error
      const fallback = getFallbackMyths()
      setMythsAndFacts(fallback)
      await AsyncStorage.setItem('myths_and_facts', JSON.stringify({
        data: fallback,
        timestamp: Date.now()
      }))
    }
  }

  //  Professional fallback myths (2 per section) - 15-20 words each
  const getFallbackMyths = (): MythFact[] => {
    return [
      // WATER (2 myths) - Blue color
      {
        id: 1,
        category: "Water",
        myth: "Drinking eight glasses of water daily is essential for everyone regardless of body composition and activity levels.",
        fact: "Hydration requirements vary significantly based on body weight, physical activity, climate conditions, and individual metabolism.",
        icon: "water",
        color: "#3498db", // Blue
      },
      {
        id: 2,
        category: "Water",
        myth: "Caffeinated beverages like coffee and tea completely dehydrate the body and don't count toward fluid intake.",
        fact: "Moderate caffeine consumption provides net hydration as the diuretic effect is minimal compared to total fluid volume.",
        icon: "water",
        color: "#3498db", // Blue
      },
      
      // DIET removed
      
      // ACNE (2 myths) - Orange
      {
        id: 3,
        category: "Acne",
        myth: "Acne develops exclusively from inadequate facial cleansing and poor hygiene practices throughout adolescence and adulthood.",
        fact: "Acne pathogenesis primarily involves hormonal fluctuations, genetic predisposition, and follicular hyperkeratinization rather than hygiene.",
        icon: "bug",
        color: colors.accent.amber,
      },
      {
        id: 4,
        category: "Acne",
        myth: "Acne naturally resolves after teenage years and rarely persists into adulthood requiring ongoing dermatological management.",
        fact: "Adult acne affects a significant portion of the population, particularly women during hormonal fluctuations and stress periods.",
        icon: "bug",
        color: colors.accent.amber,
      },
      
      // SKIN (2 myths) - Purple
      {
        id: 5,
        category: "Skin",
        myth: "Individuals with oily skin should avoid moisturizers completely to prevent exacerbating their natural sebum production.",
        fact: "All skin types require hydration; oil-free gel-based moisturizers maintain barrier function without contributing to oiliness.",
        icon: "sparkles",
        color: "#9B59B6",
      },
      {
        id: 6,
        category: "Skin",
        myth: "Sunscreen application is only necessary during summer months or when engaging in outdoor recreational activities.",
        fact: "Ultraviolet radiation penetrates cloud cover year-round, necessitating daily broad-spectrum SPF application regardless of season.",
        icon: "sparkles",
        color: "#9B59B6",
      },
    ]
  }

  // ✅ Refresh handler
  const handleRefresh = () => {
    setRefreshing(true)
    loadMythsAndFacts(true)
  }

  // Toggle expand
  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // Group by category
  const getMythsByCategory = (category: string) => {
    return mythsAndFacts.filter(item => item.category === category)
  }

  //  Render section
  const renderSection = (title: string, category: string, icon: any, accentColor: string) => {
    const myths = getMythsByCategory(category)
    
    if (myths.length === 0) return null

    return (
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { borderLeftColor: accentColor, borderLeftWidth: 4 }]}>
          <Ionicons name={icon} size={28} color={accentColor} />
          <Text style={[styles.sectionTitle, { color: accentColor }]}>{title}</Text>
        </View>
        
        {myths.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              expandedId === item.id && styles.cardExpanded,
              { borderLeftColor: accentColor, borderLeftWidth: 3 },
            ]}
            onPress={() => toggleExpand(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: accentColor + "20" }]}>
                <Text style={[styles.categoryBadgeText, { color: accentColor }]}>
                  {item.category} Myth
                </Text>
              </View>
              <Ionicons 
                name={expandedId === item.id ? "chevron-up" : "chevron-down"} 
                size={22} 
                color={accentColor} 
              />
            </View>
            
            <Text style={styles.mythText}>❌ {item.myth}</Text>
            
            {expandedId === item.id && (
              <>
                <View style={[styles.divider, { backgroundColor: accentColor + "30" }]} />
                <Text style={[styles.factText, { color: accentColor }]}>
                  ✓ {item.fact}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <LinearGradient
          colors={[DASHBOARD_COLORS.buttonGradientStart, DASHBOARD_COLORS.buttonGradientEnd]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={DASHBOARD_COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Myths & Facts</Text>
            <View style={{ width: 28 }} />
          </View>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading professional myths & facts...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient
        colors={[DASHBOARD_COLORS.buttonGradientStart, DASHBOARD_COLORS.buttonGradientEnd]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={DASHBOARD_COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Myths & Facts</Text>
          
          {/* Refresh button */}
          <TouchableOpacity 
            onPress={handleRefresh} 
            style={styles.refreshButton}
            disabled={refreshing}
          >
            <Ionicons 
              name={refreshing ? "sync" : "refresh"} 
              size={24} 
              color={DASHBOARD_COLORS.white} 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {refreshing && (
        <View style={styles.refreshBar}>
          <ActivityIndicator size="small" color="#3498db" />
          <Text style={styles.refreshText}>Updating professional myths...</Text>
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {renderSection("Water & Hydration", "Water", "water", "#3498db")}
        {renderSection("Acne & Breakouts", "Acne", "bug", colors.accent.amber)}
        {renderSection("Skincare Basics", "Skin", "sparkles", "#9B59B6")}

        {/* AI Disclaimer - Professional version */}
        <View style={styles.disclaimer}>
          <Ionicons name="medical" size={16} color="#3498db" />
          <Text style={styles.disclaimerText}>
            Evidence-based dermatological information • {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Extra bottom padding for better spacing */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  headerGradient: {
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 30,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.heading,
    color: DASHBOARD_COLORS.white,
    fontWeight: typography.weights.bold,
  },
  refreshBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  refreshText: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.small,
    color: "#3498db",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    paddingLeft: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    marginLeft: spacing.md,
  },
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  cardExpanded: {
    ...shadows.medium,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  categoryBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
  },
  mythText: {
    fontSize: typography.sizes.default,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.darkGray,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  factText: {
    fontSize: typography.sizes.default,
    lineHeight: 22,
    fontWeight: typography.weights.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.default,
    color: "#3498db",
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  disclaimerText: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.small,
    color: "rgb(165, 165, 165)",
  },
  bottomPadding: {
    height: spacing.xxl * 2,
  },
})