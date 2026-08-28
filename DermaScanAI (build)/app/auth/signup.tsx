"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native"
import { useRouter } from "expo-router"
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  type Auth,
  type User
} from "firebase/auth"
import { auth } from "../../src/config/firebase"
import { Ionicons } from "@expo/vector-icons"
import * as WebBrowser from "expo-web-browser"
import * as Google from "expo-auth-session/providers/google"
import { makeRedirectUri } from 'expo-auth-session'

import { authStyles } from "../../src/styles/authStyles"
import { colors } from "../../src/styles/theme"

WebBrowser.maybeCompleteAuthSession()

const PRIMARY_MINT = colors.primary.mint
const DARK_MINT = colors.primary.darkMint

// Validation functions
const validateName = (name: string): { isValid: boolean; message: string } => {
  if (!name.trim()) return { isValid: false, message: "Name is required" }
  if (name.trim().length < 2) return { isValid: false, message: "Name must be at least 2 characters" }
  if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) return { isValid: false, message: "Name can only contain letters" }
  return { isValid: true, message: "" }
}

const validateEmail = (email: string): { isValid: boolean; message: string } => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!email.trim()) return { isValid: false, message: "Email is required" }
  if (!emailRegex.test(email)) return { isValid: false, message: "Please enter a valid email address" }
  return { isValid: true, message: "" }
}

const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (!password) return { isValid: false, message: "Password is required" }
  if (password.length < 8) return { isValid: false, message: "Password must be at least 8 characters" }
  if (!/[A-Z]/.test(password)) return { isValid: false, message: "Password must contain one uppercase letter" }
  if (!/[a-z]/.test(password)) return { isValid: false, message: "Password must contain one lowercase letter" }
  if (!/[0-9]/.test(password)) return { isValid: false, message: "Password must contain one number" }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
    return { isValid: false, message: "Password must contain one special character" }
  }
  return { isValid: true, message: "" }
}

const validateConfirmPassword = (password: string, confirmPassword: string): { isValid: boolean; message: string } => {
  if (!confirmPassword) return { isValid: false, message: "Please confirm your password" }
  if (password !== confirmPassword) return { isValid: false, message: "Passwords do not match" }
  return { isValid: true, message: "" }
}

// Password strength indicator
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) score++;
    return Math.min(score, 7);
  };

  const strength = getStrength();
  const getStrengthColor = () => {
    if (strength <= 2) return colors.feedback.error;
    if (strength <= 4) return colors.feedback.warning;
    return colors.feedback.success;
  };
  const getStrengthText = () => {
    if (strength <= 2) return "Weak";
    if (strength <= 4) return "Medium";
    return "Strong";
  };

  if (!password) return null;

  return (
    <View style={{ marginTop: 5, marginBottom: 10 }}>
      <Text style={{ color: getStrengthColor(), fontSize: 12 }}>Password Strength: {getStrengthText()}</Text>
      <View style={{ height: 4, backgroundColor: colors.neutral.border, borderRadius: 2, marginTop: 4 }}>
        <View style={{ height: '100%', width: `${(strength / 7) * 100}%`, backgroundColor: getStrengthColor(), borderRadius: 2 }} />
      </View>
    </View>
  );
};

// Animated components
function AnimatedTitle({ text }: { text: string }) {
  const animatedValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start()
  }, [])

  const translateY = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [50, 0] })
  const opacity = animatedValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.6, 1] })

  return (
    <Animated.View style={{ transform: [{ translateY }], opacity }}>
      <Text style={authStyles.welcomeTitle}>{text}</Text>
    </Animated.View>
  )
}

function AnimatedGradientButton({ onPress, title, loading }: { onPress: () => void; title: string; loading?: boolean }) {
  const animatedValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(animatedValue, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    ).start()
  }, [])

  const bgColor = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [PRIMARY_MINT, DARK_MINT] })

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={loading}>
      <Animated.View style={[authStyles.animatedButton, { backgroundColor: bgColor }]}>
        {loading ? <ActivityIndicator color={colors.neutral.white} /> : <Text style={authStyles.buttonText}>{title}</Text>}
      </Animated.View>
    </TouchableOpacity>
  )
}

