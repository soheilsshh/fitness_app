"""Offline Persian ASR wrapper around sherpa-onnx NeMo CTC export."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

import numpy as np

from .itn import itn
from .paths import resolve_model_paths


class ShenavaASR:
    """Reusable recognizer — create once, call from many call sites."""

    def __init__(
        self,
        model_dir: str | Path | None = None,
        *,
        num_threads: int = 4,
        apply_itn: bool = True,
        persian_digits: bool = True,
    ) -> None:
        import sherpa_onnx

        onnx, tokens = resolve_model_paths(model_dir)
        self.apply_itn = apply_itn
        self.persian_digits = persian_digits
        self.recognizer = sherpa_onnx.OfflineRecognizer.from_nemo_ctc(
            model=str(onnx),
            tokens=str(tokens),
            num_threads=num_threads,
        )

    def _post(self, text: str) -> str:
        text = (text or "").strip()
        if not text:
            return ""
        if self.apply_itn:
            return itn(text, persian_digits=self.persian_digits)
        return text

    def transcribe_waveform(self, samples: np.ndarray, sample_rate: int) -> str:
        audio = np.asarray(samples, dtype=np.float32)
        if audio.ndim > 1:
            audio = audio.mean(axis=1)
        stream = self.recognizer.create_stream()
        stream.accept_waveform(int(sample_rate), audio)
        self.recognizer.decode_stream(stream)
        return self._post(stream.result.text)

    def transcribe_file(self, path: str | Path) -> str:
        from .audio import load_waveform

        audio, sample_rate = load_waveform(path)
        return self.transcribe_waveform(audio, sample_rate)


def transcribe_waveform(
    samples: Iterable[float] | np.ndarray,
    sample_rate: int,
    *,
    model_dir: str | Path | None = None,
    apply_itn: bool = True,
) -> str:
    asr = ShenavaASR(model_dir=model_dir, apply_itn=apply_itn)
    return asr.transcribe_waveform(np.asarray(samples, dtype=np.float32), sample_rate)


def transcribe_file(
    path: str | Path,
    *,
    model_dir: str | Path | None = None,
    apply_itn: bool = True,
) -> str:
    asr = ShenavaASR(model_dir=model_dir, apply_itn=apply_itn)
    return asr.transcribe_file(path)
