
import { useState, useEffect } from "react";
import { Users, Eye } from "lucide-react";

interface ViewerCounterProps {
  icon?: "users" | "eye";
  className?: string;
  showLabel?: boolean;
}

const ViewerCounter = ({ icon = "users", className = "", showLabel = true }: ViewerCounterProps) => {
  const [viewerCount, setViewerCount] = useState(2347);

  useEffect(() => {
    const interval = setInterval(() => {
      // Gradually increase viewers with some randomness
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 15) + 1; // 1-15 increase
        const shouldIncrease = Math.random() > 0.2; // 80% chance to increase
        return shouldIncrease ? prev + change : Math.max(prev - Math.floor(change / 3), 2000);
      });
    }, 3000 + Math.random() * 2000); // Random interval between 3-5 seconds

    return () => clearInterval(interval);
  }, []);

  const IconComponent = icon === "users" ? Users : Eye;

  return (
    <div className={`fp-chip ${className}`}>
      <span className="fp-chip__dot fp-chip__dot--live text-destructive" aria-hidden />
      <IconComponent size={14} className="text-primary" aria-hidden />
      <span className="fp-hud-num text-foreground">{viewerCount.toLocaleString('fa-IR')}</span>
      {showLabel && <span className="text-muted-foreground">نفر در حال تماشا</span>}
    </div>
  );
};

export default ViewerCounter;
