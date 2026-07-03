"""
Normalize media paths inside exercise template JSON.

Rewrites:
  action_video_ur -> videos/<filename>
  action_pic_url  -> images/<filename>

Default input/output targets:
  input : crul/output/exercise/exercise_templates.json
  videos: crul/output/exercise/videos/
  images: crul/output/exercise/images/

Usage:
  python exercise/normalize_media_paths.py --dry-run
  python exercise/normalize_media_paths.py
  python exercise/normalize_media_paths.py --create-backup
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path
from urllib.parse import urlparse


CRUL_ROOT = Path(__file__).resolve().parents[1]
if str(CRUL_ROOT) not in sys.path:
    sys.path.insert(0, str(CRUL_ROOT))

EXERCISE_OUTPUT_DIR = CRUL_ROOT / "output" / "exercise"
DEFAULT_INPUT = EXERCISE_OUTPUT_DIR / "exercise_templates.json"
DEFAULT_VIDEOS_DIR = EXERCISE_OUTPUT_DIR / "videos"
DEFAULT_IMAGES_DIR = EXERCISE_OUTPUT_DIR / "images"


def extract_filename(value: str) -> str:
    """Return media filename from url/path; empty if not present."""
    if not value:
        return ""
    parsed = urlparse(value)
    path = parsed.path if parsed.path else value
    return Path(path).name


def iter_movements(data: dict):
    templates = data.get("templates") or []
    for template in templates:
        for day in template.get("days") or []:
            for block in day.get("data") or []:
                for movement in block.get("movement_list") or []:
                    yield movement


def normalize_json_paths(
    data: dict,
    videos_dir: Path,
    images_dir: Path,
) -> dict:
    changed_videos = 0
    changed_images = 0
    missing_videos = 0
    missing_images = 0
    video_refs = 0
    image_refs = 0

    for movement in iter_movements(data):
        video_value = (movement.get("action_video_ur") or "").strip()
        image_value = (movement.get("action_pic_url") or "").strip()

        if video_value:
            video_refs += 1
            video_name = extract_filename(video_value)
            if video_name:
                new_video_value = f"videos/{video_name}"
                if video_value != new_video_value:
                    movement["action_video_ur"] = new_video_value
                    changed_videos += 1
                if not (videos_dir / video_name).exists():
                    missing_videos += 1

        if image_value:
            image_refs += 1
            image_name = extract_filename(image_value)
            if image_name:
                new_image_value = f"images/{image_name}"
                if image_value != new_image_value:
                    movement["action_pic_url"] = new_image_value
                    changed_images += 1
                if not (images_dir / image_name).exists():
                    missing_images += 1

    return {
        "video_refs": video_refs,
        "image_refs": image_refs,
        "changed_videos": changed_videos,
        "changed_images": changed_images,
        "missing_videos": missing_videos,
        "missing_images": missing_images,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Normalize action_video_ur/action_pic_url in exercise JSON",
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--videos-dir", type=Path, default=DEFAULT_VIDEOS_DIR)
    parser.add_argument("--images-dir", type=Path, default=DEFAULT_IMAGES_DIR)
    parser.add_argument(
        "--create-backup",
        action="store_true",
        help="Create .bak copy of input file before writing",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Analyze and print changes without writing output file",
    )
    args = parser.parse_args()

    if not args.input.exists():
        raise FileNotFoundError(f"Input not found: {args.input}")

    with open(args.input, encoding="utf-8") as f:
        data = json.load(f)

    stats = normalize_json_paths(data, args.videos_dir, args.images_dir)

    print(f"[normalize] input: {args.input}")
    print(f"[normalize] videos dir: {args.videos_dir}")
    print(f"[normalize] images dir: {args.images_dir}")
    print(f"[normalize] video refs: {stats['video_refs']}")
    print(f"[normalize] image refs: {stats['image_refs']}")
    print(f"[normalize] changed action_video_ur: {stats['changed_videos']}")
    print(f"[normalize] changed action_pic_url: {stats['changed_images']}")
    print(f"[normalize] missing local videos: {stats['missing_videos']}")
    print(f"[normalize] missing local images: {stats['missing_images']}")

    if args.dry_run:
        print("[normalize] dry-run enabled; no file written.")
        return

    if args.create_backup and args.input.exists():
        backup_path = args.input.with_suffix(args.input.suffix + ".bak")
        shutil.copy2(args.input, backup_path)
        print(f"[normalize] backup created: {backup_path}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[normalize] wrote normalized JSON: {args.output}")


if __name__ == "__main__":
    main()
