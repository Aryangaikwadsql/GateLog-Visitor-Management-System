export interface User {
  uid: string
  email: string
  role: "resident" | "watchman" | "committee"
  name: string
  apartment?: string
  phoneNumber?: string
  emailVerified: boolean
  residentId?: string
  societyId?: string
}

export interface Visitor {
  id: string
  name: string
  phoneNumber: string
  purpose: string
  vehicleNumber?: string
  imageUrl?: string
  timestamp: Date
  residentId: string
  residentName: string
  status: "pending" | "approved" | "rejected"
  addedBy: string
  societyId?: string
}
