import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Share,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// --- Light Mint Medical Theme with Darker Header and Updated Text Colors ---
const THEME = {
  primary: "#1B4D3E",      // Darker green for header
  primaryLight: "#2C5F4D",
  primaryGradient: ['#1B4D3E', '#2C5F4D'] as const, // Darker gradient for header
  secondary: "#9FB8AA",    // Light mint secondary
  accent: "#B8D9CD",       // Very light mint
  accentGradient: ['#B8D9CD', '#D1E7DD'] as const,
  success: "#8FBFA3",       // Soft green
  successGradient: ['#8FBFA3', '#A9D4BB'] as const,
  warning: "#E07C4A",       // Darker orange (was #F4B393)
  warningGradient: ['#E07C4A', '#F4B393'] as const,
  error: "#E5989B",         // Soft pink
  errorGradient: ['#E5989B', '#EEB4B7'] as const,
  info: "#A9C9DE",          // Soft blue
  infoGradient: ['#A9C9DE', '#C5DDEB'] as const,
  background: "#F4F9F6",    // Very light mint background
  surface: "#FFFFFF",       // White surface
  card: "#FFFFFF",          // Card background
  glass: "rgba(255,255,255,0.9)", // Glass morphism
  text: {
    primary: "#1A3A2B",     // Darker green (was #2C4A3B)
    secondary: "#3A5F4A",   // Darker medium green-gray (was #4F6F5E)
    muted: "#4F6F5E",       // Darker light green-gray (was #6B8B7A)
    inverse: "#FFFFFF",      // White
  },
  border: "#DCE8E2",        // Light mint border
  shadow: "#8FAA9F",        // Soft shadow
  clinical: {
    low: "#8FBFA3",         // Low risk - soft green
    medium: "#E07C4A",      // Medium risk - darker orange (was #F4B393)
    high: "#E5989B",        // High risk - soft pink
  }
};

// --- TypeScript Interfaces ---
interface InsightItem {
  text: string;
  icon: string;
  scientific_name?: string;
}

interface Compatibility {
  status: string;
  icon: string;
  score?: number;
}

interface Recommendation {
  text: string;
  skin_type: string;
  patch_test?: boolean;
  usage_tips?: string[];
}

interface ProductData {
  compatibility: Compatibility;
  key_insights: {
    pros: InsightItem[];
    cons: InsightItem[];
  };
  full_ingredients: string[];
  recommendation: Recommendation;
  warnings?: string[];
  interactions?: string[];
  metadata?: {
    analyzed_at: string;
    ocr_provider: string;
    confidence_score: number;
    analysis_version: string;
  };
}

