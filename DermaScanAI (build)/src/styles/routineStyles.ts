// routineStyles.ts
import { StyleSheet, Platform } from "react-native"

const COLORS = {
  bgGradientTop: "#ffffffff",
  bgGradientBottom: "#d4e8d9ff",        // Lighter green
  darkGreen: "#4e7565ff",
  mediumGreen: "#4A6B5D",
  lightGreenBorder: "#8EB29C",
  lightGreenFill: "rgba(230, 244, 235, 0.6)",
  white: "#FFFFFF",
  buttonGradientStart: "#558d74ff",
  buttonGradientEnd: "#4a7863ff",        // Lighter header color
  cardBorder: "#D1E3DA",
  cardBg: "#FFFFFF",
  cardShadow: "rgba(0, 0, 0, 0.08)",
  accent: "#558d74",
  chatbotPurple: "#9C27B0",
  chatbotLightPurple: "#F3E5F5",
  error: "#C41E3A",
  success: "#2C4A3E",
  warning: "#FFA500",
  textLight: "#7A6A5A",
  textDark: "#2C4A3E",
  disabled: "#E8E1D4",
  overlay: "rgba(44,74,62,0.5)",
}

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
}

const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
}

const typography = {
  sizes: {
    small: 12,
    default: 14,
    medium: 16,
    large: 18,
    heading: 22,
    title: 24,
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as const,
}

export const routineStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgGradientBottom,
  },
  header: {
    backgroundColor: COLORS.buttonGradientEnd,
    paddingTop: spacing.md,        // REDUCED from md
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,      // REDUCED from lg
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...shadows.medium,
    opacity: 0.95,
  },
  headerTitle: {
    fontSize: typography.sizes.large,  // REDUCED from heading
    fontWeight: typography.weights.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
    opacity: 0.95,
    flex: 1,
  },
  headerSubtitle: {
    fontSize: typography.sizes.small,
    color: COLORS.lightGreenFill,
    opacity: 0.85,
    lineHeight: 16,  // REDUCED from 18
  },
  headerBackButton: {
    width: 32,        // REDUCED from 36
    height: 32,       // REDUCED from 36
    borderRadius: 16, // REDUCED from 18
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerBackText: {
    color: COLORS.white,
    fontSize: 18,     // REDUCED from 20
    fontWeight: '300',
    opacity: 0.9,
  },
  
  // 🔥 REMOVED: syncStatusContainer and syncStatusText styles
  
  routineCard: {
    marginHorizontal: 12,
    marginVertical: 8,
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 16,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    width: 'auto',
  },
  routineCardActive: {
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  
  routineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  routineTitleContainer: {
    flex: 1,
    paddingRight: 4,
  },
  routineTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: COLORS.darkGreen,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  routineBadge: {
    backgroundColor: COLORS.lightGreenFill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  routineBadgeText: {
    fontSize: 11,
    color: COLORS.mediumGreen,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  routineDescription: {
    fontSize: 13,
    color: COLORS.mediumGreen,
    lineHeight: 18,
  },
  switchContainer: {
    backgroundColor: COLORS.lightGreenFill,
    borderRadius: 30,
    padding: 2,
    marginTop: 2,
  },
  
  reminderSection: {
    marginVertical: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderLabel: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: COLORS.mediumGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reminderTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderTime: {
    fontSize: 16,
    fontWeight: typography.weights.bold,
    color: COLORS.darkGreen,
    letterSpacing: 0.5,
  },
  reminderEnabledBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reminderEnabledText: {
    fontSize: 9,
    color: COLORS.white,
    fontWeight: '600',
  },
  
  stepsContainer: {
    marginVertical: 10,
  },
  stepsLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepsLabel: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: COLORS.mediumGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepsCount: {
    backgroundColor: COLORS.lightGreenFill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 11,
    color: COLORS.mediumGreen,
  },
  
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginVertical: 3,
    backgroundColor: COLORS.lightGreenFill,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stepNumberText: {
    color: COLORS.white,
    fontWeight: typography.weights.bold,
    fontSize: 11,
  },
  stepContent: {
    flex: 1,
  },
  stepName: {
    fontSize: 13,
    fontWeight: typography.weights.medium,
    color: COLORS.darkGreen,
    marginBottom: 1,
  },
  stepDuration: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: '400',
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDurationIcon: {
    fontSize: 10,
    marginRight: 2,
  },
  
  actionButton: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.buttonGradientStart,
    borderRadius: 30,
    alignItems: "center",
    ...shadows.small,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: typography.weights.bold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: COLORS.bgGradientBottom,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: spacing.lg,
    color: COLORS.accent,
  },
  emptyStateText: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: COLORS.darkGreen,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  emptyStateSubtext: {
    fontSize: typography.sizes.default,
    color: COLORS.mediumGreen,
    textAlign: "center",
    lineHeight: 22,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgGradientBottom,
  },
  loadingText: {
    marginTop: spacing.md,
    color: COLORS.mediumGreen,
    fontSize: typography.sizes.default,
  },

  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#F0EAE0',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 15,
  },
  
  timePickerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  
  saveTimeButton: {
    backgroundColor: COLORS.success,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  
  saveTimeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  notificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0E3',
    borderRadius: 12,
    padding: 10,
    marginTop: 5,
  },
  
  notificationStatusText: {
    marginLeft: 8,
    color: COLORS.textDark,
    fontSize: 13,
    flex: 1,
  },
  
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  
  totalDuration: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  
  addStepButton: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  
  addStepButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },
  
  removeStepButton: {
    padding: 8,
  },
  
  emptySteps: {
    alignItems: 'center',
    padding: 30,
  },
  
  emptyStepsText: {
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 10,
  },
  
  viewAllSteps: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#F5F0E8',
    borderRadius: 10,
  },
  
  viewAllStepsText: {
    color: COLORS.textDark,
    fontWeight: '600',
    fontSize: 12,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
  },

  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    justifyContent: 'center',
  },

  keyboardAvoidingView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    padding: 25,
    width: '100%',
    ...shadows.large,
  },

  modalScrollContent: {
    flexGrow: 1,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  modalBody: {
    flex: 1,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
    marginTop: 5,
  },

  modalInput: {
    borderWidth: 1,
    borderColor: '#F0EAE0',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FAF7F2',
    color: COLORS.textDark,
    marginBottom: 15,
  },

  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 10,
  },

  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F0EAE0',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },

  modalCancelButtonText: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 16,
  },

  modalAddButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },

  modalAddButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  gapSmall: {
    gap: spacing.sm,
  },
  
  gapMedium: {
    gap: spacing.md,
  },
  
  marginBottomSmall: {
    marginBottom: spacing.sm,
  },
  
  marginBottomMedium: {
    marginBottom: spacing.md,
  },
  
  marginBottomLarge: {
    marginBottom: spacing.lg,
  },
  
  paddingHorizontal: {
    paddingHorizontal: spacing.lg,
  },
  
  textCenter: {
    textAlign: 'center',
  },
  
  successBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  
  successText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  
  disabledText: {
    color: COLORS.disabled,
  },
  
  iconSmall: {
    width: 16,
    height: 16,
  },
  
  iconMedium: {
    width: 20,
    height: 20,
  },
  
  iconLarge: {
    width: 24,
    height: 24,
  },

  toggleLoadingContainer: {
    width: 51,
    height: 31,
    borderRadius: 31,
    backgroundColor: COLORS.lightGreenFill,
    justifyContent: 'center',
    alignItems: 'center',
  },

  offlineIndicator: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  offlineText: {
    color: COLORS.white,
    fontSize: 10,
  },
})