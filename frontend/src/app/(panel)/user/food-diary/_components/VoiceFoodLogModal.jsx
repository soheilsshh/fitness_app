"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { api } from "@/lib/axios/client";
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

function itemToMeal(item) {
  return {
    title: item.food_name,
    detail: item.amount_g ? `${item.amount_g} گرم` : "",
    calories: item.calories || 0,
    protein: item.protein_g || 0,
    carbs: item.carbs_g || 0,
    fat: item.fat_g || 0,
  };
}

export default function VoiceFoodLogModal({ open, onClose, onAdd, dayLabel }) {
  const [status, setStatus] = useState("idle"); // idle | recording | transcribing | review
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState({});
  const [notes, setNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!open) {
      stopStream();
      setStatus("idle");
      setItems([]);
      setSelected({});
      setNotes("");
      setTranscript("");
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stopStream = () => {
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleRecordingStop;
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

  const handleRecordingStop = async () => {
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
      const data = res.data || {};
      const foundItems = data.items || [];
      setItems(foundItems);
      setSelected(Object.fromEntries(foundItems.map((_, i) => [i, true])));
      setNotes(data.notes || "");
      setTranscript(data.transcript || "");
      if (foundItems.length === 0) {
        setError("چیزی از صدا تشخیص داده نشد — دوباره تلاش کنید");
        setStatus("idle");
        return;
      }
      setStatus("review");
    } catch (err) {
      setError(voiceApiErrorMessage(err));
      setStatus("idle");
    }
  };

  const toggleItem = (index) => {
    setSelected((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleConfirm = async () => {
    const chosen = items.filter((_, i) => selected[i]);
    if (chosen.length === 0) {
      setError("حداقل یک آیتم را انتخاب کنید");
      return;
    }
    setSaving(true);
    try {
      for (const item of chosen) {
        // eslint-disable-next-line no-await-in-loop
        await onAdd?.(itemToMeal(item));
      }
      toast.success("موارد ثبت شدند");
      onClose?.();
    } catch {
      // toast handled by parent onAdd
    } finally {
      setSaving(false);
    }
  };

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
              <Button type="button" size="lg" className="rounded-full" onClick={startRecording}>
                <Mic className="size-5" data-icon="inline-start" />
                شروع ضبط
              </Button>
            </div>
          ) : status === "recording" ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <span className="relative flex size-16 items-center justify-center rounded-full bg-red-500/10">
                <span className="absolute inline-flex size-16 animate-ping rounded-full bg-red-500/20" />
                <Mic className="size-6 text-red-600 dark:text-red-400" />
              </span>
              <p className="text-sm text-muted-foreground">در حال ضبط...</p>
              <Button type="button" variant="destructive" onClick={stopRecording}>
                <Square className="size-4" data-icon="inline-start" />
                پایان ضبط
              </Button>
            </div>
          ) : status === "transcribing" ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Loader2 className="size-6 animate-spin text-primary" />
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
              {notes ? (
                <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {notes}
                </p>
              ) : null}
              {items.map((item, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 rounded-xl border bg-card px-3 py-3"
                >
                  <Checkbox
                    checked={Boolean(selected[i])}
                    onCheckedChange={() => toggleItem(i)}
                  />
                  <div className="min-w-0 flex-1 text-start">
                    <p className="text-sm font-iranianSansDemiBold">{item.food_name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.amount_g ? `${item.amount_g} گرم · ` : ""}
                      {item.calories} کیلوکالری
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px] tabular-nums">
                        پروتئین {item.protein_g}g
                      </Badge>
                      <Badge variant="outline" className="text-[10px] tabular-nums">
                        کربو {item.carbs_g}g
                      </Badge>
                      <Badge variant="outline" className="text-[10px] tabular-nums">
                        چربی {item.fat_g}g
                      </Badge>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {status === "review" ? (
          <DialogFooter className="gap-2 border-t px-5 py-4 sm:justify-start">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onClose?.()}>
              انصراف
            </Button>
            <Button type="button" className="flex-1" disabled={saving} onClick={handleConfirm}>
              {saving ? "در حال ثبت..." : "تأیید و ثبت موارد انتخابی"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
