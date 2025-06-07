"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useFirebase } from "@/app/firebase-provider"
import type { User } from "@/types/user"
import { toast } from "sonner"

interface AuthContextType {
  user: User | null
  firebaseUser: any | null
  firebaseServices: {
    auth: any
    db: any
    storage: any
  } | null
  loading: boolean
  logout: () => Promise<void>
  setUser: React.Dispatch<React.SetStateAction<User | null>>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  firebaseServices: null,
  loading: true,
  logout: async () => {},
  setUser: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const { auth, db, storage, initialized } = useFirebase()

  // rest unchanged

  useEffect(() => {
    if (!initialized) {
      setLoading(true)
      return
    }

    if (!auth || !db) {
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined

    const setupAuthListener = async () => {
      try {
        const { onAuthStateChanged } = await import("firebase/auth")
        const { doc, getDoc } = await import("firebase/firestore")

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log("Auth state changed:", firebaseUser?.uid, firebaseUser?.emailVerified)
          setFirebaseUser(firebaseUser)

          if (firebaseUser) {
            try {
              const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
                if (userDoc.exists()) {
                  const userData = userDoc.data() as Omit<User, "uid">
                  const fullUser = {
                    uid: firebaseUser.uid,
                    ...userData,
                    residentId: userData.residentId || "",
                    // Removed societyId to revert to previous state
                    emailVerified: firebaseUser.emailVerified,
                  }
                  console.log("User profile loaded:", fullUser)
                  if (!firebaseUser.emailVerified) {
                    console.log("Email not verified, signing out user")
                    const { signOut } = await import("firebase/auth")
                    await signOut(auth)
                    setUser(null)
                    setFirebaseUser(null)
                    setLoading(false)
                    return
                  }
                  setUser(fullUser)
                } else {
                  console.log("User profile not found in Firestore")
                  setUser(null)
                  // Call API to delete visitor data for this user
                  fetch("/api/delete-visitor-data", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: firebaseUser.uid }),
                  }).then((res) => {
                    if (!res.ok) {
                      console.error("Failed to delete visitor data")
                    } else {
                      console.log("Visitor data deleted due to missing user profile")
                    }
                  }).catch((error) => {
                    console.error("Error deleting visitor data:", error)
                  })
                  toast.error("User profile not found. Please contact support.")
                }
            } catch (error) {
              console.error("Error fetching user data:", error)
              setUser(null)
            }
          } else {
            console.log("User signed out")
            setUser(null)
          }

          setLoading(false)
        })
      } catch (error) {
        console.error("Error setting up auth listener:", error)
        setLoading(false)
      }
    }

    setupAuthListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [auth, db, initialized])

  const logout = async () => {
    if (!auth) return

    try {
      const { signOut } = await import("firebase/auth")
      await signOut(auth)
      setUser(null)
      setFirebaseUser(null)
      console.log("User logged out")
      toast.success("Logged out successfully")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to log out")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        firebaseServices: { auth, db, storage },
        loading: loading || !initialized,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
