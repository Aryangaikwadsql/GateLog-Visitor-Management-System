import { NextRequest, NextResponse } from "next/server"
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"
import { initializeApp, getApps, getApp } from "firebase/app"

const firebaseConfig = {
  // Your Firebase config here
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(app)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { societyId, userId } = body

    if (!societyId && !userId) {
      return NextResponse.json({ error: "societyId or userId is required" }, { status: 400 })
    }

    let q = null
    if (societyId) {
      q = query(collection(db, "visitors"), where("societyId", "==", societyId))
    } else if (userId) {
      q = query(collection(db, "visitors"), where("addedBy", "==", userId))
    }

    if (!q) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 })
    }

    const snapshot = await getDocs(q)
    const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(doc(db, "visitors", docSnap.id)))
    await Promise.all(deletePromises)

    return NextResponse.json({ message: "Visitor data deleted successfully" })
  } catch (error) {
    console.error("Error deleting visitor data:", error)
    return NextResponse.json({ error: "Failed to delete visitor data" }, { status: 500 })
  }
}
