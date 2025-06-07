"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface FirebaseContextType {
  auth: any
  db: any
  storage: any
  initialized: boolean
}

const FirebaseContext = createContext<FirebaseContextType>({
  auth: null,
  db: null,
  storage: null,
  initialized: false,
})

export const useFirebase = () => useContext(FirebaseContext)

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebaseServices, setFirebaseServices] = useState<{
    auth: any
    db: any
    storage: any
  } | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let isMounted = true

    const initializeFirebase = async () => {
      if (typeof window === "undefined") return

      try {
        // Dynamic imports
        const firebaseApp = await import("firebase/app")
        const firebaseAuth = await import("firebase/auth")
        const firebaseFirestore = await import("firebase/firestore")
        const firebaseStorage = await import("firebase/storage")

        const { initializeApp, getApps } = firebaseApp

        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
        }

        // Initialize Firebase
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
        const auth = firebaseAuth.getAuth(app)
        const db = firebaseFirestore.getFirestore(app)
        const storage = firebaseStorage.getStorage(app)

        if (isMounted) {
          setFirebaseServices({ auth, db, storage })
          setInitialized(true)
          console.log("Firebase initialized successfully")
        }
      } catch (error) {
        console.error("Firebase initialization error:", error)
        if (isMounted) {
          setInitialized(true) // Mark as initialized even on error to prevent infinite loading
        }
      }
    }

    initializeFirebase()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <FirebaseContext.Provider
      value={{
        ...firebaseServices,
        initialized,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  )
}
