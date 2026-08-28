import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { colors } from "../src/styles/theme";

export default function OAuthRedirectScreen() {
  useEffect(() => {
    const completeAuth = async () => {
      try {
        await WebBrowser.maybeCompleteAuthSession();
      } catch (error) {
        console.error("Error completing auth session:", error);
      }
    };
    completeAuth();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.neutral.white }}>
      <ActivityIndicator size="large" color={colors.primary.mint} />
      <Text style={{ marginTop: 20, color: colors.primary.mint, fontSize: 16 }}>
        Completing sign in...
      </Text>
    </View>
  );
}