"""ضبط ویس خودتان و تست پایپ‌لاین ثبت غذا.

پیش‌فرض: اگر سرویس روی پورت 8000 بالا باشد همان را صدا می‌زند (مدل از قبل لود شده).
وگرنه مدل را همین‌جا بار می‌کند.

  cd fitness_app\\fa-calorie-api
  .venv\\Scripts\\python.exe test_my_voice.py

  .venv\\Scripts\\python.exe test_my_voice.py path\\to\\file.wav
  .venv\\Scripts\\python.exe test_my_voice.py --gemini
      # نیاز به توکن فیتینو: set FITINO_TOKEN=...
      # یا FITINO_PHONE + FITINO_PASSWORD

بعد از شروع ضبط، حرف بزنید و Enter را بزنید.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))

from app.asr import SAMPLE_RATE  # noqa: E402
from voice_to_text import record_from_mic  # noqa: E402

CALORIE_API = os.environ.get("CALORIE_API_URL", "http://127.0.0.1:8000").rstrip("/")
FITINO_API = os.environ.get("FITINO_URL", "http://127.0.0.1:8088").rstrip("/")
OUT_WAV = Path(__file__).resolve().parent / "_last_voice.wav"


def _utf8() -> None:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def save_wav(path: Path, samples: np.ndarray) -> None:
    pcm = np.clip(samples, -1.0, 1.0)
    pcm = (pcm * 32767.0).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm.tobytes())


def calorie_api_up() -> bool:
    try:
        with urllib.request.urlopen(CALORIE_API + "/health", timeout=2) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        return bool(body.get("ok") and body.get("asr_configured"))
    except Exception:
        return False


def post_multipart(url: str, filename: str, data: bytes, extra_headers: dict[str, str] | None = None) -> dict:
    boundary = "----FitinoVoiceTestBoundary"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        "Content-Type: audio/wav\r\n\r\n"
    ).encode("utf-8") + data + f"\r\n--{boundary}--\r\n".encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    for key, value in (extra_headers or {}).items():
        req.add_header(key, value)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {exc.code} از {url}:\n{detail}") from exc


def fitino_token() -> str:
    token = os.environ.get("FITINO_TOKEN", "").strip()
    if token:
        return token
    identifier = (
        os.environ.get("FITINO_IDENTIFIER", "").strip()
        or os.environ.get("FITINO_EMAIL", "").strip()
        or os.environ.get("FITINO_PHONE", "").strip()
    )
    password = os.environ.get("FITINO_PASSWORD", "").strip()
    if not identifier or not password:
        raise SystemExit(
            "برای --gemini یا FITINO_TOKEN را بگذارید "
            "یا FITINO_IDENTIFIER/FITINO_PHONE و FITINO_PASSWORD."
        )
    payload = json.dumps({"identifier": identifier, "password": password}).encode("utf-8")
    req = urllib.request.Request(
        FITINO_API + "/auth/login/password",
        data=payload,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"لاگین فیتینو ناموفق (HTTP {exc.code}):\n{detail}") from exc
    token = body.get("access_token") or body.get("accessToken") or body.get("token") or ""
    if not token and isinstance(body.get("data"), dict):
        token = body["data"].get("access_token") or body["data"].get("token") or ""
    if not token:
        raise SystemExit(f"توکن در جواب لاگین نبود: {body}")
    return str(token)


def run_local(audio_bytes: bytes, suffix: str, filename: str = "voice.wav") -> dict:
    from app.asr import NutritionASR
    from app.extract import extract
    from app.foods_db import FoodDB

    print("بارگذاری GapGPT ASR و کاتالوگ غذا...", flush=True)
    asr = NutritionASR()
    if not asr.configured:
        raise RuntimeError("OPENAI_API_KEY تنظیم نشده")
    db = FoodDB()
    print("تبدیل صدا به متن...", flush=True)
    asr_result = asr.transcribe_bytes(audio_bytes, suffix=suffix, filename=filename)
    result = extract(asr_result["text"], db)
    result["low_confidence"] = asr_result["low_confidence"]
    return result


def print_report(title: str, result: dict) -> None:
    print()
    print("=" * 60)
    print(title)
    print("=" * 60)
    transcript = result.get("raw_text") or result.get("transcript") or ""
    print(f"متن: {transcript or '(خالی)'}")
    if result.get("low_confidence"):
        print("هشدار: اطمینان ASR پایین است (نویز یا تلفظ نامفهوم).")
    meal = result.get("meal")
    if meal:
        print(f"وعده: {meal}")
    items = result.get("items") or []
    print(f"\nآیتم‌های قطعی ({len(items)}):")
    if not items:
        print("  — هیچ")
    for row in items:
        if "food_name" in row:
            name = row.get("food_name")
            grams = row.get("amount_g")
            kcal = row.get("calories")
            extra = f"  P{row.get('protein_g')} C{row.get('carbs_g')} F{row.get('fat_g')}"
        else:
            name = row.get("food")
            grams = row.get("grams")
            kcal = row.get("kcal")
            extra = ""
            if row.get("estimated"):
                extra = "  (تخمین واحد)"
        print(f"  - {name}  {grams}g  {kcal} kcal{extra}")
    candidates = result.get("candidates") or []
    if candidates:
        print(f"\nکاندید (kcal جمع نمی‌شود) ({len(candidates)}):")
        for row in candidates:
            print(f"  ? {row.get('food')}  گفته‌شده: {row.get('spoken')}  امتیاز {row.get('match_score')}")
    unmatched = result.get("unmatched") or []
    if unmatched:
        print("\nتشخیص‌نشده:", "، ".join(unmatched))
    questions = result.get("questions") or []
    if questions:
        print("\nسؤال‌های Gemini:")
        for q in questions:
            print(f"  • {q}")
    notes = result.get("notes")
    if notes:
        print(f"\nیادداشت: {notes}")
    if result.get("total_kcal") is not None:
        print(f"\nجمع kcal آیتم‌های قطعی: {result['total_kcal']}")
    print()
    print("JSON خام:")
    print(json.dumps(result, ensure_ascii=False, indent=2))


def load_samples(path: Path | None) -> tuple[bytes, str, np.ndarray | None]:
    from app.asr import NutritionASR

    if path is None:
        print("میکروفون آماده است. حرف بزنید، بعد Enter.", flush=True)
        samples = record_from_mic()
        return NutritionASR.samples_to_wav_bytes(samples), ".wav", samples
    if not path.exists():
        raise SystemExit(f"فایل پیدا نشد: {path}")
    from app.asr import NutritionASR

    data = path.read_bytes()
    return data, path.suffix or ".ogg", None


def main() -> int:
    _utf8()
    parser = argparse.ArgumentParser(description="تست ثبت غذا با ویس خودتان")
    parser.add_argument("file", nargs="?", help="فایل صوتی آماده؛ اگر نباشد از میکروفون ضبط می‌شود")
    parser.add_argument(
        "--gemini",
        action="store_true",
        help="همان مسیر اپ: POST به فیتینو /me/food-logs/voice (GapGPT + Gemini)",
    )
    args = parser.parse_args()
    file_path = Path(args.file) if args.file else None

    audio_bytes, suffix, samples = load_samples(file_path)
    if not audio_bytes:
        print("صدایی ضبط/دریافت نشد.")
        return 1

    if samples is not None:
        save_wav(OUT_WAV, samples)
        wav_bytes = OUT_WAV.read_bytes()
        duration_s = samples.size / SAMPLE_RATE
    else:
        wav_bytes = audio_bytes
        duration_s = len(audio_bytes) / (SAMPLE_RATE * 2)  # rough for display
    print(f"آماده ارسال ({duration_s:.1f} ثانیه تقریبی)", flush=True)

    if args.gemini:
        token = fitino_token()
        print("ارسال به فیتینو (GapGPT ASR + Gemini)...", flush=True)
        result = post_multipart(
            FITINO_API + "/me/food-logs/voice",
            "voice-note.wav",
            wav_bytes,
            extra_headers={"Authorization": f"Bearer {token}"},
        )
        print_report("خروجی فیتینو (لایه ۳–۹)", result)
        return 0

    if calorie_api_up():
        print(f"سرویس {CALORIE_API} در دسترس است — ارسال صدا...", flush=True)
        result = post_multipart(CALORIE_API + "/log-meal", "voice-note.wav", wav_bytes)
        print_report("خروجی GapGPT + کاتالوگ (بدون Gemini)", result)
        return 0

    print("سرویس پورت 8000 بالا نیست — اجرای محلی.", flush=True)
    name = file_path.name if file_path else "voice-note.wav"
    result = run_local(wav_bytes, suffix, filename=name)
    print_report("خروجی محلی GapGPT + کاتالوگ (بدون Gemini)", result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
