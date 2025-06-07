"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Camera, Upload, User, Plus, CheckCircle, XCircle, Clock, Settings } from "lucide-react" // Ensure Clock and Settings are imported
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import type { Visitor } from "@/types/user"
import { useFirebase } from "@/app/firebase-provider"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import HeatmapChart from "@/components/ui/HeatmapChart"

export default function WatchmanDashboard() {
  const { user, logout, firebaseServices } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if ((user as any)?.imageUrl) {
      setUserImageUrl((user as any).imageUrl)
    } else {
      setUserImageUrl(null)
    }
  }, [user])

  const handleUserImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedUserImage(file)
    }
  }

  const uploadUserImage = async () => {
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

      toast({
        title: "Success",
        description: "Profile image updated successfully.",
        variant: "success",
      })
    } catch (error) {
      console.error("Error uploading user image:", error)
      toast({
        title: "Error",
        description: "Failed to upload image.",
        variant: "destructive",
      })
    }
  }
  const [showEditImage, setShowEditImage] = useState(false)
  const [selectedUserImage, setSelectedUserImage] = useState<File | null>(null)
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null)

  // Prepare data for HeatmapChart
  const dates = React.useMemo(() => {
    const arr: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      arr.push(d.toISOString().split("T")[0])
    }
    return arr
  }, [])

  const hours: string[] = React.useMemo(() => Array.from({ length: 24 }, (_, i) => i.toString()), [])

  const heatmapData: number[][] = []

  // Initialize heatmapData with zeros
  for (let i = 0; i < 24; i++) {
    heatmapData[i] = Array(7).fill(0)
  }

  // Aggregate visitor counts by date and hour
  const memoizedHeatmapData = React.useMemo(() => {
    const data: number[][] = []
    for (let i = 0; i < 24; i++) {
      data[i] = Array(7).fill(0)
    }
    visitors.forEach((visitor) => {
      const dateStr = visitor.timestamp.toISOString().split("T")[0]
      const hour = visitor.timestamp.getHours()
      const dateIndex = dates.indexOf(dateStr)
      if (dateIndex !== -1) {
        data[hour][dateIndex] += 1
      }
    })
    return data
  }, [visitors, dates])

  const downloadVisitorsPdf = () => {
    if (visitors.length === 0) {
      toast({
        title: "Error",
        description: "No visitors to export",
        variant: "destructive",
      })
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

    // @ts-ignore
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    })

    doc.save("visitors_list.pdf")
  }

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    purpose: "",
    vehicleNumber: "",
    residentName: "",
    residentId: "", // resident/flat number
  })

  // State for resident name suggestions dropdown
  const [residentSuggestions, setResidentSuggestions] = useState<string[]>([])
  const [showResidentSuggestions, setShowResidentSuggestions] = useState(false)
  const [residentMap, setResidentMap] = useState<Record<string, { residentId: string; societyId: string }>>({}) // name -> {residentId, societyId} map

  // Fetch resident users from Firebase on mount
  useEffect(() => {
    if (!firebaseServices) return

    const fetchResidents = async () => {
      try {
        const { collection, getDocs, query, where } = await import("firebase/firestore")
        const { db } = firebaseServices

        const usersCollection = collection(db, "users")
        const usersQuery = query(usersCollection)
        const snapshot = await getDocs(usersQuery)

        const map: Record<string, { residentId: string; societyId: string }> = {}
        snapshot.forEach((doc) => {
          const data = doc.data() as any
          if (data.residentName && data.residentId && data.societyId) {
            map[data.residentName] = { residentId: data.residentId, societyId: data.societyId }
          }
        })

        setResidentMap(map)
      } catch (error) {
        console.error("Error fetching residents:", error)
      }
    }

    fetchResidents()
  }, [firebaseServices])

  // Filter resident suggestions based on input
  const updateResidentSuggestions = (input: string) => {
    if (!input) {
      setResidentSuggestions([])
      setShowResidentSuggestions(false)
      return
    }
    const filtered = Object.keys(residentMap).filter((name) =>
      name.toLowerCase().startsWith(input.toLowerCase())
    )
    setResidentSuggestions(filtered)
    setShowResidentSuggestions(filtered.length > 0)
  }

  // State for purpose suggestions dropdown
  const [purposeSuggestions, setPurposeSuggestions] = useState<string[]>([])
  const [showPurposeSuggestions, setShowPurposeSuggestions] = useState(false)

  // Compute frequency map of visitor purposes
  const purposeFrequencyMap: Record<string, number> = {}
  visitors.forEach((visitor) => {
    const p = visitor.purpose.toLowerCase()
    if (p) {
      purposeFrequencyMap[p] = (purposeFrequencyMap[p] || 0) + 1
    }
  })

  // Sorted purposes by frequency descending
  const sortedPurposes = Object.entries(purposeFrequencyMap)
    .sort((a, b) => b[1] - a[1])
    .map(([purpose]) => purpose)

  // Filter suggestions based on current input
  const updatePurposeSuggestions = (input: string) => {
    if (!input) {
      setPurposeSuggestions([])
      setShowPurposeSuggestions(false)
      return
    }
    const filtered = sortedPurposes.filter((p) => p.startsWith(input.toLowerCase()))
    setPurposeSuggestions(filtered)
    setShowPurposeSuggestions(filtered.length > 0)
  }

  useEffect(() => {
    if (!firebaseServices) return

    // Sync offline visitors when back online
    const syncOfflineVisitors = async () => {
      const offlineVisitors = JSON.parse(localStorage.getItem("offlineVisitors") || "[]")
      if (offlineVisitors.length === 0) return

      try {
        const { collection, addDoc } = await import("firebase/firestore")
        const { db } = firebaseServices

        for (const visitor of offlineVisitors) {
          await addDoc(collection(db, "visitors"), {
            ...visitor,
            timestamp: new Date(visitor.timestamp),
            status: "pending",
            addedBy: user?.uid,
          })
        }

        localStorage.removeItem("offlineVisitors")
        toast({
          title: "Offline Data Synced",
          description: "Offline visitor data has been synced to the server.",
          variant: "success",
        })
      } catch (error) {
        console.error("Error syncing offline visitors:", error)
        toast({
          title: "Sync Failed",
          description: "Failed to sync offline visitor data.",
          variant: "destructive",
        })
      }
    }

    const setupVisitorListener = async () => {
      try {
        const { collection, query, where, orderBy, onSnapshot } = await import("firebase/firestore")
        const { db } = firebaseServices

        const q = query(collection(db, "visitors"), where("societyId", "==", user?.societyId), orderBy("timestamp", "desc"))

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

    window.addEventListener("online", syncOfflineVisitors)

    setupVisitorListener()

    return () => {
      window.removeEventListener("online", syncOfflineVisitors)
    }
  }, [firebaseServices])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("handleSubmit called")

    // Offline-first support: check if online
    if (!navigator.onLine) {
      // Save visitor data locally in localStorage
      const offlineVisitors = JSON.parse(localStorage.getItem("offlineVisitors") || "[]")
      offlineVisitors.push({
        ...formData,
        timestamp: new Date().toISOString(),
        status: "pending",
        imagePreview,
      })
      localStorage.setItem("offlineVisitors", JSON.stringify(offlineVisitors))
      toast({
        title: "Offline",
        description: "Visitor data saved locally and will sync when online.",
        variant: "warning",
      })
      setShowAddForm(false)
      setFormData({
        name: "",
        phoneNumber: "",
        purpose: "",
        vehicleNumber: "",
        residentName: "",
        residentId: "",
      })
      setImageFile(null)
      setImagePreview(null)
      return
    }

    if (!firebaseServices) {
      toast({
        title: "Error",
        description: "Firebase not initialized",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let imageUrl = ""

      if (imageFile) {
        const formDataCloudinary = new FormData()
        formDataCloudinary.append("file", imageFile)
        formDataCloudinary.append("upload_preset", "unsigned_preset1")
        const res = await fetch("https://api.cloudinary.com/v1_1/dscaahxio/image/upload", {
          method: "POST",
          body: formDataCloudinary,
        })
        if (!res.ok) throw new Error("Image upload failed")
        const data = await res.json()
        imageUrl = data.secure_url
      }

      const { collection, addDoc, query, where, getDocs } = await import("firebase/firestore")
      const { db } = firebaseServices

      // Add visitor document
      const visitorDocRef = await addDoc(collection(db, "visitors"), {
        ...formData,
        residentId: formData.residentId, // ensure residentId is set correctly
        imageUrl,
        timestamp: new Date(),
        status: "pending", // new visitors start as pending
        addedBy: user?.uid,
        societyId: user?.societyId,
      })

      // Query resident user by residentId and societyId
      const usersQuery = query(
        collection(db, "users"),
        where("residentId", "==", formData.residentId),
        where("societyId", "==", user?.societyId)
      )
      const querySnapshot = await getDocs(usersQuery)

      if (!querySnapshot.empty) {
        const residentDoc = querySnapshot.docs[0]
        const residentData = residentDoc.data()
        const residentEmail = residentData.email

        // Call API to send visitor notification email
        console.log("Sending visitor notification email to:", residentEmail)
        console.log("Visitor data:", {
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          purpose: formData.purpose,
          vehicleNumber: formData.vehicleNumber,
          timestamp: new Date().toISOString(),
        })
        try {
          const response = await fetch("/api/send-visitor-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              visitor: {
                name: formData.name,
                phoneNumber: formData.phoneNumber,
                purpose: formData.purpose,
                vehicleNumber: formData.vehicleNumber,
                timestamp: new Date().toISOString(),
              },
              residentEmail,
            }),
          })
          if (!response.ok) {
            console.error("Failed to send visitor notification email:", await response.text())
          }
        } catch (error) {
          console.error("Error sending visitor notification email:", error)
        }
      }

      console.log("Visitor added successfully, closing form")
      setShowAddForm(false)
      setFormData({
        name: "",
        phoneNumber: "",
        purpose: "",
        vehicleNumber: "",
        residentName: "",
        residentId: "",
      })
      setImageFile(null)
      setImagePreview(null)
    } catch (error) {
      console.error("Error adding visitor:", error)
      toast({
        title: "Failed to add visitor",
        description: "",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Success",
        description: "Successfully logged out",
        variant: "success",
      })
      router.push("/auth/sign-in")
    } catch (error) {
      toast({
        title: "Error",
        description: "Logout failed",
        variant: "destructive",
      })
    }
  }

  // Panic button handler
  // Removed as per user request

  if (!firebaseServices) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Initializing Firebase...</div>
      </div>
    )
  }

  const handleVisitorStatusChange = async (visitorId: string, newStatus: string) => {
    if (!firebaseServices) {
      toast({
        title: "Error",
        description: "Firebase not initialized",
        variant: "destructive",
      })
      return
    }

    try {
      const { doc, getDoc, updateDoc } = await import("firebase/firestore")
      const { db } = firebaseServices

      const visitorDocRef = doc(db, "visitors", visitorId)
      const visitorDocSnap = await getDoc(visitorDocRef)
      if (!visitorDocSnap.exists()) {
        toast({
          title: "Error",
          description: "Visitor not found",
          variant: "destructive",
        })
        return
      }
      const visitorData = visitorDocSnap.data()

      // Update status while preserving residentId and societyId
      await updateDoc(visitorDocRef, {
        status: newStatus,
        residentId: visitorData.residentId,
        societyId: visitorData.societyId,
      })

      toast({
        title: "Success",
        description: `Visitor status updated to ${newStatus}`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error updating visitor status:", error)
      toast({
        title: "Error",
        description: "Failed to update visitor status",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 via-white to-indigo-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Image src="/logo.png" alt="GateLog" width={120} height={48} className="filter brightness-0 mt-2" />
            </div>
            <div className="flex items-center space-x-4">
            <div className="text-sm flex items-center space-x-2 font-sans">
              <div className="flex items-center space-x-2">
                {userImageUrl ? (
                  <img
                    src={userImageUrl}
                    alt="Watchman Profile"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                    <User className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-gray-500">Watchman</div>
                </div>
              </div>
              {/* Panic button removed as per user request */}
              {/* <button
                onClick={handlePanic}
                aria-label="Panic Button"
                className="p-1 rounded bg-red-600 hover:bg-red-700 flex items-center justify-center text-white"
                title="Panic Button"
              >
                Panic
              </button> */}
              <button
                onClick={() => setShowSettings(true)}
                aria-label="Settings"
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center"
              >
                <Settings className="h-6 w-6 text-gray-600" strokeWidth={1.5} />
              </button>
            </div>
              <Button onClick={handleLogout} className="btn-outline btn-sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
              <p><strong>Role:</strong> Watchman</p>
            </div>

            {showEditImage && (
              <div className="mt-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUserImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <button
                  onClick={uploadUserImage}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Visitor Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User  className="h-6 w-6 text-blue-600" />
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {visitors.filter((v) => v.status === "approved").length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {visitors.filter((v) => v.status === "rejected").length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Heatmap Chart */}
        <div className="mb-8" key={visitors.length}>
        <HeatmapChart dates={dates} hours={hours} data={memoizedHeatmapData} />
        </div>

        <div className="flex justify-between items-center mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-gray-900">Visitor Management</h1>
            <p className="text-gray-600">Add and manage visitor entries</p>
          </motion.div>

          <Button onClick={() => setShowAddForm(true)} className="bg-black hover:bg-gray-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Visitor
          </Button>
        </div>

        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Add New Visitor</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center">
                  <div className="mb-4">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Visitor preview"
                        className="w-32 h-32 rounded-full object-cover mx-auto"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="flex space-x-2 justify-center">
                    <Button type="button" onClick={() => fileInputRef.current?.click()} className="btn-outline btn-sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <Button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                    >
                      Clear Photo
                    </Button>
                  </div>
                </div>

                <Input
                  placeholder="Visitor Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoCapitalize="off"
                />
                <Input
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value
                    if (/^\d{0,10}$/.test(value)) {
                      setFormData({ ...formData, phoneNumber: value })
                    }
                  }}
                  maxLength={10}
                  required
                />
                <Input
                  placeholder="Purpose of Visit"
                  value={formData.purpose}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData({ ...formData, purpose: val })
                    updatePurposeSuggestions(val)
                  }}
                  onFocus={() => updatePurposeSuggestions(formData.purpose)}
                  onBlur={() => setTimeout(() => setShowPurposeSuggestions(false), 200)}
                  autoComplete="off"
                  autoCapitalize="off"
                  required
                  className="relative z-10 w-full max-w-full"
                />
                {showPurposeSuggestions && (
                  <ul className="absolute z-10 bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto w-full mt-1 text-sm shadow-lg" style={{width: '100%'}}>
                    {purposeSuggestions.map((suggestion) => (
                      <li
                        key={suggestion}
                        className="px-3 py-1 cursor-pointer hover:bg-gray-200"
                        onMouseDown={() => {
                          setFormData({ ...formData, purpose: suggestion })
                          setShowPurposeSuggestions(false)
                        }}
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
                <Input
                  placeholder="Vehicle Number"
                  value={formData.vehicleNumber}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase()
                    if (
                      /^([A-Z]{0,2})$/.test(value) ||
                      /^[A-Z]{2}\d{0,2}$/.test(value) ||
                      /^[A-Z]{2}\d{2}[A-Z]{0,2}$/.test(value) ||
                      /^[A-Z]{2}\d{2}[A-Z]{2}\d{0,4}$/.test(value) ||
                      value === ""
                    ) {
                      setFormData({ ...formData, vehicleNumber: value })
                    }
                  }}
                  maxLength={10}
                />
                <Input
                  placeholder="Resident Name"
                  value={formData.residentName}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData({ ...formData, residentName: val })
                    updateResidentSuggestions(val)
                  }}
                  onFocus={() => updateResidentSuggestions(formData.residentName)}
                  onBlur={() => setTimeout(() => setShowResidentSuggestions(false), 200)}
                  autoComplete="off"
                  required
                />
                {showResidentSuggestions && (
                  <ul className="absolute z-10 bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto w-full mt-1 text-sm shadow-lg">
                    {residentSuggestions.map((suggestion) => (
                      <li
                        key={suggestion}
                        className="px-3 py-1 cursor-pointer hover:bg-gray-200"
                        onMouseDown={() => {
                  setFormData({
                    ...formData,
                    residentName: suggestion,
                    residentId: residentMap[suggestion]?.residentId || "",
                  })
                  setShowResidentSuggestions(false)
                        }}
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
                <Input
                  placeholder="Resident ID / Flat Number"
                  value={formData.residentId}
                  onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                  required
                />

                <div className="flex justify-between">
<Button
  type="button"
  className="btn-outline"
  onClick={() => {
    setShowAddForm(false)
    setFormData({
      name: "",
      phoneNumber: "",
      purpose: "",
      vehicleNumber: "",
      residentName: "",
      residentId: "",
    })
    setImageFile(null)
    setImagePreview(null)
  }}
  disabled={loading}
>
  Cancel
</Button>
<Button type="submit" className="btn-outline" disabled={loading}>
  {loading ? "Saving..." : "Save"}
</Button>
                </div>
              </form>
            </div>
          </div>
        )}

            <motion.div layout className="space-y-4 font-light text-gray-700 font-sans">
              {visitors.map((visitor) => (
                <motion.div
                  key={visitor.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white p-4 rounded-md shadow flex items-center space-x-4"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {visitor.imageUrl ? (
                      <Image src={visitor.imageUrl} alt={visitor.name} width={64} height={64} />
                    ) : (
                      <User  className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                <div className="flex-1 font-sans">
                  <div className="text-base font-medium text-gray-900">{visitor.name}</div>
                  <div className="text-base text-gray-600">
                    Phone: {visitor.phoneNumber} | Vehicle: {visitor.vehicleNumber || "N/A"}
                  </div>
                  <div className="text-base text-gray-600">Purpose: {visitor.purpose}</div>
                  <div className="text-base text-gray-600">
                    Resident: {visitor.residentName} | Flat: {visitor.residentId}
                  </div>
                  <div className="text-base text-gray-500">
                    {visitor.timestamp.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      visitor.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : visitor.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {visitor.status}
                  </span>
                  {/* Removed approve/reject buttons for watchman as per user request */}
                </div>
                </motion.div>
              ))}
            </motion.div>
      </div>
    </div>
  )
}
