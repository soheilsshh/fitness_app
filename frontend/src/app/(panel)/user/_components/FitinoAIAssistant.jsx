"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAB_POS_KEY } from "./ai/chatStorage";

const FAB_SIZE = 48;

function loadPos() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FAB_POS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.x === "number" &&
      typeof parsed?.y === "number" &&
      Number.isFinite(parsed.x) &&
      Number.isFinite(parsed.y)
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function clampPos(x, y) {
  const pad = 10;
  const maxX = Math.max(pad, window.innerWidth - FAB_SIZE - pad);
  const maxY = Math.max(pad, window.innerHeight - FAB_SIZE - pad);
  return {
    x: Math.min(maxX, Math.max(pad, x)),
    y: Math.min(maxY, Math.max(pad, y)),
  };
}

function defaultPos() {
  return clampPos(
    window.innerWidth - FAB_SIZE - 18,
    window.innerHeight - FAB_SIZE - 118
  );
}

/**
 * Alive, draggable Fitino AI launcher → /user/ai (single chat page).
 */
export default function FitinoAIAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [pos, setPos] = useState({ x: 16, y: 120 });
  const [ready, setReady] = useState(false);
  const [pressed, setPressed] = useState(false);
  const posRef = useRef(pos);
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const hidden =
    pathname?.startsWith("/user/onboarding") || pathname?.startsWith("/user/ai");

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    const saved = loadPos();
    setPos(saved ? clampPos(saved.x, saved.y) : defaultPos());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const onResize = () => setPos((p) => clampPos(p.x, p.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [ready]);

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setPressed(true);
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      origX: posRef.current.x,
      origY: posRef.current.y,
    };
  }

  function onPointerMove(e) {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.hypot(dx, dy) > 6) d.moved = true;
    setPos(clampPos(d.origX + dx, d.origY + dy));
  }

  function onPointerUp() {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    setPressed(false);
    if (d.moved) {
      try {
        localStorage.setItem(FAB_POS_KEY, JSON.stringify(posRef.current));
      } catch {
        /* ignore */
      }
      return;
    }
    router.push("/user/ai");
  }

  if (!ready || hidden) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <button
        type="button"
        aria-label="باز کردن دستیار فیتینو"
        className={cn(
          "pointer-events-auto absolute flex size-12 touch-none select-none items-center justify-center rounded-full",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26fce3] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "cursor-grab active:cursor-grabbing",
          pressed && "scale-95",
          "transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        )}
        style={{ left: pos.x, top: pos.y }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Rotating chrome ring */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 z-[1] rounded-full p-[1.5px]",
            "bg-[conic-gradient(from_0deg,#26fce3,#187272,#6ceade,#26fce3)]",
            !reduceMotion && "fitino-ai-fab-spin"
          )}
        >
          <span className="block size-full rounded-full bg-background/20" />
        </span>

        {/* Core jewel */}
        <span
          className={cn(
            "relative z-[2] flex size-10 items-center justify-center rounded-full text-white",
            "bg-[linear-gradient(155deg,#8ffff0_0%,#2a9c96_42%,#145e5a_100%)]",
            "shadow-[0_10px_22px_-10px_rgba(24,114,114,0.7),0_1px_0_rgba(255,255,255,0.4)_inset,0_-1px_0_rgba(0,0,0,0.18)_inset]",
            "ring-1 ring-white/35",
            !reduceMotion && "fitino-ai-fab-breathe"
          )}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-1.5 top-0.5 h-2.5 rounded-full bg-gradient-to-b from-white/50 to-transparent"
          />
          <Sparkles
            className={cn(
              "relative size-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
              !reduceMotion && "fitino-ai-fab-spark"
            )}
          />
          <span
            aria-hidden
            className="absolute -end-px -top-px size-2 rounded-full bg-[#26fce3] shadow-[0_0_8px_rgba(38,252,227,0.9)] ring-2 ring-white/70 dark:ring-[#101818]"
          />
        </span>
      </button>
    </div>
  );
}
