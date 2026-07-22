"use client";

import { useEffect, useRef } from "react";
import { normalizeNumericInput, toPersianDigits } from "@/app/(site)/auth/_components/helpers";
import { cn } from "@/lib/utils";

/**
 * Six separate OTP digit slots — paste / autoComplete / backspace supported.
 */
export default function OtpSixSlots({ value = "", onChange, disabled = false, className }) {
  const digits = normalizeNumericInput(value).slice(0, 6).split("");
  while (digits.length < 6) digits.push("");
  const refs = useRef([]);

  useEffect(() => {
    if (disabled) return;
    refs.current[0]?.focus();
  }, [disabled]);

  const emit = (nextDigits) => {
    onChange?.(nextDigits.join("").slice(0, 6));
  };

  const setDigit = (index, char) => {
    const next = [...digits];
    next[index] = char;
    emit(next);
  };

  const handleChange = (index, raw) => {
    const cleaned = normalizeNumericInput(raw);
    if (!cleaned) {
      setDigit(index, "");
      return;
    }
    if (cleaned.length > 1) {
      onChange?.(cleaned.slice(0, 6));
      const focusAt = Math.min(cleaned.length, 5);
      requestAnimationFrame(() => refs.current[focusAt]?.focus());
      return;
    }
    setDigit(index, cleaned);
    if (index < 5) {
      requestAnimationFrame(() => refs.current[index + 1]?.focus());
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        setDigit(index - 1, "");
        refs.current[index - 1]?.focus();
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = normalizeNumericInput(e.clipboardData?.getData("text") || "");
    if (!pasted) return;
    e.preventDefault();
    onChange?.(pasted.slice(0, 6));
    const focusAt = Math.min(pasted.length, 5);
    requestAnimationFrame(() => refs.current[focusAt]?.focus());
  };

  return (
    <div
      dir="ltr"
      className={cn("flex items-center justify-center gap-2", className)}
      onPaste={handlePaste}
    >
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          aria-label={`رقم ${i + 1}`}
          value={digit ? toPersianDigits(digit) : ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            "size-11 rounded-xl border bg-black/45 text-center text-xl font-extrabold text-white outline-none transition md:size-12",
            "border-white/15 placeholder:text-white/20",
            "focus:border-primary/60 focus:shadow-[0_0_0_3px_oklch(0.58_0.11_187_/_0.22)]",
            "disabled:opacity-50"
          )}
        />
      ))}
    </div>
  );
}
