"use client"

import React, { useState } from "react"
import { View, Text, ScrollView, StyleSheet, Platform, ActivityIndicator, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"
import { useRouter } from "expo-router"
import { Card, Button } from "react-native-paper"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getLatestSkinTypeResult, type SavedSkinTypeResult } from "../../../src/utils/storageUtils"

// Professional Clinical Interface
interface ClinicalSavedResult extends SavedSkinTypeResult {
  clinicalName?: string
  clinicalDescription?: string
  clinicalPresentation?: string[]
  dailyProtocol?: {
    morning: Array<{ step: string, purpose: string, frequency: string }>
    evening: Array<{ step: string, purpose: string, frequency: string }>
    weekly?: Array<{ treatment: string, frequency: string, purpose: string }>
  }
  prescriptiveIngredients?: {
    essential: Array<{ name: string, concentration?: string, mechanism: string, evidence: string }>
    avoid: Array<{ name: string, reason: string, severity: 'High' | 'Moderate' | 'Low' }>
  }
  formulationGuide?: {
    cleanser: { type: string, rationale: string, pH?: string }
    moisturizer: { type: string, rationale: string, keyComponents: string[] }
    sunscreen: { type: string, spf_minimum: number, rationale: string }
    treatment: { type: string, rationale: string, frequency: string }
  }
  environmentalAdaptation?: {
    summer: Array<{ recommendation: string, rationale: string }>
    winter: Array<{ recommendation: string, rationale: string }>
    humid: Array<{ recommendation: string, rationale: string }>
    dry: Array<{ recommendation: string, rationale: string }>
  }
  contraindications?: Array<{ factor: string, risk: 'High' | 'Moderate' | 'Low', management: string }>
  systemicFactors?: {
    diet: Array<{ recommendation: string, rationale: string, evidence: string }>
    supplements?: Array<{ name: string, dosage?: string, purpose: string }>
    sleep: { recommendation: string, rationale: string }
    hydration: { amount: string, rationale: string }
    exercise: { recommendation: string, precautions?: string[] }
  }
  treatmentOutcomes?: {
    expected_timeline: string
    monitoring_parameters: string[]
    when_to_escalate: string[]
  }
}

// Helper function to format display title - FIXES DUPLICATE "SKIN" ISSUE
const formatDisplayTitle = (clinicalName?: string, skinType?: string): string => {
  // Priority 1: Use clinicalName but clean it
  if (clinicalName) {
    // Remove extra "Skin" words and clean up
    let cleaned = clinicalName.replace(/\s*Skin\s*/gi, ' ').trim()
    cleaned = cleaned.replace(/\s+/g, ' ')
    // If cleaned has content, return it with "Skin" added once
    if (cleaned) {
      return cleaned + " Skin"
    }
  }
  
  // Priority 2: Use skinType
  if (skinType) {
    // Remove any existing "Skin" word
    let cleaned = skinType.replace(/\s*Skin\s*/gi, '').trim()
    if (cleaned.includes('/')) {
      return cleaned + " Skin"
    }
    return `${cleaned} Skin`
  }
  
  return "Your Skin Analysis"
}

