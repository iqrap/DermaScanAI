import { StyleSheet, Platform } from "react-native"
import { colors, typography, spacing, borderRadius, shadows } from "./theme"

// Auth screens use dynamic top padding via useSafeAreaInsets (see login/signup screens).
// BASE_TOP_PADDING is the content spacing below the safe-area top inset.
export const AUTH_BASE_TOP_PADDING = 24;

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradient.pageTop,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
  },
  scrollViewContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: 80,
    paddingBottom: 40,
  },
  appTitle: {
    fontSize: typography.sizes.title,
    color: colors.primary.darkMint,
    fontWeight: typography.weights.bold,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: typography.sizes.tiny,
    color: colors.primary.darkMint,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.neutral.darkGray,
    textAlign: "left",
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: typography.sizes.small,
    color: colors.neutral.mediumGray,
    marginBottom: spacing.lg,
  },
  // inputLabel style removed as per user request to remove labels
  textInput: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.neutral.white,
    fontSize: typography.sizes.default,
    color: colors.neutral.darkGray,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral.white,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 50, // Added a fixed height for better vertical alignment
  },
  // New style for the icon inside the input wrapper
  inputIcon: {
    marginRight: spacing.sm,
  },
  // New style for the text input that accommodates the icon
  iconTextInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.default,
    color: colors.neutral.darkGray,
  },
  // Used for password fields where the eye icon is also present
  passwordInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.default,
    color: colors.neutral.darkGray,
    marginRight: spacing.sm, // Add margin to separate text from eye icon
  },
  forgotPasswordText: {
    color: colors.primary.darkMint,
    textAlign: "right",
    marginBottom: spacing.sm,
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
  },
  animatedButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.large,
  },
  buttonText: {
    color: colors.neutral.white,
    textAlign: "center",
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
  },
  signupText: {
    textAlign: "center",
    color: colors.neutral.mediumGray,
    marginBottom: spacing.lg,
    fontSize: typography.sizes.small,
  },
  signupLink: {
    fontWeight: typography.weights.bold,
    color: colors.primary.darkMint,
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral.border,
  },
  orText: {
    marginHorizontal: spacing.md,
    color: "gray",
    fontSize: typography.sizes.small,
  },
  socialButton: {
    borderWidth: 1.5,
    borderColor: colors.primary.mint,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary.paleMint,
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: spacing.md,
  },
  socialButtonText: {
    color: colors.primary.darkMint,
    textAlign: "center",
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
  },
  // Re-used container for spacing between input fields
  inputFieldContainer: {
    marginBottom: spacing.md,
  },
  lightGrayBg: {
    backgroundColor: colors.primary.paleMint,
  },
  formCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.primary.softMint,
  },
  // Modal Styles for Email Verification
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    ...shadows.large,
  },
  modalTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.neutral.darkGray,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalText: {
    fontSize: typography.sizes.default,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalEmail: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.semibold,
    color: colors.primary.mint,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalInstruction: {
    fontSize: typography.sizes.small,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  modalNote: {
    fontSize: typography.sizes.small,
    color: colors.primary.mint,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  modalButtons: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary.mint,
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.mint,
  },
  errorText: {
  color: colors.feedback.error,
  fontSize: 12,
  marginTop: 4,
  marginLeft: 8,
},
  modalButtonText: {
    color: colors.neutral.white,
    fontSize: typography.sizes.default,
    fontWeight: typography.weights.semibold,
  },
  modalButtonTextSecondary: {
    color: colors.primary.mint,
    fontSize: typography.sizes.default,
    fontWeight: typography.weights.semibold,
  },
})