// src/utils/firestoreUtils.ts
import { db, auth } from "../config/firebase"
import { collection, doc, setDoc, getDocs, query, where, orderBy, getDoc, writeBatch } from "firebase/firestore"
import type { SkinRoutine } from "./routineUtils"

const getUserId = (): string | null => {
  const user = auth.currentUser
  if (!user) {
    console.log("⚠️ User not authenticated")
    return null
  }
  return user.uid
}

//  Batch sync all routines to Firestore (more efficient)
export const syncRoutinesToFirestore = async (routines: SkinRoutine[]) => {
  try {
    const userId = getUserId()
    
    if (!userId) {
      console.log("⚠️ User not authenticated, skipping Firestore sync")
      return false
    }
    
    const batch = writeBatch(db)
    
    for (const routine of routines) {
      const docRef = doc(db, "userRoutines", `${userId}_${routine.id}`)
      const docData = { 
        ...routine, 
        userId, 
        lastSyncedAt: Date.now()
      }
      batch.set(docRef, docData, { merge: true })
    }
    
    await batch.commit()
    console.log(`✅ Synced ${routines.length} routines to Firestore`)
    return true
  } catch (error: any) {
    console.error("Error syncing routines to Firestore:", error?.message || error)
    return false
  }
}

export const saveToFirestore = async (collectionName: string, data: any, customId?: string) => {
  try {
    const userId = getUserId()
    
    if (!userId) {
      console.log("⚠️ User not authenticated, skipping Firestore save")
      return null
    }
    
    const docData = { 
      ...data, 
      userId, 
      updatedAt: Date.now()
    }
    
    // 🔥 IMPROVED: Include userId in document ID for better organization
    const finalId = customId ? `${userId}_${customId}` : `${userId}_${Date.now()}`
    await setDoc(doc(db, collectionName, finalId), docData, { merge: true })
    
    console.log(`✅ Saved to ${collectionName}`)
    return finalId
  } catch (error: any) {
    console.error("Error saving to Firestore:", error?.message || error)
    return null
  }
}

export const getUserData = async (collectionName: string) => {
  try {
    const userId = getUserId()
    
    if (!userId) {
      console.log("⚠️ User not authenticated, returning empty data")
      return []
    }
    
    const q = query(
      collection(db, collectionName),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id.replace(`${userId}_`, ''), ...doc.data() }))
  } catch (error: any) {
    console.error("Error getting data:", error?.message || error)
    return []
  }
}

// 🔥 NEW: Get routines specifically for current user from Firestore
export const getUserRoutinesFromFirestore = async (): Promise<SkinRoutine[]> => {
  try {
    const userId = getUserId()
    
    if (!userId) {
      return []
    }
    
    const q = query(
      collection(db, "userRoutines"),
      where("userId", "==", userId)
    )
    
    const snapshot = await getDocs(q)
    const routines = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: data.id // Keep original ID
      } as SkinRoutine
    })
    
    return routines
  } catch (error: any) {
    console.error("Error getting user routines:", error?.message || error)
    return []
  }
}

export const getLatestSkinResult = async () => {
  try {
    const userId = getUserId()
    
    if (!userId) {
      console.log("⚠️ User not authenticated, returning null")
      return null
    }
    
    const q = query(
      collection(db, "skinTypeResults"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const latestDoc = snapshot.docs[0]
    return { id: latestDoc.id, ...latestDoc.data() }
  } catch (error: any) {
    console.error("Error getting latest skin result:", error?.message || error)
    return null
  }
}

export const getSkinResultById = async (resultId: string) => {
  try {
    const docRef = doc(db, "skinTypeResults", resultId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
    return null
  } catch (error: any) {
    console.error("Error getting skin result:", error?.message || error)
    return null
  }
}