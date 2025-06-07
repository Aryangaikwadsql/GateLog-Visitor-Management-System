"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import ResidentDashboard from "@/components/dashboard/resident-dashboard"
import LoadingSpinner from "@/components/ui/loading-spinner"

export default function ResidentDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/auth/sign-in")
      } else if (user.role !== "resident") {
        switch (user.role) {
          case "watchman":
            router.replace("/dashboard/watchman")
            break
          case "committee":
            router.replace("/dashboard/committee")
            break
          default:
            router.replace("/auth/sign-in")
        }
      }
    }
  }, [user, loading, router])

  if (loading || !user || user.role !== "resident") {
    return <LoadingSpinner />
  }

  return <ResidentDashboard />
}
