import { auth } from "../config/firebase"

// Get current user ID or fallback to "unknown-user"
export const getCurrentUserId = (): string => {
  const currentUser = auth.currentUser
  if (!currentUser) {
    console.warn("No user is currently logged in")
    return "unknown-user"
  }
  return currentUser.uid
}

// Get current user email or null if not available
export const getCurrentUserEmail = (): string | null => {
  return auth.currentUser?.email || null
}