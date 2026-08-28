// EditRoutine.tsx
"use client"

import { useEffect, useState, useRef } from "react"
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  Modal, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  getRoutineByType,
  updateRoutineStep,
  updateReminderTime,
  type RoutineStep,
  type SkinRoutine,
} from "../../../src/utils/routineUtils"
import { 
  updateReminderNotification,
  formatTimeTo12Hour,
  cancelRoutineReminder, //  Added: To cancel previous notification
  scheduleRoutineReminder, //  Added: To schedule new notification
} from "../../../src/utils/notificationUtils"
import { routineStyles } from "../../../src/styles/routineStyles"
import { Ionicons } from '@expo/vector-icons'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function EditRoutine() {
  const router = useRouter()
  const { routineId, type } = useLocalSearchParams()
  const [routine, setRoutine] = useState<SkinRoutine | null>(null)
  const [steps, setSteps] = useState<RoutineStep[]>([])
  const [newStepName, setNewStepName] = useState("")
  const [newStepDuration, setNewStepDuration] = useState("")
  const [reminderTime, setReminderTime] = useState("")
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedTime, setSelectedTime] = useState(new Date())
  const [isSaving, setIsSaving] = useState(false) //  Added: Loading state for save button
  
  const nameInputRef = useRef<TextInput>(null)
  const durationInputRef = useRef<TextInput>(null)

  useEffect(() => {
    loadRoutine()
  }, [])

  const loadRoutine = async () => {
    try {
      const routineType = (type as "morning" | "night") || "morning"
      const data = await getRoutineByType(routineType)
      if (data) {
        setRoutine(data)
        setSteps(data.steps)
        setReminderTime(data.reminderTime)
        
        const [hour, minute] = data.reminderTime.split(':').map(Number)
        const date = new Date()
        date.setHours(hour, minute, 0, 0)
        setSelectedTime(date)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load routine")
    }
  }

  const handleAddStep = async () => {
    if (!newStepName.trim() || !newStepDuration.trim()) {
      Alert.alert("Error", "Please enter step name and duration")
      return
    }

    const duration = Number.parseInt(newStepDuration)
    if (isNaN(duration) || duration <= 0) {
      Alert.alert("Error", "Please enter a valid duration in minutes")
      return
    }

    const newStep: RoutineStep = {
      id: Date.now().toString(),
      name: newStepName.trim(),
      duration: duration,
    }

    const updatedSteps = [...steps, newStep]
    setSteps(updatedSteps)

    if (routine) {
      await updateRoutineStep(routine.id, updatedSteps)
    }

    setNewStepName("")
    setNewStepDuration("")
    setModalVisible(false)
    Keyboard.dismiss()
    Alert.alert("Success", "Step added successfully!")
  }

  const handleRemoveStep = (stepId: string) => {
    Alert.alert(
      "Remove Step",
      "Are you sure you want to remove this step?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const updatedSteps = steps.filter((s) => s.id !== stepId)
            setSteps(updatedSteps)
            if (routine) {
              await updateRoutineStep(routine.id, updatedSteps)
              Alert.alert("Success", "Step removed successfully!")
            }
          }
        }
      ]
    )
  }

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false)
    
    if (selectedDate) {
      setSelectedTime(selectedDate)
      const hours = selectedDate.getHours()
      const minutes = selectedDate.getMinutes()
      const time24 = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      setReminderTime(time24)
    }
  }

  //  FIXED: Save button handler with proper cancellation
  const handleUpdateReminderTime = async () => {
    if (!routine) return;
    
    if (isSaving) return; // Prevent double taps
    setIsSaving(true);
    
    try {
      console.log(`💾 Updating time: ${reminderTime} for ${routine.type} routine`);
      
      // Step 1: Save time to storage first
      await updateReminderTime(routine.id, reminderTime)
      
      // Step 2: If routine is enabled, cancel old and schedule new notification
      if (routine.isEnabled) {
        console.log(`🔔 Routine is enabled, updating notification...`);
        
        // Cancel previous notification first
        await cancelRoutineReminder(routine.id);
        console.log(`✓ Previous notification cancelled`);
        
        // Schedule new notification with updated time
        const newNotificationId = await scheduleRoutineReminder(
          routine.id, 
          reminderTime, 
          routine.type
        );
        
        if (newNotificationId) {
          const time12 = formatTimeTo12Hour(reminderTime)
          Alert.alert(
            "✅ Reminder Updated",
            `Your ${routine.type} routine notification has been updated to ${time12}`,
            [{ text: "Great!" }]
          )
        }
      } else {
        // Routine is disabled, just save the time
        const time12 = formatTimeTo12Hour(reminderTime)
        Alert.alert(
          "✅ Time Saved", 
          `Reminder time updated to ${time12}. Enable routine to receive notifications.`,
          [{ text: "OK" }]
        )
      }
      
      // Step 3: Refresh routine data to get updated state
      await loadRoutine();
      
    } catch (error) {
      console.log("Error updating reminder time:", error)
      Alert.alert("Error", "Failed to update reminder time. Please try again.")
    } finally {
      setIsSaving(false);
    }
  }

  const getTotalDuration = () => {
    return steps.reduce((total, step) => total + step.duration, 0)
  }

  const handleModalOpen = () => {
    setModalVisible(true)
    setTimeout(() => {
      nameInputRef.current?.focus()
    }, 300)
  }

  const handleModalClose = () => {
    setModalVisible(false)
    setNewStepName("")
    setNewStepDuration("")
    Keyboard.dismiss()
  }

  if (!routine) {
    return (
      <SafeAreaView style={routineStyles.loadingContainer}>
        <Text style={routineStyles.loadingText}>Loading...</Text>
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
          <Text style={routineStyles.headerTitle}>Edit {routine.title}</Text>
        </View>
        <Text style={routineStyles.headerSubtitle}>
          Customize your {routine.type} routine steps and timing
        </Text>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
          {/* Reminder Time Section */}
          <View style={[routineStyles.routineCard, { marginHorizontal: 0 }]}>
            <Text style={[routineStyles.stepsLabel, { marginBottom: 15 }]}>
              <Ionicons name="time-outline" size={20} color="#2E9D72" /> Reminder Time
            </Text>
            
            <TouchableOpacity
              style={routineStyles.timePickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={routineStyles.timePickerButtonText}>
                {formatTimeTo12Hour(reminderTime)}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#3DB48A" />
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={handleTimeChange}
              />
            )}

            <TouchableOpacity
              style={[
                routineStyles.saveTimeButton,
                isSaving && { opacity: 0.6 } // Disabled style when saving
              ]}
              onPress={handleUpdateReminderTime}
              disabled={isSaving} //  Disable button while saving
            >
              <Text style={routineStyles.saveTimeButtonText}>
                {isSaving ? "Saving..." : "Save Reminder Time"}
              </Text>
            </TouchableOpacity>

            {routine.isEnabled && (
              <View style={routineStyles.notificationStatus}>
                <Ionicons name="notifications" size={16} color="#3DB48A" />
                <Text style={routineStyles.notificationStatusText}>
                  Daily notification at {formatTimeTo12Hour(reminderTime)}
                </Text>
              </View>
            )}
          </View>

          {/* Steps Section */}
          <View style={[routineStyles.routineCard, { marginHorizontal: 0, marginTop: 15 }]}>
            <View style={routineStyles.stepsHeader}>
              <View>
                <Text style={routineStyles.stepsLabel}>
                  <Ionicons name="list" size={20} color="#2E9D72" /> Routine Steps
                </Text>
                <Text style={routineStyles.totalDuration}>
                  Total: {getTotalDuration()} minutes
                </Text>
              </View>
              <TouchableOpacity
                style={routineStyles.addStepButton}
                onPress={handleModalOpen}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={routineStyles.addStepButtonText}>Add Step</Text>
              </TouchableOpacity>
            </View>

            {steps.map((step, index) => (
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
                <TouchableOpacity 
                  onPress={() => handleRemoveStep(step.id)} 
                  style={routineStyles.removeStepButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#C41E3A" />
                </TouchableOpacity>
              </View>
            ))}

            {steps.length === 0 && (
              <View style={routineStyles.emptySteps}>
                <Ionicons name="list" size={40} color="#9CAF88" />
                <Text style={routineStyles.emptyStepsText}>
                  No steps added yet. Tap "Add Step" to create your routine.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add Step Modal */}
      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent
        statusBarTranslucent
        onRequestClose={handleModalClose}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={routineStyles.modalOverlay}>
            <View
              style={[
                routineStyles.modalContainer,
                {
                  maxHeight: SCREEN_HEIGHT * 0.8,
                }
              ]}
            >
              <KeyboardAvoidingView
                behavior={'padding'}
                style={routineStyles.keyboardAvoidingView}
              >
                <View style={routineStyles.modalContent}>
                  <View style={routineStyles.modalHeader}>
                    <Text style={routineStyles.modalTitle}>Add New Step</Text>
                    <TouchableOpacity onPress={handleModalClose}>
                      <Ionicons name="close" size={24} color="#7A6A5A" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={routineStyles.modalScrollContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View style={routineStyles.modalBody}>
                      <Text style={routineStyles.inputLabel}>Step Name</Text>
                      <TextInput
                        ref={nameInputRef}
                        style={routineStyles.modalInput}
                        placeholder="e.g., Cleanse, Tone, Moisturize"
                        placeholderTextColor="#9CAF88"
                        value={newStepName}
                        onChangeText={setNewStepName}
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => {
                          durationInputRef.current?.focus()
                        }}
                      />

                      <Text style={routineStyles.inputLabel}>Duration (minutes)</Text>
                      <TextInput
                        ref={durationInputRef}
                        style={routineStyles.modalInput}
                        placeholder="e.g., 2, 5, 10"
                        placeholderTextColor="#9CAF88"
                        keyboardType="numeric"
                        value={newStepDuration}
                        onChangeText={setNewStepDuration}
                        returnKeyType="done"
                        onSubmitEditing={handleAddStep}
                      />

                      <View style={routineStyles.modalButtons}>
                        <TouchableOpacity
                          style={routineStyles.modalCancelButton}
                          onPress={handleModalClose}
                        >
                          <Text style={routineStyles.modalCancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={routineStyles.modalAddButton}
                          onPress={handleAddStep}
                        >
                          <Text style={routineStyles.modalAddButtonText}>Add Step</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  )
}