"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { FAB_POS_KEY } from "./ai/chatStorage";

const FAB_SIZE = 56;

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
  const pad = 8;
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
 * Alive, freely draggable Fitino AI launcher → /user/ai
 */
export default function FitinoAIAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [pos, setPos] = useState({ x: 16, y: 120 });
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
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
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
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
    e.preventDefault();
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.hypot(dx, dy) > 4) d.moved = true;
    const next = clampPos(d.origX + dx, d.origY + dy);
    posRef.current = next;
    setPos(next);
  }

  function onPointerUp() {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    setDragging(false);
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
          "pointer-events-auto absolute flex size-14 touch-none select-none items-center justify-center rounded-full",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          dragging ? "cursor-grabbing" : "cursor-grab",
          dragging && "scale-[1.03]"
        )}
        style={{ left: pos.x, top: pos.y }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Brand aqua spinning halo — #187272 → #26fce3 */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-[1] rounded-full p-[3px]",
            "bg-[conic-gradient(from_0deg,#187272_0%,#2a9c96_22%,#58cac0_44%,#26fce3_66%,#58cac0_82%,#187272_100%)]",
            "shadow-[0_0_12px_rgba(38,252,227,0.45),0_0_22px_rgba(42,156,150,0.3)]",
            !reduceMotion && !dragging && "fitino-ai-fab-spin"
          )}
        >
          <span className="block size-full rounded-full bg-background" />
        </span>

        {/* Soft brand glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-2 z-0 rounded-full bg-[radial-gradient(circle,rgba(38,252,227,0.35)_0%,rgba(42,156,150,0.14)_48%,transparent_72%)] blur-[1px]"
        />

        {/* Core — logo on brand aqua wash */}
        <span
          className={cn(
            "pointer-events-none relative z-[2] flex size-11 items-center justify-center overflow-hidden rounded-full",
            "bg-[linear-gradient(155deg,#58cac0_0%,#2a9c96_48%,#187272_100%)]",
            "shadow-[0_10px_22px_-10px_rgba(38,252,227,0.4),0_1px_0_rgba(255,255,255,0.28)_inset]",
            "ring-1 ring-white/25",
            !reduceMotion && !dragging && "fitino-ai-fab-breathe"
          )}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-1.5 top-0.5 h-2.5 rounded-full bg-gradient-to-b from-white/45 to-transparent"
          />
          <Logo
            className={cn(
              "relative size-8 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]",
              !reduceMotion && !dragging && "fitino-ai-fab-spark"
            )}
          />
        </span>
      </button>
    </div>
  );
}
