// RoutineScheduler.tsx
"use client"

import { useState, useCallback, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, useFocusEffect } from "expo-router"
import { getSkinRoutines, type SkinRoutine, toggleRoutine } from "../../../src/utils/routineUtils"
import {
  requestNotificationPermissions,
  formatTimeTo12Hour,
  cancelRoutineReminder,
  scheduleRoutineReminder,
  rescheduleAllNotifications,
  // REMOVED: setupNotificationHandler, debugReminders (not in utils)
} from "../../../src/utils/notificationUtils"
import { routineStyles } from "../../../src/styles/routineStyles"
import { Ionicons } from '@expo/vector-icons'
import { saveToFirestore, syncRoutinesToFirestore } from "../../../src/utils/firestoreUtils"

export default function RoutineScheduler() {
  const router = useRouter()
  const [routines, setRoutines] = useState<SkinRoutine[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("synced")

  useEffect(() => {
    console.log("🚀 RoutineScheduler MOUNTED");
    rescheduleAllNotifications()
    checkSyncStatus()
    // REMOVED: setupNotificationHandler()
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadRoutines()
      requestNotificationPermissions()
    }, []),
  )

  const checkSyncStatus = async () => {
    const { auth } = require("../../../src/config/firebase")
    const user = auth.currentUser
    if (user) {
      setSyncStatus("synced")
    } else {
      setSyncStatus("offline")
    }
  }

  const loadRoutines = async () => {
    try {
      const data = await getSkinRoutines()
      setRoutines(data)
      
      const { auth } = require("../../../src/config/firebase")
      const user = auth.currentUser
      
      if (user) {
        setSyncStatus("syncing")
        await syncRoutinesToFirestore(data)
        setSyncStatus("synced")
      } else {
        setSyncStatus("offline")
      }
      
      // REMOVED: await debugReminders()
    } catch (error) {
      console.log("Error loading routines:", error)
      setSyncStatus("offline")
    } finally {
      setLoading(false)
    }
  }

  // TOGGLE BUTTON HANDLER
  const handleToggleRoutine = async (routineId: string, currentState: boolean) => {
    if (togglingId === routineId) return
    setTogglingId(routineId)
    
    console.log(`🎯 Toggle: ${routineId} from ${currentState} to ${!currentState}`);
    
    try {
      await toggleRoutine(routineId, !currentState)
      
      const { auth } = require("../../../src/config/firebase")
      const user = auth.currentUser
      
      const routine = routines.find((r) => r.id === routineId)
      if (routine && user) {
        setSyncStatus("syncing")
        await saveToFirestore("userRoutines", { ...routine, isEnabled: !currentState }, routineId)
        setSyncStatus("synced")
      }

      if (!currentState) { // OFF -> ON (Enable)
        if (routine) {
          await scheduleRoutineReminder(routineId, routine.reminderTime, routine.type)
        }
      } else { // ON -> OFF (Disable)
        await cancelRoutineReminder(routineId)
        Alert.alert(
          "⏰ Reminders Off",
          `You won't receive notifications for this routine`,
          [{ text: "OK" }]
        )
      }
      
      await loadRoutines()
      
    } catch (error) {
      console.log("Error:", error)
      Alert.alert("Error", "Failed to update routine")
      setSyncStatus("offline")
    } finally {
      setTogglingId(null)
    }
  }

  const handleEditRoutine = (routine: SkinRoutine) => {
    router.push({
      pathname: "/features/skin_routine/EditRoutine",
      params: { routineId: routine.id, type: routine.type },
    })
  }

  const getRoutineIcon = (type: string) => {
    return type === 'morning' ? 'sunny-outline' : 'moon-outline'
  }

  if (loading) {
    return (
      <SafeAreaView style={routineStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#B5C9A8" />
        <Text style={routineStyles.loadingText}>Loading your routines...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={routineStyles.container} edges={["top"]}>
      <View style={routineStyles.header}>
        <View style={routineStyles.headerRow}>
          <TouchableOpacity 
            style={routineStyles.headerBackButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={routineStyles.headerTitle}>Skin Routine Scheduler</Text>
        </View>
        <Text style={routineStyles.headerSubtitle}>
          Set up your daily morning and night skincare routines
        </Text>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {routines.map((routine) => {
          const time12 = formatTimeTo12Hour(routine.reminderTime)
          const isToggling = togglingId === routine.id
          
          return (
            <View 
              key={routine.id} 
              style={[
                routineStyles.routineCard, 
                routine.isEnabled && routineStyles.routineCardActive
              ]}
            >
              <View style={routineStyles.routineHeader}>
                <View style={routineStyles.routineTitleContainer}>
                  <View style={routineStyles.routineBadge}>
                    <Ionicons 
                      name={getRoutineIcon(routine.type)} 
                      size={12} 
                      color="#2E9D72"
                    />
                    <Text style={routineStyles.routineBadgeText}>
                      {routine.type} routine
                    </Text>
                  </View>
                  <Text style={routineStyles.routineTitle}>{routine.title}</Text>
                  <Text style={routineStyles.routineDescription}>{routine.description}</Text>
                </View>
                <View style={routineStyles.switchContainer}>
                  {isToggling ? (
                    <ActivityIndicator size="small" color="#3DB48A" />
                  ) : (
                    <Switch
                      value={routine.isEnabled}
                      onValueChange={() => handleToggleRoutine(routine.id, routine.isEnabled)}
                      trackColor={{ false: "#E8E1D4", true: "#B5C9A8" }}
                      thumbColor={routine.isEnabled ? "#4ECBA0" : "#FFFFFF"}
                      ios_backgroundColor="#E8E1D4"
                    />
                  )}
                </View>
              </View>

              <View style={routineStyles.reminderSection}>
                <Text style={routineStyles.reminderLabel}>Reminder Time</Text>
                <View style={routineStyles.reminderTimeContainer}>
                  <Ionicons name="time-outline" size={20} color="#3DB48A" />
                  <Text style={routineStyles.reminderTime}>{time12}</Text>
                  {routine.isEnabled && (
                    <View style={routineStyles.reminderEnabledBadge}>
                      <Ionicons name="notifications" size={12} color="#FFFFFF" />
                      <Text style={routineStyles.reminderEnabledText}>DAILY</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={routineStyles.stepsContainer}>
                <View style={routineStyles.stepsLabelContainer}>
                  <Text style={routineStyles.stepsLabel}>Routine Steps</Text>
                  <Text style={routineStyles.stepsCount}>{routine.steps.length} steps</Text>
                </View>
                
                {routine.steps.slice(0, expandedIds.has(routine.id) ? routine.steps.length : 2).map((step, index) => (
                  <View key={step.id} style={routineStyles.stepItem}>
                    <View style={routineStyles.stepNumber}>
                      <Text style={routineStyles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <View style={routineStyles.stepContent}>
                      <Text style={routineStyles.stepName}>{step.name}</Text>
                      <Text style={routineStyles.stepDuration}>
                        <Ionicons name="timer-outline" size={12} color="#4ECBA0" /> {step.duration} min
                      </Text>
                    </View>
                  </View>
                ))}
                
                {routine.steps.length > 2 && (
                  <TouchableOpacity 
                    onPress={() => {
                      setExpandedIds((prev) => {
                        const next = new Set(prev)
                        if (next.has(routine.id)) {
                          next.delete(routine.id)
                        } else {
                          next.add(routine.id)
                        }
                        return next
                      })
                    }}
                    style={routineStyles.viewAllSteps}
                  >
                    <Ionicons 
                      name={expandedIds.has(routine.id) ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#3DB48A" 
                    />
                    <Text style={routineStyles.viewAllStepsText}>
                      {expandedIds.has(routine.id)
                        ? "Show less"
                        : `+${routine.steps.length - 2} more step${routine.steps.length - 2 > 1 ? "s" : ""}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity 
                style={routineStyles.actionButton} 
                onPress={() => handleEditRoutine(routine)}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                <Text style={routineStyles.actionButtonText}>Edit Routine</Text>
              </TouchableOpacity>
            </View>
          )
        })}

        {routines.length === 0 && (
          <View style={routineStyles.emptyState}>
            <Text style={routineStyles.emptyStateIcon}>🧴</Text>
            <Text style={routineStyles.emptyStateText}>No Routines Yet</Text>
            <Text style={routineStyles.emptyStateSubtext}>
              Start by creating your morning and night skincare routines
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}