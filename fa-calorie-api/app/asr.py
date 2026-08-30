"""Layer 3 ASR — GapGPT Whisper API (no local model weights).

Reads OPENAI_API_KEY, OPENAI_BASE_URL, GAPGPT_WHISPER_MODEL from the environment.
In local dev, falls back to fitness_app/backend/.env when keys are unset.
"""

from __future__ import annotations

import io
import json
import os
import urllib.error
import urllib.request
import wave
from pathlib import Path

import numpy as np

from .text import correct_asr_text

DEFAULT_BASE_URL = "https://api.gapgpt.app/v1"
DEFAULT_MODEL = "gapgpt/whisper-1"
SAMPLE_RATE = 16000
_BACKEND_ENV = Path(__file__).resolve().parent.parent.parent / "backend" / ".env"


def _apply_env_file(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        if key and key not in os.environ:
            os.environ[key] = val.strip().strip('"').strip("'")


def _ensure_env() -> None:
    _apply_env_file(_BACKEND_ENV)


class NutritionASR:
    """GapGPT Whisper client — kept name for callers (main, tests, CLI)."""

    def __init__(self, num_threads: int = 1) -> None:  # noqa: ARG002 — legacy arg
        _ensure_env()
        self.api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        self.base_url = os.environ.get("OPENAI_BASE_URL", DEFAULT_BASE_URL).strip().rstrip("/")
        self.model = os.environ.get("GAPGPT_WHISPER_MODEL", DEFAULT_MODEL).strip()

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    @staticmethod
    def samples_to_wav_bytes(samples: np.ndarray) -> bytes:
        pcm = np.clip(samples, -1.0, 1.0)
        pcm = (pcm * 32767.0).astype(np.int16)
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SAMPLE_RATE)
            w.writeframes(pcm.tobytes())
        return buf.getvalue()

    def transcribe_bytes(
        self,
        data: bytes,
        *,
        suffix: str = ".ogg",
        filename: str = "audio",
    ) -> dict:
        if not self.configured:
            raise RuntimeError("OPENAI_API_KEY is not set (GapGPT Whisper ASR)")
        name = filename if "." in filename else f"{filename}{suffix}"
        raw = self._post_transcription(data, name)
        text = correct_asr_text(raw)
        return {
            "text": text,
            "low_confidence": False,
            "avg_logprob": None,
            "compression_ratio": None,
        }

    def transcribe(self, samples: np.ndarray) -> dict:
        if samples.size == 0:
            return {"text": "", "low_confidence": True, "avg_logprob": None, "compression_ratio": None}
        wav = self.samples_to_wav_bytes(samples)
        return self.transcribe_bytes(wav, suffix=".wav", filename="voice.wav")

    def _post_transcription(self, data: bytes, filename: str) -> str:
        boundary = "----FitinoGapGPTASR"
        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            "Content-Type: application/octet-stream\r\n\r\n"
        ).encode("utf-8") + data + (
            f"\r\n--{boundary}\r\n"
            f'Content-Disposition: form-data; name="model"\r\n\r\n'
            f"{self.model}\r\n"
            f"--{boundary}--\r\n"
        ).encode("utf-8")
        url = f"{self.base_url}/audio/transcriptions"
        req = urllib.request.Request(
            url,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": f"multipart/form-data; boundary={boundary}",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"GapGPT ASR HTTP {exc.code}: {detail}") from exc
        if isinstance(payload, dict):
            return str(payload.get("text") or "").strip()
        return str(payload).strip()
