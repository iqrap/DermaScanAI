"use client"

import { useRef, useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Keyboard,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import CustomCamera, { type CameraRef } from "../../component/CameraView"
import * as ImageManipulator from 'expo-image-manipulator'
import { saveToFirestore } from "../../../src/utils/firestoreUtils"
import { apiService } from "../../../src/services/apiService"

const { height, width } = Dimensions.get("window")

const FRAME_WIDTH = width * 0.78
const FRAME_HEIGHT = height * 0.42

const THEME = {
  primary: "#1B4D3E",
  secondary: "#2C5F4D",
  accent: "#0A7A6F",
  success: "#27AE60",
  warning: "#E67E22",
  error: "#C0392B",
  info: "#3498DB",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: {
    primary: "#1E293B",
    secondary: "#475569",
    muted: "#64748B",
    inverse: "#FFFFFF",
  },
  border: "#E2E8F0",
  card: "#FFFFFF",
  shadow: "#000000",
}

interface OCRResult {
  text: string | null
  provider: string
  confidence?: number
}

const SKIN_RELATED_KEYWORDS = [
  'skin', 'face', 'cream', 'lotion', 'serum', 'moisturizer', 'cleanser',
  'toner', 'sunscreen', 'spf', 'acne', 'anti-aging', 'retinol', 'vitamin c',
  'hyaluronic', 'niacinamide', 'peptide', 'ceramide', 'exfoliant', 'mask',
  'eye cream', 'lip balm', 'body lotion', 'hand cream', 'foot cream',
  'acids', 'aha', 'bha', 'glycolic', 'salicylic', 'lactic', 'mandelic',
  'azelaic', 'kojic', 'tranexamic', 'alpha arbutin', 'bakuchiol',
  'squalane', 'glycerin', 'dimethicone', 'petrolatum', 'lanolin',
  'mineral oil', 'paraffin', 'beeswax', 'carnauba wax', 'cetyl alcohol',
  'stearyl alcohol', 'cetearyl alcohol', 'emollient', 'humectant',
  'occlusive', 'surfactant', 'preservative', 'fragrance', 'parfum',
  'essential oil', 'botanical', 'extract', 'ferment', 'probiotic',
  'prebiotic', 'postbiotic', 'collagen', 'elastin', 'keratin',
  'dermatologist', 'hypoallergenic', 'non-comedogenic', 'oil-free',
  'water-based', 'gel-based', 'cream-based', 'ointment', 'balm',
  'medicine', 'ointment', 'topical', 'dermatology'
]

const isSkinRelated = (text: string): boolean => {
  const lowerText = text.toLowerCase()
  return SKIN_RELATED_KEYWORDS.some(keyword => lowerText.includes(keyword))
}

export default function IngrediantAnalyzer() {
  const router = useRouter()
  const cameraRef = useRef<CameraRef | null>(null)

  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualText, setManualText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [ocrProgress, setOcrProgress] = useState("")
  const [processingStage, setProcessingStage] = useState<string>("")
  const [ocrConfidence, setOcrConfidence] = useState<number>(0)
  
  const scanLineAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (photoUri) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start()
    } else {
      scanLineAnim.stopAnimation()
      scanLineAnim.setValue(0)
    }
  }, [photoUri])

  const performOCR = async (imageUri: string): Promise<OCRResult> => {
    setOcrProgress("Reading ingredients...")
    
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      )

      const response = await fetch(manipulatedImage.uri)
      const blob = await response.blob()
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      
      const result = await apiService.performOCR(base64)
      setOcrConfidence(result.confidence || 0)
      return result
    } catch (error) {
      console.error('OCR error:', error)
      return { text: null, provider: 'error', confidence: 0 }
    }
  }

  const analyzeWithGroq = async (ingredientText: string, ocrProvider?: string) => {
    try {
      setProcessingStage("Analyzing ingredients...")
      
      if (!isSkinRelated(ingredientText)) {
        Alert.alert(
          "Invalid Product Type",
          "This doesn't appear to be a skin product. Please scan a skincare product or medicine.",
          [
            { text: "Try Again", onPress: () => setPhotoUri(null) },
            { text: "Manual Entry", onPress: () => {
              setPhotoUri(null)
              setShowManualInput(true)
              setIsLoading(false)
            }}
          ]
        )
        setIsLoading(false)
        return null
      }
      
      const analysis = await apiService.analyzeIngredients(
        ingredientText, 
        ocrProvider, 
        ocrConfidence
      )
      
      return analysis
    } catch (error: any) {
      console.error('Groq API error:', error)
      throw error
    }
  }

  const handleCapture = async (photo: { uri: string } | null) => {
    if (!photo?.uri) return
    setPhotoUri(photo.uri)
  }

  const handleAnalyzePress = async () => {
    if (!photoUri) {
      Alert.alert("Alert", "Please capture an image of the ingredient list")
      return
    }

    setIsLoading(true)
    
    try {
      const ocrResult = await performOCR(photoUri)
      
      if (!ocrResult.text || ocrResult.text.length < 20) {
        Alert.alert(
          "Reading Failed",
          "Could not read ingredients clearly. Would you like to enter them manually?",
          [
            { text: "Cancel", style: "cancel", onPress: () => {
              setPhotoUri(null)
              setIsLoading(false)
            }},
            { text: "Manual Entry", onPress: () => {
              setPhotoUri(null)
              setShowManualInput(true)
              setIsLoading(false)
            }}
          ]
        )
        return
      }

      const analysis = await analyzeWithGroq(ocrResult.text, ocrResult.provider)
      
      if (analysis) {
        await saveToFirestore("productScans", {
          scanId: Date.now().toString(),
          ingredientsText: ocrResult.text,
          analysisResult: analysis,
          ocrProvider: ocrResult.provider,
          imageUrl: photoUri,
          timestamp: Date.now()
        })
        
        scanLineAnim.stopAnimation()
        
        router.push({
          pathname: "/features/Product_Scanner/ProductResultScreen",
          params: { analysisData: JSON.stringify(analysis) }
        })
        
        setTimeout(() => {
          setPhotoUri(null)
          setIsLoading(false)
        }, 100)
      }
    } catch (error) {
      console.error('Processing error:', error)
      Alert.alert(
        "Analysis Error",
        "An error occurred. Please try again or enter ingredients manually.",
        [
          { text: "Try Again", onPress: () => setPhotoUri(null) },
          { text: "Manual Entry", onPress: () => {
            setPhotoUri(null)
            setShowManualInput(true)
            setIsLoading(false)
          }}
        ]
      )
    }
  }

  const handleManualSubmit = async () => {
    Keyboard.dismiss()
    
    if (manualText.trim().length < 10) {
      Alert.alert("Invalid Input", "Please enter the full ingredient list")
      return
    }
    
    if (!isSkinRelated(manualText)) {
      Alert.alert(
        "Invalid Product Type",
        "This doesn't appear to be a skincare product. Please enter only skincare ingredients."
      )
      return
    }
    
    setIsLoading(true)
    setShowManualInput(false)
    
    try {
      const analysis = await analyzeWithGroq(manualText, 'manual')
      
      if (analysis) {
        await saveToFirestore("productScans", {
          scanId: Date.now().toString(),
          ingredientsText: manualText,
          analysisResult: analysis,
          ocrProvider: 'manual',
          imageUrl: null,
          timestamp: Date.now()
        })
        
        router.push({
          pathname: "/features/Product_Scanner/ProductResultScreen",
          params: { analysisData: JSON.stringify(analysis) }
        })
      }
    } catch (error) {
      console.error('Manual analysis error:', error)
      Alert.alert("Analysis Error", "Could not analyze ingredients. Please check the format and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.text.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Ingredient Scanner</Text>
          <Text style={styles.headerSubtitle}>Skincare analysis</Text>
        </View>
        <TouchableOpacity onPress={() => setShowInstructions(true)} style={styles.iconButton}>
          <Ionicons name="medical" size={26} color={THEME.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.cameraView} />
        ) : (
          <CustomCamera ref={cameraRef} onCapture={handleCapture} cameraType="back" style={styles.cameraView}>
            <View style={styles.overlayContainer} pointerEvents="none">
              <View style={styles.scanFrame}>
                {photoUri && (
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        transform: [
                          {
                            translateY: scanLineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, FRAME_HEIGHT - 2],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                )}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                
                <View style={styles.crosshair}>
                  <View style={styles.crosshairHorizontal} />
                  <View style={styles.crosshairVertical} />
                </View>
              </View>

              <View style={styles.frameTextContainer}>
                <Ionicons name="scan" size={16} color="#FFF" />
                <Text style={styles.frameText}>
                  {photoUri ? "PROCESSING..." : "ALIGN INGREDIENTS IN FRAME"}
                </Text>
              </View>
            </View>
          </CustomCamera>
        )}
      </View>

      <View style={styles.bottomCard}>
        {!photoUri && !isLoading && (
          <View style={styles.clinicalBadge}>
            <Ionicons name="flask" size={14} color={THEME.primary} />
            <Text style={styles.clinicalBadgeText}>Skincare Ingredient Analysis</Text>
          </View>
        )}
        
        <Text style={styles.bottomTitle}>Ingredient Safety Check</Text>
        <Text style={styles.bottomSubtitle}>Find out what's in your skincare</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={styles.loadingTitle}>{ocrProgress || "Processing..."}</Text>
            <Text style={styles.loadingSubtitle}>{processingStage}</Text>
            
            {ocrConfidence > 0 && (
              <View style={styles.confidenceBar}>
                <View style={[styles.confidenceFill, { width: `${ocrConfidence * 100}%` }]} />
              </View>
            )}
          </View>
        ) : !photoUri ? (
          <>
            <TouchableOpacity 
              style={styles.captureBtnOuter} 
              onPress={() => cameraRef.current?.takePicture?.()}
            >
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>

            <View style={styles.alternativeOptions}>
              <TouchableOpacity onPress={() => setShowManualInput(true)} style={styles.manualBtn}>
                <Ionicons name="create-outline" size={18} color={THEME.primary} />
                <Text style={styles.manualText}>Type Ingredients</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.postCaptureContainer}>
            <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.retakeBtn}>
              <Ionicons name="close" size={20} color={THEME.text.secondary} />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleAnalyzePress} 
              style={styles.analyzeBtn}
              disabled={isLoading}
            >
              <Text style={styles.analyzeText}>Analyze</Text>
              <Ionicons name="medical" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        visible={showInstructions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInstructions(false)}
      >
        <View style={styles.instructionOverlay}>
          <ScrollView style={styles.instructionCard}>
            <View style={styles.instructionHeader}>
              <View style={styles.instructionIconContainer}>
                <Ionicons name="medical" size={28} color={THEME.primary} />
              </View>
              <Text style={styles.instructionTitle}>Scanning Guide</Text>
              <TouchableOpacity onPress={() => setShowInstructions(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={THEME.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.instructionSubtitle}>
              Follow these tips for best results
            </Text>

            <View style={styles.instructionList}>
              {[
                {
                  icon: "scan-outline",
                  title: "Position Ingredients",
                  description: "Center the ingredient list in the frame",
                  note: "Make sure all text is visible",
                },
                {
                  icon: "sunny-outline",
                  title: "Good Lighting",
                  description: "Use bright, even light",
                  note: "Avoid shadows on the text",
                },
                {
                  icon: "hand-left-outline",
                  title: "Hold Steady",
                  description: "Keep your phone still",
                  note: "Blurry photos won't work well",
                },
                {
                  icon: "text-outline",
                  title: "Clear Text",
                  description: "Make sure all words are sharp",
                  note: "Get closer if text is small",
                },
              ].map((item, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.instructionItemIcon}>
                    <Ionicons name={item.icon as any} size={24} color={THEME.primary} />
                  </View>
                  <View style={styles.instructionItemContent}>
                    <Text style={styles.instructionItemTitle}>{item.title}</Text>
                    <Text style={styles.instructionItemDesc}>{item.description}</Text>
                    <Text style={styles.instructionItemNote}>{item.note}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.tipsContainer}>
              <View style={styles.tipHeader}>
                <Ionicons name="flask" size={20} color={THEME.accent} />
                <Text style={styles.tipTitle}>Quick Tips</Text>
              </View>
              
              <View style={styles.tipGrid}>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={16} color={THEME.success} />
                  <Text style={styles.tipText}>Use good lighting</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={16} color={THEME.success} />
                  <Text style={styles.tipText}>Avoid shiny packaging</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={16} color={THEME.success} />
                  <Text style={styles.tipText}>Keep camera steady</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={16} color={THEME.success} />
                  <Text style={styles.tipText}>Hold phone parallel to text</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={() => setShowInstructions(false)} style={styles.gotItButton}>
              <Text style={styles.gotItButtonText}>Start Scanning</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showManualInput} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.manualModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Type Ingredients</Text>
                <Text style={styles.modalSubtitle}>Enter the ingredient list</Text>
              </View>
              <TouchableOpacity onPress={() => setShowManualInput(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={THEME.text.secondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              multiline
              style={styles.textInput}
              placeholder="Aqua, Glycerin, Niacinamide, Hyaluronic Acid, ..."
              placeholderTextColor={THEME.text.muted}
              value={manualText}
              onChangeText={setManualText}
              textAlignVertical="top"
              autoFocus
            />

            <View style={styles.inputNote}>
              <Ionicons name="information-circle" size={16} color={THEME.info} />
              <Text style={styles.inputNoteText}>
                Separate ingredients with commas for best results
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setShowManualInput(false)} 
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleManualSubmit} 
                style={styles.modalAnalyzeBtn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.modalAnalyzeBtnText}>Analyze</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: THEME.background 
  },
  
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerTitle: { 
    marginTop: 25,
    fontSize: 18, 
    fontWeight: "700", 
    color: THEME.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.text.muted,
    marginTop: 2,
  },
  iconButton: { 
    padding: 8,
    borderRadius: 8,
    backgroundColor: THEME.background,
  },
  
  cameraContainer: {
    height: height * 0.55,
    backgroundColor: "#000",
    borderRadius: 0,
    overflow: "hidden",
  },
  cameraView: { 
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderWidth: 2,
    marginBottom: 10,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 16,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#FFF",
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  crosshair: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairHorizontal: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  crosshairVertical: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    position: 'absolute',
  },
  scanLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: THEME.accent,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  frameTextContainer: {
    marginTop: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.75)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  frameText: { 
    color: "#FFF", 
    fontSize: 13, 
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  
  bottomCard: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -10,
    shadowColor: THEME.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  clinicalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  clinicalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.primary,
  },
  bottomTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: THEME.text.primary,
    marginBottom: 4,
  },
  bottomSubtitle: { 
    fontSize: 13, 
    color: THEME.text.muted, 
    marginBottom: 15,
    textAlign: 'center',
  },
  
  captureBtnOuter: {
    width: 70,
    height: 70,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: THEME.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  captureBtnInner: {
    width: 54,
    height: 54,
    borderRadius: 32,
    backgroundColor: THEME.primary,
  },
  
  alternativeOptions: {
    width: '100%',
    marginTop: 5,
  },
  manualBtn: {
    flexDirection: "row",
    backgroundColor: THEME.background,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: THEME.primary,
  },
  manualText: { 
    color: THEME.primary, 
    fontWeight: "600",
    fontSize: 15,
  },
  
  postCaptureContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 16,
  },
  retakeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor: THEME.surface,
  },
  retakeText: { 
    color: THEME.text.secondary,
    fontWeight: "600",
  },
  analyzeBtn: {
    flex: 1,
    backgroundColor: THEME.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeText: { 
    color: "#FFF", 
    fontWeight: "700",
    fontSize: 15,
  },
  
  loadingContainer: { 
    alignItems: "center",
    width: '100%',
  },
  loadingTitle: { 
    marginTop: 16, 
    fontSize: 16, 
    fontWeight: "600",
    color: THEME.text.primary,
  },
  loadingSubtitle: { 
    marginTop: 4, 
    fontSize: 13, 
    color: THEME.text.muted,
    textAlign: 'center',
  },
  confidenceBar: {
    width: '80%',
    height: 4,
    backgroundColor: THEME.border,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: THEME.success,
    borderRadius: 2,
  },
  
  instructionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  instructionCard: {
    width: "100%",
    maxHeight: height * 0.8,
    backgroundColor: THEME.surface,
    borderRadius: 24,
    padding: 24,
  },
  instructionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  instructionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: THEME.background,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: THEME.text.primary,
    marginLeft: 12,
  },
  instructionSubtitle: {
    fontSize: 14,
    color: THEME.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.background,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionList: { 
    gap: 16,
    marginBottom: 20,
  },
  instructionItem: { 
    flexDirection: "row", 
    alignItems: "flex-start",
  },
  instructionItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.background,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionItemContent: { 
    flex: 1, 
    marginLeft: 14,
  },
  instructionItemTitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: THEME.text.primary, 
    marginBottom: 4,
  },
  instructionItemDesc: { 
    fontSize: 13, 
    color: THEME.text.secondary, 
    lineHeight: 18,
    marginBottom: 2,
  },
  instructionItemNote: {
    fontSize: 12,
    color: THEME.primary,
    fontStyle: 'italic',
  },
  
  tipsContainer: { 
    marginTop: 8, 
    marginBottom: 20,
    padding: 16, 
    backgroundColor: THEME.background, 
    borderRadius: 16,
    borderLeftWidth: 4, 
    borderLeftColor: THEME.accent,
  },
  tipHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 12,
    gap: 8,
  },
  tipTitle: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: THEME.accent,
  },
  tipGrid: {
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: { 
    fontSize: 13, 
    color: THEME.text.secondary,
    flex: 1,
  },
  
  gotItButton: { 
    backgroundColor: THEME.primary, 
    paddingVertical: 18, 
    borderRadius: 14, 
    alignItems: "center",
    marginTop: 2,
    marginBottom:35,
  },
  gotItButtonText: { 
    color: THEME.text.inverse, 
    fontSize: 16, 
    fontWeight: "700",
  },
  
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.6)", 
    justifyContent: "center", 
    alignItems: "center",
  },
  manualModalCard: { 
    width: "90%", 
    backgroundColor: THEME.surface, 
    padding: 24, 
    borderRadius: 20,
    shadowColor: THEME.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "700",
    color: THEME.text.primary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: THEME.text.muted,
    marginTop: 4,
  },
  modalCloseBtn: {
    padding: 8,
  },
  textInput: { 
    height: 150, 
    borderWidth: 1, 
    borderColor: THEME.border, 
    borderRadius: 12, 
    padding: 16, 
    marginTop: 8,
    fontSize: 14,
    color: THEME.text.primary,
    backgroundColor: THEME.background,
  },
  inputNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  inputNoteText: {
    fontSize: 12,
    color: THEME.info,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 30,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  modalCancelText: {
    color: THEME.text.secondary,
    fontWeight: '600',
  },
  modalAnalyzeBtn: { 
    flex: 1,
    backgroundColor: THEME.primary, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: "center",
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalAnalyzeBtnText: { 
    color: "#FFF", 
    fontWeight: "700",
    fontSize: 15,
  },
})