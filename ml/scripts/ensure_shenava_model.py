#!/usr/bin/env python3
"""Ensure Shenava Koochik weights exist locally (idempotent; safe to run from git hooks)."""

from __future__ import annotations

import sys
from pathlib import Path

ML_ROOT = Path(__file__).resolve().parents[1]
SRC = ML_ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from shenava_asr.download import NEEDED, download  # noqa: E402
from shenava_asr.paths import default_model_dir  # noqa: E402


def model_ready(dest: Path | None = None) -> bool:
    root = dest or default_model_dir()
    return all((root / name).is_file() for name in NEEDED)


def main() -> int:
    dest = default_model_dir()
    if model_ready(dest):
        print(f"Shenava model already present: {dest}")
        return 0
    print(f"Downloading Shenava model (~450MB) into {dest} ...")
    try:
        download(dest)
    except SystemExit as e:
        print(e, file=sys.stderr)
        return 1
    except Exception as e:
        print(f"download failed: {e}", file=sys.stderr)
        return 1
    print("Shenava model download complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
