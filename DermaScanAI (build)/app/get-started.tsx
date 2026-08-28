import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Easing,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../src/config/firebase";

const { width, height } = Dimensions.get("window");

const images = [
  require("../assets/images/bg1.jpg"),
  require("../assets/images/bg2.jpg"),
  require("../assets/images/bg3.jpg"),
  require("../assets/images/bg4.jpg"),
  require("../assets/images/bg5.jpg"),
  require("../assets/images/bg6.jpg"),
  require("../assets/images/bg7.jpg"),
  require("../assets/images/bg8.jpg"),
];

function AnimatedTitle({ text }: { text: string }) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.back(1)),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  return (
    <Animated.View style={{ transform: [{ translateY }], opacity }}>
      <Text style={styles.title}>{text}</Text>
    </Animated.View>
  );
}

function AnimatedMintButton({ onPress }: { onPress: () => void }) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#60a089ff", "#1e6447ff"],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.button, { backgroundColor }]}>
        <Text style={styles.buttonText}>Create an Account</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function GetStarted() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [currentImage, setCurrentImage] = useState(0);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        router.replace("/drawer/dashboard");
      }
      setChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setCurrentImage((prev) => (prev + 1) % images.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#60a089" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.Image
        source={images[currentImage]}
        style={[styles.background, { opacity: fadeAnim }]}
      />
      <View style={styles.overlay}>
        <View style={styles.centerContent}>
          <AnimatedTitle text="Smart SkinCare Assistant" />
          <Text style={styles.subtitle}>
            Are you ready to get to know your skin better?
          </Text>
        </View>
        <View style={styles.bottomButton}>
          <AnimatedMintButton onPress={() => router.push("/auth/signup")} />
          <TouchableOpacity onPress={() => router.push("/auth/login")} activeOpacity={0.7}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  background: { position: "absolute", width, height, resizeMode: "cover" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
  },
  centerContent: { alignItems: "center", justifyContent: "flex-end", flex: 1, marginBottom: 40 },
  title: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
    textShadowColor: "rgba(168, 230, 207, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 18,
    color: "#9fa8a6ff",
    textAlign: "center",
    fontWeight: "600",
  },
  bottomButton: { width: "70%", marginBottom: 80, alignItems: "center" },
  button: {
    width: width - 40,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#133f2dff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: { color: "#e0dcdcff", fontSize: 18, fontWeight: "bold", letterSpacing: 1 },
  loginText: { color: "#ebdcdcff", fontSize: 16, marginTop: 18 },
  loginLink: { color: "#2e309cff", fontWeight: "700" },
});