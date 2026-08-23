"""CLI: shenava-transcribe audio.wav [--json]"""

from __future__ import annotations

import argparse
import json
import sys

from .audio import load_waveform
from .recognizer import ShenavaASR


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Transcribe Persian audio with Shenava ASR")
    p.add_argument("audio", help="Path to wav/flac/ogg (16 kHz mono preferred)")
    p.add_argument("--model-dir", default=None, help="Override model folder")
    p.add_argument("--no-itn", action="store_true", help="Skip spoken-number ITN")
    p.add_argument("--threads", type=int, default=4)
    p.add_argument("--json", action="store_true", help="Print {\"text\": \"...\"} for tooling")
    args = p.parse_args(argv)

    asr = ShenavaASR(
        model_dir=args.model_dir,
        num_threads=args.threads,
        apply_itn=not args.no_itn,
    )
    samples, sr = load_waveform(args.audio)
    text = asr.transcribe_waveform(samples, sr)
    if args.json:
        print(json.dumps({"text": text}, ensure_ascii=False))
    else:
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
