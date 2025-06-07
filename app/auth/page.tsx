"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import AuthSelection from "@/components/auth/auth-selection"
import SignIn from "@/components/auth/sign-in"
import SignUp from "@/components/auth/sign-up"

export default function AuthPage() {
  const [mode, setMode] = useState<"selection" | "signIn" | "signUp">("selection")
  const router = useRouter()

  const handleSignInSuccess = () => {
    // Removed immediate redirection to avoid premature navigation
    // Redirection will be handled in sign-in page after user state update
  }

  const handleSignUpSuccess = () => {
    // Redirect to sign-in page or dashboard after sign up
    router.push("/auth")
  }

  const handleBack = () => {
    setMode("selection")
  }

  return (
    <>
      {mode === "selection" && (
        <AuthSelection
          onSignIn={() => setMode("signIn")}
          onSignUp={() => setMode("signUp")}
        />
      )}
      {mode === "signIn" && <SignIn onBack={handleBack} onSuccess={handleSignInSuccess} />}
      {mode === "signUp" && <SignUp onBack={handleBack} onSuccess={handleSignUpSuccess} />}
    </>
  )
}
