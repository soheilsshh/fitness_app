"use client"

import { LiquidMetal } from "@paper-design/shaders-react"
import { motion } from "framer-motion"

export default function ShadersBackground({ className = "absolute inset-0 z-0 pointer-events-none" }) {
  return (
    <div aria-hidden className={`${className} overflow-hidden`}>
      <motion.div
        className="w-full h-full"
        initial={{ opacity: 0.15, scale: 1 }}
        animate={{ opacity: 0.35, scale: 1.02, rotate: 2 }}
        transition={{ duration: 16, repeat: Infinity, repeatType: "mirror" }}
      >
        <LiquidMetal
          style={{ width: "100%", height: "100%", filter: "blur(10px)" }}
          colorBack="hsl(0, 0%, 0%, 0)"
          colorTint="hsl(29, 77%, 49%)"
          repetition={4}
          softness={0.6}
          shiftRed={0.25}
          shiftBlue={0.25}
          distortion={0.12}
          contour={1}
          shape="plane"
          offsetX={0}
          offsetY={0}
          scale={1}
          rotation={0}
          speed={0.25}
        />
      </motion.div>
    </div>
  )
}
