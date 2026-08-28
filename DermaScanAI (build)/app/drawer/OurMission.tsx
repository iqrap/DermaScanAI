import React, { useState } from "react";
import { View, Text, ScrollView, ImageBackground, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

// Dashboard ki color scheme
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
    accent: "#558d74",
    textPrimary: "#012203ff",
    textBody: "#262626",
    featureIcon: "#4e7565ff",
    shadow: "#000",
    sectionTitle: "#7A6A5A",
};

export default function MissionScreen() {
    const router = useRouter();
    const [reviews] = useState([]);

    const styles = StyleSheet.create({
        container: { 
            flex: 1, 
            backgroundColor: COLORS.bgGradientTop 
        },
        gradient: {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        },
        headerGradient: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 120,
            borderBottomLeftRadius: 25,
            borderBottomRightRadius: 25,
        },
        headerBar: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: Platform.OS === "android" ? 20 : 10,
            paddingBottom: 20,
            zIndex: 10,
        },
        backBtn: {
            padding: 8,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.2)",
            marginRight: 10,
        },
        headerTextWrapper: { flex: 1 },
        headerTitle: {
            fontSize: 18,
            fontWeight: "700",
            color: COLORS.white,
        },
        headerSubtitle: {
            fontSize: 11,
            color: "rgba(255,255,255,0.8)",
            marginTop: 2,
            fontWeight: "600",
        },
        shadowStyle: {
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 5,
        },
        headerImage: {
            width: "100%", 
            height: 180, 
            justifyContent: "flex-end",
            marginTop: 0,
        },
        imageStyle: { 
            borderBottomLeftRadius: 20, 
            borderBottomRightRadius: 20 
        },
        highlightCardContainer: { 
            paddingHorizontal: 20, 
            marginTop: -40, 
            marginBottom: 15, 
            zIndex: 10 
        },
        highlightCard: { 
            backgroundColor: COLORS.white, 
            borderRadius: 18, 
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.cardBorder,
        },
        missionTitleRow: { 
            flexDirection: "row", 
            alignItems: "center", 
            marginBottom: 12 
        },
        missionTitle: { 
            fontSize: 22, 
            fontWeight: "bold", 
            color: COLORS.darkGreen,
            marginLeft: 10,
        },
        missionText: { 
            fontSize: 16, 
            lineHeight: 24, 
            color: COLORS.mediumGreen,
        },
        detailedCard: { 
            paddingHorizontal: 18, 
            marginBottom: 25, 
            backgroundColor: COLORS.white, 
            borderRadius: 16, 
            padding: 18, 
            marginHorizontal: 12,
            borderWidth: 1,
            borderColor: COLORS.cardBorder,
        },
        baseTextStyle: { 
            fontSize: 14.5, 
            lineHeight: 23,
            color: COLORS.textBody, 
            marginBottom: 16 
        },
        boldStyle: {
            fontWeight: "bold", 
            color: COLORS.darkGreen,
        },
        featureIconsContainer: { 
            flexDirection: "row", 
            flexWrap: "wrap", 
            justifyContent: "space-between", 
            marginTop: 18, 
            paddingVertical: 8 
        },
        featureIconBox: { 
            width: "48%", 
            alignItems: "center", 
            marginBottom: 15, 
            backgroundColor: COLORS.lightGreenFill,
            padding: 12, 
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.lightGreenBorder,
        },
        featureIconText: { 
            fontSize: 12, 
            color: COLORS.darkGreen, 
            marginTop: 6, 
            fontWeight: "600" 
        },
        endingNote: { 
            fontSize: 12, 
            color: COLORS.mediumGreen, 
            paddingHorizontal: 20, 
            marginTop: 10, 
            marginBottom: 30, 
            textAlign: "center", 
            lineHeight: 22,
            fontWeight: "500",
        },
    });

    return (
        <View style={styles.container}>
            {/* Dashboard-style gradient background */}
            <LinearGradient
                colors={[COLORS.bgGradientTop, COLORS.bgGradientBottom]}
                style={styles.gradient}
            />
            
            {/* Dashboard-style header gradient */}
            <LinearGradient
                colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]}
                style={styles.headerGradient}
            />

            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <FontAwesome5 name="arrow-left" size={16} color={COLORS.white} />
                    </TouchableOpacity>
                    <View style={styles.headerTextWrapper}>
                        <Text style={styles.headerTitle}>Our Mission</Text>
                        <Text style={styles.headerSubtitle}>Why we built Dermascan AI</Text>
                    </View>
                </View>

                <ScrollView 
                    contentContainerStyle={{ paddingBottom: 40, paddingTop: 0 }}
                    showsVerticalScrollIndicator={false}
                >

                    {/* Header Image */}
                    <ImageBackground
                        source={require('../../assets/images/Mission.jpg')}
                        style={styles.headerImage}
                        imageStyle={styles.imageStyle}
                    />
                    {/* Highlighted Mission Card */}
                    <View style={styles.highlightCardContainer}>
                        <View style={[styles.highlightCard, styles.shadowStyle]}>
                            <View style={styles.missionTitleRow}>
                                <Text style={styles.missionTitle}>Our Core Mission</Text>
                            </View>
                            <Text style={styles.missionText}>
                                To empower everyone to understand, care for, and protect their skin using intelligent, accessible, and <Text style={styles.boldStyle}>medically informed AI solutions</Text>.
                            </Text>
                        </View>
                    </View>

                    {/* Detailed Mission Card */}
                    <View style={[styles.detailedCard, styles.shadowStyle]}>
                        
                        {/* Para 1 */}
                        <Text style={styles.baseTextStyle}>
                            At <Text style={styles.boldStyle}>Dermascan AI</Text>, our primary goal is to democratize advanced skincare. We aim to bridge the gap created by the high costs and limited access to dermatologists by leveraging sophisticated <Text style={styles.boldStyle}>deep learning models</Text> trained on extensive, validated datasets. Our platform translates complex dermatology knowledge into clear, actionable guidance for users globally.
                        </Text>

                        {/* Para 2 */}
                        <Text style={styles.baseTextStyle}>
                            Dermascan AI is built on principles of <Text style={styles.boldStyle}>maximum reliability and ethical safety</Text>. We prioritize data accuracy by continuously refining our models to minimize false positives and negatives, ensuring responsible technology use. All sensitive data is handled with <Text style={styles.boldStyle}>end-to-end encryption</Text>, and we strictly adhere to data minimization principles to protect user privacy.
                        </Text>

                        {/* Para 3 */}
                        <Text style={styles.baseTextStyle}>
                            Our <Text style={styles.boldStyle}>AI-powered skin disease detection feature</Text> offers instant, preliminary analysis for conditions including acne, eczema, psoriasis, and early signs of pigmentation changes. The system allows users to securely track the progression of identified skin concerns over time, providing a visual history that can be <Text style={styles.boldStyle}>shared with a certified medical professional</Text>.
                        </Text>

                        {/* Para 4 */}
                        <Text style={styles.baseTextStyle}>
                            Through comprehensive <Text style={styles.boldStyle}>Skin Type and Metric Analysis</Text>, we assess factors like pore size, hydration levels, oil production (sebum), and barrier function health. This detailed insight fuels our personalized product matching system, ensuring we recommend specific routines and ingredients that directly address your skin's <Text style={styles.boldStyle}>unique biological requirements</Text>.
                        </Text>

                        {/* Para 5 */}
                        <Text style={styles.baseTextStyle}>
                            The <Text style={styles.boldStyle}>Product Ingredient Scanner</Text> empowers consumer choice. It cross-references ingredients against major regulatory databases and, crucially, against your personal allergy profile. The system highlights potentially irritating or harmful compounds while identifying beneficial active components, providing <Text style={styles.boldStyle}>specific warnings tailored to you</Text>.
                        </Text>

                        {/* Para 6 */}
                        <Text style={styles.baseTextStyle}>
                            Our <Text style={styles.boldStyle}>Real-time Environmental Alerts</Text> are designed for proactive protection. We integrate local data on UV index, humidity, temperature, and pollution levels. This allows us to provide specific daily guidance, such as adjusting your cleansing routine due to high air pollution or recommending a specific SPF factor for your environment, defending your skin against <Text style={styles.boldStyle}>daily external stressors</Text>.
                        </Text>

                        {/* Para 7 */}
                        <Text style={styles.baseTextStyle}>
                            Dermascan AI is committed to fostering an <Text style={styles.boldStyle}>informed user community</Text>. We provide continuously updated educational resources, including articles and video summaries, derived from peer-reviewed dermatology journals. Our goal is to transition users from guesswork to <Text style={styles.boldStyle}>lifelong confidence in skin care decisions</Text>.
                        </Text>

                        {/* Para 8 */}
                        <Text style={styles.baseTextStyle}>
                            We strongly emphasize <Text style={styles.boldStyle}>inclusivity and global accessibility</Text>. A primary focus of our model development is the rigorous testing and refinement of our algorithms across all Fitzpatrick skin types to eliminate algorithmic bias, ensuring accurate and equitable results for conditions that manifest differently on <Text style={styles.boldStyle}>all skin tones</Text>.
                        </Text>

                        {/* Para 9 */}
                        <Text style={styles.baseTextStyle}>
                            By merging cutting-edge AI, established dermatology principles, and dynamic environmental data, Dermascan AI serves as your dedicated, personal skin health partner. We aim to move beyond simple troubleshooting to facilitate <Text style={styles.boldStyle}>proactive, preventative, and holistic skin health management</Text> for every single user.
                        </Text>

                        {/* Feature Icons */}
                        <View style={styles.featureIconsContainer}>
                            <View style={[styles.featureIconBox, styles.shadowStyle]}>
                                <FontAwesome5 name="user-md" size={28} color={COLORS.accent} />
                                <Text style={styles.featureIconText}>Expert Detection</Text>
                            </View>

                            <View style={[styles.featureIconBox, styles.shadowStyle]}>
                                <FontAwesome5 name="robot" size={28} color={COLORS.accent} />
                                <Text style={styles.featureIconText}>AI Analysis</Text>
                            </View>

                            <View style={[styles.featureIconBox, styles.shadowStyle]}>
                                <FontAwesome5 name="search" size={28} color={COLORS.accent} />
                                <Text style={styles.featureIconText}>Ingredient Check</Text>
                            </View>

                            <View style={[styles.featureIconBox, styles.shadowStyle]}>
                                <FontAwesome5 name="cloud-sun" size={28} color={COLORS.accent} />
                                <Text style={styles.featureIconText}>Weather Alerts</Text>
                            </View>
                        </View>
                    </View>

                    {/* Ending Note */}
                    <Text style={styles.endingNote}>
                        Thank you for being part of <Text style={{ fontWeight: "bold", color: COLORS.accent }}>Dermascan AI</Text>! Together, we create a community of informed and confident skin care enthusiasts.
                    </Text>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}