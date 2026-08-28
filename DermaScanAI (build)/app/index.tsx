import React, { useEffect, useRef } from "react";
import {
  View,
  ImageBackground,
  Image,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../src/config/firebase";

export default function Welcome() {
  const router = useRouter();

  // --- Animations using plain React Native Animated (works in Expo Go) ---
  const logoScale   = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleY      = useRef(new Animated.Value(30)).current;
  const titleOp     = useRef(new Animated.Value(0)).current;
  const subY        = useRef(new Animated.Value(-20)).current;
  const subOp       = useRef(new Animated.Value(0)).current;
  const spinnerOp   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo zoom-in
    Animated.parallel([
      Animated.spring(logoScale,   { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();

    // Title fade-in-up after 300ms
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(titleY,  { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(titleOp, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    // Subtitle fade-in-down after 500ms
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(subY,  { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(subOp, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    // Spinner appears after 900ms
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(spinnerOp, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth Check:", user?.email, user?.emailVerified);
      // 1.5s splash so animations finish before navigating
      setTimeout(() => {
        if (user && user.emailVerified) {
          router.replace("/drawer/dashboard");
        } else {
          router.replace("/get-started");
        }
      }, 1500);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ImageBackground
      source={require("../assets/images/background.jpg")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Animated.Image
          source={require("../assets/images/logo.png")}
          style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
        />
        <Animated.Text style={[styles.title, { opacity: titleOp, transform: [{ translateY: titleY }] }]}>
          DermaScanAI
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, { opacity: subOp, transform: [{ translateY: subY }] }]}>
          Smart SkinCare
        </Animated.Text>
        <Animated.View style={{ opacity: spinnerOp, marginTop: 40 }}>
          <ActivityIndicator size="large" color="#4ECBA0" />
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay:   { alignItems: "center", justifyContent: "center" },
  logo: {
    width: 210,
    height: 210,
    resizeMode: "contain",
    marginBottom: -45,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#1f4221ff",
    letterSpacing: 1.2,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 17,
    fontStyle: "italic",
    color: "#273327ff",
    marginTop: -2,
  },
});
