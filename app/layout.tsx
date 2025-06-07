import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import "../styles/globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { FirebaseProvider } from "./firebase-provider"
import Toaster from "@/components/ui/toaster"
import Footer from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700"] })

export const metadata: Metadata = {
  title: "GateLog - Visitor Management System",
  description: "Secure visitor management for modern communities",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${poppins.className} min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50`}>
        <div suppressHydrationWarning className="flex-grow flex flex-col">
          <FirebaseProvider>
            <AuthProvider>
              <main className="flex-grow flex flex-col">
                {children}
              </main>
              <Footer />
              <Toaster />
            </AuthProvider>
          </FirebaseProvider>
        </div>
      </body>
    </html>
  )
}
