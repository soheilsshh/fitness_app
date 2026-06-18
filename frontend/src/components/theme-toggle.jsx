"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoonIcon, SunIcon } from "lucide-react";

export function ThemeToggle({ className, buttonClassName }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme !== "light";
  const Icon = isDark ? MoonIcon : SunIcon;

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className={cn(buttonClassName, className)}
      aria-label={isDark ? "فعال‌سازی حالت روز" : "فعال‌سازی حالت شب"}
      title={isDark ? "حالت روز (کلید D)" : "حالت شب (کلید D)"}
      onClick={toggleTheme}
    >
      <Icon className="size-4" />
      <span className="sr-only">تغییر تم</span>
    </Button>
  );
}
