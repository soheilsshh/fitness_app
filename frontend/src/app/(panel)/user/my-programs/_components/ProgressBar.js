"use client";

import { motion } from "framer-motion";

export default function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full rounded-full bg-white/10">
      <motion.div
        className="h-2 rounded-full bg-linear-to-l from-emerald-400/90 to-cyan-400/70"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
      />
    </div>
  );
}
