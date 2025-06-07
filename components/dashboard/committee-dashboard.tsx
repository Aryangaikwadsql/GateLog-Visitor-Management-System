"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, CheckCircle, XCircle, Clock, User, Car, Eye } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Toast } from "@/components/ui/toast"
import { useRouter } from "next/navigation"
import type { Visitor } from "@/types/user"
import { Settings } from "lucide-react"
import HeatmapChart from "@/components/ui/HeatmapChart"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export default function CommitteeDashboard() {
  const { user, logout, firebaseServices } = useAuth()
  const router = useRouter()
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")

  const [showSettings, setShowSettings] = useState(false)
  const [showEditImage, setShowEditImage] = useState(false)
  const [selectedUserImage, setSelectedUserImage] = useState<File | null>(null)
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null)

  // Prepare data for HeatmapChart
  const dates: string[] = []
  const hours: string[] = Array.from({ length: 24 }, (_, i) => i.toString())
  const heatmapData: number[][] = []

  // Generate last 7 days dates array in 'YYYY-MM-DD' format
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split("T")[0])
  }

  // Initialize heatmapData with zeros
  for (let i = 0; i < 24; i++) {
    heatmapData[i] = Array(7).fill(0)
  }

  // Aggregate visitor counts by date and hour
  visitors.forEach((visitor) => {
    const dateStr = visitor.timestamp.toISOString().split("T")[0]
    const hour = visitor.timestamp.getHours()
    const dateIndex = dates.indexOf(dateStr)
    if (dateIndex !== -1) {
      heatmapData[hour][dateIndex] += 1
    }
  })

  const downloadVisitorsPdf = () => {
    if (visitors.length === 0) {
      Toast({ title: "Error", description: "No visitors to export", variant: "destructive" })
      return
    }
    const doc = new jsPDF()
    doc.text("Visitors List", 14, 20)
    const tableColumn = ["Name", "Purpose", "Vehicle Number", "Status", "Timestamp"]
    const tableRows: any[] = []

    visitors.forEach(visitor => {
      const visitorData = [
        visitor.name,
        visitor.purpose,
        visitor.vehicleNumber || "N/A",
        visitor.status,
        visitor.timestamp.toLocaleString(),
      ]
      tableRows.push(visitorData)
    })

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    })

    doc.save("visitors_list.pdf")
  }

  useEffect(() => {
    if (!firebaseServices) return

    const setupVisitorListener = async () => {
      try {
        const { collection, query, onSnapshot, orderBy } = await import("firebase/firestore")
        const { db } = firebaseServices

        const q = query(collection(db, "visitors"), orderBy("timestamp", "desc"))

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const visitorData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
          })) as Visitor[]

          setVisitors(visitorData)
        })

        return unsubscribe
      } catch (error) {
        console.error("Error setting up visitor listener:", error)
      }
    }

    setupVisitorListener()
  }, [firebaseServices])

  const handleStatusUpdate = async (visitorId: string, status: "approved" | "rejected") => {
    if (!firebaseServices) return;

    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = firebaseServices;

      console.log("Updating visitor:", visitorId, { status }); // Log the update request

      await updateDoc(doc(db, "visitors", visitorId), { status });

      // Optimistic UI update
      setVisitors((prev) =>
        prev.map((v) => (v.id === visitorId ? { ...v, status } : v))
      );

      Toast({
        title: "Success",
        description: `Visitor ${status} successfully`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating visitor status:", error); // Log the error
      Toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update visitor status",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout() // Call the logout function
      Toast({ title: "Success", description: "Successfully logged out", variant: "success" })
      router.push("/auth/sign-in") // Redirect to sign-in page
    } catch (error) {
      Toast({ title: "Error", description: "Failed to log out", variant: "destructive" })
    }
  }

  if (!firebaseServices) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Initializing Firebase...</div>
      </div>
    )
  }

  const filteredVisitors = visitors.filter((visitor) => filter === "all" || visitor.status === filter)

  const stats = {
    total: visitors.length,
    pending: visitors.filter((v) => v.status === "pending").length,
    approved: visitors.filter((v) => v.status === "approved").length,
    rejected: visitors.filter((v) => v.status === "rejected").length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center pt-2">
              <Image src="/logo.png" alt="GateLog" width={120} height={48} className="filter brightness-0" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm flex items-center space-x-2">
                <div>
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-gray-500">Committee Member</div>
                </div>
                <button
                  onClick={() => setShowSettings(true)}
                  aria-label="Settings"
                  className="p-1 rounded hover:bg-gray-200 flex items-center justify-center"
                >
                  <Settings className="h-6 w-6 text-gray-600" strokeWidth={1.5} />
                </button>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-6">
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
              User Registration Details
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-2 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                  id="menu-button"
                  aria-expanded="true"
                  aria-haspopup="true"
                  onClick={() => setShowEditImage(!showEditImage)}
                >
                  &#x22EE;
                </button>
              </div>
            </h2>
            <div className="space-y-2">
              {userImageUrl && (
                <div className="mb-4 flex items-center justify-center">
                  <img
                    src={userImageUrl}
                    alt="User"
                    className="w-32 h-32 rounded-full object-cover border border-gray-300"
                  />
                </div>
              )}
              <p><strong>Name:</strong> {user?.name || "N/A"}</p>
              <p><strong>Email:</strong> {user?.email || "N/A"}</p>
              <p><strong>Role:</strong> Committee Member</p>
            </div>

            {showEditImage && (
              <div className="mt-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedUserImage(file)
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <button
                  onClick={async () => {
                    if (!selectedUserImage || !firebaseServices || !user) return

                    try {
                      const formDataCloudinary = new FormData()
                      formDataCloudinary.append("file", selectedUserImage)
                      formDataCloudinary.append("upload_preset", "unsigned_preset1")

                      const res = await fetch("https://api.cloudinary.com/v1_1/dscaahxio/image/upload", {
                        method: "POST",
                        body: formDataCloudinary,
                      })

                      if (!res.ok) throw new Error("Image upload failed")

                      const data = await res.json()
                      const imageUrl = data.secure_url

                      // Save imageUrl to Firestore user document
                      const { doc, updateDoc } = await import("firebase/firestore")
                      const { db } = firebaseServices

                      const userDocRef = doc(db, "users", user.uid)
                      await updateDoc(userDocRef, { imageUrl })

                      setUserImageUrl(imageUrl)
                      setSelectedUserImage(null)
                      setShowEditImage(false)

                      Toast({
                        title: "Success",
                        description: "Profile image updated successfully.",
                        variant: "success",
                      })
                    } catch (error) {
                      console.error("Error uploading user image:", error)
                      Toast({
                        title: "Error",
                        description: "Failed to upload image.",
                        variant: "destructive",
                      })
                    }
                  }}
                  disabled={!selectedUserImage}
                  className="mt-2 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  Upload Image
                </button>
              </div>
            )}

            <div className="border-t border-gray-300 pt-4">
              <button
                onClick={() => downloadVisitorsPdf()}
                className="mt-4 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
              >
                Download Visitors PDF
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visitor Statistics Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Committee Dashboard</h1>
          <p className="text-gray-600">Here's the overview of visitors.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Total Visitors</h3>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Pending Visitors</h3>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Approved Visitors</h3>
            <p className="text-2xl font-bold">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Rejected Visitors</h3>
            <p className="text-2xl font-bold">{stats.rejected}</p>
          </div>
        </div>

        {/* Render HeatmapChart */}
        <HeatmapChart data={heatmapData} dates={dates} hours={hours} />

        {/* Visitor List Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Visitor List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Name</th>
                  <th className="py-2 px-4 border-b">Purpose</th>
                  <th className="py-2 px-4 border-b">Vehicle Number</th>
                  <th className="py-2 px-4 border-b">Status</th>
                  <th className="py-2 px-4 border-b">Timestamp</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.map((visitor) => (
                  <tr key={visitor.id}>
                    <td className="py-2 px-4 border-b">{visitor.name}</td>
                    <td className="py-2 px-4 border-b">{visitor.purpose}</td>
                    <td className="py-2 px-4 border-b">{visitor.vehicleNumber || "N/A"}</td>
                    <td className="py-2 px-4 border-b">{visitor.status}</td>
                    <td className="py-2 px-4 border-b">{visitor.timestamp.toLocaleString()}</td>
                    <td className="py-2 px-4 border-b">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(visitor.id, visitor.status === "approved" ? "rejected" : "approved")}
                      >
                        {visitor.status === "approved" ? "Reject" : "Approve"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
