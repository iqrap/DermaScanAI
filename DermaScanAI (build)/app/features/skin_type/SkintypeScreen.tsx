"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
  Platform,
  ScrollView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { ComponentProps } from "react" // Keep this import

const { width, height } = Dimensions.get("window")

// 1. Infer the correct type for MaterialCommunityIcons names
type MaterialCommunityIconNameType = ComponentProps<typeof MaterialCommunityIcons>["name"]

const COLORS = {
  bgGradientTop: "#f3faf6ff",
  bgGradientBottom: "#c1dbc6ff",
  darkGreen: "#2D4A3E",
  mediumGreen: "#4A6B5D",
  lightGreenBorder: "#8EB29C",
  lightGreenFill: "rgba(230, 244, 235, 0.6)",
  white: "#FFFFFF",
  modalOverlay: "rgba(29, 48, 40, 0.7)",
  buttonGradientStart: "#558d74ff",
  buttonGradientEnd: "#3b6450ff",
  cardBorder: "#D1E3DA",
  cardBg: "#FFFFFF",
  cardShadow: "rgba(0, 0, 0, 0.08)",
  modalCardBg: "#FFFFFF",
  modalCardShadow: "rgba(0, 0, 0, 0.25)",
  accent: "#558d74",
  black: "#000000",
}

// Skin Types Data
type SkinTypeDetails = {
  title: string
  description: string
  // 2. Use the inferred type here (MaterialCommunityIconNameType)
  icon: MaterialCommunityIconNameType
  image: any
}

const SKIN_TYPE_DATA: Record<string, SkinTypeDetails> = {
  Oily: {
    title: "Oily Skin",
    description:
      "This skin type is characterized by excess sebum production, resulting in a constantly shiny or greasy appearance, especially in the T-zone. Pores are often enlarged and visible, and you may be prone to acne, blackheads, and blemishes due to oil buildup.",
    icon: "water-outline",
    image: require("../../../assets/images/skintype.jpg"),
  },
  Dry: {
    title: "Dry Skin",
    description:
      "Dry skin lacks natural oils (sebum), leading to a tight, rough, or flaky texture. It can appear dull and may be susceptible to redness, irritation, and fine lines. The skin barrier is often compromised, needing deep replenishment.",
    icon: "texture-box",
    image: require("../../../assets/images/skintype.jpg"),
  },
  Sensitive: {
    title: "Sensitive Skin",
    description:
      "Sensitive skin often reacts negatively to environmental factors, ingredients, and stress. It is easily irritated, leading to redness, stinging, itching, or inflammation. It requires gentle, soothing, and hypoallergenic products.",
    icon: "emoticon-frown-outline",
    image: require("../../../assets/images/skintype.jpg"),
  },
  Normal: {
    title: "Normal Skin",
    description:
      "Normal skin is well-balanced, neither too oily nor too dry. It features small, barely visible pores, a smooth texture, and good circulation. It rarely experiences severe reactions, making it the least problematic type.",
    // FIX APPLIED: Replaced 'sparkles' (Ionicons) with a valid MaterialCommunityIcons name
    icon: "check-circle-outline",
    image: require("../../../assets/images/skintype.jpg"),
  },
}

// Bottom modal animation hook
const useSlideAnimation = (visible: boolean) => {
  const slideAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  })

  return { translateY }
}

