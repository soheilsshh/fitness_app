"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiTarget, FiTool, FiX } from "react-icons/fi";
import ExerciseMedia from "./ExerciseMedia";

export default function ExerciseDetailModal({ open, onClose, exercise }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted || !exercise) return null;

  const steps = exercise.instructionSteps || [];

  return createPortal(
    <div className="fixed inset-0 z-[250]">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="بستن"
      />
      <div className="absolute inset-0 flex items-center justify-center p-3 md:p-6">
        <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border bg-card text-card-foreground shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
            <div className="min-w-0">
              <div className="text-lg font-extrabold">{exercise.name}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {exercise.sets > 0 ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {exercise.sets} ست
                  </span>
                ) : null}
                {exercise.reps ? (
                  <span className="rounded-full border bg-muted px-3 py-1 text-xs font-bold">
                    {exercise.reps} تکرار
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <FiX />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="overflow-hidden rounded-2xl border bg-muted/40">
              <ExerciseMedia exercise={exercise} />
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {exercise.category ? (
                <span className="rounded-xl border bg-muted px-3 py-1.5 text-muted-foreground">
                  {exercise.category}
                </span>
              ) : null}
              {exercise.equipment ? (
                <span className="inline-flex items-center gap-1 rounded-xl border bg-muted px-3 py-1.5 text-muted-foreground">
                  <FiTool />
                  {exercise.equipment}
                </span>
              ) : null}
              {exercise.target ? (
                <span className="inline-flex items-center gap-1 rounded-xl border bg-muted px-3 py-1.5 text-muted-foreground">
                  <FiTarget />
                  {exercise.target}
                </span>
              ) : null}
            </div>

            {exercise.description ? (
              <div className="rounded-2xl border bg-muted/40 p-4">
                <div className="mb-2 text-sm font-bold">توضیحات</div>
                <p className="text-sm leading-7 text-muted-foreground">
                  {exercise.description}
                </p>
              </div>
            ) : null}

            {steps.length > 0 ? (
              <div className="rounded-2xl border bg-muted/40 p-4">
                <div className="mb-3 text-sm font-bold">طرز انجام صحیح</div>
                <ol className="space-y-2">
                  {steps.map((step, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm leading-7 text-muted-foreground"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
