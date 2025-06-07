"use client"

import { useRouter } from "next/navigation"
import SignUp from "@/components/auth/sign-up"
import { useAuth } from "@/contexts/auth-context"

export default function SignUpPage() {
  const router = useRouter()
  const { loading } = useAuth()

  const handleBack = () => {
    router.push("/auth")
  }

  const handleSuccess = () => {
    router.push("/auth/sign-in")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="loader"></div>
      </div>
    )
  }

  return <SignUp onBack={handleBack} onSuccess={handleSuccess} />
}
