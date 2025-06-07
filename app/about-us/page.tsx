"use client"

import { Lock, Camera, AlertTriangle, BarChart, WifiOff, Zap } from "lucide-react"

export default function AboutUs() {
  return (
    <main className="max-w-4xl mx-auto p-6 bg-white rounded shadow mt-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-6">About GateLog</h1>
      <section className="mb-6 space-y-4">
        <p>
          GateLog is a next generation visitor management system designed to redefine how residential societies handle access, accountability, and security. Built with precision and purpose, GateLog eliminates outdated manual registers and replaces them with a seamless, intelligent, and real time platform that empowers residents, watchmen, and committee members alike.
        </p>
        <p>
          Every tap, screen, and interaction is engineered to deliver the polish of enterprise grade software while remaining intuitive for everyday community use. With features like real time visitor logging, instant digital approvals, emergency alerts, and cloud backed image storage, GateLog is more than an app. It is your society’s digital gatekeeper.
        </p>
        <p>
          Crafted from the first line of code to the final UI pixel, GateLog is a commercial grade platform with premium design aesthetics and a robust backend infrastructure, ready for real world deployment.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Who Built GateLog?</h2>
        <p className="mb-4">
          Aryan Gaikwad isn’t just a developer. He is the Architect, Strategist and Visionary behind GateLog. Every screen, every feature, every decision was executed solo. No fluff, no team, just relentless execution. Born out of obsession with precision and a refusal to accept broken systems, GateLog is Aryan’s answer to the daily chaos at residential gates.
        </p>
        <blockquote className="border-l-4 border-indigo-600 pl-4 italic text-gray-700">
          “I didn’t build an app. I engineered a real world weapon against urban negligence. After watching multiple true crime cases, I noticed a pattern. Crimes happen because entry points are weak. So I built GateLog. This is just the prototype. Next, more upgrades, more security and full scale deployment on Play Store and App Store. Watch this space.”
          <br />
          <span className="block mt-2 font-semibold">~Aryan Gaikwad, Architect and Visionary of GateLog</span>
        </blockquote>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Our Vision</h2>
        <p className="mb-6">
          To digitally empower housing societies with secure, transparent, and scalable tools eliminating access-related risks and establishing smarter, safer communities.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
        <ul className="space-y-3">
          <li className="flex items-center space-x-3">
            <Lock className="w-5 h-5 text-indigo-600" />
            <span>Real-time visitor tracking and secure logging</span>
          </li>
          <li className="flex items-center space-x-3">
            <Camera className="w-5 h-5 text-indigo-600" />
            <span>Cloud-based image uploads for every visitor</span>
          </li>
          <li className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-indigo-600" />
            <span>One-tap emergency alerts to committee members</span>
          </li>
          <li className="flex items-center space-x-3">
            <BarChart className="w-5 h-5 text-indigo-600" />
            <span>Heatmaps and traffic analytics</span>
          </li>
          <li className="flex items-center space-x-3">
            <WifiOff className="w-5 h-5 text-indigo-600" />
            <span>Offline mode for connectivity-challenged areas</span>
          </li>
          <li className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-indigo-600" />
            <span>Commercial-grade UI with smooth performance</span>
          </li>
        </ul>
      </section>
    </main>
  )
}
