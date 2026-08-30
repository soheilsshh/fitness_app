"use client";

import { Check } from "lucide-react";
import FreeTextInput from "../../../ai-nutrition/single/_components/FreeTextInput";
import { cn } from "@/lib/utils";
import {
  DISLIKE_EXERCISE_OPTIONS,
  LIMITATION_NONE,
  LIMITATION_OTHER,
  toggleExclusive,
} from "./workoutWizard";

function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-11 cursor-pointer touch-manipulation items-center gap-1.5 rounded-full border px-3.5 text-sm font-iranianSansMedium transition-colors duration-200",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      {selected ? <Check className="size-3.5 shrink-0" aria-hidden /> : null}
      {children}
    </button>
  );
}

export default function WizardSlide({ slide, answers, onChange }) {
  const set = (patch) => onChange({ ...answers, ...patch });
  const voiceKey = slide.id;
  const voiceValue = answers.voiceNotes?.[voiceKey] || "";
  const setVoice = (text) =>
    set({ voiceNotes: { ...answers.voiceNotes, [voiceKey]: text } });

  const renderChips = (options, selected, onToggle, multi) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Chip
          key={opt.value}
          selected={multi ? selected.includes(opt.value) : selected === opt.value}
          onClick={() => onToggle(opt.value)}
        >
          {opt.label}
        </Chip>
      ))}
    </div>
  );

  let body = null;
  if (slide.mode === "single") {
    const field =
      slide.id === "goal"
        ? "goal"
        : slide.id === "days"
          ? "daysPerWeek"
          : slide.id === "duration"
            ? "sessionDuration"
            : slide.id === "level"
              ? "experienceLevel"
              : slide.id === "history"
                ? "trainingHistory"
                : slide.id === "location"
                  ? "location"
                  : slide.id === "style"
                    ? "style"
                    : "cardio";
    body = renderChips(slide.options, answers[field], (v) => set({ [field]: v }), false);
  } else if (slide.mode === "multi") {
    const field = slide.id === "equipment" ? "equipment" : "bodyPriority";
    body = renderChips(slide.options, answers[field], (v) => set({ [field]: toggleExclusive(answers[field], v) }), true);
  } else if (slide.mode === "limitations") {
    body = (
      <div className="space-y-4">
        {renderChips(
          slide.options,
          answers.limitations,
          (v) => set({ limitations: toggleExclusive(answers.limitations, v, [LIMITATION_NONE]) }),
          true
        )}
        {answers.limitations.includes(LIMITATION_OTHER) ? (
          <FreeTextInput
            value={answers.limitationNote}
            onChange={(v) => set({ limitationNote: v })}
            label="توضیح محدودیت (متن یا صدا)"
            placeholder="مثلاً: زانوی راستم موقع اسکوات تیر می‌کشد."
          />
        ) : null}
        <p className="text-xs leading-5 text-muted-foreground">
          این سؤال فقط برای شخصی‌سازی برنامه است و جایگزین ارزیابی پزشکی نیست. اگر درد یا آسیب جدی داری، به متخصص مراجعه کن.
        </p>
      </div>
    );
  } else if (slide.mode === "disliked") {
    body = (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "none", label: "خیر" },
            { value: "list", label: "بله، از لیست انتخاب می‌کنم" },
            { value: "custom", label: "توضیح خودم" },
          ].map((opt) => (
            <Chip
              key={opt.value}
              selected={answers.dislikedMode === opt.value}
              onClick={() => set({ dislikedMode: opt.value })}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
        {answers.dislikedMode === "list" ? (
          renderChips(
            DISLIKE_EXERCISE_OPTIONS,
            answers.dislikedExercises,
            (v) => set({ dislikedExercises: toggleExclusive(answers.dislikedExercises, v) }),
            true
          )
        ) : null}
        {answers.dislikedMode === "custom" ? (
          <FreeTextInput
            value={answers.dislikedNote}
            onChange={(v) => set({ dislikedNote: v })}
            label="کدام حرکات را نمی‌خواهی؟"
            placeholder="مثلاً: اسکوات دوست ندارم و زانوم اذیت می‌شود."
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground">{slide.title}</p>
        <h3 className="mt-1 text-lg font-iranianSansDemiBold leading-7 text-foreground sm:text-xl">
          {slide.question}
        </h3>
      </div>
      {body}
      {slide.mode !== "limitations" && slide.mode !== "disliked" ? (
        <FreeTextInput
          value={voiceValue}
          onChange={setVoice}
          label="توضیح بیشتر با صدا یا متن (اختیاری)"
          placeholder="اگر نکته‌ای هست که در گزینه‌ها نبود، بگو."
        />
      ) : slide.mode === "limitations" && !answers.limitations.includes(LIMITATION_OTHER) ? (
        <FreeTextInput
          value={voiceValue}
          onChange={setVoice}
          label="توضیح صوتی یا متنی بیشتر (اختیاری)"
          placeholder="مثلاً: زانوم یه مقدار اذیتم می‌کنه."
        />
      ) : null}
    </div>
  );
}
