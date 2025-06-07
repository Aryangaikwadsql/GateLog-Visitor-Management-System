"use client"

"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Camera, Upload, User, Car, Plus } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import type { Visitor } from "@/types/user"
import ResidentDashboard from "./resident-dashboard"
import WatchmanDashboard from "./watchman-dashboard"
import CommitteeDashboard from "./committee-dashboard"

export default function CommonDashboard() {
  const { user, logout, firebaseServices } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  console.log("CommonDashboard user:", user)
  console.log("CommonDashboard user role:", user?.role)

  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    purpose: "",
    vehicleNumber: "",
    residentName: "",
    residentId: "",
  })

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

  useEffect(() => {
    if (!firebaseServices) return

    const setupVisitorListener = async () => {
      try {
        const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore")
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
        const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage")
        const { storage } = firebaseServices
        const imageRef = ref(storage, `visitors/${Date.now()}_${imageFile.name}`)
        await uploadBytes(imageRef, imageFile)
        imageUrl = await getDownloadURL(imageRef)
      }

      const { collection, addDoc } = await import("firebase/firestore")
      const { db } = firebaseServices

      await addDoc(collection(db, "visitors"), {
        ...formData,
        imageUrl,
        timestamp: new Date(),
        status: "pending",
        addedBy: user?.uid,
      })

      toast({
        title: "Success",
        description: "Visitor added successfully",
        variant: "success",
      })

      // Reset form
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
      setShowAddForm(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add visitor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!firebaseServices) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Initializing Firebase...</div>
      </div>
    )
  }

  const renderDashboard = () => {
    switch (user?.role) {
      case "resident":
        return <ResidentDashboard />
      case "watchman":
        return <WatchmanDashboard />
      case "committee":
        return <CommitteeDashboard />
      default:
        return <div>Unknown role: {user?.role}</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center mt-2">
              <Image src="/logo.png" alt="GateLog" width={120} height={48} className="filter brightness-0" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <div className="font-medium">{user?.name}</div>
                <div className="text-gray-500">{user?.role}</div>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderDashboard()}</div>
    </div>
  )
}
