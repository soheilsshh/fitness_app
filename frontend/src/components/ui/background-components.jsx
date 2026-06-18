import React from "react";

export const GlowBackground = ({ children, className = "" }) => {
  return (
    <div className={`w-full relative bg-white overflow-hidden ${className}`}>
      {/* Soft Green Glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at center, #8FFFB0, transparent 70%)`,
        }}
      />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default GlowBackground;
