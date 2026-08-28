import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

// ─── Lazy-load expo-notifications to suppress Expo Go warnings ──────────────
// expo-notifications fires misleading warnings about REMOTE push notifications
// at module-load time in Expo Go.  We only use LOCAL scheduled notifications,
// which are fully supported.  By lazy-loading the module with require() we can
// intercept console output around the load and filter out those specific
// messages while keeping all other console output intact.

type NotificationsModule = typeof import("expo-notifications")

let _Notifications: NotificationsModule | null = null

const getNotifications = (): NotificationsModule => {
  if (_Notifications) return _Notifications

  // Temporarily suppress Expo Go push-notification warnings during module load
  const origError = console.error
  const origWarn = console.warn

  const isExpoGoMsg = (args: unknown[]) =>
    args.some(
      (a) =>
        typeof a === "string" &&
        (a.includes("expo-notifications") || a.includes("Expo Go")),
    )

  console.error = (...args: unknown[]) => {
    if (isExpoGoMsg(args)) return
    origError.apply(console, args)
  }
  console.warn = (...args: unknown[]) => {
    if (isExpoGoMsg(args)) return
    origWarn.apply(console, args)
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  _Notifications = require("expo-notifications") as NotificationsModule

  // Restore original console methods immediately
  console.error = origError
  console.warn = origWarn

  // Set notification behaviour (show even when app is in foreground)
  try {
    _Notifications!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    })
  } catch (e) {
    console.log("Notification handler setup failed:", e)
  }

  return _Notifications!
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScheduledNotification {
  routineId: string
  notificationId: string
  hour: number
  minute: number
  type: "morning" | "night"
  timeString: string
}

// ─── Android channel setup ──────────────────────────────────────────────────

const ANDROID_CHANNEL_ID = "skincare-reminders"

/**
 * Creates the Android notification channel (required for Android 8+).
 * Safe to call multiple times — Android ignores duplicate channel creation.
 */
export const setupNotificationChannel = async () => {
  if (Platform.OS === "android") {
    const N = getNotifications()
    await N.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Skincare Reminders",
      importance: N.AndroidImportance.HIGH,
      sound: "default",
      description: "Daily morning and night skincare routine reminders",
    })
  }
}

// ─── Permissions ─────────────────────────────────────────────────────────────

