"""
Normalize media paths inside diet template JSON.

Typical rewrite:
  food_image -> images/<filename>

If video fields are present, they can also be normalized to:
  <video_field> -> videos/<filename>

Default input/output:
  input : crul/output/food/diet_templates.json
  images: crul/output/food/images/
  videos: crul/output/food/videos/
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

from config import DIET_TEMPLATES_FILE, FOOD_IMAGES_DIR  # noqa: E402

DEFAULT_INPUT = DIET_TEMPLATES_FILE
DEFAULT_IMAGES_DIR = FOOD_IMAGES_DIR
DEFAULT_VIDEOS_DIR = FOOD_IMAGES_DIR.parent / "videos"

DEFAULT_IMAGE_FIELDS = [
    "food_image",
    "food_pic_url",
    "image_url",
    "pic_url",
    "thumbnail_url",
]
DEFAULT_VIDEO_FIELDS = [
    "food_video",
    "food_video_url",
    "video_url",
    "action_video_ur",
]


def parse_fields(value: str) -> list[str]:
    return [part.strip() for part in value.split(",") if part.strip()]


def extract_filename(value: str) -> str:
    if not value:
        return ""
    parsed = urlparse(value)
    path = parsed.path if parsed.path else value
    return Path(path).name


def iter_nested_dicts(node):
    if isinstance(node, dict):
        yield node
        for value in node.values():
            yield from iter_nested_dicts(value)
    elif isinstance(node, list):
        for value in node:
            yield from iter_nested_dicts(value)


def normalize_json_paths(
    data: dict,
    image_fields: list[str],
    video_fields: list[str],
    images_dir: Path,
    videos_dir: Path,
) -> dict:
    changed_images = 0
    changed_videos = 0
    image_refs = 0
    video_refs = 0
    missing_images = 0
    missing_videos = 0

    templates = data.get("templates") or []
    for template in templates:
        for node in iter_nested_dicts(template):
            for field in image_fields:
                value = (node.get(field) or "").strip()
                if not value:
                    continue
                image_refs += 1
                filename = extract_filename(value)
                if not filename:
                    continue
                new_value = f"images/{filename}"
                if value != new_value:
                    node[field] = new_value
                    changed_images += 1
                if not (images_dir / filename).exists():
                    missing_images += 1

            for field in video_fields:
                value = (node.get(field) or "").strip()
                if not value:
                    continue
                video_refs += 1
                filename = extract_filename(value)
                if not filename:
                    continue
                new_value = f"videos/{filename}"
                if value != new_value:
                    node[field] = new_value
                    changed_videos += 1
                if not (videos_dir / filename).exists():
                    missing_videos += 1

    return {
        "image_refs": image_refs,
        "video_refs": video_refs,
        "changed_images": changed_images,
        "changed_videos": changed_videos,
        "missing_images": missing_images,
        "missing_videos": missing_videos,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Normalize media paths in diet_templates.json",
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--images-dir", type=Path, default=DEFAULT_IMAGES_DIR)
    parser.add_argument("--videos-dir", type=Path, default=DEFAULT_VIDEOS_DIR)
    parser.add_argument(
        "--image-fields",
        type=str,
        default=",".join(DEFAULT_IMAGE_FIELDS),
        help="Comma-separated image field names to normalize",
    )
    parser.add_argument(
        "--video-fields",
        type=str,
        default=",".join(DEFAULT_VIDEO_FIELDS),
        help="Comma-separated video field names to normalize",
    )
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

    image_fields = parse_fields(args.image_fields)
    video_fields = parse_fields(args.video_fields)

    stats = normalize_json_paths(
        data=data,
        image_fields=image_fields,
        video_fields=video_fields,
        images_dir=args.images_dir,
        videos_dir=args.videos_dir,
    )

    print(f"[normalize-food] input: {args.input}")
    print(f"[normalize-food] images dir: {args.images_dir}")
    print(f"[normalize-food] videos dir: {args.videos_dir}")
    print(f"[normalize-food] image fields: {', '.join(image_fields)}")
    print(f"[normalize-food] video fields: {', '.join(video_fields)}")
    print(f"[normalize-food] image refs: {stats['image_refs']}")
    print(f"[normalize-food] video refs: {stats['video_refs']}")
    print(f"[normalize-food] changed image paths: {stats['changed_images']}")
    print(f"[normalize-food] changed video paths: {stats['changed_videos']}")
    print(f"[normalize-food] missing local images: {stats['missing_images']}")
    print(f"[normalize-food] missing local videos: {stats['missing_videos']}")

    if args.dry_run:
        print("[normalize-food] dry-run enabled; no file written.")
        return

    if args.create_backup:
        backup_path = args.input.with_suffix(args.input.suffix + ".bak")
        shutil.copy2(args.input, backup_path)
        print(f"[normalize-food] backup created: {backup_path}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[normalize-food] wrote normalized JSON: {args.output}")


if __name__ == "__main__":
    main()
