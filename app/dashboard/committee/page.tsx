"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import CommitteeDashboard from "@/components/dashboard/committee-dashboard"
import LoadingSpinner from "@/components/ui/loading-spinner"

export default function CommitteeDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/auth/sign-in")
      } else if (user.role !== "committee") {
        switch (user.role) {
          case "watchman":
            router.replace("/dashboard/watchman")
            break
          case "resident":
            router.replace("/dashboard/resident")
            break
          default:
            router.replace("/auth/sign-in")
        }
      }
    }
  }, [user, loading, router])

  if (loading || !user || user.role !== "committee") {
    return <LoadingSpinner />
  }

  return <CommitteeDashboard />
}
