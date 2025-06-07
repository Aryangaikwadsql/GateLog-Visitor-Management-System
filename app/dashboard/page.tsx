"use client"

import { useAuth } from "@/contexts/auth-context"
import ResidentDashboard from "@/components/dashboard/resident-dashboard"
import WatchmanDashboard from "@/components/dashboard/watchman-dashboard"
import CommitteeDashboard from "@/components/dashboard/committee-dashboard"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "resident":
          router.replace("/dashboard/resident")
          break
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
  }, [user, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700">
        <h2 className="text-xl font-semibold mb-4">Access Restricted</h2>
        <p className="mb-2">You must be signed in to view the dashboard.</p>
        <p>
          Please{" "}
          <a href="/auth/sign-in" className="text-indigo-600 underline">
            sign in
          </a>{" "}
          to continue.
        </p>
      </div>
    )
  }

  return null
}
