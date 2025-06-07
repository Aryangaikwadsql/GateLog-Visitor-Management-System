"use client"

import { useState, useEffect, useRef } from "react"
import { Settings } from "lucide-react"
import { motion } from "framer-motion"
import { Bell, User as UserIcon, Car, Clock, CheckCircle, XCircle } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useFirebase } from "@/app/firebase-provider"
import type { Visitor } from "@/types/user"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export default function ResidentDashboard() {
  const { user, logout } = useAuth()
  // Extend user type to include residentId and photoURL if needed
  const extendedUser = user as (typeof user & { residentId?: string; imageUrl?: string } | null)

  const [showSettings, setShowSettings] = useState(false)
  const { db, initialized } = useFirebase()
  const [visitors, setVisitors] = useState<Visitor[]>([])

  const [userImageUrl, setUserImageUrl] = useState<string | null>(null)
  const [showEditImage, setShowEditImage] = useState(false)
  const [selectedUserImage, setSelectedUserImage] = useState<File | null>(null)

  useEffect(() => {
    if (extendedUser?.imageUrl) {
      setUserImageUrl(extendedUser.imageUrl)
    } else {
      setUserImageUrl(null)
    }
  }, [extendedUser])

  const handleUserImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedUserImage(file)
    }
  }

  const uploadUserImage = async () => {
    if (!selectedUserImage || !db || !user) return

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

      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, { imageUrl })

      setUserImageUrl(imageUrl)
      setSelectedUserImage(null)
      setShowEditImage(false)

      toast.success("Profile image updated successfully.")
    } catch (error) {
      console.error("Error uploading user image:", error)
      toast.error("Failed to upload image.")
    }
  }
  const [notifications, setNotifications] = useState<any[]>([])
  const [lastShownVisitorId, setLastShownVisitorId] = useState<string | null>(null)
  const [shownVisitorIds, setShownVisitorIds] = useState<Set<string>>(new Set())
  const shownVisitorIdsRef = useRef<Set<string>>(new Set())
  // Fix for setEnlargedImage type error: ensure argument is string or null
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)
  const safeSetEnlargedImage = (url: string | undefined | null) => {
    setEnlargedImage(url ?? null)
  }
  const [showNotifications, setShowNotifications] = useState(false)
  const router = useRouter()

  const downloadVisitorsPdf = () => {
    if (visitors.length === 0) {
      toast.error("No visitors to export")
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
    if (!user || !db || !initialized) return

    console.log("ResidentDashboard: user residentId =", extendedUser?.residentId)
    console.log("ResidentDashboard: user info =", user)

    const setupVisitorListener = async () => {
      try {
        const { collection, query, where, onSnapshot, orderBy } = await import("firebase/firestore")
        const q = query(
          collection(db, "visitors"),
          where("residentId", "==", extendedUser?.residentId?.toString()), // Ensure string comparison
          // Removed societyId filter to revert to previous state
          orderBy("timestamp", "desc")
        );


        const unsubscribe = onSnapshot(q, (snapshot) => {
          const visitorData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
          })) as Visitor[]

          setVisitors(visitorData)

          if (visitorData.length > 0) {
            const latestVisitor = visitorData[0]

            // Call API to send visitor notification email
            const sendVisitorNotification = async (visitor: any, residentEmail: string) => {
              try {
                const response = await fetch("/api/send-visitor-notification", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ visitor, residentEmail }),
                })
                if (!response.ok) {
                  console.error("Failed to send visitor notification email")
                }
              } catch (error) {
                console.error("Error sending visitor notification email:", error)
              }
            }

            if (!shownVisitorIdsRef.current.has(latestVisitor.id)) {
              // Trigger email notification
              if (user?.email) {
                sendVisitorNotification(latestVisitor, user.email)
              }

              toast.custom(() => (
                <div className="bg-white shadow-lg rounded-lg p-4 flex items-center gap-4 max-w-sm border border-gray-200">
                  <img
                    src={latestVisitor.imageUrl || "/placeholder.svg"}
                    alt="Visitor"
                    className="w-14 h-14 rounded-full object-cover border cursor-pointer"
                    onClick={() => setEnlargedImage(latestVisitor.imageUrl || "/placeholder.svg")}
                  />
                  <div>
                    <p className="font-semibold">{latestVisitor.name}</p>
                    <p className="text-sm text-gray-600">{latestVisitor.purpose}</p>
                    {latestVisitor.vehicleNumber && (
                      <p className="text-xs text-gray-500">Vehicle: {latestVisitor.vehicleNumber}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {latestVisitor.timestamp.toLocaleDateString()} {latestVisitor.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
              setNotifications(prev => {
                if (prev.find(n => n.id === latestVisitor.id)) {
                  return prev
                }
                return [
                  {
                    id: latestVisitor.id,
                    title: `Visitor: ${latestVisitor.name}`,
                    message: latestVisitor.purpose,
                    imageUrl: latestVisitor.imageUrl || "/placeholder.svg",
                    timestamp: latestVisitor.timestamp,
                  },
                  ...prev,
                ]
              })
              shownVisitorIdsRef.current.add(latestVisitor.id)
              setShownVisitorIds(new Set(shownVisitorIdsRef.current))
            }
          }
        })

        return unsubscribe
      } catch (error) {
        console.error("Error setting up visitor listener:", error)
      }
    }

    setupVisitorListener()
  }, [user, db, initialized, lastShownVisitorId])

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  const closeImageModal = () => {
    setEnlargedImage(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const handleApproveVisitor = async (visitorId: string) => {
    if (!db) {
      toast.error("Database not initialized")
      return
    }
    try {
      const { doc, updateDoc } = await import("firebase/firestore")
      const visitorRef = doc(db, "visitors", visitorId)
      await updateDoc(visitorRef, { status: "approved" })
      toast.success("Visitor approved successfully!")
    } catch (error) {
      console.error("Error approving visitor:", error)
      toast.error("Failed to approve visitor.")
    }
  }

  const handleLogout = async () => {
    await logout()
    toast.success("Successfully logged out")
    router.push("/auth/sign-in") // Redirect to sign-in page
  }

  if (!initialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Initializing Firebase...</div>
      </div>
    )
  }

  if (!extendedUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center pt-2">
              <Image src="/logo.png" alt="GateLog" width={120} height={48} className="filter brightness-0" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative" onClick={toggleNotifications} style={{ cursor: "pointer" }}>
                <Bell className="h-6 w-6 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg z-50">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-gray-500">No new notifications</div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="p-4 border-b border-gray-200 hover:bg-gray-100 cursor-pointer">
                          <p className="font-semibold">{notification.title || "Notification"}</p>
                          <p className="text-sm text-gray-600">{notification.message || ""}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            <div className="text-sm flex items-center space-x-2">
              <div>
                <div className="font-medium">{user?.name}</div>
                <div className="text-gray-500">Resident ID: {extendedUser?.residentId || "N/A"}</div>
              </div>
              <div className="ml-4">
                {userImageUrl ? (
                  <img
                    src={userImageUrl}
                    alt="User Profile"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                    <UserIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
                  <button
                    onClick={() => setShowSettings(true)}
                    aria-label="Settings"
                    className="p-1 rounded hover:bg-gray-200"
                  >
                    <Settings className="h-6 w-6 text-gray-600" strokeWidth={1.5} />
                  </button>
                </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>

            {showSettings && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-6">
                  <h2 className="text-xl font-bold mb-4">User Registration Details</h2>
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
                    <p><strong>Resident ID:</strong> {extendedUser?.residentId || "N/A"}</p>
                  </div>

                  <button
                    onClick={() => setShowEditImage(!showEditImage)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                  >
                    {showEditImage ? "Cancel" : "Edit Profile Picture"}
                  </button>

                  {showEditImage && (
                    <div className="mt-4 space-y-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUserImageChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      {selectedUserImage && (
                        <img
                          src={URL.createObjectURL(selectedUserImage)}
                          alt="Selected"
                          className="w-32 h-32 rounded-full object-cover border border-gray-300"
                        />
                      )}
                      <button
                        onClick={uploadUserImage}
                        disabled={!selectedUserImage}
                        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
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
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}</h1>
          <p className="text-gray-600">Here's what's happening with your visitors today.</p>
        </motion.div>

        {enlargedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 cursor-pointer"
            onClick={closeImageModal}
          >
            <img src={enlargedImage} alt="Enlarged Visitor" className="max-w-[500px] max-h-[500px] rounded-lg shadow-lg" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{visitors.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    visitors.filter(
                      (v) =>
                        v.status === "approved" &&
                        new Date(v.timestamp).toDateString() === new Date().toDateString(),
                    ).length
                  }
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {visitors.filter((v) => v.status === "pending").length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Visitors</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {visitors.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No visitors yet. When someone visits, you'll see them here.
              </div>
            ) : (
              visitors.slice(0, 10).map((visitor) => (
                <div key={visitor.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {visitor.imageUrl ? (
                  <img
                    src={visitor.imageUrl}
                    alt={visitor.name}
                    className="h-12 w-12 rounded-full object-cover cursor-pointer"
                    onClick={() => safeSetEnlargedImage(visitor.imageUrl)}
                  />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{visitor.name}</p>
                        <p className="text-sm text-gray-600">{visitor.purpose}</p>
                        {visitor.vehicleNumber && (
                          <div className="flex items-center mt-1">
                            <Car className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">{visitor.vehicleNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{visitor.timestamp.toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">{visitor.timestamp.toLocaleTimeString()}</p>
                      </div>
                      {getStatusIcon(visitor.status)}
                      {/* Add approve button only if visitor is pending */}
                      {visitor.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleApproveVisitor(visitor.id)}
                          className="bg-green-600 hover:bg-green-700 text-white ml-2"
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
