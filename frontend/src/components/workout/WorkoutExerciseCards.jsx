"use client";

import { useState } from "react";
import { ChevronLeft, PlayCircle } from "lucide-react";
import { parseExerciseStep } from "@/app/(panel)/coach/students/_components/exerciseHelpers";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { exercisePreviewUrl, isVideoMedia } from "./mediaUrl";
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

function ExerciseBadges({ exercise }) {
  return (
    <div className="flex flex-wrap gap-2">
      {exercise.sets > 0 ? (
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          {Number(exercise.sets).toLocaleString("fa-IR")} ست
        </Badge>
      ) : null}
      {exercise.reps ? (
        <Badge variant="secondary">{exercise.reps} تکرار</Badge>
      ) : null}
      {exercise.category ? (
        <Badge variant="outline">{exercise.category}</Badge>
      ) : null}
    </div>
  );
}

function ExerciseThumb({ exercise, index }) {
  const preview = exercisePreviewUrl(exercise);
  const showVideo = isVideoMedia(exercise?.gifUrl) || isVideoMedia(preview);

  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
      {preview ? (
        showVideo ? (
          <video
            src={preview}
            className="size-full object-cover"
            muted
            playsInline
            loop
            autoPlay
            aria-hidden
          />
        ) : (
          <img
            src={preview}
            alt={exercise.name}
            className="size-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        )
      ) : (
        <div className="flex size-full items-center justify-center text-sm font-semibold text-muted-foreground">
          {(index + 1).toLocaleString("fa-IR")}
        </div>
      )}
      <span className="absolute bottom-1 end-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
        {(index + 1).toLocaleString("fa-IR")}
      </span>
    </div>
  );
}

function ExerciseCardRow({ exercise, index, clickable, onSelect }) {
  const Wrapper = clickable ? "button" : "div";

  return (
    <Wrapper
      type={clickable ? "button" : undefined}
      onClick={clickable ? () => onSelect?.(exercise) : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-start transition-colors",
        clickable && "cursor-pointer hover:bg-muted/50"
      )}
    >
      <ExerciseThumb exercise={exercise} index={index} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{exercise.name}</p>
        <div className="mt-2">
          <ExerciseBadges exercise={exercise} />
        </div>
      </div>
      {clickable ? <ChevronLeft className="size-4 shrink-0 text-muted-foreground" /> : null}
    </Wrapper>
  );
}

export default function WorkoutExerciseCards({
  workout,
  dayKey = "day",
  clickable = false,
  variant = "cards",
}) {
  const [selected, setSelected] = useState(null);
  const exercises = normalizeExercises(workout);

  if (exercises.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          حرکتی ثبت نشده
        </CardContent>
      </Card>
    );
  }

  if (variant === "accordion") {
    return (
      <>
        <Accordion type="multiple" className="w-full rounded-lg border px-3">
          {exercises.map((exercise, index) => (
            <AccordionItem key={`${dayKey}-${exercise.key}`} value={exercise.key}>
              <AccordionTrigger className="hover:no-underline">
                <span className="flex flex-1 items-center gap-3 pe-2 text-start">
                  <ExerciseThumb exercise={exercise} index={index} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {exercise.name}
                    </span>
                    <span className="mt-2 block">
                      <ExerciseBadges exercise={exercise} />
                    </span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 ps-1">
                  {exercise.category ? (
                    <p className="text-xs text-muted-foreground">
                      دسته: {exercise.category}
                    </p>
                  ) : null}
                  {clickable ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected(exercise)}
                    >
                      <PlayCircle data-icon="inline-start" />
                      مشاهده جزئیات و انیمیشن
                    </Button>
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

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

  return (
    <>
      <div className="space-y-3">
        {exercises.map((exercise, index) => (
          <ExerciseCardRow
            key={`${dayKey}-${exercise.key}`}
            exercise={exercise}
            index={index}
            clickable={clickable}
            onSelect={setSelected}
          />
        ))}
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
