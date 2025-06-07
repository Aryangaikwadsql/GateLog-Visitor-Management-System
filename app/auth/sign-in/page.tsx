"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import SignIn from "@/components/auth/sign-in"

export default function SignInPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    console.log("SignInPage useEffect - user:", user, "loading:", loading)
    if (!loading && user) {
      console.log("Redirecting based on user role:", user.role)
      if (!user.role) {
        console.error("User role is undefined or empty, redirecting to sign-in")
        router.push("/auth/sign-in")
        return
      }
      switch (user.role) {
        case "resident":
          router.push("/dashboard/resident")
          break
        case "watchman":
          router.push("/dashboard/watchman")
          break
        case "committee":
          router.push("/dashboard/committee")
          break
        default:
          router.push("/dashboard")
      }
    }
  }, [user, loading, router])

  const handleBack = () => {
    router.push("/auth")
  }

  const handleSuccess = () => {
    console.log("Sign in success callback triggered")
    // Removed immediate redirect to allow useEffect to handle it after user state updates
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="loader"></div>
      </div>
    )
  }

  return <SignIn onBack={handleBack} onSuccess={handleSuccess} />
}
