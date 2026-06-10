"use client";

import { useState } from "react";
import { FiChevronLeft } from "react-icons/fi";
import { parseExerciseStep } from "@/app/(panel)/coach/students/_components/exerciseHelpers";
import { mediaUrl } from "./mediaUrl";
import ExerciseDetailModal from "./ExerciseDetailModal";

function normalizeExercises(workout) {
  if (!workout) return [];
  if (workout.exercises?.length) {
    return workout.exercises.map((ex, i) => ({
      key: `${ex.exerciseId || ex.name}-${i}`,
      ...ex,
      sets: ex.sets ?? 0,
      reps: ex.reps ?? "",
    }));
  }
  return (workout.steps || []).map((step, i) => {
    const parsed = parseExerciseStep(step);
    return {
      key: `step-${i}`,
      name: parsed.name || step,
      sets: parseInt(parsed.sets, 10) || 0,
      reps: parsed.reps || "",
      imageUrl: "",
      gifUrl: "",
    };
  });
}

export default function WorkoutExerciseCards({
  workout,
  dayKey = "day",
  clickable = false,
}) {
  const [selected, setSelected] = useState(null);
  const exercises = normalizeExercises(workout);

  if (exercises.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/20 p-5 text-center text-sm text-zinc-500">
        حرکتی ثبت نشده
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {exercises.map((ex, index) => {
          const img = mediaUrl(ex.imageUrl);
          const Wrapper = clickable ? "button" : "div";
          return (
            <Wrapper
              key={`${dayKey}-${ex.key}`}
              type={clickable ? "button" : undefined}
              onClick={clickable ? () => setSelected(ex) : undefined}
              className={[
                "flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/40 p-3 text-right transition",
                clickable ? "hover:border-emerald-400/30 hover:bg-emerald-400/5 cursor-pointer" : "",
              ].join(" ")}
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                {img ? (
                  <img
                    src={img}
                    alt={ex.name}
                    className="h-full w-full object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-zinc-600">
                    {index + 1}
                  </div>
                )}
                <span className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {index + 1}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-white">{ex.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ex.sets > 0 ? (
                    <span className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
                      {ex.sets} ست
                    </span>
                  ) : null}
                  {ex.reps ? (
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-zinc-300">
                      {ex.reps} تکرار
                    </span>
                  ) : null}
                  {ex.category ? (
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400">
                      {ex.category}
                    </span>
                  ) : null}
                </div>
              </div>

              {clickable ? (
                <FiChevronLeft className="shrink-0 text-zinc-500" />
              ) : null}
            </Wrapper>
          );
        })}
      </div>

      {clickable ? (
        <ExerciseDetailModal
          open={!!selected}
          onClose={() => setSelected(null)}
          exercise={selected}
        />
      ) : null}
    </>
  );
}
