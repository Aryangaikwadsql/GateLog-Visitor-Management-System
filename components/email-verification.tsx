"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mail, RefreshCw, CheckCircle } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useFirebase } from "@/app/firebase-provider"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

export default function EmailVerification() {
  const { firebaseUser, logout } = useAuth()
  const { auth, initialized } = useFirebase()
  const { toast } = useToast()
  const [sending, setSending] = useState(false)
  const [checkingVerification, setCheckingVerification] = useState(false)

  const handleResendVerification = async () => {
    if (!firebaseUser || !auth) return

    setSending(true)
    try {
      const { sendEmailVerification } = await import("firebase/auth")
      await sendEmailVerification(firebaseUser)
      toast({
        title: "Email Sent",
        description: "Verification email sent successfully",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification email",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleCheckVerification = async () => {
    if (!firebaseUser || !auth) return

    setCheckingVerification(true)
    try {
      await firebaseUser.reload()
      if (firebaseUser.emailVerified) {
        toast({
          title: "Success",
          description: "Email verified! Redirecting to dashboard...",
          variant: "success",
        })
        // The auth state change will automatically trigger the redirect
      } else {
        toast({
          title: "Not Verified",
          description: "Please check your email and click the verification link",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check verification status",
        variant: "destructive",
      })
    } finally {
      setCheckingVerification(false)
    }
  }

  // Auto-check verification status every 5 seconds
  useEffect(() => {
    if (!firebaseUser) return

    const interval = setInterval(async () => {
      try {
        await firebaseUser.reload()
        // The auth state listener will handle the redirect
      } catch (error) {
        console.error("Error checking verification status:", error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [firebaseUser])

  if (!initialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Initializing Firebase...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
          <div className="mb-6">
            <Image src="/logo.png" alt="GateLog" width={120} height={48} className="mx-auto filter brightness-0" />
          </div>

          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
            <p className="text-gray-600">
              We've sent a verification link to <strong>{firebaseUser?.email}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Please check your email and click the verification link to activate your account.
            </p>

            <Button
              onClick={handleCheckVerification}
              disabled={checkingVerification}
              className="w-full bg-black hover:bg-gray-800"
            >
              {checkingVerification ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  I've Verified My Email
                </>
              )}
            </Button>

            <Button onClick={handleResendVerification} disabled={sending} variant="outline" className="w-full">
              {sending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend Verification Email"
              )}
            </Button>

            <Button onClick={logout} variant="ghost" className="w-full">
              Sign Out
            </Button>
          </div>

          <div className="mt-6 text-xs text-gray-500">We'll automatically detect when you verify your email.</div>
        </div>
      </motion.div>
    </div>
  )
}
