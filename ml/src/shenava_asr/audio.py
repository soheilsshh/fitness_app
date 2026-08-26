"""Load audio for Shenava — prefers WAV/FLAC/OGG; converts via ffmpeg when needed."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np


TARGET_SR = 16_000


def load_waveform(path: str | Path) -> tuple[np.ndarray, int]:
    """Return mono float32 samples and sample rate (ideally 16 kHz)."""
    path = Path(path)
    try:
        import soundfile as sf

        audio, sr = sf.read(str(path), always_2d=False)
        return _to_mono_f32(audio), int(sr)
    except Exception:
        pass

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError(
            f"Cannot decode {path.suffix or path.name}: install ffmpeg or upload 16 kHz WAV"
        )

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav_path = Path(tmp.name)
    try:
        cmd = [
            ffmpeg,
            "-y",
            "-i",
            str(path),
            "-ar",
            str(TARGET_SR),
            "-ac",
            "1",
            "-f",
            "wav",
            str(wav_path),
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or "ffmpeg failed")
        import soundfile as sf

        audio, sr = sf.read(str(wav_path), always_2d=False)
        return _to_mono_f32(audio), int(sr)
    finally:
        wav_path.unlink(missing_ok=True)


def _to_mono_f32(audio: np.ndarray) -> np.ndarray:
    arr = np.asarray(audio, dtype=np.float32)
    if arr.ndim > 1:
        arr = arr.mean(axis=1)
    return arr
