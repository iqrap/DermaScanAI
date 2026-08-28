// app/_layout.tsx
import { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import {
  setupNotificationChannel,
  rescheduleAllNotifications,
} from "../src/utils/notificationUtils";

export default function RootLayout() {
  useEffect(() => {
    // Set up Android notification channel and reschedule saved reminders on app start
    const initNotifications = async () => {
      await setupNotificationChannel();
      await rescheduleAllNotifications();
    };
    initNotifications();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
