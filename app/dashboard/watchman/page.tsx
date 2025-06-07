"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import WatchmanDashboard from "@/components/dashboard/watchman-dashboard"
import LoadingSpinner from "@/components/ui/loading-spinner"

export default function WatchmanDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/auth/sign-in")
      } else if (user.role !== "watchman") {
        switch (user.role) {
          case "resident":
            router.replace("/dashboard/resident")
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

  if (loading || !user || user.role !== "watchman") {
    return <LoadingSpinner />
  }

  return <WatchmanDashboard />
}
