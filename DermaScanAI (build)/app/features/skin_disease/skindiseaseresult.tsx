import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Image,
  SafeAreaView,
  Share,
  Dimensions,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { apiService } from '../../../src/services/apiService';

const { width } = Dimensions.get('window');

const COLORS = {
  bgGradientTop: "#F4F9F6",
  bgGradientBottom: "#E8F5E9",
  darkGreen: "#2D4A3E",
  mediumGreen: "#4A6B5D",
  lightGreenBorder: "#8EB29C",
  lightGreenFill: "rgba(230, 244, 235, 0.6)",
  white: "#FFFFFF",
  accent: "#558d74",
  cardBorder: "#D1E3DA",
  buttonGradientStart: "#558d74",
  buttonGradientEnd: "#3b6450",
  amberFill: "rgba(254, 243, 199, 0.3)",
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function SkinDiseaseResult() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<{
    description: string;
    causes: string;
    treatments: string;
    showDoctorNote: boolean;
  } | null>(null);

  const diseaseName = params.diseaseName as string || 'Unknown';
  const confidence = parseFloat(params.confidence as string) || 0;
  const photoUri = params.photoUri as string || null;

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        const result = await apiService.analyzeSkinDisease(diseaseName);
        setAnalysisData(result);
      } catch {
        // Backend offline — show the generic clinical fallback instead of an error
        setAnalysisData({
          description: `Could not load specific clinical description for ${diseaseName} at this time.`,
          causes: `Information regarding the potential causes is temporarily unavailable.`,
          treatments: `- Check your internet connection.\n- Try reloading the screen.\n- If the issue persists, contact support.`,
          showDoctorNote: diseaseName !== 'No Disease',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [diseaseName]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Skin Analysis Report:\nDisease Detected: ${diseaseName}\nConfidence: ${confidence.toFixed(1)}%\n\nPlease consult a dermatologist for definitive diagnosis.`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleConsultDoctor = () => {
    const url = 'https://www.google.com/maps/search/dermatologist+near+me';

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(url);
        }
      })
      .catch(() => {
        Alert.alert(
          'Unable to Open Maps',
          'Please manually search for "dermatologist near me" in Google Maps',
          [{ text: 'OK' }]
        );
      });
  };

  const getConfidenceColor = () => {
    if (confidence >= 85) return '#22C55E';
    if (confidence >= 70) return '#EAB308';
    return '#EF4444';
  };

  const getConfidenceMessage = () => {
    if (confidence >= 85) return 'High Confidence Screening';
    if (confidence >= 70) return 'Moderate Confidence Screening';
    return 'Low Confidence Screening';
  };

  const markdownStyles = {
    body: {
      fontSize: 15,
      lineHeight: 24,
      color: '#374151',
    },
    strong: {
      fontWeight: '700' as const,
      color: '#2D4A3E',
    },
    list_item: {
      marginBottom: 6,
      flexDirection: 'row' as const,
    },
    bullet_list_icon: {
      color: '#2D4A3E',
      marginRight: 8,
    },
  };

  const markdownStylesCauses = {
    body: {
      fontSize: 15,
      lineHeight: 24,
      color: '#4B5563',
    },
    strong: {
      fontWeight: '700' as const,
      color: '#78350F',
    },
    list_item: {
      marginBottom: 6,
      flexDirection: 'row' as const,
    },
    bullet_list_icon: {
      color: '#B45309',
      marginRight: 8,
    },
  };

  const markdownStylesTreatments = {
    body: {
      fontSize: 15,
      lineHeight: 24,
      color: '#374151',
    },
    strong: {
      fontWeight: '700' as const,
      color: '#0F172A',
    },
    list_item: {
      marginBottom: 6,
      flexDirection: 'row' as const,
    },
    bullet_list_icon: {
      color: '#0284C7',
      marginRight: 8,
    },
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.bgGradientTop, COLORS.bgGradientBottom]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Premium Header - Styled to match SkinDiseaseAnalyzer */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.safeHeader}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Dermatology Report</Text>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <Ionicons name="share-social" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Image Preview - Rectangle Card */}
        {photoUri && (
          <View style={styles.imageCard}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <View style={styles.imageOverlay}>
              <Text style={styles.imageLabel}>Analyzed Area</Text>
            </View>
          </View>
        )}

        {/* Diagnosis Card */}
        <View style={[styles.diagnosisCard, { borderLeftColor: getConfidenceColor() }]}>
          <View style={styles.diagnosisHeader}>
            <LinearGradient
              colors={['#558D74', '#3B6450']}
              style={styles.diagnosisIcon}
            >
              <Ionicons name="medkit" size={22} color="#FFF" />
            </LinearGradient>
            <Text style={styles.diagnosisTitle}>PRIMARY DIAGNOSIS</Text>
          </View>

          <Text style={styles.diseaseName}>{diseaseName}</Text>

          <View style={styles.confidenceSection}>
            <View style={styles.confidenceHeader}>
              <Text style={styles.confidenceLabel}>AI Match Confidence</Text>
              <Text style={[styles.confidenceValue, { color: getConfidenceColor() }]}>
                {confidence.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.confidenceBarContainer}>
              <View style={[styles.confidenceBar, { width: `${confidence}%`, backgroundColor: getConfidenceColor() }]} />
            </View>
            <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor() + '15' }]}>
              <Text style={[styles.confidenceBadgeText, { color: getConfidenceColor() }]}>
                {getConfidenceMessage()}
              </Text>
            </View>
          </View>
        </View>

        {/* Medical Disclaimer */}
        {diseaseName !== 'No Disease' && (
          <View style={styles.disclaimerCard}>
            <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
            <Text style={styles.disclaimerText}>
              <Text style={{ fontWeight: '700' }}>Clinical Disclaimer:</Text> This AI analysis is a preliminary screening tool. It is not an official medical diagnosis. Please consult a doctor or dermatologist for definitive medical guidance.
            </Text>
          </View>
        )}

        {/* Clinical Recommendations Section (Redesigned medically) */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Analyzing Skin with AI...</Text>
            <Text style={styles.loadingSubtext}>Generating medical description, causes, and treatments...</Text>
          </View>
        ) : (
          <>
            {/* 1. Clinical Description Card */}
            <View style={[styles.medicalCard, styles.descriptionCard]}>
              <View style={styles.medicalCardHeader}>
                <LinearGradient
                  colors={['#E8F5E9', '#C8E6C9']}
                  style={styles.medicalIconContainer}
                >
                  <Ionicons name="pulse" size={20} color={COLORS.darkGreen} />
                </LinearGradient>
                <Text style={styles.medicalCardTitle}>Clinical Description</Text>
              </View>
              <View style={styles.medicalCardContent}>
                <Markdown style={markdownStyles}>
                  {analysisData?.description || 'No description available.'}
                </Markdown>
              </View>
            </View>

            {/* 2. Common Causes & Triggers Card */}
            <View style={[styles.medicalCard, styles.causesCard]}>
              <View style={styles.medicalCardHeader}>
                <LinearGradient
                  colors={[COLORS.amberFill, '#FDE68A']}
                  style={styles.medicalIconContainer}
                >
                  <Ionicons name="flask-outline" size={20} color="#B45309" />
                </LinearGradient>
                <Text style={[styles.medicalCardTitle, { color: '#78350F' }]}>Common Causes & Triggers</Text>
              </View>
              <View style={styles.medicalCardContent}>
                <Markdown style={markdownStylesCauses}>
                  {analysisData?.causes || 'No causes information available.'}
                </Markdown>
              </View>
            </View>

            {/* 3. Treatment Recommendations Card */}
            <View style={[styles.medicalCard, styles.treatmentCard]}>
              <View style={styles.medicalCardHeader}>
                <LinearGradient
                  colors={['#E0F2FE', '#BAE6FD']}
                  style={styles.medicalIconContainer}
                >
                  <Ionicons name="bandage-outline" size={20} color="#0369A1" />
                </LinearGradient>
                <Text style={[styles.medicalCardTitle, { color: '#0C4A6E' }]}>Treatment & Care Guidelines</Text>
              </View>
              <View style={styles.medicalCardContent}>
                <Markdown style={markdownStylesTreatments}>
                  {analysisData?.treatments || 'No treatment guidelines available.'}
                </Markdown>
              </View>
            </View>

            {/* 4. Smart Medical Warning / Advisory Banner */}
            {analysisData?.showDoctorNote && (
              <View style={styles.medicalWarningCard}>
                <View style={styles.medicalWarningHeader}>
                  <Ionicons name="alert-circle" size={22} color="#DC2626" />
                  <Text style={styles.medicalWarningTitle}>Important Medical Advisory</Text>
                </View>
                <Text style={styles.medicalWarningText}>
                  This condition requires careful observation. Please consult a qualified dermatologist for a comprehensive diagnosis, personalized clinical prescription, and direct visual mapping of the affected skin.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Doctor Consultation Card - Only show for actual diseases */}
        {diseaseName !== 'No Disease' && (
          <TouchableOpacity style={styles.consultCard} onPress={handleConsultDoctor}>
            <LinearGradient
              colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]}
              style={styles.consultGradient}
            >
              <View style={styles.consultContent}>
                <View style={styles.consultIconContainer}>
                  <Ionicons name="business" size={28} color="#FFF" />
                </View>
                <View style={styles.consultTextContainer}>
                  <Text style={styles.consultTitle}>Find a Dermatologist</Text>
                  <Text style={styles.consultSubtitle}>Locate nearby skin specialists</Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color="#FFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="medkit-outline" size={16} color="#9CA3AF" />
          <Text style={styles.footerText}>
            This information is for educational purposes only. Always seek the advice of your physician.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================
// STYLING SYSTEM
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  headerContainer: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  headerGradient: {
    width: '100%',
    paddingBottom: 12,
  },
  safeHeader: {
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 35) : 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 30,
  },
  imageCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  imageLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  diagnosisCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  diagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  diagnosisIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  diagnosisTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
  },
  diseaseName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D4A3E',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  confidenceSection: {
    marginTop: 4,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  confidenceValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  confidenceBarContainer: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  confidenceBar: {
    height: '100%',
    borderRadius: 5,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  confidenceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    marginLeft: 12,
    lineHeight: 18,
  },
  medicalCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  descriptionCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#2D4A3E',
  },
  causesCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#D97706',
  },
  treatmentCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#0284C7',
  },
  medicalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  medicalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medicalCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.2,
  },
  medicalCardContent: {
    marginTop: 4,
  },
  medicalWarningCard: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  medicalWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicalWarningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
    marginLeft: 8,
  },
  medicalWarningText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 20,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D4A3E',
    marginTop: 15,
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 16,
  },
  consultCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  consultGradient: {
    padding: 20,
  },
  consultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consultIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  consultTextContainer: {
    flex: 1,
  },
  consultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  consultSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 16,
    backgroundColor: 'transparent',
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginLeft: 8,
    lineHeight: 16,
  },
});