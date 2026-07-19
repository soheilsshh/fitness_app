"use client";

/**
 * 0–100 glowing progress ring with a bright head (funnel spec §6.3),
 * gradient stops mapped to the Fitino teal palette.
 */
export default function FunnelProgressRing({
  value = 0,
  size = 148,
  strokeWidth = 8,
  children,
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;
  // Head position on the (already -90°-rotated) circle.
  const theta = (clamped / 100) * 2 * Math.PI;
  const headX = size / 2 + r * Math.cos(theta);
  const headY = size / 2 + r * Math.sin(theta);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="funnel-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#26fce3" />
            <stop offset="50%" stopColor="#58cac0" />
            <stop offset="100%" stopColor="#2a9c96" />
          </linearGradient>
          <filter id="funnel-ring-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#funnel-ring-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        {clamped > 0 && clamped < 100 && (
          <circle
            cx={headX}
            cy={headY}
            r={strokeWidth * 0.75}
            fill="#26fce3"
            filter="url(#funnel-ring-glow)"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