/**
 * Request notification permissions from the OS.
 * Required on iOS 16+ and Android 13+.
 * Returns true if granted, false otherwise.
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const N = getNotifications()
    const { status: existingStatus } = await N.getPermissionsAsync()
    if (existingStatus === "granted") return true

    const { status } = await N.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
      android: {
        allowAlert: true,
        allowSound: true,
      },
    })

    if (status !== "granted") {
      console.log("⚠️ Notification permission denied")
      return false
    }

    console.log("✅ Notification permission granted")
    return true
  } catch (error) {
    console.log("Error requesting notification permissions:", error)
    return false
  }
}

// ─── Time formatting helpers ─────────────────────────────────────────────────

/** Convert 24-hour time string (e.g. "14:30") to 12-hour format ("2:30 PM") */
export const formatTimeTo12Hour = (time24: string): string => {
  const [hour, minute] = time24.split(":").map(Number)
  const period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`
}

/** Convert 12-hour time string (e.g. "2:30 PM") to 24-hour format ("14:30") */
export const formatTimeTo24Hour = (time12: string): string => {
  const [time, period] = time12.split(" ")
  let [hour, minute] = time.split(":").map(Number)

  if (period === "PM" && hour !== 12) hour += 12
  if (period === "AM" && hour === 12) hour = 0

  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
}

// ─── Schedule a daily reminder ───────────────────────────────────────────────

/**
 * Schedule a daily local push notification for a skincare routine.
 * Cancels any existing notification for the same routineId first,
 * then schedules a new repeating notification at the given time.
 *
 * Works in Expo Go — uses local scheduled notifications (not remote push).
 */
export const scheduleRoutineReminder = async (
  routineId: string,
  reminderTime: string,
  type: "morning" | "night",
): Promise<string | null> => {
  try {
    // Ensure permissions before scheduling
    const hasPermission = await requestNotificationPermissions()
    if (!hasPermission) {
      console.log("⚠️ Cannot schedule — notification permission not granted")
      return null
    }

    // Cancel any existing notification for this routine first
    await cancelRoutineReminder(routineId)

    const N = getNotifications()
    const [hour, minute] = reminderTime.split(":").map(Number)
    const time12 = formatTimeTo12Hour(reminderTime)

    const title =
      type === "morning"
        ? "🌞 Morning Skincare Routine"
        : "🌙 Night Skincare Routine"

    const body =
      type === "morning"
        ? `Time for your morning skincare routine! Start your day with healthy skin.`
        : `Time for your night skincare routine! Wind down and take care of your skin.`

    // Schedule daily repeating notification at the specified hour:minute
    const notificationId = await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: N.AndroidNotificationPriority.HIGH,
        data: { routineId, type },
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: Platform.OS === "android" ? ANDROID_CHANNEL_ID : undefined,
      } as import("expo-notifications").DailyTriggerInput,
    })

    // Persist the scheduled notification info for tracking / rescheduling
    const scheduled = await getScheduledNotifications()
    const updated = scheduled.filter((s) => s.routineId !== routineId)
    updated.push({
      routineId,
      notificationId,
      hour,
      minute,
      type,
      timeString: time12,
    })
    await AsyncStorage.setItem("scheduledNotifications", JSON.stringify(updated))

    console.log(
      `🔔 Scheduled ${type} reminder at ${time12} (id: ${notificationId})`,
    )
    return notificationId
  } catch (error) {
    console.log("Error scheduling routine reminder:", error)
    return null
  }
}

// ─── Cancel a reminder ───────────────────────────────────────────────────────

/**
 * Cancel the scheduled notification for a specific routine.
 */
export const cancelRoutineReminder = async (routineId: string): Promise<void> => {
  try {
    const scheduled = await getScheduledNotifications()
    const entry = scheduled.find((s) => s.routineId === routineId)

    if (entry?.notificationId) {
      const N = getNotifications()
      await N.cancelScheduledNotificationAsync(entry.notificationId)
      console.log(`🔕 Cancelled reminder for ${routineId}`)
    }

    const updated = scheduled.filter((s) => s.routineId !== routineId)
    await AsyncStorage.setItem("scheduledNotifications", JSON.stringify(updated))
  } catch (error) {
    console.log("Error canceling routine reminder:", error)
  }
}

// ─── Storage helpers ─────────────────────────────────────────────────────────

/** Get all tracked scheduled notifications from AsyncStorage */
export const getScheduledNotifications = async (): Promise<ScheduledNotification[]> => {
  try {
    const stored = await AsyncStorage.getItem("scheduledNotifications")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/** Alias kept for backward compatibility */
export const getScheduledNotificationsForDay = async (): Promise<ScheduledNotification[]> => {
  return getScheduledNotifications()
}

// ─── Update reminder ─────────────────────────────────────────────────────────

/**
 * Update an existing reminder to a new time.
 * Cancels the old notification and schedules a new one.
 */
export const updateReminderNotification = async (
  routineId: string,
  newReminderTime: string,
  type: "morning" | "night",
): Promise<string | null> => {
  try {
    await cancelRoutineReminder(routineId)
    return await scheduleRoutineReminder(routineId, newReminderTime, type)
  } catch (error) {
    console.log("Error updating reminder notification:", error)
    return null
  }
}

// ─── Reschedule all (called on app start) ────────────────────────────────────

/**
 * Re-schedule all enabled routine notifications from saved data.
 * Called on app mount so reminders survive app restarts.
 */
export const rescheduleAllNotifications = async (): Promise<void> => {
  try {
    const N = getNotifications()
    // Cancel all existing scheduled notifications first
    await N.cancelAllScheduledNotificationsAsync()

    const routinesRaw = await AsyncStorage.getItem("skinRoutines")
    if (!routinesRaw) return

    const routines = JSON.parse(routinesRaw) as Array<{
      id: string
      isEnabled: boolean
      reminderTime: string
      type: "morning" | "night"
    }>

    const enabledRoutines = routines.filter((r) => r.isEnabled)

    for (const routine of enabledRoutines) {
      await scheduleRoutineReminder(routine.id, routine.reminderTime, routine.type)
    }

    console.log(
      `🔄 Rescheduled ${enabledRoutines.length} routine notification(s)`,
    )
  } catch (error) {
    console.log("Error rescheduling notifications:", error)
  }
}
