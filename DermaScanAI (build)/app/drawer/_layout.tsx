"use client"
import { Drawer } from "expo-router/drawer"
import { Alert, Pressable, Text, View, StyleSheet } from "react-native"
import { signOut, deleteUser, sendPasswordResetEmail } from "firebase/auth"
import { auth } from "../../src/config/firebase"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

// Define the Props type for the DrawerItem component
type DrawerItemProps = {
  label: string
  onPress: () => void
  danger?: boolean
  icon: keyof typeof Ionicons.glyphMap
}

export default function DrawerLayout() {
  const router = useRouter()

  // Helper function to safely get the error message
  const getErrorMessage = (error: unknown) => {
    if (error && typeof error === "object" && "message" in error) {
      return (error as Error).message
    }
    return "An unknown error occurred."
  }

  // Logout function
  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await signOut(auth)
              router.replace("/get-started")
            } catch (error) {
              console.log("Error signing out:", error)
              Alert.alert("Error", "Something went wrong while signing out.")
            }
          },
        },
      ],
      { cancelable: true },
    )
  }

  // Delete account function
  const handleDeleteAccount = () => {
    Alert.alert(
      "Confirm Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              if (auth.currentUser) {
                await deleteUser(auth.currentUser)
                router.replace("/get-started")
              }
            } catch (error) {
              console.log("Error deleting account:", error)
              Alert.alert(
                "Error",
                getErrorMessage(error) || "Failed to delete account. You may need to re-login and try again.",
              )
            }
          },
        },
      ],
      { cancelable: true },
    )
  }

  // Change password function
  const handleChangePassword = () => {
    const email = auth.currentUser?.email
    if (!email) {
      Alert.alert("Error", "No email found for current user.")
      return
    }

    Alert.alert("Change Password", "A password reset email will be sent to your registered email address.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send",
        onPress: async () => {
          try {
            await sendPasswordResetEmail(auth, email)
            Alert.alert("Email Sent", "Password reset email has been sent. Check your inbox or spam folder.")
          } catch (error) {
            console.log("Error sending reset email:", error)
            Alert.alert("Error", getErrorMessage(error) || "Failed to send password reset email.")
          }
        },
      },
    ])
  }

  // Drawer item component with icon - Increased height and text size
  const DrawerItem = ({ label, onPress, danger = false, icon }: DrawerItemProps) => (
    <Pressable 
      onPress={onPress} 
      style={({ pressed }: { pressed: boolean }) => [
        styles.drawerItem, 
        pressed && styles.drawerItemPressed
      ]}
    >
      <View style={styles.drawerItemContent}>
        <Ionicons 
          name={icon} 
          size={20} // Increased from 18
          color={danger ? "#ff6b6b" : "#1d491f"} 
          style={styles.drawerIcon}
        />
        <Text style={[styles.drawerText, danger && styles.drawerTextDanger]}>{label}</Text>
      </View>
    </Pressable>
  )

  // Custom drawer content
  const CustomDrawerContent = () => (
    <View style={styles.drawerContainer}>
      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {auth.currentUser?.email?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userEmail} numberOfLines={1}>
            {auth.currentUser?.email || "User"}
          </Text>
          <Text style={styles.userStatus}>Active</Text>
        </View>
      </View>

      {/* Decorative Wave */}
      <View style={styles.waveContainer}>
        <View style={styles.wave} />
      </View>

      {/* Main Menu Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>MAIN MENU</Text>
        <DrawerItem 
          label="Dashboard" 
          onPress={() => router.push("./dashboard")} 
          icon="home-outline"
        />
        <DrawerItem 
          label="Our Mission" 
          onPress={() => router.push("./OurMission")} 
          icon="heart-outline"
        />
        <DrawerItem 
          label="Change Password" 
          onPress={handleChangePassword} 
          icon="key-outline"
        />
      </View>

      {/* Information Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>INFORMATION</Text>
        <DrawerItem 
          label="Terms & Privacy" 
          onPress={() => router.push("./TermsAndPrivacyScreen")} 
          icon="document-text-outline"
        />
        <DrawerItem 
          label="Myths & Facts" 
          onPress={() => router.push("./MythsAndFacts")} 
          icon="information-circle-outline"
        />
      </View>

      {/* Account Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <DrawerItem 
          label="Logout" 
          onPress={handleLogout} 
          icon="log-out-outline"
          danger 
        />
        <DrawerItem 
          label="Delete Account" 
          onPress={handleDeleteAccount} 
          icon="trash-outline"
          danger 
        />
      </View>

      {/* Cute Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>✨ Stay safe & healthy ✨</Text>
      </View>
    </View>
  )

  return <Drawer screenOptions={{ headerShown: false }} drawerContent={() => <CustomDrawerContent />} />
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "#f0f4f3", // soft mint-gray (original)
    paddingTop: 40,
    paddingHorizontal: 15,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#d9ebe1", // mint-light
    padding: 12, // Slightly increased
    borderRadius: 15, // More rounded like pink theme
    shadowColor: "#b2d8cc",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 40, // Slightly increased
    height: 40, // Slightly increased
    borderRadius: 12, // More rounded
    backgroundColor: "#1d491f",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18, // Increased
    fontWeight: "600",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 14, // Increased
    fontWeight: "600",
    color: "#1d491f",
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
    color: "#71b48d",
    fontWeight: "500",
  },
  waveContainer: {
    marginBottom: 20,
  },
  wave: {
    height: 2,
    backgroundColor: "#ffd1d1", // Pink wave from pink theme
    borderRadius: 1,
    width: "100%",
  },
  sectionContainer: {
    marginBottom: 20, // Space between sections
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#b29696", // Pinkish color from pink theme
    marginBottom: 10,
    marginLeft: 5,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  drawerItem: {
    paddingVertical: 12, // Increased from 8
    paddingHorizontal: 15, // Increased from 12
    borderRadius: 12, // Increased from 8
    marginBottom: 8, // Increased from 6
    backgroundColor: "#d9ebe1",
    borderWidth: 1,
    borderColor: "#b2d8cc",
    shadowColor: "#b2d8cc",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  drawerItemPressed: {
    backgroundColor: "#b2e6d6",
    transform: [{ scale: 0.98 }],
    borderColor: "#1d491f",
  },
  drawerItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  drawerIcon: {
    marginRight: 12, // Increased from 10
  },
  drawerText: {
    fontSize: 15, // Increased from 13
    color: "#212529",
    fontWeight: "500",
  },
  drawerTextDanger: {
    color: "#ff6b6b", // Pinkish danger color
    fontWeight: "600",
  },
  footer: {
    marginTop: "auto",
    marginBottom: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    marginBottom: 45,
    color: "#b29696", // Pinkish color
    fontStyle: "italic",
  },
})