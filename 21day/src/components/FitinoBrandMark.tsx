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
      <img
        src="/fitino-logo.png"
        alt="فیتینو"
        className="h-full w-full object-contain"
        draggable={false}
      />
    </div>
  );
};

export default FitinoBrandMark;
