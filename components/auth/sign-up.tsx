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

interface SignUpProps {
  onBack: () => void
  onSuccess: () => void
}

export default function SignUp({ onBack, onSuccess }: SignUpProps) {
  const { auth, db, initialized } = useFirebase()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "resident" as "resident" | "watchman" | "committee",
    residentId: "",
    phoneNumber: "",
    societyId: "", // added societyId input
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!auth || !db) {
      toast.error("Firebase not initialized")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    toast("Creating account...")

    try {
      const { createUserWithEmailAndPassword, sendEmailVerification } = await import("firebase/auth")
      const { doc, setDoc } = await import("firebase/firestore")

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)

      console.log("User created:", userCredential.user.uid)

      // Send email verification
      try {
        await sendEmailVerification(userCredential.user)
        console.log("Verification email sent")
        toast.success("Account created! Please verify your account via the email sent.")
      } catch (emailError) {
        console.error("Error sending verification email:", emailError)
        toast.error("Failed to send verification email. Please try again.")
      }

      // Save user profile to Firestore only after email verification (to be handled after sign-in)
      // Assign default societyId for watchman users during signup
      const societyIdForWatchman = "default-society-id" // Replace with actual logic or config

      const userData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        residentId: formData.residentId,
        phoneNumber: formData.phoneNumber,
        createdAt: new Date(),
      }
      if (formData.role === "watchman") {
        userData.societyId = societyIdForWatchman
      }

      await setDoc(doc(db, "users", userCredential.user.uid), userData)

      console.log("User profile saved to Firestore")

      onSuccess()
    } catch (error: any) {
      console.error("Sign up error:", error)
      if (error.code === "auth/email-already-in-use") {
        toast.error("Email already registered. Redirecting to sign in page...")
        setTimeout(() => {
          router.push("/auth/sign-in")
        }, 1500)
      } else {
        toast.error(error.message)
      }
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

          <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="h-12"
            />

            <Input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-12"
            />

            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
              required
            >
              <option value="resident">Resident</option>
              <option value="watchman">Watchman</option>
              <option value="committee">Committee Member</option>
            </select>
            <Input
              type="text"
              placeholder="Society ID"
              value={formData.societyId}
              onChange={(e) => setFormData({ ...formData, societyId: e.target.value })}
              required
              className="h-12 mt-2"
            />

            {formData.role === "resident" && (
              <Input
                type="text"
                placeholder="Apartment Number"
                value={formData.residentId}
                onChange={(e) => {
                  const val = e.target.value
                  if (/^\d{0,5}$/.test(val)) {
                    setFormData({ ...formData, residentId: val })
                  }
                }}
                required
                className="h-12"
              />
            )}

            <Input
              type="tel"
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChange={(e) => {
                const val = e.target.value
                if (/^\d{0,10}$/.test(val)) {
                  setFormData({ ...formData, phoneNumber: val })
                }
              }}
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

            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="h-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {formData.confirmPassword !== "" && formData.confirmPassword !== formData.password && (
              <p className="text-red-600 text-sm mt-1">Passwords do not match</p>
            )}

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
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
