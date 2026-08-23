"use client";

import { useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/axios/client";
import { VOICE_API_TIMEOUT_MS, voiceApiErrorMessage } from "@/lib/api/voice";
import { blobToWav16kMono } from "@/lib/audio/wav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const EFFORT_OPTIONS = [6, 7, 8, 9, 10];

// alt keys must match the backend's FeelingAfter enum exactly
// (great|good|ok|tired|exhausted) so the survey stores usable AI-analysis data.
const FEELING_OPTIONS = [
  { key: "great", emoji: "😄" },
  { key: "good", emoji: "🙂" },
  { key: "ok", emoji: "😐" },
  { key: "tired", emoji: "😓" },
  { key: "exhausted", emoji: "🥵" },
];

const PAIN_OPTIONS = [
  { key: "shoulder", label: "شانه" },
  { key: "elbow_wrist", label: "آرنج/مچ" },
  { key: "lower_back", label: "کمر" },
  { key: "hip_glute", label: "لگن/باسن" },
  { key: "knee", label: "زانو" },
  { key: "ankle_calf", label: "مچ پا/ساق" },
  { key: "none", label: "هیچ‌کدام" },
];

const DURATION_OPTIONS = [30, 45, 60, 75, 90];
const MAX_FAVORITES = 2;

/**
 * Optional micro-survey shown once, right after the first workout session
 * logged in a day. Every field is skippable — "رد شدن" and the dialog's
 * close (backdrop/Esc) both submit whatever was filled in so far.
 */
export default function PostWorkoutSurveyModal({ open, onOpenChange, sessionId, exercises }) {
  const [effort, setEffort] = useState(null);
  const [feeling, setFeeling] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [painArea, setPainArea] = useState(null);
  const [painNote, setPainNote] = useState("");
  const [duration, setDuration] = useState(null);
  const [voiceText, setVoiceText] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  function toggleFavorite(name) {
    setFavorites((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= MAX_FAVORITES) return prev;
      return [...prev, name];
    });
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        uploadVoiceNote(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast.error("دسترسی به میکروفون ممکن نشد");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function uploadVoiceNote(blob) {
    setTranscribing(true);
    try {
      const wavBlob = await blobToWav16kMono(blob);
      const form = new FormData();
      form.append("file", wavBlob, "note.wav");
      const res = await api.post(`/me/workout-sessions/${sessionId}/survey/voice`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: VOICE_API_TIMEOUT_MS,
      });
      setVoiceText(res.data?.text || "");
    } catch (error) {
      toast.error(voiceApiErrorMessage(error));
    } finally {
      setTranscribing(false);
    }
  }

  async function handleSubmit(skip) {
    setSubmitting(true);
    try {
      if (!skip) {
        const payload = {};
        if (effort) payload.effortRpe = effort;
        if (feeling) payload.feelingAfter = feeling;
        if (favorites.length) payload.favoriteExercises = favorites;
        if (painArea) {
          payload.painArea = painArea;
          if (painArea !== "none" && painNote.trim()) payload.painNote = painNote.trim();
        }
        if (duration) payload.durationEstimateMinutes = duration;
        if (voiceText.trim()) payload.voiceNoteText = voiceText.trim();
        if (Object.keys(payload).length > 0) {
          await api.patch(`/me/workout-sessions/${sessionId}/survey`, payload);
        }
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.response?.data?.error || "ثبت اطلاعات ناموفق بود");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleSubmit(true)}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>چند سؤال کوتاه راجع به این تمرین</DialogTitle>
          <DialogDescription>
            این بخش کاملاً اختیاری است ولی برای تحلیل بهتر روند تمرینت کاربردی است.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">سختی تمرین امروزت چقدر بود؟</p>
            <ToggleGroup
              type="single"
              value={effort ? String(effort) : ""}
              onValueChange={(v) => setEffort(v ? Number(v) : null)}
              variant="outline"
              size="sm"
              className="flex flex-wrap justify-start gap-2"
            >
              {EFFORT_OPTIONS.map((v) => (
                <ToggleGroupItem key={v} value={String(v)}>
                  {v.toLocaleString("fa-IR")}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">بعد از تمرین چه حسی داشتی؟</p>
            <div className="flex flex-wrap gap-2">
              {FEELING_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFeeling(f.key)}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full border text-xl transition",
                    feeling === f.key ? "border-primary bg-primary/10" : "border-border bg-card"
                  )}
                >
                  <span role="img" aria-label={f.key}>
                    {f.emoji}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {exercises?.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                کدام حرکت امروز را بیشتر دوست داشتی؟ (حداکثر ۲ مورد)
              </p>
              <div className="flex flex-wrap gap-2">
                {exercises.map((ex) => (
                  <button
                    key={ex.name}
                    type="button"
                    onClick={() => toggleFavorite(ex.name)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition",
                      favorites.includes(ex.name)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    {ex.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium">درد یا ناراحتی داری؟</p>
            <ToggleGroup
              type="single"
              value={painArea || ""}
              onValueChange={(v) => setPainArea(v || null)}
              variant="outline"
              size="sm"
              className="flex flex-wrap justify-start gap-2"
            >
              {PAIN_OPTIONS.map((p) => (
                <ToggleGroupItem key={p.key} value={p.key}>
                  {p.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {painArea && painArea !== "none" ? (
              <Textarea
                value={painNote}
                onChange={(e) => setPainNote(e.target.value)}
                placeholder="کجا و چطور درد می‌کند؟"
                className="mt-2"
                rows={2}
              />
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">مدت تقریبی تمرین شما</p>
            <ToggleGroup
              type="single"
              value={duration ? String(duration) : ""}
              onValueChange={(v) => setDuration(v ? Number(v) : null)}
              variant="outline"
              size="sm"
              className="flex flex-wrap justify-start gap-2"
            >
              {DURATION_OPTIONS.map((d) => (
                <ToggleGroupItem key={d} value={String(d)}>
                  {d.toLocaleString("fa-IR")} دقیقه
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">چیز دیگه‌ای هست بخوای بگی؟</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={recording ? "destructive" : "outline"}
                size="sm"
                onClick={recording ? stopRecording : startRecording}
                disabled={transcribing}
              >
                {recording ? <Square data-icon="inline-start" /> : <Mic data-icon="inline-start" />}
                {recording ? "توقف ضبط" : "ضبط صدا"}
              </Button>
              {transcribing ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  در حال پردازش...
                </span>
              ) : null}
            </div>
            {voiceText ? (
              <Textarea
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                rows={3}
                className="mt-1"
              />
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => handleSubmit(true)} disabled={submitting}>
            رد شدن
          </Button>
          <Button type="button" onClick={() => handleSubmit(false)} disabled={submitting}>
            {submitting ? "در حال ثبت..." : "ثبت"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
