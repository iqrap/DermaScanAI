import React, { useRef, useEffect, useState } from "react";
import {
    ScrollView,
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
    Linking
} from "react-native";
import { Text, Divider } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
// Import React for ComponentProps
import type { ComponentProps } from 'react'; 

// 1. Define the type by inferring it from the Ionicons component's props
type IoniconsNameType = ComponentProps<typeof Ionicons>['name'];

// 2. Define the Interface using the inferred type
interface SectionItem {
    icon: IoniconsNameType; // Use the inferred type here
    title: string;
    text: string;
    email?: string; 
}

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TermsAndPrivacy() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    // Type the state as number or null
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
        }).start();
    }, []);

    // 3. Apply the Interface to the sections array
    const sections: SectionItem[] = [
        {
            icon: "document-text-outline",
            title: "1. Introduction & Acceptance",
            text: "Welcome to DermascanAI. By downloading, accessing, or using this application, you enter into a binding legal agreement with us. DermascanAI utilizes advanced Artificial Intelligence and Machine Learning algorithms to analyze skin conditions, evaluate product ingredients, and monitor environmental triggers. It is crucial to understand that this application is strictly a wellness tool designed for informational purposes only. It does NOT provide medical diagnoses, treatment plans, or professional medical advice. The AI analysis is probabilistic and based on visual patterns; it is not a substitute for a clinical examination by a certified dermatologist. By continuing to use the app, you acknowledge that you are responsible for your own health decisions and agree to consult a professional for any concerning skin symptoms."
        },
        {
            icon: "information-circle-outline",
            title: "2. Comprehensive Data Collection",
            // Removed bullet points/hyphens from text
            text: "To function effectively, DermascanAI collects specific categories of data. (A) Personal Identity: We collect your name, email address, and age to manage your account and ensure age-appropriate usage. (B) Health & Skin Profile: We process images of your skin conditions and data regarding your skin type (e.g., Oily, Dry, Sensitive), allergies, and current skincare routine. This data is essential for the AI to identify potential diseases and flag harmful ingredients. (C) Technical & Environmental Data: We collect device information (ID, model), IP address, and precise geolocation. Geolocation is strictly used to fetch real-time local weather data (UV Index, Humidity, Pollution levels) to provide timely skin protection notifications. We do not track your location history."
        },
        {
            icon: "analytics-outline",
            title: "3. Usage of Data & AI Training",
            // Removed bullet points/hyphens from text
            text: "Your data is utilized to deliver a highly personalized experience. Primary usage includes processing your skin images through our neural networks to detect patterns resembling skin diseases (e.g., Eczema, Acne, Melanoma). We also use your ingredient preferences to filter cosmetic products that may cause adverse reactions. Beyond individual service, we use aggregated, anonymized data to train and refine our AI models. This means your data, stripped of all personal identifiers, helps the system become smarter and more accurate for the global community. We also analyze usage trends to improve app stability, fix bugs, and optimize user interface performance. We strictly do not sell your personal data to third-party advertisers."
        },
        {
            icon: "shield-checkmark-outline",
            title: "4. Data Security & Retention",
            text: "We implement industry-standard security protocols to safeguard your sensitive health data. All data in transit is encrypted using SSL/TLS technology, and data at rest is secured within Firebase's encrypted cloud storage infrastructure. Access to personal identifiers and medical images is restricted to authorized automated systems and key personnel required for maintenance. We perform regular security audits to identify and patch vulnerabilities. Your data is retained only as long as necessary to provide our services or as required by law. Users have the right to request the deletion of their account and all associated data at any time through the app settings or support contact."
        },
        {
            icon: "person-outline",
            title: "5. User Obligations & Conduct",
            text: "As a user, you agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree not to misuse the scanning feature by uploading inappropriate, non-skin-related, or offensive images. You must not attempt to reverse-engineer the AI code, disrupt the servers, or use the app for any illegal activities. Furthermore, you acknowledge that relying solely on the AI for critical health decisions is a violation of these terms. Always verify AI findings with a medical professional before starting any treatment."
        },
        {
            icon: "refresh-circle-outline",
            title: "6. Modifications to Terms",
            text: "DermascanAI reserves the right to modify, amend, or update these Terms of Service and Privacy Policy at any time to reflect changes in our technology, legal requirements, or business practices. Significant changes will be communicated to you via a prominent in-app notification or email. The 'Last Updated' date at the bottom of this page indicates the latest revision. Your continued use of the application following the posting of changes constitutes your acceptance of such changes. We encourage you to review this policy periodically to stay informed about how we are protecting your information."
        },
        {
            icon: "mail-outline",
            title: "7. Contact & Support",
            text: "We value your feedback and are committed to resolving your concerns. If you have questions regarding these Terms, Privacy practices, or need assistance with an AI analysis result, please contact our dedicated support team. For data deletion requests or privacy inquiries, please use the subject line 'Privacy Request'.",
            email: "dermascanai1166@gmail.com"
        }
    ];

    const toggleExpand = (index: number) => { // Type the index parameter
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleEmailPress = (email: string) => { // Type the email parameter
        Linking.openURL(`mailto:${email}`);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={["#75a78fff", "#558d74ff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" /> 
                    </TouchableOpacity>
                    <View style={{ alignItems: "center", flex: 1 }}>
                        {/* Adjusted header text color for better contrast */}
                        <Text style={[styles.headerTitle, { color: "#F9FFFB" }]}>Terms & Privacy Policy</Text> 
                        <Text style={[styles.headerSubtitle, { color: "#DFF3EB" }]}>Comprehensive User Agreement</Text>
                    </View>
                </View>
            </LinearGradient>

            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={{ paddingBottom: 60 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Stylish intro card */}
                    <View style={styles.introCard}>
                        <View style={styles.introBadgeRow}>
                            <Ionicons name="alert-circle-outline" size={18} color="#92400E" />
                            <Text style={styles.introBadgeText}>Please read these terms carefully</Text>
                        </View>
                        <Text style={styles.introTitle}>Important information about your data & privacy</Text>
                        <Text style={styles.introText}>
                            Please read these Terms of Service and Privacy Policy carefully. By using DermascanAI, you agree
                            to the detailed practices described below regarding your data, security, and the usage of
                            Artificial Intelligence in healthcare.
                        </Text>
                    </View>

                    {/* All map parameters are correctly typed */}
                    {sections.map((section: SectionItem, index: number) => ( 
                        <View style={styles.sectionCard} key={index}>
                            <TouchableOpacity
                                style={styles.sectionHeader}
                                onPress={() => toggleExpand(index)}
                            >
                                <Ionicons
                                    name={section.icon}
                                    size={18}
                                    color="#1d6657ff" // Icon color updated
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                <Ionicons
                                    name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                                    size={18}
                                    color="#1d6657ff"
                                    style={{ marginLeft: "auto" }}
                                />
                            </TouchableOpacity>
                            {expandedIndex === index && (
                                <View style={styles.expandedContent}>
                                    {/* Text without hyphens/stars */}
                                    <Text style={styles.paragraph}>{section.text}</Text> 
                                </View>
                            )}
                            {expandedIndex === index && section.email && (
                                <TouchableOpacity onPress={() => handleEmailPress(section.email!)}>
                                    <Text style={styles.emailText}>
                                        {section.email}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}

                    <Divider style={styles.divider} />

                    <Text style={styles.footerNote}>
                        Last updated: October 2025{"\n"}© 2025 DermascanAI. All rights reserved.
                    </Text>
                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#F9FFFB" },
    header: {
        height: 100, // Increased height for more space at the top
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        justifyContent: "flex-end",
        paddingBottom: 15,
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    // Added paddingTop for better spacing from the screen edge
    headerContent: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 10 }, 
    backButton: { padding: 6, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)" }, 
    headerTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.5 },
    headerSubtitle: { fontSize: 11, opacity: 0.9, marginTop: 2 },
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    // Intro card in mint/teal theme
    introCard: {
        backgroundColor: "#E6F4EF",
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#A5D6C4",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    introBadgeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    introBadgeText: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: "600",
        color: "#0F4F3E",
        textTransform: "uppercase",
        letterSpacing: 0.7,
    },
    introTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#145A46",
        marginBottom: 4,
    },
    introText: { 
        fontSize: 13, 
        color: "#374151", 
        lineHeight: 20,
        textAlign: "left", 
    },
    // Section Card styling (white card, stylish look)
    sectionCard: { 
        backgroundColor: "rgba(255, 255, 255, 1)", 
        borderRadius: 14, 
        padding: 14, 
        marginBottom: 15, 
        elevation: 5, // Increased elevation
        shadowColor: "#000", 
        shadowOpacity: 0.12, 
        shadowRadius: 6, 
        shadowOffset: { width: 0, height: 3 } 
    },
    sectionHeader: { 
        flexDirection: "row", 
        alignItems: "center", 
        paddingBottom: 10, 
        marginBottom: 4, 
        borderBottomWidth: 1, // Added border for separation
        borderBottomColor: 'rgba(29, 102, 87, 0.1)' 
    },
    sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1d6657ff" },
    expandedContent: { 
        paddingTop: 8, 
        paddingHorizontal: 0 
    },
    paragraph: { 
        fontSize: 14, 
        color: "#374151", 
        lineHeight: 20, // Adjusted line height
        textAlign: "left", 
        marginTop: 0 
    },
    emailText: {
        fontSize: 14,
        fontWeight: "700", 
        color: "#1d6657ff", // Bold green color for link
        marginTop: 6
    },
    bold: { fontWeight: "700", color: "#000000" },
    divider: { backgroundColor: "#DFF3EB", marginVertical: 18, height: 1 },
    footerNote: { textAlign: "center", color: "#6B7280", fontSize: 12, marginTop: 10, marginBottom: 20 },
});
