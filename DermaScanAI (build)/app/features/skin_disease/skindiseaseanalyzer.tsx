"use client"

import { useRef, useState, useEffect } from "react"
import {
  View,
  Text,
  Animated,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  SafeAreaView,
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import CustomCamera from "../../component/CameraView"
import type { CameraRef } from "../../component/CameraView"
import { saveToFirestore } from "../../../src/utils/firestoreUtils"
import { ENV } from "../../../src/config/env"

const { height, width } = Dimensions.get("window")

const FRAME_WIDTH = width * 0.85
const FRAME_HEIGHT = height * 0.45

// Model API URL (from .env)
const API_BASE_URL = ENV.MODEL_API_URL; // Same URL for both endpoints
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
  buttonGradientStart: "#558d74ff",
  buttonGradientEnd: "#3b6450ff",
}

export default function SkinDiseaseAnalyzer() {
  const router = useRouter()
  const cameraRef = useRef<CameraRef>(null)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [isFlash, setIsFlash] = useState(false)
  const [cameraType, setCameraType] = useState<"back" | "front">("back")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showIntroCard, setShowIntroCard] = useState(true)
  const [isValidating, setIsValidating] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const spinAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start()
  }, [])

  useEffect(() => {
    if (isAnalyzing || isValidating) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ).start()
    } else {
      spinAnim.setValue(0)
    }
  }, [isAnalyzing, isValidating])

  const handleCapture = (photo: any) => {
    if (!photo?.uri) {
      Alert.alert("Error", "Unable to capture image.")
      return
    }
    console.log('📸 Camera captured URI:', photo.uri)
    setPhotoUri(photo.uri)
  }

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow gallery access.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    })

    if (!result.canceled) {
      const uri = result.assets[0].uri
      console.log('📸 Selected image URI:', uri)
      setPhotoUri(uri)
    }
  }

  // Validate skin image first
  const validateSkinImage = async (uri: string): Promise<boolean> => {
    setIsValidating(true)

    try {
      const formData = new FormData()
      formData.append("file", {
        uri: uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any)

      console.log('📤 Sending to:', `${API_BASE_URL}/validate-skin`)

      const response = await fetch(`${API_BASE_URL}/validate-skin`, {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      })

      console.log('📥 Response status:', response.status)

      // First get response text
      const responseText = await response.text()
      console.log('📥 Raw response:', responseText)

      // Try to parse as JSON
      let result
      try {
        result = JSON.parse(responseText)
      } catch (e) {
        console.error('Failed to parse JSON:', e)
        throw new Error('Invalid response from server')
      }

      console.log('🔍 Parsed result:', result)
      setIsValidating(false)

      if (!result.isSkinImage) {
        Alert.alert(
          "Invalid Image",
          result.message || `This doesn't appear to be a skin image. Confidence: ${result.confidence?.toFixed(2)}%`,
          [{ text: "OK", onPress: () => setPhotoUri(null) }]
        )
        return false
      }

      console.log(`✅ Valid skin image with ${result.confidence?.toFixed(2)}% confidence`)
      return true

    } catch (error: any) {
      console.log("❌ Validation Error:", error.message)
      setIsValidating(false)
      Alert.alert(
        "Validation Error",
        `Could not validate image: ${error.message}\n\nMake sure backend is running.`
      )
      return false
    }
  }
  // Main analyze function with validation + disease detection
  const handleAnalyze = async () => {
    if (!photoUri) {
      Alert.alert("No Photo", "Please capture an image first.")
      return
    }

    console.log('📤 Starting analysis process...')

    // Step 1: Validate if it's a skin image
    const isValidSkin = await validateSkinImage(photoUri)
    if (!isValidSkin) {
      return
    }

    // Step 2: Proceed with disease analysis
    console.log('📤 Sending image for disease detection')
    setIsAnalyzing(true)

    try {
      const formData = new FormData()
      formData.append("file", {
        uri: photoUri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const result = await response.json()
      console.log('📥 Disease result:', result)

      if (result.error) {
        throw new Error(result.error)
      }

      // Save to Firestore
      await saveToFirestore("diseaseResults", {
        id: Date.now().toString(),
        concern: {
          name: result.diseaseName,
          matchPercentage: result.diseaseConfidence || result.confidence || 0
        },
        imageUrl: photoUri,
        timestamp: Date.now(),
        message: result.message || "",
        recommendation: result.recommendation || "",
        action: result.action || "",
        validatorConfidence: result.validatorConfidence || 0
      })

      setIsAnalyzing(false)

      // Navigate to result screen
      router.push({
        pathname: "/features/skin_disease/skindiseaseresult",
        params: {
          photoUri,
          timestamp: Date.now().toString(),
          diseaseName: result.diseaseName,
          confidence: (result.diseaseConfidence || result.confidence || 0).toString(),
          message: result.message || "",
          recommendation: result.recommendation || "",
          action: result.action || "",
          skinPercentage: (result.skinPercentage || 0).toString(),
          validatorConfidence: (result.validatorConfidence || 0).toString()
        },
      })

    } catch (error: any) {
      console.log("❌ Disease Detection Error:", error)
      setIsAnalyzing(false)

      if (error?.name === "AbortError") {
        Alert.alert("Timeout", "Server took too long. Make sure backend is running.")
      } else {
        Alert.alert("Error", "Could not analyze image. Please try again.")
      }
    }
  }

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  return (
    <View style={styles.fullScreen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <LinearGradient
        colors={[COLORS.bgGradientTop, COLORS.bgGradientBottom]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Validation Loading */}
      {isValidating && (
        <LinearGradient colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]} style={styles.loadingScreen}>
          <Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
            <Ionicons name="scan" size={60} color="#fff" />
          </Animated.View>
          <Text style={styles.loadingText}>Validating Image</Text>
          <Text style={styles.loadingSubtext}>Checking if this is a skin image...</Text>
        </LinearGradient>
      )}

      {/* Disease Analysis Loading */}
      {isAnalyzing && (
        <LinearGradient colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]} style={styles.loadingScreen}>
          <Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
            <Ionicons name="reload" size={60} color="#fff" />
          </Animated.View>
          <Text style={styles.loadingText}>Analyzing Your Skin</Text>
          <Text style={styles.loadingSubtext}>Please wait...</Text>
        </LinearGradient>
      )}

      {showIntroCard ? (
        <View style={styles.introCardContainer}>
          <View style={styles.introCard}>
            <View style={styles.introCardHeader}>
              <LinearGradient
                colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]}
                style={styles.introCardHeaderIcon}
              >
                <Ionicons name="medkit" size={32} color="#fff" />
              </LinearGradient>
              <Text style={styles.introCardTitle}>Skin Disease Analyzer</Text>
              <Text style={styles.introCardSubtitle}>AI-Powered Dermatological Analysis</Text>
            </View>

            <ScrollView style={styles.introCardScroll}>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={COLORS.accent} />
                <Text style={styles.infoBoxText}>
                  Advanced AI technology to detect common skin conditions. Align the affected area within the camera
                  frame for accurate analysis.
                </Text>
              </View>

              <View style={[styles.infoBox, { backgroundColor: '#E8F5E9', marginTop: 10 }]}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.accent} />
                <Text style={styles.infoBoxText}>
                  ✓ Smart validation ensures only skin images are analyzed for accurate results.
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Detectable Conditions (7)</Text>

              <View style={styles.diseaseGrid}>
                {[
                  { name: "Acne", icon: "water" },
                  { name: "Benign Tumors", icon: "alert-circle" },
                  { name: "Lichen", icon: "layers" },
                  { name: "No Disease", icon: "checkmark-circle" },
                  { name: "Vitiligo", icon: "contrast" },
                  { name: "Eczema", icon: "flame" },
                  { name: "Scabies", icon: "bug" },
                ].map((disease, index) => (
                  <View key={index} style={styles.diseaseItem}>
                    <View style={styles.diseaseIconCircle}>
                      <Ionicons name={disease.icon as any} size={18} color={COLORS.accent} />
                    </View>
                    <Text style={styles.diseaseItemTitle}>{disease.name}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.tipsBox}>
                <Ionicons name="bulb" size={20} color={COLORS.accent} />
                <Text style={styles.tipsText}>
                  For optimal results: Ensure good lighting, hold camera steady, and capture clear images.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity onPress={() => setShowIntroCard(false)} style={styles.dismissIntroBtn}>
              <LinearGradient
                colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]}
                style={styles.dismissIntroGradient}
              >
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.dismissIntroText}>Start Analysis</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.cameraFull}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.fullImage} />
          ) : (
            <CustomCamera
              ref={cameraRef}
              style={styles.cameraFull}
              onCapture={handleCapture}
              cameraType={cameraType}
              isFlashOn={isFlash}
            >
              <View style={styles.overlayContainer} pointerEvents="none">
                <View style={styles.scanFrame}>
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
                  <Ionicons name="scan" size={14} color="#FFF" />
                  <Text style={styles.frameText}>ALIGN SKIN AREA IN FRAME</Text>
                </View>
              </View>
            </CustomCamera>
          )}

          <View style={styles.fixedHeader}>
            <LinearGradient
              colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]}
              style={styles.headerGradient}
            >
              <SafeAreaView>
                <View style={styles.headerContent}>
                  <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Disease Analyzer</Text>
                  {!photoUri ? (
                    <TouchableOpacity
                      onPress={() => setCameraType(prev => prev === "back" ? "front" : "back")}
                      style={styles.headerButton}
                    >
                      <Ionicons name="camera-reverse" size={24} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.headerButton}>
                      <Ionicons name="refresh" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </SafeAreaView>
            </LinearGradient>
          </View>

          <View style={styles.bottomControls}>
            <TouchableOpacity onPress={pickImage} style={styles.circleBtn}>
              <Ionicons name="image" size={26} color={COLORS.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => cameraRef.current?.takePicture?.()} style={styles.captureWrapper}>
              <View style={styles.captureOuter}>
                <View style={styles.captureInner} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsFlash(prev => !prev)} style={styles.circleBtn}>
              <Ionicons name={isFlash ? "flash" : "flash-off"} size={26} color={COLORS.accent} />
            </TouchableOpacity>
          </View>

          {photoUri && !isAnalyzing && !isValidating && (
            <View style={styles.analyzeCardContainer}>
              <View style={styles.analyzeCard}>
                <Image source={{ uri: photoUri }} style={styles.cardImage} />
                <Text style={styles.cardTitle}>Ready for Analysis</Text>
                <TouchableOpacity onPress={handleAnalyze} style={styles.analyzeCardBtn}>
                  <LinearGradient
                    colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]}
                    style={styles.gradientCardBtn}
                  >
                    <Text style={styles.analyzeCardText}>Start Analysis</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPhotoUri(null)}>
                  <Text style={styles.retakeBtnText}>Capture New Image</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: COLORS.bgGradientTop },
  loadingScreen: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 20, fontWeight: "bold", color: "#fff", marginTop: 20 },
  loadingSubtext: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 5 },
  introCardContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 15 },
  introCard: { backgroundColor: COLORS.white, borderRadius: 25, width: "100%", padding: 20, maxHeight: "85%", elevation: 8 },
  introCardHeader: { alignItems: "center", marginBottom: 15 },
  introCardHeaderIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  introCardTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.darkGreen },
  introCardSubtitle: { fontSize: 12, color: COLORS.mediumGreen },
  introCardScroll: { marginBottom: 15 },
  infoBox: { flexDirection: "row", backgroundColor: COLORS.lightGreenFill, padding: 12, borderRadius: 15, marginBottom: 15 },
  infoBoxText: { flex: 1, marginLeft: 10, fontSize: 12, color: COLORS.darkGreen },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.darkGreen, marginBottom: 12 },
  diseaseGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  diseaseItem: { width: "48%", flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, padding: 8, borderRadius: 10, marginBottom: 8 },
  diseaseIconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.lightGreenFill, justifyContent: "center", alignItems: "center", marginRight: 6 },
  diseaseItemTitle: { fontSize: 12, fontWeight: "600", color: COLORS.darkGreen },
  tipsBox: { flexDirection: "row", backgroundColor: "#FFF9E6", padding: 12, borderRadius: 15, marginBottom: 10 },
  tipsText: { flex: 1, marginLeft: 10, fontSize: 11, color: "#6D4C00" },
  dismissIntroBtn: { borderRadius: 15, overflow: "hidden" },
  dismissIntroGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 15 },
  dismissIntroText: { fontSize: 16, fontWeight: "bold", color: "#fff", marginLeft: 8 },
  cameraFull: { flex: 1 },
  fullImage: { width: "100%", height: "100%" },
  fixedHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  headerGradient: { paddingBottom: 15 },
  headerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15, paddingTop: Platform.OS === "android" ? 35 : 10 },
  headerButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.white },
  bottomControls: { position: "absolute", bottom: 80, left: 0, right: 0, flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingHorizontal: 40 },
  circleBtn: { width: 55, height: 55, borderRadius: 28, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center", elevation: 5 },
  captureWrapper: { width: 75, height: 75, borderRadius: 38, justifyContent: "center", alignItems: "center" },
  captureOuter: { width: 75, height: 75, borderRadius: 38, borderWidth: 4, borderColor: COLORS.white, justifyContent: "center", alignItems: "center" },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.accent },
  analyzeCardContainer: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center", paddingHorizontal: 20, paddingBottom: 40 },
  analyzeCard: { backgroundColor: COLORS.white, borderRadius: 25, padding: 20, width: "100%", alignItems: "center" },
  cardImage: { width: 100, height: 100, borderRadius: 20, marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.darkGreen, marginBottom: 10 },
  analyzeCardBtn: { backgroundColor: COLORS.accent, borderRadius: 25, paddingVertical: 12, paddingHorizontal: 30, marginTop: 10 },
  gradientCardBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  analyzeCardText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  retakeBtnText: { fontSize: 14, color: COLORS.accent, marginTop: 10 },
  overlayContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: FRAME_WIDTH, height: FRAME_HEIGHT, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 16, backgroundColor: 'transparent', overflow: 'hidden', marginBottom: 10 },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#FFF' },
  cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
  crosshair: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  crosshairHorizontal: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  crosshairVertical: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.25)', position: 'absolute' },
  frameTextContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, gap: 6 },
  frameText: { color: '#FFF', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
})