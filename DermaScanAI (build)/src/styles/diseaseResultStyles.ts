import { StyleSheet } from "react-native"
import { colors, typography, spacing, shadows } from "./theme"

export const diseaseResultStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.disease.lightBg,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },

  loadingSpinner: {
    marginBottom: spacing.xl,
  },

  loadingText: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.semibold,
    color: colors.disease.darkTeal,
    marginBottom: spacing.sm,
  },

  loadingSubText: {
    fontSize: typography.sizes.default,
    color: colors.neutral.mediumGray,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    paddingTop: 20,   // ✅ Added extra top space
    minHeight: 50,   // Fixed height to prevent jumping
    ...shadows.small,
  },

  backBtn: {
    padding: spacing.sm,
  },

  headerTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.neutral.white,
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.3,
  },

  saveBtn: {
    padding: spacing.sm,
  },

  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 30,
  },

  card: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    minHeight: 100,  // Prevent layout jumping
    ...shadows.small,
  },

  whiteCard: {
    backgroundColor: colors.neutral.white,
  },

  concernCard: {
    marginBottom: spacing.xl,
  },

  concernContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: spacing.lg,
    overflow: "hidden",
    marginRight: spacing.lg,
    borderWidth: 2,
    borderColor: colors.disease.darkTeal,
    ...shadows.small,
  },

  concernImage: {
    width: "100%",
    height: "100%",
  },

  concernText: {
    flex: 1,
  },

  concernHeader: {
    fontSize: typography.sizes.small,
    color: colors.neutral.mediumGray,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
  },

  concernName: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.disease.darkTeal,
    marginTop: 2,
    marginBottom: spacing.sm,
  },

  matchBadge: {
    backgroundColor: colors.disease.darkTeal,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: "flex-start",
  },

  matchPercentage: {
    fontSize: typography.sizes.small,
    color: colors.neutral.white,
    fontWeight: typography.weights.semibold,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  headerIcon: {
    marginRight: spacing.md,
  },

  sectionHeaderText: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.disease.darkTeal,
    letterSpacing: 0.3,
  },

  understandingContent: {
    marginTop: spacing.md,
  },

  understandingItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  bottomItem: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },

  understandingLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.disease.darkTeal,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },

  understandingText: {
    fontSize: typography.sizes.default,
    color: colors.neutral.mediumGray,
    lineHeight: 20,
  },

  subheader: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.disease.darkTeal,
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },

  recommendationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: spacing.lg,
    backgroundColor: colors.disease.lightBg,
  },

  recommendedItem: {
    backgroundColor: colors.disease.lightCardBg,
  },

  recommendationLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  recommendationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },

  iconRecommended: {
    backgroundColor: "#4CAF50",
  },

  iconNotRecommended: {
    backgroundColor: "#FF5722",
  },

  recommendationText: {
    fontSize: typography.sizes.small,
    color: colors.neutral.mediumGray,
    flex: 1,
  },

  recommendedText: {
    color: colors.primary.midMint,
    fontWeight: typography.weights.semibold,
  },

  badgeStatus: {
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  badgeGreen: {
    backgroundColor: colors.disease.cardGradientEnd,
  },

  badgeRed: {
    backgroundColor: "#ffccbc",
  },

  badgeText: {
    fontSize: typography.sizes.tiny,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.darkGray,
  },

  disclaimerCard: {
    flexDirection: "row",
    backgroundColor: colors.disease.alertBg,
    borderRadius: spacing.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.disease.alertBorder,
  },

  disclaimerIcon: {
    marginRight: spacing.md,
  },

  disclaimerText: {
    fontSize: typography.sizes.small,
    color: colors.neutral.mediumGray,
    lineHeight: 18,
    flex: 1,
    fontStyle: "italic",
  },

  // Section containers for a more "report-like" structure
  sectionBox: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.neutral.offWhite,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
  },
  sectionBoxPrimary: {
    backgroundColor: colors.disease.lightCardBg,
    borderColor: colors.disease.cardGradientEnd,
  },
  sectionBoxWarning: {
    backgroundColor: colors.disease.alertBg,
    borderColor: colors.disease.alertBorder,
  },
  sectionTag: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: typography.sizes.tiny,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.white,
    backgroundColor: colors.disease.darkTeal,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  ctaButton: {
    borderRadius: spacing.xl,
    overflow: "hidden",
    marginBottom: spacing.xl,
    ...shadows.large,
  },

  ctaGradient: {
    flexDirection: "row",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },

  ctaText: {
    color: colors.neutral.white,
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    marginRight: spacing.md,
    letterSpacing: 0.3,
  },

  // deleteButton removed
})

