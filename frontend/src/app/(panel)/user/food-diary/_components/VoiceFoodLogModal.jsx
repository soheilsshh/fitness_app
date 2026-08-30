"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle, Loader2, Mic, Square } from "lucide-react";
import { api } from "@/lib/axios/client";
import { USER_FOODS_PATH } from "@/lib/api/user";
import { VOICE_API_TIMEOUT_MS, voiceApiErrorMessage } from "@/lib/api/voice";
import { blobToWav16kMono } from "@/lib/audio/wav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  computeDraftServing,
  draftFromVoiceItem,
  draftToMeal,
  normalizeVoiceQuestions,
  hasVoiceReviewSession,
  voiceStatusAfterDismiss,
} from "@/lib/nutrition/voiceReview";
import VoiceMissedFoodPanel from "./VoiceMissedFoodPanel";
import VoiceQuantityFields from "./VoiceQuantityFields";
import MealTypeBoxes from "./MealTypeBoxes";

function formatKcal(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return Math.round(v).toLocaleString("fa-IR");
}

function VoiceFoodCard({ draft, checked, onToggle, onChange }) {
  const serving = computeDraftServing(draft);
  const incomplete = !serving.ok;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3 transition-colors duration-200",
        checked ? "border-primary/40" : "opacity-70"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center">
          <Checkbox
            checked={checked}
            onCheckedChange={onToggle}
            className="cursor-pointer"
            aria-label={`انتخاب ${draft.foodName}`}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-3 text-start">
          <div>
            <p className="text-sm font-iranianSansDemiBold">{draft.foodName}</p>
            {draft.spoken && draft.spoken !== draft.foodName ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground">گفته شده: {draft.spoken}</p>
            ) : null}
            {draft.needsConversion && draft.spokenUnit ? (
              <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                واحد «{draft.spokenUnit}» در دیتابیس این غذا نیست — یکی از واحدهای موجود را انتخاب کنید.
              </p>
            ) : null}
            {draft.needsQuantity && !draft.qty ? (
              <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                مقدار گفته نشد — مقدار و واحد را وارد کنید.
              </p>
            ) : null}
          </div>

          <VoiceQuantityFields
            idPrefix={`voice-item-${draft.key}`}
            foodName={draft.foodName}
            qty={draft.qty}
            unit={draft.unit}
            units={draft.units}
            onQtyChange={(qty) => onChange({ ...draft, qty })}
            onUnitChange={(unit) => onChange({ ...draft, unit, needsConversion: false })}
          />

          <div className="space-y-1.5">
            <p className="text-[11px] font-iranianSansDemiBold text-muted-foreground">
              این غذا مال کدام وعده است؟
            </p>
            <MealTypeBoxes
              name={`وعده ${draft.foodName}`}
              value={draft.mealType || ""}
              onChange={(mealType) => onChange({ ...draft, mealType })}
            />
          </div>

          {serving.ok ? (
            <>
              <p className="text-xs tabular-nums text-muted-foreground">
                ≈ {Math.round(serving.grams).toLocaleString("fa-IR")} گرم · {formatKcal(serving.calories)} کیلوکالری
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  پروتئین {serving.protein}g
                </Badge>
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  کربو {serving.carbs}g
                </Badge>
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  چربی {serving.fat}g
                </Badge>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {incomplete ? "بعد از انتخاب مقدار و واحد، کالری محاسبه می‌شود." : null}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VoiceFoodLogModal({
  open,
  onClose,
  onAdd,
  dayLabel,
  foodsPath = USER_FOODS_PATH,
}) {
  const [status, setStatus] = useState("idle");
  const [drafts, setDrafts] = useState([]);
  const [selected, setSelected] = useState({});
  const [notes, setNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [questions, setQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const nextKeyRef = useRef(0);
  const runIdRef = useRef(0);
  const sessionRef = useRef({ status, drafts, questions, transcript });
  sessionRef.current = { status, drafts, questions, transcript };

  const stopStream = () => {
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    streamRef.current = null;
  };

  const abortRecording = () => {
    runIdRef.current += 1;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.onstop = null;
      try {
        recorder.stop();
      } catch {
        /* already stopped */
      }
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    stopStream();
  };

  const resetSession = () => {
    abortRecording();
    setStatus("idle");
    setDrafts([]);
    setSelected({});
    setNotes("");
    setTranscript("");
    setQuestions([]);
    setQuestionAnswers({});
    setError("");
    setSaving(false);
    nextKeyRef.current = 0;
  };

  useEffect(() => {
    if (open) return;
    const session = sessionRef.current;
    if (session.status === "recording") {
      abortRecording();
    } else {
      stopStream();
    }
    setStatus(voiceStatusAfterDismiss(session));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const allocKey = () => {
    nextKeyRef.current += 1;
    return `food-${nextKeyRef.current}`;
  };

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      runIdRef.current += 1;
      const runId = runIdRef.current;
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        void handleRecordingStop(runId);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
    } catch {
      setError("دسترسی به میکروفون ممکن نشد — مجوز مرورگر را بررسی کنید");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    stopStream();
  };

  const handleRecordingStop = async (runId) => {
    if (runId !== runIdRef.current) return;
    setStatus("transcribing");
    const rawBlob = new Blob(chunksRef.current, { type: "audio/webm" });
    try {
      const wavBlob = await blobToWav16kMono(rawBlob);
      const form = new FormData();
      form.append("file", wavBlob, "voice-note.wav");
      const res = await api.post("/me/food-logs/voice", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: VOICE_API_TIMEOUT_MS,
      });
      if (runId !== runIdRef.current) return;
      const data = res.data || {};
      const foundItems = data.items || [];
      nextKeyRef.current = 0;
      const nextDrafts = foundItems.map((item) => draftFromVoiceItem(item, allocKey()));
      setDrafts(nextDrafts);
      setSelected(Object.fromEntries(nextDrafts.map((d) => [d.key, true])));
      setNotes(data.notes || "");
      setTranscript(data.transcript || "");
      const nextQuestions = normalizeVoiceQuestions(data.questions);
      setQuestions(nextQuestions);
      setQuestionAnswers({});
      if (foundItems.length === 0 && nextQuestions.length === 0) {
        setError("چیزی از صدا تشخیص داده نشد — دوباره تلاش کنید");
        setStatus("idle");
        return;
      }
      setStatus("review");
    } catch (err) {
      if (runId !== runIdRef.current) return;
      setError(voiceApiErrorMessage(err));
      setStatus(hasVoiceReviewSession(sessionRef.current) ? "review" : "idle");
    }
  };

  const handleConfirm = async () => {
    const chosen = drafts.filter((d) => selected[d.key]);
    if (chosen.length === 0) {
      setError("حداقل یک آیتم را انتخاب کنید");
      return;
    }
    const incomplete = chosen.find((d) => !computeDraftServing(d).ok);
    if (incomplete) {
      setError(`برای «${incomplete.foodName}» مقدار و واحد را از دیتابیس کامل کنید`);
      return;
    }
    const missingMeal = chosen.find((d) => !d.mealType);
    if (missingMeal) {
      setError(`برای «${missingMeal.foodName}» یکی از چهار وعده را تیک بزن`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      for (const draft of chosen) {
        const meal = draftToMeal(draft);
        if (!meal) continue;
        // eslint-disable-next-line no-await-in-loop
        await onAdd?.(meal);
      }
      toast.success("موارد ثبت شدند");
      resetSession();
      onClose?.();
    } catch {
      // toast handled by parent onAdd
    } finally {
      setSaving(false);
    }
  };

  const existingNames = new Set(drafts.map((d) => d.foodName));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden px-0 sm:max-w-lg" dir="rtl">
        <DialogHeader className="border-b px-5 py-4 text-start">
          <DialogTitle className="flex items-center gap-2">
            <Mic className="size-4 text-primary" />
            ثبت غذا با صدا
          </DialogTitle>
          {dayLabel ? <DialogDescription>برنامه {dayLabel}</DialogDescription> : null}
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {status === "idle" ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="max-w-xs text-sm text-muted-foreground">
                دکمه را بزنید و بگویید چه چیزی خورده‌اید، مثلاً:
                «یک بشقاب چلوکباب با نوشابه»
              </p>
              <Button
                type="button"
                size="lg"
                className="h-11 min-h-11 cursor-pointer rounded-full px-6 active:scale-[0.97]"
                onClick={startRecording}
              >
                <Mic className="size-5" data-icon="inline-start" />
                شروع ضبط
              </Button>
            </div>
          ) : status === "recording" ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <span className="relative flex size-16 items-center justify-center rounded-full bg-red-500/10 motion-reduce:animate-none">
                <span className="absolute inline-flex size-16 animate-ping rounded-full bg-red-500/20 motion-reduce:hidden" />
                <Mic className="size-6 text-red-600 dark:text-red-400" />
              </span>
              <p className="text-sm text-muted-foreground">در حال ضبط...</p>
              <Button type="button" variant="destructive" className="h-11 min-h-11 cursor-pointer" onClick={stopRecording}>
                <Square className="size-4" data-icon="inline-start" />
                پایان ضبط
              </Button>
            </div>
          ) : status === "transcribing" ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Loader2 className="size-6 animate-spin text-primary motion-reduce:animate-none" />
              <p className="text-sm text-muted-foreground">
                در حال تبدیل صدا به متن و تحلیل غذا...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transcript ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 text-start">
                  <p className="text-[11px] font-iranianSansDemiBold text-primary">
                    متن تشخیص‌داده‌شده
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">{transcript}</p>
                </div>
              ) : null}
              {questions.length > 0 ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-3 text-start">
                  <p className="flex items-center gap-1.5 text-[11px] font-iranianSansDemiBold text-amber-800 dark:text-amber-300">
                    <HelpCircle className="size-3.5" />
                    سؤال برای اطمینان
                  </p>
                  <div className="mt-2 space-y-3">
                    {questions.map((q, i) => (
                      <div key={`${i}-${q.text}`}>
                        <p className="text-sm leading-relaxed text-foreground">{q.text}</p>
                        {q.options.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={q.text}>
                            {q.options.map((opt) => {
                              const active = questionAnswers[i] === opt;
                              return (
                                <Button
                                  key={opt}
                                  type="button"
                                  size="sm"
                                  variant={active ? "default" : "outline"}
                                  className={cn(
                                    "h-8 cursor-pointer whitespace-normal text-xs",
                                    !active &&
                                      "border-amber-500/40 bg-background/70 text-foreground hover:bg-amber-500/10"
                                  )}
                                  aria-pressed={active}
                                  onClick={() =>
                                    setQuestionAnswers((prev) => ({
                                      ...prev,
                                      [i]: prev[i] === opt ? "" : opt,
                                    }))
                                  }
                                >
                                  {opt}
                                </Button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {notes ? (
                <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {notes}
                </p>
              ) : null}

              {drafts.length === 0 ? (
                <p className="rounded-xl border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  غذایی از صدا تشخیص داده نشد. از کادر پایین می‌توانید مورد ازقلم‌افتاده را اضافه کنید.
                </p>
              ) : (
                drafts.map((draft) => (
                  <VoiceFoodCard
                    key={draft.key}
                    draft={draft}
                    checked={Boolean(selected[draft.key])}
                    onToggle={() =>
                      setSelected((prev) => ({ ...prev, [draft.key]: !prev[draft.key] }))
                    }
                    onChange={(next) =>
                      setDrafts((prev) => prev.map((d) => (d.key === next.key ? next : d)))
                    }
                  />
                ))
              )}

              <VoiceMissedFoodPanel
                foodsPath={foodsPath}
                existingNames={existingNames}
                onAdd={(draft) => {
                  const next = { ...draft, key: allocKey() };
                  setDrafts((prev) => [...prev, next]);
                  setSelected((prev) => ({ ...prev, [next.key]: true }));
                }}
              />
            </div>
          )}
        </div>

        {status === "review" ? (
          <DialogFooter className="gap-2 border-t px-5 py-4 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              className="h-11 min-h-11 flex-1 cursor-pointer"
              onClick={() => {
                setStatus("idle");
                setError("");
              }}
            >
              ضبط دوباره
            </Button>
            <Button
              type="button"
              className="h-11 min-h-11 flex-1 cursor-pointer"
              disabled={saving}
              onClick={handleConfirm}
            >
              {saving ? "در حال ثبت..." : "تأیید و ثبت موارد انتخابی"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