export default function SkintypeScreen() {
  const router = useRouter()
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedSkinData, setSelectedSkinData] = useState<SkinTypeDetails | null>(null)

  const { translateY } = useSlideAnimation(modalVisible)

  const handleSkinTypePress = (typeKey: keyof typeof SKIN_TYPE_DATA) => {
    setSelectedSkinData(SKIN_TYPE_DATA[typeKey])
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setSelectedSkinData(null)
  }

  const SkinTypeButton = ({
    label,
    iconName,
    onPress,
  }: {
    label: string
    // Icon type uses the inferred type
    iconName: MaterialCommunityIconNameType
    onPress: () => void
  }) => (
    <TouchableOpacity style={styles.gridButton} onPress={onPress} activeOpacity={0.7}>
      <MaterialCommunityIcons
        name={iconName}
        size={width * 0.08}
        color={COLORS.darkGreen}
        style={{ marginBottom: 8 }}
      />
      <Text style={styles.gridButtonText}>{label}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={[COLORS.bgGradientTop, COLORS.bgGradientBottom]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.pageTitleHeader}>SKIN PROFILE QUIZ</Text>
        </View>

        <ScrollView contentContainerStyle={styles.contentView} showsVerticalScrollIndicator={false}>
          {/* Subtitle - Reduced marginBottom here in styles */}
          <Text style={styles.pageSubtitle}>
            Unlock your personalized skincare routine by identifying your skin type.
          </Text>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={24}
              color={COLORS.accent}
              style={{ marginRight: 10 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoCardTitle}>Discover Your Needs</Text>
              <Text style={styles.infoCardText}>
                Answer a few quick questions to reveal your unique skin type. Tap the buttons below to learn about each
                type.
              </Text>
            </View>
          </View>

          <View style={styles.progressWrapper}>
            <View style={styles.progressBarBase}>
              <View style={styles.progressBarFill} />
            </View>
            <Text style={styles.progressText}>Question 1 of 15</Text>
          </View>

          <TouchableOpacity onPress={() => router.push("/features/skin_type/SkinQuizScreen")} activeOpacity={0.8}>
            <LinearGradient
              colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainStartButton}
            >
              <Text style={styles.mainStartButtonText}>Start Quiz Now</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.white} style={{ marginLeft: 5 }} />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.gridTitle}>OR Learn More About Skin Types</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              <SkinTypeButton
                label="Oily"
                iconName={SKIN_TYPE_DATA.Oily.icon}
                onPress={() => handleSkinTypePress("Oily")}
              />
              <SkinTypeButton
                label="Dry"
                iconName={SKIN_TYPE_DATA.Dry.icon}
                onPress={() => handleSkinTypePress("Dry")}
              />
            </View>
            <View style={styles.gridRow}>
              {/* Changed 'Combination' to 'Sensitive' and updated its icon/functionality */}
              <SkinTypeButton
                label="Sensitive"
                iconName={SKIN_TYPE_DATA.Sensitive.icon}
                onPress={() => handleSkinTypePress("Sensitive")}
              />
              <SkinTypeButton
                label="Normal"
                iconName={SKIN_TYPE_DATA.Normal.icon}
                onPress={() => handleSkinTypePress("Normal")}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modal */}
      <Modal animationType="none" transparent visible={modalVisible} onRequestClose={closeModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
          <Animated.View style={[styles.modalContent, { transform: [{ translateY }] }]}>
            {selectedSkinData && (
              <>
                <View style={styles.modalHandle} />
                <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.modalImageWrapper}>
                    <Image source={selectedSkinData.image} style={styles.modalImage} resizeMode="cover" />
                  </View>
                  <View style={styles.modalTextContainer}>
                    <Text style={styles.modalTitle}>{selectedSkinData.title}</Text>
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Characteristics:</Text>
                      <Text style={styles.modalDesc}>{selectedSkinData.description}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
                    <MaterialCommunityIcons name="close" size={24} color={COLORS.darkGreen} />
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  header: {
    paddingHorizontal: width * 0.06,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 25 : 25, // extra top spacing
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: width * 0.06,
    top: Platform.OS === "android" ? StatusBar.currentHeight! + 25 : 25,
    zIndex: 10,
    padding: 5,
    marginTop: -15,
  },
  pageTitleHeader: {
    fontSize: width * 0.06,
    fontWeight: "800",
    color: COLORS.darkGreen,
    textAlign: "center",
    letterSpacing: 0.5,
    flex: 1,
    marginLeft: 60,
    marginRight: 40,
    marginTop: -15,
  },
  contentView: {
    paddingHorizontal: width * 0.06,
    paddingBottom: 40,
    paddingTop: 20, // extra top padding for spacing
  },
  pageSubtitle: {
    fontSize: width * 0.04,
    color: COLORS.mediumGreen,
    textAlign: "center",
    marginTop: -10,
    marginBottom: 10, // REDUCED SPACE HERE (from 30)
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: width * 0.05,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 5,
    borderLeftColor: COLORS.accent,
    elevation: 5,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  infoCardTitle: { fontSize: width * 0.045, fontWeight: "bold", color: COLORS.darkGreen, marginBottom: 10 },
  infoCardText: { fontSize: width * 0.035, color: COLORS.mediumGreen, lineHeight: 20 },
  progressWrapper: { marginBottom: 20, alignItems: "center" },
  progressBarBase: {
    height: 6,
    width: "100%",
    backgroundColor: "rgba(45, 74, 62, 0.1)",
    borderRadius: 3,
    marginBottom: 10,
  },
  progressBarFill: { height: "100%", width: "10%", backgroundColor: COLORS.darkGreen, borderRadius: 3 },
  progressText: { fontSize: width * 0.035, color: COLORS.darkGreen, fontWeight: "600" },
  mainStartButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "center",
  },
  mainStartButtonText: { color: COLORS.white, fontSize: width * 0.045, fontWeight: "bold" },
  gridTitle: {
    fontSize: width * 0.03,
    color: COLORS.mediumGreen,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  gridContainer: { gap: 16 },
  gridRow: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  gridButton: {
    flex: 1,
    backgroundColor: COLORS.lightGreenFill,
    borderWidth: 1,
    borderColor: COLORS.lightGreenBorder,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    height: width * 0.25,
  },
  gridButtonText: { color: COLORS.darkGreen, fontSize: width * 0.04, fontWeight: "600", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: COLORS.modalOverlay, justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: COLORS.modalCardBg,
    width: "100%",
    maxHeight: height * 0.8,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 30,
    shadowColor: COLORS.modalCardShadow,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#CCC",
    borderRadius: 5,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  modalScrollContent: { paddingBottom: 40 },
  modalCloseButton: {
    position: "absolute",
    top: 25,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 15,
    padding: 5,
  },
  modalImageWrapper: { width: "100%", height: width * 0.5, overflow: "hidden", marginBottom: 20 },
  modalImage: { width: "100%", height: "100%" },
  modalTextContainer: { paddingHorizontal: width * 0.06 },
  modalTitle: {
    fontSize: width * 0.065,
    fontWeight: "bold",
    color: COLORS.darkGreen,
    textAlign: "center",
    marginBottom: 20,
  },
  modalSection: { marginBottom: 20, padding: 15, borderRadius: 10, backgroundColor: COLORS.lightGreenFill },
  modalSectionTitle: {
    fontSize: width * 0.045,
    fontWeight: "700",
    color: COLORS.darkGreen,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(45, 74, 62, 0.1)",
    paddingBottom: 5,
  },
  modalDesc: { fontSize: width * 0.04, color: COLORS.mediumGreen, lineHeight: 24 },
})
