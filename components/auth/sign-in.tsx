"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useFirebase } from "@/app/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

interface SignInProps {
  onBack: () => void
  onSuccess: () => void
}

export default function SignIn({ onBack, onSuccess }: SignInProps) {
  const { auth, db, initialized } = useFirebase()
  const { setUser } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Starting sign in process...")

    if (!auth) {
      console.error("Firebase auth is not initialized")
      toast.error("Firebase not initialized")
      return
    }

    setLoading(true)

    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth")
      console.log("Attempting to sign in with email:", formData.email)
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)

      console.log("Sign in successful:", userCredential.user.uid)

      if (!userCredential.user.emailVerified) {
        console.log("Email not verified, signing out user")
        toast.error("Please verify your email before signing in.")
        const { signOut } = await import("firebase/auth")
        await signOut(auth)
        setLoading(false)
        return
      }

      toast.success("Welcome back!")

      // Fetch user role from Firestore and update app state
      try {
        const { doc, getDoc } = await import("firebase/firestore")
        console.log("Fetching user data from Firestore...")
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          console.log("Successfully fetched user data:", userData)
          setUser({
            uid: userCredential.user.uid,
            email: userData.email || "",
            role: userData.role || "",
            name: userData.name || "",
            emailVerified: userCredential.user.emailVerified,
            societyId: userData.societyId || "",
          })
          // Redirect based on role immediately after setting user
          const role = (userData.role || "").toLowerCase()
          if (role === "resident") {
            router.push("/dashboard/resident")
          } else if (role === "watchman") {
            router.push("/dashboard/watchman")
          } else if (role === "committee") {
            router.push("/dashboard/committee")
          } else {
            toast.error("User role is not defined")
          }
        } else {
          console.log("No user document found in Firestore")
          setUser(null)
        }
      } catch (firestoreError) {
        console.error("Error fetching user role:", firestoreError)
        setUser(null)
        onSuccess()
      }
    } catch (error: any) {
      console.error("Sign in error:", error)
      toast.error("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  if (!initialized) {
    return <></>
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2 hover:bg-gray-100">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 flex justify-center">
              <Image src="/logo.png" alt="GateLog" width={120} height={48} className="filter brightness-0" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="h-12"
          />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-black hover:bg-gray-800 text-white font-semibold flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              className="text-sm text-gray-600 hover:text-black"
              onClick={async () => {
                if (!auth) {
                  toast.error("Firebase not initialized")
                  return
                }
                if (!formData.email) {
                  toast.error("Please enter your email address")
                  return
                }
                try {
                  const { sendPasswordResetEmail } = await import("firebase/auth")
                  await sendPasswordResetEmail(auth, formData.email)
                  toast.success("Password reset email sent")
                } catch (error) {
                  console.error("Error sending password reset email:", error)
                  toast.error("Failed to send password reset email")
                }
              }}
            >
              Forgot your password?
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