export default function SavedSkinResultsScreen() {
  const [clinicalResult, setClinicalResult] = useState<ClinicalSavedResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    desc: false,
    protocol: false,
    ingredients: false,
    formulation: false,
    environment: false,
    contra: false,
    systemic: false,
    outcomes: false
  })
  const router = useRouter()

  const loadClinicalData = async () => {
    setLoading(true)
    try {
      // First try to load full clinical data
      const clinicalDataString = await AsyncStorage.getItem("lastClinicalSkinResult")
      if (clinicalDataString) {
        const fullData = JSON.parse(clinicalDataString)
        setClinicalResult(fullData)
      } else {
        // Fallback to regular saved result
        const result = await getLatestSkinTypeResult()
        setClinicalResult(result as ClinicalSavedResult)
      }
    } catch (error) {
      console.log("Error loading clinical data:", error)
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      loadClinicalData()
    }, [])
  )

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

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006B5F" />
          <Text style={styles.loadingText}>Loading your saved skin analysis...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!clinicalResult) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Saved Analysis</Text>
            <Text style={styles.headerSubtitle}>Your Skin History</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={70} color="#A0A0A0" />
          <Text style={styles.emptyText}>No Saved Analysis Found</Text>
          <Text style={styles.emptySubtext}>Complete a skin assessment to create your personalized skin care plan.</Text>
          <LinearGradient colors={["#006B5F", "#0D5A47"]} style={styles.btnGradient}>
            <Button
              mode="contained"
              onPress={() => router.push("../../features/skin_type/SkintypeScreen")}
              labelStyle={{ color: "#fff", fontWeight: "600", fontSize: 16 }}
              style={styles.submitBtn}
            >
              Start New Assessment
            </Button>
          </LinearGradient>
        </View>
      </SafeAreaView>
    )
  }

  const hasClinicalData = !!(clinicalResult.clinicalDescription || clinicalResult.dailyProtocol)

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Saved Analysis</Text>
          <Text style={styles.headerSubtitle}>Your Skin Care History</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Result Header - FIXED: No duplicate "Skin" text */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>
            {formatDisplayTitle(clinicalResult.clinicalName, clinicalResult.skinType)}
          </Text>
          <Text style={styles.resultDate}>Analyzed on: {formatDate(clinicalResult.timestamp)}</Text>
          {hasClinicalData && (
            <View style={styles.clinicalBadge}>
              <Ionicons name="medical" size={14} color="#006B5F" />
              <Text style={styles.clinicalBadgeText}>Complete Skin Analysis</Text>
            </View>
          )}
        </View>

        {hasClinicalData ? (
          <>
            {/* SECTION 1: Clinical Description */}
            {clinicalResult.clinicalDescription && (
              <Card style={styles.clinicalCard}>
                <TouchableOpacity onPress={() => toggleSection('desc')} style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <View style={[styles.iconCircle, { backgroundColor: '#006B5F' }]}>
                      <Ionicons name="medical" size={18} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.sectionTag}>ABOUT YOUR SKIN</Text>
                      <Text style={styles.sectionTitle}>What This Means</Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={expandedSections['desc'] ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#006B5F" 
                  />
                </TouchableOpacity>

                {expandedSections['desc'] && (
                  <View style={styles.cardContent}>
                    <Text style={styles.clinicalText}>{clinicalResult.clinicalDescription}</Text>
                    
                    {clinicalResult.clinicalPresentation && (
                      <View style={styles.presentationBox}>
                        <Text style={styles.presentationTitle}>What you might notice:</Text>
                        {clinicalResult.clinicalPresentation.map((item, idx) => (
                          <View key={idx} style={styles.presentationItem}>
                            <Ionicons name="checkmark-circle" size={14} color="#006B5F" />
                            <Text style={styles.presentationText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </Card>
            )}

            {/* SECTION 2: Daily Protocol */}
            {clinicalResult.dailyProtocol && (
              <Card style={styles.protocolCard}>
                <TouchableOpacity onPress={() => toggleSection('protocol')} style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <View style={[styles.iconCircle, { backgroundColor: '#FFA500' }]}>
                      <Ionicons name="sunny" size={18} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.sectionTag}>DAILY ROUTINE</Text>
                      <Text style={styles.sectionTitle}>Morning & Evening</Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={expandedSections['protocol'] ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#006B5F" 
                  />
                </TouchableOpacity>

                {expandedSections['protocol'] && (
                  <View style={styles.cardContent}>
                    {/* Morning */}
                    <Text style={styles.routineLabel}>🌅 Morning Routine</Text>
                    <Text style={styles.routineIntro}>Start your day with:</Text>
                    
                    {clinicalResult.dailyProtocol.morning.map((step, idx) => (
                      <View key={`am-${idx}`} style={styles.savedStep}>
                        <View style={styles.stepDot} />
                        <View style={styles.stepContent}>
                          <Text style={styles.stepText}>{step.step}</Text>
                          <Text style={styles.purposeText}>💡 {step.purpose}</Text>
                          <Text style={styles.frequencyText}>⏰ {step.frequency}</Text>
                        </View>
                      </View>
                    ))}

                    <View style={styles.divider} />

                    {/* Evening */}
                    <Text style={styles.routineLabel}>🌙 Evening Routine</Text>
                    <Text style={styles.routineIntro}>Wind down with:</Text>
                    
                    {clinicalResult.dailyProtocol.evening.map((step, idx) => (
                      <View key={`pm-${idx}`} style={styles.savedStep}>
                        <View style={styles.stepDot} />
                        <View style={styles.stepContent}>
                          <Text style={styles.stepText}>{step.step}</Text>
                          <Text style={styles.purposeText}>💡 {step.purpose}</Text>
                          <Text style={styles.frequencyText}>⏰ {step.frequency}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            )}

            {/* SECTION 3: Prescriptive Ingredients */}
            {clinicalResult.prescriptiveIngredients && (
              <Card style={styles.ingredientCard}>
                <TouchableOpacity onPress={() => toggleSection('ingredients')} style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <View style={[styles.iconCircle, { backgroundColor: '#9C27B0' }]}>
                      <Ionicons name="flask" size={18} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.sectionTag}>INGREDIENTS</Text>
                      <Text style={styles.sectionTitle}>What To Look For</Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={expandedSections['ingredients'] ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#006B5F" 
                  />
                </TouchableOpacity>

                {expandedSections['ingredients'] && (
                  <View style={styles.cardContent}>
                    {/* Essential */}
                    <Text style={styles.categoryLabel}>✅ Look For These</Text>
                    <Text style={styles.categoryHint}>Great choices for your skin:</Text>
                    
                    {clinicalResult.prescriptiveIngredients.essential.map((item, idx) => (
                      <View key={`ess-${idx}`} style={styles.essentialItem}>
                        <Text style={styles.essentialName}>{item.name}</Text>
                        {item.concentration && (
                          <Text style={styles.concentration}>Try: {item.concentration}</Text>
                        )}
                        <Text style={styles.mechanismText}>How it helps: {item.mechanism}</Text>
                      </View>
                    ))}

                    {/* Avoid */}
                    <Text style={[styles.categoryLabel, { marginTop: 16, color: '#D32F2F' }]}>
                      ❌ Be Careful With
                    </Text>
                    <Text style={styles.categoryHint}>These might not be ideal:</Text>
                    
                    {clinicalResult.prescriptiveIngredients.avoid.map((item, idx) => (
                      <View key={`av-${idx}`} style={styles.avoidItem}>
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
            )}

            {/* SECTION 4: Formulation Guide */}
            {clinicalResult.formulationGuide && (
              <Card style={styles.formulationCard}>
                <TouchableOpacity onPress={() => toggleSection('formulation')} style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <View style={[styles.iconCircle, { backgroundColor: '#FF6B6B' }]}>
                      <Ionicons name="cube" size={18} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.sectionTag}>PRODUCT TYPES</Text>
                      <Text style={styles.sectionTitle}>What To Choose</Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={expandedSections['formulation'] ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#006B5F" 
                  />
                </TouchableOpacity>

                {expandedSections['formulation'] && (
                  <View style={styles.cardContent}>
                    <View style={styles.formulationItem}>
                      <View style={styles.formulationIcon}>
                        <Ionicons name="water" size={20} color="#006B5F" />
                      </View>
                      <View style={styles.formulationContent}>
                        <Text style={styles.formulationLabel}>Cleanser</Text>
                        <Text style={styles.formulationValue}>{clinicalResult.formulationGuide.cleanser.type}</Text>
                        <Text style={styles.formulationRationale}>{clinicalResult.formulationGuide.cleanser.rationale}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.formulationItem}>
                      <View style={styles.formulationIcon}>
                        <Ionicons name="leaf" size={20} color="#006B5F" />
                      </View>
                      <View style={styles.formulationContent}>
                        <Text style={styles.formulationLabel}>Moisturizer</Text>
                        <Text style={styles.formulationValue}>{clinicalResult.formulationGuide.moisturizer.type}</Text>
                        <Text style={styles.formulationRationale}>{clinicalResult.formulationGuide.moisturizer.rationale}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.formulationItem}>
                      <View style={styles.formulationIcon}>
                        <Ionicons name="sunny" size={20} color="#006B5F" />
                      </View>
                      <View style={styles.formulationContent}>
                        <Text style={styles.formulationLabel}>Sunscreen</Text>
                        <Text style={styles.formulationValue}>
                          {clinicalResult.formulationGuide.sunscreen.type} (SPF {clinicalResult.formulationGuide.sunscreen.spf_minimum}+)
                        </Text>
                        <Text style={styles.formulationRationale}>{clinicalResult.formulationGuide.sunscreen.rationale}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </Card>
            )}

            {/* SECTION 5: Environmental Adaptation */}
            {clinicalResult.environmentalAdaptation && (
              <Card style={styles.environmentCard}>
                <TouchableOpacity onPress={() => toggleSection('environment')} style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <View style={[styles.iconCircle, { backgroundColor: '#4CAF50' }]}>
                      <Ionicons name="leaf" size={18} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.sectionTag}>SEASONAL CARE</Text>
                      <Text style={styles.sectionTitle}>Adjust Through The Year</Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={expandedSections['environment'] ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#006B5F" 
                  />
                </TouchableOpacity>

                {expandedSections['environment'] && (
                  <View style={styles.cardContent}>
                    {clinicalResult.environmentalAdaptation.summer && (
                      <>
                        <Text style={styles.seasonLabel}>☀️ Summer</Text>
                        {clinicalResult.environmentalAdaptation.summer.map((item, idx) => (
                          <View key={`sum-${idx}`} style={styles.environmentItem}>
                            <Ionicons name="chevron-forward" size={14} color="#006B5F" />
                            <Text style={styles.environmentText}>{item.recommendation}</Text>
                          </View>
                        ))}
                      </>
                    )}
                    
                    {clinicalResult.environmentalAdaptation.winter && (
                      <>
                        <Text style={[styles.seasonLabel, { marginTop: 12 }]}>❄️ Winter</Text>
                        {clinicalResult.environmentalAdaptation.winter.map((item, idx) => (
                          <View key={`win-${idx}`} style={styles.environmentItem}>
                            <Ionicons name="chevron-forward" size={14} color="#006B5F" />
                            <Text style={styles.environmentText}>{item.recommendation}</Text>
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                )}
              </Card>
            )}

            {/* SECTION 6: Contraindications */}
            {clinicalResult.contraindications && clinicalResult.contraindications.length > 0 && (
              <Card style={styles.contraindicationCard}>
                <TouchableOpacity onPress={() => toggleSection('contra')} style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <View style={[styles.iconCircle, { backgroundColor: '#D32F2F' }]}>
                      <Ionicons name="warning" size={18} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.sectionTag}>SPECIAL CARE</Text>
                      <Text style={styles.sectionTitle}>When To Be Careful</Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={expandedSections['contra'] ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#006B5F" 
                  />
                </TouchableOpacity>

                {expandedSections['contra'] && (
                  <View style={styles.cardContent}>
                    {clinicalResult.contraindications.map((item, idx) => (
                      <View key={idx} style={styles.contraItem}>
                        <View style={styles.contraHeader}>
                          <Text style={styles.contraFactor}>{item.factor}</Text>
                          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.risk) + '20' }]}>
                            <Text style={[styles.riskText, { color: getRiskColor(item.risk) }]}>
                              {item.risk}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.contraManagement}>What to do: {item.management}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            )}

            {/* SECTION 7: Systemic Factors */}
            {clinicalResult.systemicFactors && (
              <Card style={styles.systemicCard}>
                <TouchableOpacity onPress={() => toggleSection('systemic')} style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <View style={[styles.iconCircle, { backgroundColor: '#E91E63' }]}>
                      <Ionicons name="heart" size={18} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.sectionTag}>LIFESTYLE</Text>
                      <Text style={styles.sectionTitle}>Whole-Body Wellness</Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={expandedSections['systemic'] ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#006B5F" 
                  />
                </TouchableOpacity>

                {expandedSections['systemic'] && (
                  <View style={styles.cardContent}>
                    {/* Diet */}
                    <Text style={styles.systemicLabel}>🥗 Diet</Text>
                    {clinicalResult.systemicFactors.diet.map((item, idx) => (
                      <View key={`diet-${idx}`} style={styles.systemicItem}>
                        <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                        <Text style={styles.systemicText}>{item.recommendation}</Text>
                      </View>
                    ))}

                    {/* Sleep */}
                    <Text style={[styles.systemicLabel, { marginTop: 12 }]}>😴 Sleep</Text>
                    <Text style={styles.systemicDetail}>{clinicalResult.systemicFactors.sleep.recommendation}</Text>

                    {/* Hydration */}
                    <Text style={[styles.systemicLabel, { marginTop: 12 }]}>💧 Hydration</Text>
                    <Text style={styles.systemicDetail}>{clinicalResult.systemicFactors.hydration.amount}</Text>
                  </View>
                )}
              </Card>
            )}

            {/* SECTION 8: Treatment Outcomes */}
            {clinicalResult.treatmentOutcomes && (
              <Card style={styles.outcomeCard}>
                <TouchableOpacity onPress={() => toggleSection('outcomes')} style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <View style={[styles.iconCircle, { backgroundColor: '#2196F3' }]}>
                      <Ionicons name="trending-up" size={18} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.sectionTag}>WHAT TO EXPECT</Text>
                      <Text style={styles.sectionTitle}>Your Skin Journey</Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={expandedSections['outcomes'] ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#006B5F" 
                  />
                </TouchableOpacity>

                {expandedSections['outcomes'] && (
                  <View style={styles.cardContent}>
                    <View style={styles.timelineBox}>
                      <Ionicons name="calendar" size={18} color="#006B5F" />
                      <Text style={styles.timelineText}>Expected timeline: {clinicalResult.treatmentOutcomes.expected_timeline}</Text>
                    </View>
                    
                    <Text style={styles.outcomeLabel}>Things to notice:</Text>
                    {clinicalResult.treatmentOutcomes.monitoring_parameters.map((param, idx) => (
                      <View key={`mon-${idx}`} style={styles.outcomeItem}>
                        <Ionicons name="eye" size={14} color="#006B5F" />
                        <Text style={styles.outcomeItemText}>{param}</Text>
                      </View>
                    ))}
                    
                    <Text style={[styles.outcomeLabel, { marginTop: 12, color: '#D32F2F' }]}>See a doctor if:</Text>
                    {clinicalResult.treatmentOutcomes.when_to_escalate.map((item, idx) => (
                      <View key={`esc-${idx}`} style={styles.outcomeItem}>
                        <Ionicons name="alert-circle" size={14} color="#D32F2F" />
                        <Text style={[styles.outcomeItemText, { color: '#D32F2F' }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            )}
          </>
        ) : (
          // Fallback to basic data if no clinical data
          <>
            <Card style={styles.basicCard}>
              <View style={styles.cardContent}>
                <Text style={styles.basicDescription}>{clinicalResult.description}</Text>
                
                {clinicalResult.sideEffects && clinicalResult.sideEffects.length > 0 && (
                  <View style={styles.basicSection}>
                    <Text style={styles.basicSectionTitle}>Common Concerns:</Text>
                    {clinicalResult.sideEffects.map((effect, idx) => (
                      <Text key={idx} style={styles.basicText}>• {effect}</Text>
                    ))}
                  </View>
                )}

                {clinicalResult.avoid && clinicalResult.avoid.length > 0 && (
                  <View style={styles.basicSection}>
                    <Text style={styles.basicSectionTitle}>Things to Avoid:</Text>
                    {clinicalResult.avoid.map((item, idx) => (
                      <Text key={idx} style={styles.basicText}>• {item}</Text>
                    ))}
                  </View>
                )}

                {clinicalResult.tips && clinicalResult.tips.length > 0 && (
                  <View style={styles.basicSection}>
                    <Text style={styles.basicSectionTitle}>Helpful Tips:</Text>
                    {clinicalResult.tips.map((tip, idx) => (
                      <Text key={idx} style={styles.basicText}>• {tip}</Text>
                    ))}
                  </View>
                )}
              </View>
            </Card>
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.newAssessmentBtn}
            onPress={() => router.push("../../features/skin_type/SkintypeScreen")}
          >
            <Ionicons name="refresh" size={20} color="#006B5F" />
            <Text style={styles.newAssessmentText}>Take New Assessment</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={16} color="#999" />
          <Text style={styles.disclaimerText}>
            This is your saved skin analysis. Skin can change over time, so consider updating your assessment every few months or if your skin feels different.
          </Text>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#006B5F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#006B5F',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBackBtn: {
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  resultHeader: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#006B5F',
    marginBottom: 4,
    textAlign: 'center',
  },
  resultDate: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 8,
  },
  clinicalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  clinicalBadgeText: {
    fontSize: 12,
    color: '#006B5F',
    fontWeight: '600',
  },
  clinicalCard: {
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
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
  basicCard: {
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
    gap: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#006B5F',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  cardContent: {
    padding: 16,
  },
  clinicalText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#424242',
    marginBottom: 12,
  },
  presentationBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
  },
  presentationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 8,
  },
  presentationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  presentationText: {
    flex: 1,
    fontSize: 13,
    color: '#616161',
  },
  routineLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 4,
  },
  routineIntro: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  savedStep: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#006B5F',
    marginTop: 6,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  purposeText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  frequencyText: {
    fontSize: 11,
    color: '#999',
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 2,
  },
  categoryHint: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 10,
  },
  essentialItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  essentialName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 2,
  },
  concentration: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  mechanismText: {
    fontSize: 12,
    color: '#424242',
    lineHeight: 16,
  },
  avoidItem: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  avoidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  avoidName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D32F2F',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '600',
  },
  avoidReason: {
    fontSize: 12,
    color: '#B71C1C',
    lineHeight: 16,
  },
  formulationItem: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  formulationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formulationContent: {
    flex: 1,
  },
  formulationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 2,
  },
  formulationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  formulationRationale: {
    fontSize: 11,
    color: '#666',
  },
  seasonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 6,
  },
  environmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
    paddingLeft: 4,
  },
  environmentText: {
    flex: 1,
    fontSize: 12,
    color: '#424242',
  },
  contraItem: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  contraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  contraFactor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
  },
  contraManagement: {
    fontSize: 12,
    color: '#B71C1C',
    lineHeight: 16,
  },
  systemicLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 6,
  },
  systemicItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  systemicText: {
    flex: 1,
    fontSize: 13,
    color: '#424242',
  },
  systemicDetail: {
    fontSize: 13,
    color: '#424242',
    marginBottom: 4,
    paddingLeft: 12,
  },
  timelineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  timelineText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
  },
  outcomeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 6,
  },
  outcomeItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  outcomeItemText: {
    flex: 1,
    fontSize: 12,
    color: '#424242',
  },
  basicDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#424242',
    marginBottom: 16,
  },
  basicSection: {
    marginTop: 12,
  },
  basicSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006B5F',
    marginBottom: 6,
  },
  basicText: {
    fontSize: 13,
    color: '#616161',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  actionRow: {
    marginVertical: 20,
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
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 30,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#999',
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  btnGradient: {
    borderRadius: 30,
    width: '80%',
  },
  submitBtn: {
    borderRadius: 30,
    backgroundColor: 'transparent',
    paddingVertical: 8,
  },
})