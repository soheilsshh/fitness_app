import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ActionDockProps {
  children: ReactNode;
  /** Only show on small screens (default true) — desktop keeps the inline CTA. */
  mobileOnly?: boolean;
  className?: string;
}

/** Sticky bottom action bar for conversion pages — app-native feel instead of an inline form button. */
const ActionDock = ({ children, mobileOnly = true, className }: ActionDockProps) => {
  return (
    <div className={cn("fp-dock", mobileOnly && "md:hidden", className)}>
      {children}
    </div>
  );
};

export default ActionDock;
