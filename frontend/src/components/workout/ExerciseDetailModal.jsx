"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiTarget, FiTool, FiX } from "react-icons/fi";
import { mediaUrl } from "./mediaUrl";

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

  const gif = mediaUrl(exercise.gifUrl);
  const image = mediaUrl(exercise.imageUrl);
  const steps = exercise.instructionSteps || [];

  return createPortal(
    <div className="fixed inset-0 z-[250]">
      <button
        type="button"
        className="absolute inset-0 bg-black/75"
        onClick={onClose}
        aria-label="بستن"
      />
      <div className="absolute inset-0 flex items-center justify-center p-3 md:p-6">
        <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="min-w-0">
              <div className="text-lg font-extrabold text-white">{exercise.name}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {exercise.sets > 0 ? (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
                    {exercise.sets} ست
                  </span>
                ) : null}
                {exercise.reps ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-zinc-200">
                    {exercise.reps} تکرار
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
            >
              <FiX />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
              {gif ? (
                <img
                  src={gif}
                  alt={exercise.name}
                  className="mx-auto max-h-64 w-full object-contain"
                />
              ) : image ? (
                <img
                  src={image}
                  alt={exercise.name}
                  className="mx-auto max-h-64 w-full object-contain"
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
                  انیمیشن در دسترس نیست
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {exercise.category ? (
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300">
                  {exercise.category}
                </span>
              ) : null}
              {exercise.equipment ? (
                <span className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300">
                  <FiTool className="text-zinc-500" />
                  {exercise.equipment}
                </span>
              ) : null}
              {exercise.target ? (
                <span className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300">
                  <FiTarget className="text-zinc-500" />
                  {exercise.target}
                </span>
              ) : null}
            </div>

            {exercise.description ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 text-sm font-bold text-white">توضیحات</div>
                <p className="text-sm leading-7 text-zinc-300">{exercise.description}</p>
              </div>
            ) : null}

            {steps.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 text-sm font-bold text-white">طرز انجام صحیح</div>
                <ol className="space-y-2">
                  {steps.map((step, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm leading-7 text-zinc-300"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs font-bold text-emerald-200">
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
