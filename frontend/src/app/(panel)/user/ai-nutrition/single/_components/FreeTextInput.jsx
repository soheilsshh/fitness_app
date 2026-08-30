"use client";

import { useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { api } from "@/lib/axios/client";
import { VOICE_API_TIMEOUT_MS, voiceApiErrorMessage } from "@/lib/api/voice";
import { blobToWav16kMono } from "@/lib/audio/wav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Free-text restriction/preference field with an optional voice shortcut.
 * Voice → STT → متن → این فیلد (هیچ‌وقت صدا مستقیم به مدل برنامه‌ریز داده نمی‌شود).
 */
export default function FreeTextInput({
  value,
  onChange,
  label = "یا متن آزاد بنویس",
  placeholder = "مثلاً: مرغ و تخم‌مرغ دارم، ماهی ندارم، لبنیات دوست ندارم و شامم سبک باشه.",
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

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
      setRecording(true);
    } catch {
      setError("دسترسی به میکروفون ممکن نشد — مجوز مرورگر را بررسی کنید");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    stopStream();
    setRecording(false);
  };

  const handleRecordingStop = async () => {
    setTranscribing(true);
    const rawBlob = new Blob(chunksRef.current, { type: "audio/webm" });
    try {
      const wavBlob = await blobToWav16kMono(rawBlob);
      const form = new FormData();
      form.append("file", wavBlob, "voice-note.wav");
      const res = await api.post("/me/ai/transcribe", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: VOICE_API_TIMEOUT_MS,
      });
      const text = res.data?.text || "";
      if (!text) {
        setError("چیزی از صدا تشخیص داده نشد — دوباره تلاش کنید");
      } else {
        onChange(value ? `${value}\n${text}` : text);
      }
    } catch (err) {
      setError(voiceApiErrorMessage(err));
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-iranianSansDemiBold text-foreground">
          {label}
        </p>
        <Button
          type="button"
          size="sm"
          variant={recording ? "destructive" : "outline"}
          className="h-11 gap-1.5 rounded-full cursor-pointer"
          disabled={transcribing}
          onClick={recording ? stopRecording : startRecording}
        >
          {transcribing ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              در حال پردازش...
            </>
          ) : recording ? (
            <>
              <Square className="size-3.5" />
              پایان ضبط
            </>
          ) : (
            <>
              <Mic className="size-3.5" />
              ضبط صدا
            </>
          )}
        </Button>
      </div>
      <Textarea
        rows={4}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(recording && "ring-2 ring-red-500/40")}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