// --- Helper Components ---
const ClinicalInsightRow: React.FC<{ item: InsightItem; type: 'pro' | 'con' }> = ({ item, type }) => {
  const isPro = type === 'pro';
  return (
    <View style={styles.clinicalInsightItem}>
      <LinearGradient
        colors={isPro ? ['#8FBFA3', '#A9D4BB'] : ['#E07C4A', '#F4B393']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.clinicalInsightIcon]}
      >
        <Icon
          name={item.icon || (isPro ? 'checkmark-circle' : 'warning')}
          size={16}
          color="#FFF"
        />
      </LinearGradient>
      <View style={styles.clinicalInsightContent}>
        <Text style={isPro ? styles.clinicalInsightTextPro : styles.clinicalInsightTextCon}>
          {item.text}
        </Text>
        {item.scientific_name && (
          <View style={styles.scientificContainer}>
            <Icon name="flask" size={10} color={THEME.text.muted} />
            <Text style={styles.clinicalInsightScientific}>{item.scientific_name}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RiskIndicator: React.FC<{ level: 'low' | 'medium' | 'high'; label: string }> = ({ level, label }) => {
  const colors = {
    low: THEME.clinical.low,
    medium: THEME.clinical.medium,
    high: THEME.clinical.high
  };
  
  const gradientColors = {
    low: ['#8FBFA3', '#A9D4BB'] as const,
    medium: ['#E07C4A', '#F4B393'] as const,
    high: ['#E5989B', '#EEB4B7'] as const
  };
  
  return (
    <LinearGradient
      colors={gradientColors[level]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.riskIndicator]}
    >
      <View style={[styles.riskDot, { backgroundColor: '#FFF' }]} />
      <Text style={[styles.riskText, { color: '#FFF' }]}>{label}</Text>
    </LinearGradient>
  );
};

const StatCard: React.FC<{ icon: string; value: number; label: string; color: string }> = ({ icon, value, label, color }) => (
  <LinearGradient
    colors={[`${color}15`, `${color}05`]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.statCard}
  >
    <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text style={[styles.statCardValue, { color }]}>{value}</Text>
    <Text style={styles.statCardLabel}>{label}</Text>
  </LinearGradient>
);

// --- Main Component ---
export default function ClinicalIngredientAnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analysis' | 'ingredients' | 'clinical'>('analysis');
  const [formulationStats, setFormulationStats] = useState({
    baseType: 'Water-based',
    phRange: '5.0 - 6.0',
    stability: '12 months',
    lightSensitivity: 'Low'
  });

  useEffect(() => {
    try {
      if (params.analysisData) {
        const parsedData = JSON.parse(params.analysisData as string);
        setProductData(parsedData);
        
        // Calculate dynamic formulation stats based on ingredients
        if (parsedData.full_ingredients && Array.isArray(parsedData.full_ingredients)) {
          const stats = calculateFormulationStats(parsedData.full_ingredients, parsedData);
          setFormulationStats(stats);
        }
      }
    } catch (error) {
      console.error('Error parsing data:', error);
      Alert.alert('Clinical Error', 'Could not load analysis data');
    } finally {
      setLoading(false);
    }
  }, [params.analysisData]);

  // Function to calculate formulation stats dynamically
  const calculateFormulationStats = (ingredients: string[], analysis: any) => {
    // Detect base type
    const waterBasedKeywords = ['aqua', 'water', 'distilled water', 'spring water', 'purified water'];
    const oilBasedKeywords = ['oil', 'butter', 'wax', 'fat', 'petrolatum', 'mineral oil', 'squalane', 'jojoba'];
    const siliconeBasedKeywords = ['dimethicone', 'cyclomethicone', 'silicone', 'siloxane'];
    
    let hasWater = false;
    let hasOil = false;
    let hasSilicone = false;
    
    ingredients.forEach(ingredient => {
      const lowerIng = ingredient.toLowerCase();
      if (waterBasedKeywords.some(keyword => lowerIng.includes(keyword))) {
        hasWater = true;
      }
      if (oilBasedKeywords.some(keyword => lowerIng.includes(keyword))) {
        hasOil = true;
      }
      if (siliconeBasedKeywords.some(keyword => lowerIng.includes(keyword))) {
        hasSilicone = true;
      }
    });
    
    let baseType = 'Water-based';
    if (hasWater && hasOil) baseType = 'Hybrid';
    else if (hasOil) baseType = 'Oil-based';
    else if (hasSilicone) baseType = 'Silicone-based';
    else if (hasWater) baseType = 'Water-based';
    else baseType = 'Unknown';
    
    // Calculate pH range based on ingredients
    let phRange = '5.0 - 6.0';
    const acidicIngredients = ['citric acid', 'lactic acid', 'glycolic acid', 'salicylic acid', 'vitamin c', 'ascorbic acid'];
    const alkalineIngredients = ['sodium hydroxide', 'potassium hydroxide', 'triethanolamine', 'ammonium hydroxide'];
    
    let hasAcid = false;
    let hasAlkaline = false;
    
    ingredients.forEach(ingredient => {
      const lowerIng = ingredient.toLowerCase();
      if (acidicIngredients.some(keyword => lowerIng.includes(keyword))) {
        hasAcid = true;
      }
      if (alkalineIngredients.some(keyword => lowerIng.includes(keyword))) {
        hasAlkaline = true;
      }
    });
    
    if (hasAcid && !hasAlkaline) phRange = '3.5 - 5.5';
    else if (hasAlkaline && !hasAcid) phRange = '6.0 - 7.5';
    else if (hasAcid && hasAlkaline) phRange = '5.0 - 6.5';
    
    // Calculate stability based on ingredients and preservatives
    let stability = '12 months';
    const preservatives = ['phenoxyethanol', 'paraben', 'potassium sorbate', 'sodium benzoate', 'benzyl alcohol', 'ethylhexylglycerin'];
    const antioxidants = ['vitamin e', 'tocopherol', 'ascorbic acid', 'ferulic acid', 'resveratrol'];
    const unstableIngredients = ['retinol', 'vitamin c', 'ascorbic acid', 'benzoyl peroxide'];
    
    let hasPreservatives = false;
    let hasAntioxidants = false;
    let hasUnstable = false;
    
    ingredients.forEach(ingredient => {
      const lowerIng = ingredient.toLowerCase();
      if (preservatives.some(keyword => lowerIng.includes(keyword))) hasPreservatives = true;
      if (antioxidants.some(keyword => lowerIng.includes(keyword))) hasAntioxidants = true;
      if (unstableIngredients.some(keyword => lowerIng.includes(keyword))) hasUnstable = true;
    });
    
    if (hasPreservatives && hasAntioxidants && !hasUnstable) stability = '24 months';
    else if (hasPreservatives && !hasUnstable) stability = '18 months';
    else if (hasUnstable) stability = '6 months';
    else if (!hasPreservatives) stability = '6 months';
    
    // Calculate light sensitivity
    let lightSensitivity = 'Low';
    const photosensitiveIngredients = ['retinol', 'retinoid', 'vitamin c', 'ascorbic acid', 'alpha hydroxy acid', 'aha', 'beta hydroxy acid', 'bha', 'salicylic acid', 'benzoyl peroxide', 'essential oils', 'citrus oil'];
    
    let hasPhotosensitive = false;
    ingredients.forEach(ingredient => {
      const lowerIng = ingredient.toLowerCase();
      if (photosensitiveIngredients.some(keyword => lowerIng.includes(keyword))) {
        hasPhotosensitive = true;
      }
    });
    
    if (hasPhotosensitive) lightSensitivity = 'High';
    else if (hasAcid && !hasPhotosensitive) lightSensitivity = 'Medium';
    
    return {
      baseType,
      phRange,
      stability,
      lightSensitivity
    };
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Ingredient Analysis Report - Compatibility: ${productData?.compatibility?.status}`,
        title: 'Clinical Ingredient Analysis',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share report');
    }
  };

  const getCompatibilityScore = () => {
    if (!productData?.compatibility?.score) return 75;
    return productData.compatibility.score;
  };

  const getCompatibilityColor = () => {
    const score = getCompatibilityScore();
    if (score >= 80) return THEME.clinical.low;
    if (score >= 60) return THEME.clinical.medium;
    return THEME.clinical.high;
  };

  const getRiskLevel = (): 'low' | 'medium' | 'high' => {
    const score = getCompatibilityScore();
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#F4F9F6', '#E8F3EE']}
        style={styles.loadingContainer}
      >
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingTitle}>Clinical Analysis in Progress</Text>
          <Text style={styles.loadingSubtitle}>Evaluating ingredient formulation...</Text>
          
          <View style={styles.loadingSteps}>
            <View style={styles.loadingStep}>
              <Icon name="scan" size={16} color={THEME.primary} />
              <Text style={styles.loadingStepText}>Analyzing molecular structure</Text>
            </View>
            <View style={styles.loadingStep}>
              <Icon name="flask" size={16} color={THEME.primary} />
              <Text style={styles.loadingStepText}>Checking compatibility</Text>
            </View>
            <View style={styles.loadingStep}>
              <Icon name="medical" size={16} color={THEME.primary} />
              <Text style={styles.loadingStepText}>Generating clinical report</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (!productData) {
    return (
      <LinearGradient
        colors={['#F4F9F6', '#E8F3EE']}
        style={styles.errorContainer}
      >
        <View style={styles.errorCard}>
          <View style={styles.errorIconContainer}>
            <Icon name="medical" size={48} color={THEME.error} />
          </View>
          <Text style={styles.errorTitle}>Analysis Failed</Text>
          <Text style={styles.errorText}>Unable to complete clinical evaluation</Text>
          <TouchableOpacity
            onPress={() => router.push("/features/Product_Scanner/ProductScannerScreen")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={THEME.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.errorButton}
            >
              <Text style={styles.errorButtonText}>New Scan</Text>
              <Icon name="scan" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const { compatibility, key_insights, full_ingredients, recommendation, warnings, interactions, metadata } = productData;

  // Split ingredients into two columns
  const columns: string[][] = [[], []];
  
  if (full_ingredients && Array.isArray(full_ingredients)) {
    full_ingredients.forEach((ingredient, index) => {
      if (ingredient && ingredient.trim()) {
        columns[index % 2].push(ingredient);
      }
    });
  }

  const renderAnalysisTab = () => (
    <>
      {/* Clinical Score Card */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FCFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.clinicalScoreCard}
      >
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Clinical Compatibility Score</Text>
          <RiskIndicator level={getRiskLevel()} label={`${getCompatibilityScore()}% Match`} />
        </View>
        
        <View style={styles.scoreMeterContainer}>
          <View style={styles.scoreMeter}>
            <View style={[styles.scoreFill, { width: `${getCompatibilityScore()}%`, backgroundColor: getCompatibilityColor() }]} />
          </View>
          <View style={styles.scoreMarkers}>
            <Text style={styles.scoreMarker}>0%</Text>
            <Text style={styles.scoreMarker}>50%</Text>
            <Text style={styles.scoreMarker}>100%</Text>
          </View>
        </View>
        
        <View style={styles.scoreDetails}>
          <View style={styles.scoreDetailItem}>
            <Icon name="calendar" size={14} color={THEME.text.muted} />
            <Text style={styles.scoreDetailText}>
              {metadata?.analyzed_at ? new Date(metadata.analyzed_at).toLocaleDateString() : 'Today'}
            </Text>
          </View>
          {metadata?.ocr_provider && (
            <View style={styles.scoreDetailItem}>
              <Icon name="scan" size={14} color={THEME.text.muted} />
              <Text style={styles.scoreDetailText}>OCR: {metadata.ocr_provider}</Text>
            </View>
          )}
          {metadata?.confidence_score && (
            <View style={styles.scoreDetailItem}>
              <Icon name="checkmark-circle" size={14} color={THEME.text.muted} />
              <Text style={styles.scoreDetailText}>Confidence: {Math.round(metadata.confidence_score * 100)}%</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Key Insights with Medical Terminology */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FCFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.clinicalSection}
      >
        <View style={styles.sectionHeaderContainer}>
          <LinearGradient
            colors={THEME.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionHeaderIcon}
          >
            <Icon name="flask" size={16} color="#FFF" />
          </LinearGradient>
          <Text style={styles.sectionHeader}>Clinical Key Insights</Text>
        </View>
        
        <View style={styles.clinicalInsightsContainer}>
          {/* Therapeutic Benefits */}
          <View style={styles.clinicalColumn}>
            <View style={[styles.columnHeader, { backgroundColor: `${THEME.success}15` }]}>
              <Icon name="checkmark-circle" size={16} color={THEME.success} />
              <Text style={[styles.subHeader, { color: THEME.success }]}>Therapeutic Benefits</Text>
            </View>
            {key_insights?.pros?.map((item, index) => (
              <ClinicalInsightRow key={`pro-${index}`} item={item} type="pro" />
            ))}
            {(!key_insights?.pros || key_insights.pros.length === 0) && (
              <Text style={styles.noDataText}>No significant benefits identified</Text>
            )}
          </View>
          
          {/* Potential Concerns */}
          <View style={styles.clinicalColumn}>
            <View style={[styles.columnHeader, { backgroundColor: `${THEME.warning}15` }]}>
              <Icon name="warning" size={16} color={THEME.warning} />
              <Text style={[styles.subHeader, { color: THEME.warning }]}>Clinical Concerns</Text>
            </View>
            {key_insights?.cons?.map((item, index) => (
              <ClinicalInsightRow key={`con-${index}`} item={item} type="con" />
            ))}
            {(!key_insights?.cons || key_insights.cons.length === 0) && (
              <Text style={styles.noDataText}>No significant concerns detected</Text>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Warnings Section */}
      {warnings && warnings.length > 0 && (
        <LinearGradient
          colors={['#FFF9F0', '#FFFCF5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.warningsSection}
        >
          <View style={styles.warningsHeader}>
            <View style={styles.warningsIconContainer}>
              <Icon name="alert-circle" size={18} color={THEME.warning} />
            </View>
            <Text style={styles.warningsTitle}>Clinical Warnings</Text>
          </View>
          {warnings.map((warning, index) => (
            <View key={index} style={styles.warningItem}>
              <View style={[styles.warningBullet, { backgroundColor: THEME.warning }]} />
              <Text style={styles.warningText}>{warning}</Text>
            </View>
          ))}
        </LinearGradient>
      )}

      {/* Interactions */}
      {interactions && interactions.length > 0 && (
        <LinearGradient
          colors={['#F0F8FF', '#F5FAFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.interactionsSection}
        >
          <View style={styles.interactionsHeader}>
            <View style={styles.interactionsIconContainer}>
              <Icon name="git-network" size={18} color={THEME.info} />
            </View>
            <Text style={styles.interactionsTitle}>Potential Interactions</Text>
          </View>
          {interactions.map((interaction, index) => (
            <View key={index} style={styles.interactionItem}>
              <View style={[styles.interactionBullet, { backgroundColor: THEME.info }]} />
              <Text style={styles.interactionText}>{interaction}</Text>
            </View>
          ))}
        </LinearGradient>
      )}
    </>
  );

  const renderIngredientsTab = () => (
    <>
      {/* Full Ingredient List with Clinical Formatting */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FCFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.clinicalSection}
      >
        <View style={styles.sectionHeaderContainer}>
          <LinearGradient
            colors={THEME.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionHeaderIcon}
          >
            <Icon name="list" size={16} color="#FFF" />
          </LinearGradient>
          <Text style={styles.sectionHeader}>Complete Ingredient Profile</Text>
        </View>
        
        <View style={styles.ingredientHeader}>
          <Text style={styles.ingredientSubheader}>INCI Standard Format</Text>
          <View style={styles.ingredientCount}>
            <Text style={styles.ingredientCountText}>{full_ingredients?.length || 0} ingredients</Text>
          </View>
        </View>
        
        <View style={styles.ingredientListContainer}>
          <View style={styles.ingredientColumn}>
            {columns[0].map((item, index) => (
              <View key={`col1-${index}`} style={styles.ingredientItem}>
                <View style={styles.ingredientNumberContainer}>
                  <Text style={styles.ingredientNumber}>{index * 2 + 1}</Text>
                </View>
                <Text style={styles.ingredientText}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={styles.ingredientColumn}>
            {columns[1].map((item, index) => (
              <View key={`col2-${index}`} style={styles.ingredientItem}>
                <View style={styles.ingredientNumberContainer}>
                  <Text style={styles.ingredientNumber}>{index * 2 + 2}</Text>
                </View>
                <Text style={styles.ingredientText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ingredientFooter}>
          <Icon name="information-circle" size={14} color={THEME.text.muted} />
          <Text style={styles.ingredientFooterText}>
            Listed in order of concentration (descending)
          </Text>
        </View>
      </LinearGradient>

      {/* Ingredient Stats */}
      <View style={styles.statsGrid}>
        <StatCard 
          icon="flask" 
          value={full_ingredients?.length || 0} 
          label="Total Ingredients" 
          color={THEME.primary} 
        />
        <StatCard 
          icon="checkmark-circle" 
          value={key_insights?.pros?.length || 0} 
          label="Beneficial" 
          color={THEME.success} 
        />
        <StatCard 
          icon="warning" 
          value={key_insights?.cons?.length || 0} 
          label="Concerns" 
          color={THEME.warning} 
        />
      </View>
    </>
  );

  const renderClinicalTab = () => (
    <>
      {/* Clinical Recommendation */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FCFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.clinicalSection}
      >
        <View style={styles.sectionHeaderContainer}>
          <LinearGradient
            colors={THEME.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionHeaderIcon}
          >
            <Icon name="medical" size={16} color="#FFF" />
          </LinearGradient>
          <Text style={styles.sectionHeader}>Clinical Recommendation</Text>
        </View>
        
        <View style={styles.recommendationCard}>
          <LinearGradient
            colors={[`${THEME.primary}15`, `${THEME.primary}08`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.recommendationBadge}
          >
            <Icon name="people" size={14} color={THEME.primary} />
            <Text style={styles.recommendationBadgeText}>
              INDICATED FOR: {recommendation?.skin_type?.toUpperCase() || 'ALL SKIN TYPES'}
            </Text>
          </LinearGradient>
          
          <Text style={styles.recommendationText}>
            {recommendation?.text || 'Based on clinical evaluation of ingredient formulation.'}
          </Text>

          {recommendation?.patch_test && (
            <View style={styles.patchTestNote}>
              <Icon name="flask" size={16} color={THEME.warning} />
              <Text style={styles.patchTestText}>Patch test recommended before full application</Text>
            </View>
          )}

          {recommendation?.usage_tips && recommendation.usage_tips.length > 0 && (
            <View style={styles.usageTips}>
              <Text style={styles.usageTipsTitle}>Clinical Usage Guidelines:</Text>
              {recommendation.usage_tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={[styles.tipBullet, { backgroundColor: THEME.primary }]} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Dynamic Formulation Analysis - Now 2 cards per row with actual data */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FCFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.clinicalSection}
      >
        <View style={styles.sectionHeaderContainer}>
          <LinearGradient
            colors={THEME.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionHeaderIcon}
          >
            <Icon name="flask" size={16} color={THEME.text.primary} />
          </LinearGradient>
          <Text style={styles.sectionHeader}>Formulation Analysis</Text>
        </View>
        
        <View style={styles.formulationGrid}>
          <View style={styles.formulationRow}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FCFA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.formulationItem, styles.formulationItemLeft]}
            >
              <View style={[styles.formulationIcon, { backgroundColor: `${THEME.info}15` }]}>
                <Icon name="water" size={22} color={THEME.info} />
              </View>
              <Text style={styles.formulationLabel}>Base</Text>
              <Text style={styles.formulationValue}>{formulationStats.baseType}</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#FFFFFF', '#F8FCFA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.formulationItem, styles.formulationItemRight]}
            >
              <View style={[styles.formulationIcon, { backgroundColor: `${THEME.warning}15` }]}>
                <Icon name="thermometer" size={22} color={THEME.warning} />
              </View>
              <Text style={styles.formulationLabel}>pH Range</Text>
              <Text style={styles.formulationValue}>{formulationStats.phRange}</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.formulationRow}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FCFA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.formulationItem, styles.formulationItemLeft]}
            >
              <View style={[styles.formulationIcon, { backgroundColor: `${THEME.success}15` }]}>
                <Icon name="time" size={22} color={THEME.success} />
              </View>
              <Text style={styles.formulationLabel}>Stability</Text>
              <Text style={styles.formulationValue}>{formulationStats.stability}</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#FFFFFF', '#F8FCFA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.formulationItem, styles.formulationItemRight]}
            >
              <View style={[styles.formulationIcon, { backgroundColor: `${THEME.accent}25` }]}>
                <Icon name="sunny" size={22} color={THEME.text.secondary} />
              </View>
              <Text style={styles.formulationLabel}>Light Sensitivity</Text>
              <Text style={styles.formulationValue}>{formulationStats.lightSensitivity}</Text>
            </LinearGradient>
          </View>
        </View>
      </LinearGradient>

      {/* Medical Disclaimer */}
      <LinearGradient
        colors={['#F8FCFA', '#F0F8F4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.disclaimerSection}
      >
        <Icon name="medical" size={20} color={THEME.text.muted} />
        <Text style={styles.disclaimerText}>
          This analysis is for informational purposes only and does not constitute medical advice. 
          Always consult with a board-certified dermatologist before starting new skincare products.
        </Text>
      </LinearGradient>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Enhanced Header with Darker Colors */}
      <LinearGradient
        colors={['#1B4D3E', '#2C5F4D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.headerIconBtn}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTextWrapper}>
            <Text style={styles.headerTitle}>Clinical Ingredient Analysis</Text>
            <Text style={styles.headerSubtitle}>Medical-grade evaluation report</Text>
          </View>
          
          {/* Placeholder for alignment - no share button */}
          <View style={styles.headerPlaceholder} />
        </View>
        
        {/* Decorative Elements */}
        <View style={[styles.headerDecoration1, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
        <View style={[styles.headerDecoration2, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analysis' && styles.activeTab]}
          onPress={() => setActiveTab('analysis')}
          activeOpacity={0.7}
        >
          <Icon 
            name="analytics" 
            size={16} 
            color={activeTab === 'analysis' ? '#FFF' : THEME.text.muted} 
          />
          <Text style={[styles.tabText, activeTab === 'analysis' && styles.activeTabText]}>
            Analysis
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ingredients' && styles.activeTab]}
          onPress={() => setActiveTab('ingredients')}
          activeOpacity={0.7}
        >
          <Icon 
            name="list" 
            size={16} 
            color={activeTab === 'ingredients' ? '#FFF' : THEME.text.muted} 
          />
          <Text style={[styles.tabText, activeTab === 'ingredients' && styles.activeTabText]}>
            Ingredients
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'clinical' && styles.activeTab]}
          onPress={() => setActiveTab('clinical')}
          activeOpacity={0.7}
        >
          <Icon 
            name="medical" 
            size={16} 
            color={activeTab === 'clinical' ? '#FFF' : THEME.text.muted} 
          />
          <Text style={[styles.tabText, activeTab === 'clinical' && styles.activeTabText]}>
            Clinical
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {activeTab === 'analysis' && renderAnalysisTab()}
        {activeTab === 'ingredients' && renderIngredientsTab()}
        {activeTab === 'clinical' && renderClinicalTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F4F9F6' 
  },
  
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#8FAA9F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
    maxWidth: 340,
  },
  loadingTitle: { 
    marginTop: 20, 
    fontSize: 20, 
    fontWeight: '700',
    color: '#1A3A2B',
    textAlign: 'center',
  },
  loadingSubtitle: { 
    marginTop: 8, 
    fontSize: 14, 
    color: '#4F6F5E',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingSteps: {
    width: '100%',
    gap: 12,
  },
  loadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE8E2',
  },
  loadingStepText: {
    fontSize: 13,
    color: '#3A5F4A',
    flex: 1,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#8FAA9F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
    maxWidth: 340,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5989B20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E5989B',
    marginBottom: 8
  },
  errorText: {
    fontSize: 14,
    color: '#4F6F5E',
    textAlign: 'center',
    marginBottom: 24
  },
  errorButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTextWrapper: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerPlaceholder: {
    width: 36,
    height: 36,
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#FFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: { 
    fontSize: 11, 
    color: 'rgba(255,255,255,0.9)', 
    marginTop: 2,
  },
  headerDecoration1: {
    position: 'absolute',
    top: -15,
    right: -15,
    width: 100,
    height: 100,
    borderRadius: 50,
    zIndex: 1,
  },
  headerDecoration2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    zIndex: 1,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE8E2',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F4F9F6',
  },
  activeTab: {
    backgroundColor: '#1B4D3E',
    shadowColor: '#1B4D3E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F6F5E',
  },
  activeTabText: {
    color: '#FFFFFF',
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },

  clinicalScoreCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#8FAA9F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  scoreTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A5F4A',
  },
  scoreMeterContainer: {
    marginBottom: 14,
  },
  scoreMeter: {
    height: 8,
    backgroundColor: '#DCE8E2',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  scoreMarker: {
    fontSize: 9,
    color: '#4F6F5E',
  },
  scoreDetails: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  scoreDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F9F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  scoreDetailText: {
    fontSize: 10,
    color: '#4F6F5E',
  },

  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '600',
  },

  clinicalSection: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#8FAA9F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionHeaderIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1A3A2B',
    letterSpacing: 0.3,
  },

  clinicalInsightsContainer: { 
    gap: 14,
  },
  clinicalColumn: { 
    backgroundColor: '#F8FCFA',
    borderRadius: 14,
    padding: 14,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  subHeader: { 
    fontSize: 13, 
    fontWeight: '700',
  },
  clinicalInsightItem: { 
    flexDirection: 'row', 
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  clinicalInsightIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  clinicalInsightContent: {
    flex: 1,
  },
  clinicalInsightTextPro: { 
    fontSize: 12, 
    color: '#1A3A2B',
    fontWeight: '500',
    lineHeight: 17,
    marginBottom: 2,
  },
  clinicalInsightTextCon: { 
    fontSize: 12, 
    color: '#E07C4A',
    fontWeight: '500',
    lineHeight: 17,
    marginBottom: 2,
  },
  scientificContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  clinicalInsightScientific: {
    fontSize: 10,
    color: '#4F6F5E',
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 11,
    color: '#4F6F5E',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 6
  },

  warningsSection: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E07C4A40',
  },
  warningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  warningsIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#E07C4A15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E07C4A',
  },
  warningItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
    paddingLeft: 38,
  },
  warningBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 8,
    marginTop: 5,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#3A5F4A',
    lineHeight: 17,
  },

  interactionsSection: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#A9C9DE40',
  },
  interactionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  interactionsIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#A9C9DE15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  interactionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A9C9DE',
  },
  interactionItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
    paddingLeft: 38,
  },
  interactionBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 8,
    marginTop: 5,
  },
  interactionText: {
    flex: 1,
    fontSize: 12,
    color: '#3A5F4A',
    lineHeight: 17,
  },

  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  ingredientSubheader: {
    fontSize: 12,
    color: '#4F6F5E',
    fontWeight: '500',
  },
  ingredientCount: {
    backgroundColor: '#7D9F8F15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ingredientCountText: {
    fontSize: 10,
    color: '#7D9F8F',
    fontWeight: '600',
  },
  ingredientListContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    backgroundColor: '#F8FCFA',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE8E2',
  },
  ingredientColumn: { 
    width: '48%' 
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ingredientNumberContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7D9F8F15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  ingredientNumber: {
    fontSize: 10,
    color: '#7D9F8F',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ingredientText: { 
    flex: 1,
    fontSize: 12, 
    color: '#1A3A2B',
    lineHeight: 17,
  },
  ingredientFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 4,
    backgroundColor: '#F8FCFA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  ingredientFooterText: { 
    fontSize: 10, 
    color: '#4F6F5E',
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE8E2',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statCardLabel: {
    fontSize: 9,
    color: '#4F6F5E',
    textAlign: 'center',
  },

  recommendationCard: {
    backgroundColor: '#F8FCFA',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCE8E2',
  },
  recommendationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
    gap: 4,
  },
  recommendationBadgeText: {
    color: '#1B4D3E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  recommendationText: { 
    fontSize: 13, 
    lineHeight: 20, 
    color: '#1A3A2B',
    marginBottom: 14,
  },
  patchTestNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E07C4A10',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E07C4A25',
  },
  patchTestText: {
    flex: 1,
    fontSize: 12,
    color: '#E07C4A',
    fontWeight: '600',
  },
  usageTips: {
    marginTop: 6,
  },
  usageTipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A3A2B',
    marginBottom: 10,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  tipBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 10,
    marginTop: 5,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#3A5F4A',
    lineHeight: 17,
  },

  formulationGrid: {
    gap: 8,
  },
  formulationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  formulationItem: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE8E2',
    backgroundColor: '#FFFFFF',
  },
  formulationItemLeft: {
    marginRight: 0,
  },
  formulationItemRight: {
    marginLeft: 0,
  },
  formulationIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  formulationLabel: {
    fontSize: 10,
    color: '#4F6F5E',
    marginBottom: 2,
  },
  formulationValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A3A2B',
    textAlign: 'center',
  },

  disclaimerSection: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#DCE8E2',
    marginTop: 4,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#4F6F5E',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});