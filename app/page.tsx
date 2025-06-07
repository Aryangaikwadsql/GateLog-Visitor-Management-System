"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import IntroPage from "@/components/intro-page"
import AuthSelection from "@/components/auth/auth-selection"
import SignIn from "@/components/auth/sign-in"
import SignUp from "@/components/auth/sign-up"
import ResidentDashboard from "@/components/dashboard/resident-dashboard"
import WatchmanDashboard from "@/components/dashboard/watchman-dashboard"
import CommitteeDashboard from "@/components/dashboard/committee-dashboard"
import EmailVerification from "@/components/email-verification"

type AppState = "intro" | "auth-selection" | "sign-in" | "sign-up" | "dashboard" | "email-verification"

export default function Home() {
  const [appState, setAppState] = useState<AppState>("intro")
  const [mounted, setMounted] = useState(false)
  const { user, firebaseUser, loading } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle authentication state changes
  useEffect(() => {
    if (!mounted || loading) return

    console.log("Auth state changed:", { user, firebaseUser, loading })

    if (firebaseUser) {
      // User is signed in
      if (!firebaseUser.emailVerified) {
        console.log("User not verified, showing verification page")
        setAppState("email-verification")
      } else if (user) {
        console.log("User verified and profile loaded, showing dashboard")
        setAppState("dashboard")
      }
    } else {
      // User is not signed in
      if (appState !== "intro") {
        console.log("User not signed in, showing auth selection")
        setAppState("auth-selection")
      }
    }
  }, [user, firebaseUser, loading, mounted, appState])

  if (!mounted || loading) {
    return <></>
  }

  const handleSignInSuccess = () => {
    console.log("Sign in successful")
    setAppState("dashboard")
  }

  const handleSignUpSuccess = () => {
    console.log("Sign up successful")
    setAppState("auth-selection")
  }

  const renderCurrentState = () => {
    switch (appState) {
      case "intro":
        return <IntroPage onComplete={() => setAppState("auth-selection")} />
      case "auth-selection":
        return <AuthSelection />
      case "sign-in":
        return <SignIn onBack={() => setAppState("auth-selection")} onSuccess={handleSignInSuccess} />
      case "sign-up":
        return <SignUp onBack={() => setAppState("auth-selection")} onSuccess={handleSignUpSuccess} />
      case "dashboard":
        if (user?.role === "resident") return <ResidentDashboard />
        if (user?.role === "watchman") return <WatchmanDashboard />
        if (user?.role === "committee") return <CommitteeDashboard />
        return <ResidentDashboard />
      case "email-verification":
        return <EmailVerification />
      default:
        return <AuthSelection />
    }
  }

  return (
    <>
      {renderCurrentState()}
    </>
  )
}
