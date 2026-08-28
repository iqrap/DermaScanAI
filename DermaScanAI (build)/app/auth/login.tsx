import { useState, useEffect, useRef } from "react"
import { View, Text, TextInput, TouchableOpacity, Alert, Image, Animated, Easing, ActivityIndicator, Platform } from "react-native"
import { useRouter } from "expo-router"
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"
import { auth } from "../../src/config/firebase"
import * as WebBrowser from "expo-web-browser"
import * as Google from "expo-auth-session/providers/google"
import { makeRedirectUri } from 'expo-auth-session'
import { Ionicons } from "@expo/vector-icons"
import { authStyles } from "../../src/styles/authStyles"
import { colors } from "../../src/styles/theme"

WebBrowser.maybeCompleteAuthSession()

const PRIMARY_MINT = colors.primary.mint
const DARK_MINT = colors.primary.darkMint

// Animated components
function AnimatedWelcomeTitle({ text }: { text: string }) {
  const animatedValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start()
  }, [])

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  })

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.6, 1],
  })

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
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ).start()
  }, [])

  const bgColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [PRIMARY_MINT, DARK_MINT],
  })

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={loading}>
      <Animated.View style={[authStyles.animatedButton, { backgroundColor: bgColor }]}>
        {loading ? (
          <ActivityIndicator color={colors.neutral.white} />
        ) : (
          <Text style={authStyles.buttonText}>{title}</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  )
}

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  
  // State for unverified user
  const [unverifiedEmail, setUnverifiedEmail] = useState("")
  const [unverifiedPassword, setUnverifiedPassword] = useState("")
  const [resendDisabled, setResendDisabled] = useState(false)
  const [countdown, setCountdown] = useState(60)

  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        console.log("User already logged in:", user.email);
        router.replace("/drawer/dashboard");
      }
    });
    return () => unsubscribe();
  }, []);

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

  // Countdown timer
  useEffect(() => {
    let timer: any; 
    if (resendDisabled && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
      setCountdown(60);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendDisabled, countdown]);

  // Google Sign-In response handler - FIXED
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      
      signInWithCredential(auth, credential)
        .then((result) => {
          const user = result.user;
          console.log("Google Sign-In Success:", user.email);
          
          if (!user.emailVerified) {
            Alert.alert(
              "Email Not Verified",
              "Please verify your email address before logging in with Google.",
              [{ text: "OK", onPress: () => signOut(auth) }]
            );
            setGoogleLoading(false);
          } else {
            // Use replace instead of push to prevent back navigation
            setGoogleLoading(false);
            router.replace("/drawer/dashboard");
          }
        })
        .catch((error: any) => {
          console.error("Firebase Error:", error);
          setGoogleLoading(false);
          if (error.code === 'auth/account-exists-with-different-credential') {
            Alert.alert(
              "Account Exists",
              "An account already exists with the same email address. Please sign in using the original method."
            );
          } else {
            Alert.alert("Google Login Error", error.message || "Failed to sign in with Google");
          }
        });
    } else if (response?.type === "error") {
      setGoogleLoading(false);
      console.error("Google auth error:", response.error);
      Alert.alert("Google Login Failed", response.error?.message || "Please try again.");
    } else if (response?.type === "cancel") {
      setGoogleLoading(false);
    }
  }, [response]);

  const handleResendVerification = async () => {
    if (!unverifiedEmail || !unverifiedPassword) {
      Alert.alert("Error", "Please enter your email and password first");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, unverifiedEmail, unverifiedPassword);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        setResendDisabled(true);
        Alert.alert("✅ Verification Email Sent", "Please check your email and verify your account.");
      } else {
        Alert.alert("Info", "This email is already verified. Please login.");
      }
      
      await signOut(auth);
      
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        Alert.alert("Error", "Invalid email or password.");
      } else {
        Alert.alert("Error", error.message || "Unable to send verification email");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setUnverifiedEmail(email);
        setUnverifiedPassword(password);
        
        await signOut(auth);
        
        Alert.alert(
          "❌ Email Not Verified",
          "Please verify your email before logging in.",
          [
            { text: "Resend Email", onPress: handleResendVerification },
            { text: "OK", style: "cancel" }
          ]
        );
        setLoading(false);
        return;
      }

      // Use replace instead of push
      router.replace("/drawer/dashboard");
      
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        Alert.alert("Login Failed", "Invalid email or password");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("Invalid Email", "Please enter a valid email address");
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert("Too Many Attempts", "Try again later.");
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert("Network Error", "Please check your internet connection.");
      } else {
        Alert.alert("Login Error", error.message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email first");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("✅ Password Reset Email Sent", `Check your email (${email}) for instructions.`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert("Error", "No account found with this email address");
      } else {
        Alert.alert("Error", error.message || "Something went wrong");
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!request) {
      Alert.alert("Error", "Google Sign-In not configured properly");
      return;
    }
    
    setGoogleLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      setGoogleLoading(false);
      console.error("Google Sign-In error:", error);
      Alert.alert("Error", "Failed to initiate Google Sign-In");
    }
  };

  return (
    <View style={authStyles.container}>
      <View style={authStyles.contentContainer}>
        <Text style={authStyles.appTitle}>SMART SKINCARE</Text>
        <Text style={authStyles.appSubtitle}>Science Backed Dermatology Assistant</Text>

        <View style={authStyles.formCard}>
          <AnimatedWelcomeTitle text="Welcome Back" />
          <Text style={authStyles.formSubtitle}>Log in to track your skin health history and AI insights.</Text>

          {/* Email Input */}
          <View style={[authStyles.inputWrapper, { borderColor: isEmailFocused ? PRIMARY_MINT : colors.neutral.border }]}>
            <Ionicons name="mail-outline" size={20} color={isEmailFocused ? PRIMARY_MINT : colors.neutral.placeholder} style={authStyles.inputIcon} />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor={colors.neutral.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              style={authStyles.iconTextInput}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
            />
          </View>

          {/* Password Input */}
          <View style={[authStyles.inputWrapper, { borderColor: isPasswordFocused ? PRIMARY_MINT : colors.neutral.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={isPasswordFocused ? PRIMARY_MINT : colors.neutral.placeholder} style={authStyles.inputIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.neutral.placeholder}
              secureTextEntry={!showPassword}
              style={authStyles.iconTextInput}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye" : "eye-off"} size={22} color={PRIMARY_MINT} />
            </TouchableOpacity>
          </View>

          {/* Resend Verification Option */}
          {unverifiedEmail === email && (
            <TouchableOpacity onPress={handleResendVerification} disabled={resendDisabled || loading} style={{ marginBottom: 10 }}>
              <Text style={{ color: resendDisabled ? colors.neutral.placeholder : PRIMARY_MINT, textAlign: 'center', fontSize: 12 }}>
                {resendDisabled ? `Resend verification email in ${countdown}s` : "Didn't receive verification email? Resend"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Forgot Password */}
          <TouchableOpacity onPress={handleForgotPassword} disabled={forgotPasswordLoading} style={{ marginBottom: 4 }}>
            {forgotPasswordLoading ? (
              <ActivityIndicator size="small" color={PRIMARY_MINT} />
            ) : (
              <Text style={authStyles.forgotPasswordText}>Forgot Password?</Text>
            )}
          </TouchableOpacity>

          <AnimatedGradientButton onPress={handleLogin} title="Login" loading={loading} />

          {/* Sign Up Link - FIXED: Removed Link component and used TouchableOpacity with router */}
          <TouchableOpacity onPress={() => router.push("/auth/signup")} style={{ marginTop: 16, marginBottom: 8, alignItems: 'center' }}>
            <Text style={authStyles.signupText}>
              Don't have an account? <Text style={authStyles.signupLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

          <View style={authStyles.orDivider}>
            <View style={authStyles.dividerLine} />
            <Text style={authStyles.orText}>or</Text>
            <View style={authStyles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity 
            onPress={handleGoogleSignIn} 
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
      </View>
    </View>
  )
}