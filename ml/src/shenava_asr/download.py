"""Download Shenava Koochik v1.0 sherpa-onnx weights from Hugging Face."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .paths import MODEL_NAME, default_model_dir

HF_REPO = "Reza2kn/Shenava-Koochik-v1.0-sherpa-onnx"
NEEDED = ("model.onnx", "tokens.txt")


def download(dest=None) -> str:
    try:
        from huggingface_hub import hf_hub_download
    except ImportError as e:
        raise SystemExit(
            "huggingface_hub is required. Install with:\n"
            "  pip install 'shenava-asr[download]'\n"
            "or: pip install huggingface_hub"
        ) from e

    out = default_model_dir() if dest is None else Path(dest)
    out.mkdir(parents=True, exist_ok=True)
    if all((out / name).is_file() for name in NEEDED):
        print(f"skip (already present): {out}")
        return str(out)
    for name in NEEDED:
        path = hf_hub_download(
            repo_id=HF_REPO,
            filename=name,
            local_dir=str(out),
        )
        print(f"ok: {path}")
    return str(out)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=f"Download {MODEL_NAME} weights")
    p.add_argument(
        "--dest",
        default=None,
        help=f"Target folder (default: {default_model_dir()})",
    )
    args = p.parse_args(argv)
    dest = Path(args.dest).expanduser().resolve() if args.dest else default_model_dir()
    print(download(dest))
    return 0


if __name__ == "__main__":
    sys.exit(main())
