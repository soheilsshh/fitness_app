import { cn } from "@/lib/utils";

interface FitinoBrandMarkProps {
  size?: number;
  className?: string;
  pulse?: boolean;
}

const FitinoBrandMark = ({ size = 88, className, pulse = true }: FitinoBrandMarkProps) => {
  return (
    <div
      className={cn("relative shrink-0", pulse && "fitino-logo-breathe", className)}
      style={{
        width: size,
        height: size,
        filter: "drop-shadow(0 0 28px rgba(38, 252, 227, 0.32))",
      }}
    >
      <div
        aria-hidden
        className="absolute -inset-[6%] rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(38,252,227,0) 0%, rgba(38,252,227,0.85) 22%, rgba(88,202,192,0.35) 40%, rgba(38,252,227,0) 62%)",
          maskImage:
            "radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 2.5px))",
          WebkitMaskImage:
            "radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 2.5px))",
        }}
      />
      <img
        src="/fitino-logo.png"
        alt="فیتینو"
        className="h-full w-full rounded-full border border-white/10 object-cover"
        draggable={false}
      />
    </div>
  );
};

export default FitinoBrandMark;