export default function SignupScreen() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // Validation states
  const [nameError, setNameError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  
  // Touched states
  const [nameTouched, setNameTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isNameFocused, setIsNameFocused] = useState(false)
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isConfirmFocused, setIsConfirmFocused] = useState(false)

  // Loading states
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [resendDisabled, setResendDisabled] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [isVerified, setIsVerified] = useState(false)

  const router = useRouter()

  // Google Auth Request with proper configuration for both platforms
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "307987207309-2vru7kcnfto2432an6m6mqcjt7uqodhr.apps.googleusercontent.com",
    iosClientId: "307987207309-1glblln7p7uu086oo7gms0f2aa93rh0p.apps.googleusercontent.com",
    webClientId: "307987207309-gutv06ekkv213jf3t9gv3k6tti71951l.apps.googleusercontent.com",
    redirectUri: makeRedirectUri({
      scheme: Platform.OS === 'ios' 
        ? 'com.googleusercontent.apps.307987207309-1glblln7p7uu086oo7gms0f2aa93rh0p'
        : 'com.googleusercontent.apps.307987207309-2vru7kcnfto2432an6m6mqcjt7uqodhr',
    }),
  })
  
  // Validation effects
  useEffect(() => {
    if (nameTouched) { const result = validateName(name); setNameError(result.isValid ? "" : result.message); }
  }, [name, nameTouched]);

  useEffect(() => {
    if (emailTouched) { const result = validateEmail(email); setEmailError(result.isValid ? "" : result.message); }
  }, [email, emailTouched]);

  useEffect(() => {
    if (passwordTouched) { const result = validatePassword(password); setPasswordError(result.isValid ? "" : result.message); }
  }, [password, passwordTouched]);

  useEffect(() => {
    if (confirmPasswordTouched) { const result = validateConfirmPassword(password, confirmPassword); setConfirmPasswordError(result.isValid ? "" : result.message); }
  }, [password, confirmPassword, confirmPasswordTouched]);
  
  // Google Sign-In response handler - FIXED
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => { 
          router.replace("/drawer/dashboard"); 
        })
        .catch((error: any) => {
          console.error("Google Error:", error);
          setGoogleLoading(false);
          if (error.code === 'auth/account-exists-with-different-credential') {
            Alert.alert("Account Exists", "An account already exists with this email. Please login instead.");
          } else if (error.code === 'auth/email-already-in-use') {
            Alert.alert("Email Already Exists", "This email is already registered. Please login instead.");
          } else {
            Alert.alert("Google Sign Up Error", error.message || "Failed to sign up with Google");
          }
        });
    } else if (response?.type === "error") {
      setGoogleLoading(false);
      console.error("Google auth error:", response.error);
      Alert.alert("Google Sign Up Failed", response.error?.message || "Please try again.");
    } else if (response?.type === "cancel") {
      setGoogleLoading(false);
    }
  }, [response]);

  // Countdown timer
  useEffect(() => {
    let timer: any;
    if (resendDisabled && countdown > 0) {
      timer = setTimeout(() => { setCountdown(prev => prev - 1); }, 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
      setCountdown(60);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [resendDisabled, countdown]);

  // Verification check interval
  useEffect(() => {
    let interval: any;
    if (showVerificationModal && currentUser && !isVerified) {
      interval = setInterval(async () => {
        try {
          await currentUser.reload();
          if (currentUser.emailVerified) {
            clearInterval(interval);
            setIsVerified(true);
            await signOut(auth);
            setShowVerificationModal(false);
            Alert.alert("✅ Email Verified!", "Your email has been verified. Please login to continue.", [
              { text: "Go to Login", onPress: () => router.push("/auth/login") }
            ]);
          }
        } catch (error) { console.log("Error checking verification:", error); }
      }, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [showVerificationModal, currentUser, isVerified]);

  const handleGoogleSignUp = async () => {
    if (!request) {
      Alert.alert("Error", "Google Sign-In not configured properly");
      return;
    }
    
    setGoogleLoading(true);
    try { 
      await promptAsync(); 
    } 
    catch (error) { 
      setGoogleLoading(false); 
      console.error("Google Sign-Up error:", error);
      Alert.alert("Error", "Failed to initiate Google Sign-Up"); 
    }
  };

  const handleSignup = async () => {
    const nameValidation = validateName(name);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const confirmValidation = validateConfirmPassword(password, confirmPassword);
    
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    
    if (!nameValidation.isValid || !emailValidation.isValid || !passwordValidation.isValid || !confirmValidation.isValid) {
      Alert.alert("Validation Error", nameValidation.message || emailValidation.message || passwordValidation.message || confirmValidation.message);
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth as Auth, email, password);
      const user = userCredential.user;
      await sendEmailVerification(user);
      setCurrentUser(user);
      setShowVerificationModal(true);
      setIsVerified(false);
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert("Email Already Exists", "This email is already registered. Please login instead.");
      } else if (error.code === 'auth/weak-password') {
        Alert.alert("Weak Password", "Password should be at least 6 characters.");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("Invalid Email", "Please enter a valid email address.");
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert("Network Error", "Please check your internet connection.");
      } else {
        Alert.alert("Signup Error", error.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleResendVerification = async () => {
    if (currentUser && !resendDisabled) {
      try {
        await sendEmailVerification(currentUser);
        setResendDisabled(true);
        Alert.alert("✅ Sent!", "Verification email has been resent.");
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to resend verification email.");
      }
    }
  }

  const handleContinueToLogin = () => {
    setShowVerificationModal(false);
    router.push("/auth/login");
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.gradient.pageTop }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={authStyles.scrollViewContent} keyboardShouldPersistTaps="handled">
        <Text style={authStyles.appTitle}>SMART SKINCARE</Text>
        <Text style={authStyles.appSubtitle}>Create your dermatology profile</Text>

        <View style={authStyles.formCard}>
          <AnimatedTitle text="Create Account" />
          <Text style={authStyles.formSubtitle}>We use your details only to personalize medical‑grade advice.</Text>

          {/* Name Input */}
          <View>
            <View style={[authStyles.inputWrapper, { borderColor: nameError ? colors.feedback.error : (isNameFocused ? PRIMARY_MINT : colors.neutral.border) }]}>
              <Ionicons name="person-outline" size={20} color={nameError ? colors.feedback.error : (isNameFocused ? PRIMARY_MINT : colors.neutral.placeholder)} style={authStyles.inputIcon} />
              <TextInput placeholder="Full Name" placeholderTextColor={colors.neutral.placeholder} style={authStyles.iconTextInput} value={name} onChangeText={setName}
                onFocus={() => { setIsNameFocused(true); setNameTouched(true); }} onBlur={() => { setIsNameFocused(false); }} />
            </View>
            {nameError ? <Text style={authStyles.errorText}>{nameError}</Text> : null}
          </View>

          {/* Email Input */}
          <View>
            <View style={[authStyles.inputWrapper, { borderColor: emailError ? colors.feedback.error : (isEmailFocused ? PRIMARY_MINT : colors.neutral.border) }]}>
              <Ionicons name="mail-outline" size={20} color={emailError ? colors.feedback.error : (isEmailFocused ? PRIMARY_MINT : colors.neutral.placeholder)} style={authStyles.inputIcon} />
              <TextInput placeholder="Email Address" placeholderTextColor={colors.neutral.placeholder} keyboardType="email-address" autoCapitalize="none" style={authStyles.iconTextInput} value={email} onChangeText={setEmail}
                onFocus={() => { setIsEmailFocused(true); setEmailTouched(true); }} onBlur={() => { setIsEmailFocused(false); }} />
            </View>
            {emailError ? <Text style={authStyles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Password Input */}
          <View>
            <View style={[authStyles.inputWrapper, { borderColor: passwordError ? colors.feedback.error : (isPasswordFocused ? PRIMARY_MINT : colors.neutral.border) }]}>
              <Ionicons name="lock-closed-outline" size={20} color={passwordError ? colors.feedback.error : (isPasswordFocused ? PRIMARY_MINT : colors.neutral.placeholder)} style={authStyles.inputIcon} />
              <TextInput placeholder="Password" placeholderTextColor={colors.neutral.placeholder} secureTextEntry={!showPassword} style={authStyles.iconTextInput} value={password} onChangeText={setPassword}
                onFocus={() => { setIsPasswordFocused(true); setPasswordTouched(true); }} onBlur={() => { setIsPasswordFocused(false); }} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color={PRIMARY_MINT} />
              </TouchableOpacity>
            </View>
            <PasswordStrengthIndicator password={password} />
            {passwordError ? <Text style={authStyles.errorText}>{passwordError}</Text> : null}
          </View>

          {/* Confirm Password Input */}
          <View>
            <View style={[authStyles.inputWrapper, { borderColor: confirmPasswordError ? colors.feedback.error : (isConfirmFocused ? PRIMARY_MINT : colors.neutral.border) }]}>
              <Ionicons name="lock-closed-outline" size={20} color={confirmPasswordError ? colors.feedback.error : (isConfirmFocused ? PRIMARY_MINT : colors.neutral.placeholder)} style={authStyles.inputIcon} />
              <TextInput placeholder="Confirm Password" placeholderTextColor={colors.neutral.placeholder} secureTextEntry={!showConfirmPassword} style={authStyles.iconTextInput} value={confirmPassword} onChangeText={setConfirmPassword}
                onFocus={() => { setIsConfirmFocused(true); setConfirmPasswordTouched(true); }} onBlur={() => { setIsConfirmFocused(false); }} />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={20} color={PRIMARY_MINT} />
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? <Text style={authStyles.errorText}>{confirmPasswordError}</Text> : null}
          </View>

          {/* Sign Up Button */}
          <AnimatedGradientButton onPress={handleSignup} title="Sign Up" loading={loading} />

          {/* Login Link - FIXED */}
          <TouchableOpacity onPress={() => router.push("/auth/login")} style={{ marginTop: 16, marginBottom: 8, alignItems: 'center' }}>
            <Text style={authStyles.signupText}>
              Already have an account? <Text style={authStyles.signupLink}>Login</Text>
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={authStyles.orDivider}>
            <View style={authStyles.dividerLine} />
            <Text style={authStyles.orText}>or</Text>
            <View style={authStyles.dividerLine} />
          </View>

          {/* Google Sign Up Button */}
          <TouchableOpacity 
            onPress={handleGoogleSignUp} 
            disabled={!request || googleLoading || loading} 
            style={[authStyles.socialButton, (googleLoading || !request) && { opacity: 0.7 }]}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={PRIMARY_MINT} />
            ) : (
              <>
                <Image source={{ uri: "https://img.icons8.com/color/48/google-logo.png" }} style={authStyles.socialIcon} />
                <Text style={authStyles.socialButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Verification Modal */}
      <Modal visible={showVerificationModal} transparent={true} animationType="slide" onRequestClose={() => setShowVerificationModal(false)}>
        <View style={authStyles.modalOverlay}>
          <View style={authStyles.modalContent}>
            <Ionicons name="mail-outline" size={60} color={PRIMARY_MINT} />
            <Text style={authStyles.modalTitle}>Verify Your Email</Text>
            <Text style={authStyles.modalText}>We've sent a verification email to:</Text>
            <Text style={authStyles.modalEmail}>{email}</Text>
            <Text style={authStyles.modalInstruction}>Please check your inbox and click the verification link to activate your account.</Text>
            <Text style={[authStyles.modalInstruction, { color: colors.primary.mint, fontWeight: 'bold', marginTop: 10 }]}>
              ⚠️ You will NOT be able to login until your email is verified.
            </Text>

            <View style={authStyles.modalButtons}>
              <TouchableOpacity style={[authStyles.modalButton, authStyles.modalButtonPrimary]} onPress={handleResendVerification} disabled={resendDisabled}>
                <Text style={authStyles.modalButtonText}>{resendDisabled ? `Resend in ${countdown}s` : "Resend Email"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[authStyles.modalButton, authStyles.modalButtonSecondary]} onPress={handleContinueToLogin}>
                <Text style={authStyles.modalButtonTextSecondary}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}