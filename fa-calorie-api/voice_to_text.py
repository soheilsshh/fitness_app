"""Give it your voice, get Persian text back.

Usage:
  python voice_to_text.py                    # record from the mic, Enter to stop
  python voice_to_text.py path\\to\\file.ogg   # transcribe an existing file

Uses GapGPT Whisper (layer 3) — same as /transcribe and /log-meal APIs.
"""

from __future__ import annotations

import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))

from app.asr import SAMPLE_RATE, NutritionASR  # noqa: E402


def record_from_mic() -> np.ndarray:
    try:
        import sounddevice as sd
    except ImportError:
        print(
            "sounddevice نصب نیست. یا نصبش کن: pip install sounddevice\n"
            "یا مسیر یک فایل صوتی رو به‌عنوان آرگومان بده.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    print("در حال ضبط... برای پایان دادن Enter را بزنید.", flush=True)
    chunks: list[np.ndarray] = []

    def callback(indata, _frames, _time_info, _status):
        chunks.append(indata.copy())

    with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, dtype="float32", callback=callback):
        input()

    if not chunks:
        return np.zeros(0, dtype=np.float32)
    return np.concatenate(chunks).reshape(-1)


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    asr = NutritionASR()
    if not asr.configured:
        print("OPENAI_API_KEY تنظیم نشده (GapGPT).", file=sys.stderr)
        return 1

    if len(sys.argv) > 1:
        path = Path(sys.argv[1])
        if not path.exists():
            print(f"فایل پیدا نشد: {path}", file=sys.stderr)
            return 1
        data = path.read_bytes()
        suffix = path.suffix or ".ogg"
        print("در حال تبدیل به متن...", flush=True)
        result = asr.transcribe_bytes(data, suffix=suffix, filename=path.name)
    else:
        samples = record_from_mic()
        if samples.size == 0:
            print("صدایی ضبط/دریافت نشد.")
            return 1
        print("در حال تبدیل به متن...", flush=True)
        result = asr.transcribe(samples)

    print("---")
    print(result["text"] if result["text"] else "(متنی تشخیص داده نشد)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
