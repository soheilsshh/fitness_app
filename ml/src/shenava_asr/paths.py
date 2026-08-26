"""Resolve Shenava model asset paths (weights live outside the Python package)."""

from __future__ import annotations

import os
from pathlib import Path

MODEL_NAME = "shenava-koochik-v1.0"
ENV_MODEL_DIR = "SHENAVA_MODEL_DIR"


def ml_root() -> Path:
    """fitness_app/ml — package lives in src/, weights in models/."""
    return Path(__file__).resolve().parents[2]


def default_model_dir() -> Path:
    override = os.environ.get(ENV_MODEL_DIR, "").strip()
    if override:
        return Path(override).expanduser().resolve()
    return ml_root() / "models" / MODEL_NAME


def resolve_model_paths(model_dir: str | Path | None = None) -> tuple[Path, Path]:
    """Return (model.onnx, tokens.txt). Raises FileNotFoundError if missing."""
    root = Path(model_dir).expanduser().resolve() if model_dir else default_model_dir()
    onnx = root / "model.onnx"
    tokens = root / "tokens.txt"
    missing = [str(p) for p in (onnx, tokens) if not p.is_file()]
    if missing:
        raise FileNotFoundError(
            "Shenava model files missing:\n  - "
            + "\n  - ".join(missing)
            + f"\nDownload with: shenava-download-model\n"
            f"Or set {ENV_MODEL_DIR} to a folder that contains model.onnx + tokens.txt."
        )
    return onnx, tokens
