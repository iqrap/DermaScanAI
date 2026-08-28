import { StyleSheet } from "react-native"
import { spacing, borderRadius } from "./theme"

export const cameraStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {
    borderWidth: 3,
    width: "80%",
    height: "50%",
    borderRadius: borderRadius.lg,
    justifyContent: "flex-end",
    alignItems: "flex-start",
    overflow: "hidden",
  },
  feedback: {
    marginTop: spacing.lg,
    fontSize: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  progressBackground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 6,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressFill: {
    height: "100%",
    width: "0%",
  },
})
