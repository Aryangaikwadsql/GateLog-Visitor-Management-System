"use client"

import { useEffect, useState } from "react"
import { motion, useAnimation, AnimatePresence, type PanInfo } from "framer-motion"
import { Building, Shield, Zap, Users, Lock, Eye, ArrowUp } from "lucide-react"

interface IntroPageProps {
  onComplete?: () => void
}

export default function GateLogIntro({ onComplete }: IntroPageProps) {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(false)
  const [swipeProgress, setSwipeProgress] = useState(0)
  const [isSwipeComplete, setIsSwipeComplete] = useState(false)
  const controls = useAnimation()

  useEffect(() => {
    const sequence = async () => {
      // Phase 1: Particles and initial setup
      await new Promise((resolve) => setTimeout(resolve, 500))
      setCurrentPhase(1)

      // Phase 2: Logo appearance
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setCurrentPhase(2)

      // Phase 3: Background elements
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setCurrentPhase(3)

      // Phase 4: Data lines
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setCurrentPhase(4)

      // Phase 5: Text reveal
      await new Promise((resolve) => setTimeout(resolve, 1200))
      setCurrentPhase(5)

      // Phase 6: Show swipe indicator
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setShowSwipeIndicator(true)
    }

    sequence()
  }, [])

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = -100 // Swipe up threshold

    if (info.offset.y < swipeThreshold && !isSwipeComplete) {
      setIsSwipeComplete(true)
      // Trigger completion animation
      controls
        .start({
          y: -window.innerHeight,
          opacity: 0,
          transition: { duration: 0.8, ease: "easeInOut" },
        })
        .then(() => {
          if (onComplete) onComplete()
        })
    } else {
      // Reset position if swipe wasn't far enough
      setSwipeProgress(0)
    }
  }

  const handleDrag = (event: any, info: PanInfo) => {
    if (info.offset.y < 0) {
      const progress = Math.min(Math.abs(info.offset.y) / 100, 1)
      setSwipeProgress(progress)
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden"
      animate={controls}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{ cursor: showSwipeIndicator ? "grab" : "default" }}
      whileDrag={{ cursor: "grabbing" }}
    >
        {/* Swipe Progress Overlay */}
        <AnimatePresence>
          {swipeProgress > 0 && (
            <motion.div
              className="absolute inset-0 bg-blue-500/10 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: swipeProgress * 0.3 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

      {/* Swipe Indicator */}
      <AnimatePresence>
        {showSwipeIndicator && !isSwipeComplete && (
          <motion.div
            className="absolute bottom-2 left-[48%] transform -translate-x-1/2 flex flex-col items-center pointer-events-none"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
          >
            {/* Swipe Up Text */}
            <motion.p
              className="text-gray-400 text-base font-light tracking-wide ml-[-25px]" // shifted left a little more from -20px to -25px
              style={{ transform: 'translateY(-30px)' }} // moved text a bit up from -20px to -30px
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              Swipe up to enter
            </motion.p>

            {/* Animated Arrow */}
            <motion.div
              className="relative ml-[-10px]" // moved arrow a little more left from ml-[-4px] to ml-[-10px]
              animate={{
                y: [-5, -15, -5],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <ArrowUp size={24} className="text-blue-400" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Particle Field */}
      <AnimatePresence>
        {currentPhase >= 1 && (
          <div className="absolute inset-0">
            {Array.from({ length: 80 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-0.5 bg-blue-400 rounded-full"
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1920),
                  y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1080),
                }}
                animate={{
                  opacity: [0, 0.8, 0.3, 0.8, 0],
                  scale: [0, 1, 0.5, 1, 0],
                  x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1920),
                  y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1080),
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: Math.random() * 3,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Flowing Data Lines */}
      <AnimatePresence>
        {currentPhase >= 4 && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                style={{
                  width: "200%",
                  top: `${20 + i * 15}%`,
                  left: "-50%",
                }}
                initial={{ opacity: 0, x: "-100%" }}
                animate={{
                  opacity: [0, 1, 0],
                  x: ["100%", "200%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.5,
                  ease: "linear",
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Background Architectural Elements */}
      <AnimatePresence>
        {currentPhase >= 3 && (
          <div className="absolute inset-0 opacity-10">
            <motion.div
              className="absolute top-1/4 left-1/4 text-white/20"
              initial={{ opacity: 0, scale: 0, rotate: -45 }}
              animate={{
                opacity: [0, 0.3, 0.1],
                scale: [0, 1.2, 1],
                rotate: [-45, 0, 15],
              }}
              transition={{ duration: 2, delay: 0.2 }}
            >
              <Building size={120} strokeWidth={0.5} />
            </motion.div>

            <motion.div
              className="absolute top-1/3 right-1/4 text-blue-400/20"
              initial={{ opacity: 0, scale: 0, rotate: 45 }}
              animate={{
                opacity: [0, 0.4, 0.15],
                scale: [0, 1.5, 1.2],
                rotate: [45, 0, -10],
              }}
              transition={{ duration: 2.5, delay: 0.5 }}
            >
              <Shield size={100} strokeWidth={0.5} />
            </motion.div>

            <motion.div
              className="absolute bottom-1/3 left-1/3 text-white/15"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.25, 0.1],
                scale: [0, 1.3, 1.1],
              }}
              transition={{ duration: 2.2, delay: 0.8 }}
            >
              <Lock size={80} strokeWidth={0.5} />
            </motion.div>

            <motion.div
              className="absolute top-2/3 right-1/3 text-blue-300/20"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.3, 0.12],
                scale: [0, 1.4, 1.15],
              }}
              transition={{ duration: 2.3, delay: 1.1 }}
            >
              <Eye size={90} strokeWidth={0.5} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Glowing Grid Overlay */}
      <AnimatePresence>
        {currentPhase >= 3 && (
          <div className="absolute inset-0 opacity-5">
            <motion.div
              className="w-full h-full"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: "50px 50px",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0.1] }}
              transition={{ duration: 3, delay: 1 }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">

        {/* GateLog Logo */}
        <AnimatePresence>
          {currentPhase >= 2 && (
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, scale: 0.3, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 1.5,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.3,
              }}
            >
              <motion.h1
                className="text-6xl md:text-8xl font-bold text-white relative font-poppins"
                style={{
                  filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))",
                  textShadow: "0 0 40px rgba(59, 130, 246, 0.3)",
                }}
                animate={{
                  textShadow: [
                    "0 0 40px rgba(59, 130, 246, 0.3)",
                    "0 0 60px rgba(59, 130, 246, 0.6)",
                    "0 0 40px rgba(59, 130, 246, 0.3)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                Gate<span className="text-blue-400">Log</span>
              </motion.h1>

              {/* Logo Glow Effect */}
              <motion.div
                className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tagline with Letter-by-Letter Animation */}
        <AnimatePresence>
          {currentPhase >= 5 && (
            <motion.div className="max-w-2xl">
              <motion.div
                className="text-xl md:text-2xl text-gray-300 font-light tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {Array.from("Redefining Residential Security").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.5 + index * 0.05,
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                    className={char === " " ? "inline-block w-2" : ""}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </motion.div>

              {/* Underline Animation */}
              <motion.div
                className="h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent mt-4"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                transition={{ delay: 2, duration: 1.5, ease: "easeOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Icons Animation */}
        <AnimatePresence>
          {currentPhase >= 5 && (
            <motion.div
              className="flex space-x-8 mt-12 opacity-40"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 0.4, y: 0 }}
              transition={{ delay: 2.5, duration: 1 }}
            >
              {[Shield, Lock, Users, Zap].map((Icon, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 2.8 + index * 0.2,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 200,
                  }}
                >
                  <Icon size={32} className="text-blue-400/60 hover:text-blue-400 transition-colors duration-300" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle Vignette Effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </motion.div>
  )
}
