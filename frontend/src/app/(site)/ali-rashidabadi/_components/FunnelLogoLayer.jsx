"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import FunnelLogo from "./FunnelLogo";

/**
 * Traveling-logo provider (funnel spec §5.1 FunnelOrbLayer, orb → Fitino logo).
 * Renders exactly one logo in a fixed overlay; each phase drops a <LogoAnchor/>
 * and the logo springs to it, so it reads as one persistent mark across the
 * whole funnel. Spring constants come from the spec — do not retune.
 */
const LogoCtx = createContext(null);

const SPRING = { type: "spring", stiffness: 95, damping: 19, mass: 1.45 };

export function FunnelLogoLayer({ children }) {
  const anchorsRef = useRef(new Map()); // id -> { el, size, thinking, order }
  const orderRef = useRef(0);
  const [target, setTarget] = useState(null);

  const measure = useCallback(() => {
    let latest = null;
    for (const [id, a] of anchorsRef.current) {
      if (!a.el?.isConnected) continue;
      if (!latest || a.order > latest.a.order) latest = { id, a };
    }
    if (!latest) return;
    const r = latest.a.el.getBoundingClientRect();
    if (!r.width && !r.height) return;
    setTarget((prev) => {
      const next = {
        id: latest.id,
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        size: latest.a.size,
        thinking: latest.a.thinking,
      };
      if (
        prev &&
        prev.id === next.id &&
        Math.abs(prev.x - next.x) < 0.5 &&
        Math.abs(prev.y - next.y) < 0.5 &&
        prev.size === next.size &&
        prev.thinking === next.thinking
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const register = useCallback(
    (id, el, size, thinking) => {
      anchorsRef.current.set(id, { el, size, thinking, order: ++orderRef.current });
      measure();
      return () => {
        anchorsRef.current.delete(id);
        measure();
      };
    },
    [measure]
  );

  // Continuous measure loop: anchors move under entrance animations and
  // scrolling (including the phone frame's inner scroll); one rect read per
  // frame keeps the overlay glued to the active anchor.
  useEffect(() => {
    let raf;
    const loop = () => {
      measure();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [measure]);

  return (
    <LogoCtx.Provider value={register}>
      {children}
      {target && (
        <motion.div
          className="pointer-events-none fixed z-[60]"
          initial={false}
          animate={{
            left: target.x - target.size / 2,
            top: target.y - target.size / 2,
            width: target.size,
            height: target.size,
          }}
          transition={SPRING}
        >
          <FunnelLogo size="100%" thinking={target.thinking} />
        </motion.div>
      )}
    </LogoCtx.Provider>
  );
}

/**
 * Invisible placeholder that reserves space and tells the layer where the
 * logo should travel to. Falls back to a static inline logo when no
 * <FunnelLogoLayer/> is mounted.
 */
export function LogoAnchor({ id, size = 120, thinking = false, className, style }) {
  const register = useContext(LogoCtx);
  const ref = useRef(null);

  useEffect(() => {
    if (!register || !ref.current) return;
    return register(id, ref.current, size, thinking);
  }, [register, id, size, thinking]);

  if (!register) {
    return (
      <div className={className} style={style}>
        <FunnelLogo size={size} thinking={thinking} />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      aria-hidden
      className={className}
      style={{ width: size, height: size, ...style }}
    />
  );
}
