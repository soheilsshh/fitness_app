"""
Download diet-template images into output/food/images (deduplicated, flat).

Reads diet template JSON and scans image-like fields recursively.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

CRUL_ROOT = Path(__file__).resolve().parents[1]
if str(CRUL_ROOT) not in sys.path:
    sys.path.insert(0, str(CRUL_ROOT))

from config import DIET_TEMPLATES_FILE, FOOD_IMAGES_DIR
from media_downloader import download_unique_media_from_fields

DEFAULT_IMAGE_FIELDS = [
    "food_image",
    "action_pic_url",
    "food_pic_url",
    "image_url",
    "pic_url",
    "thumbnail_url",
]


def parse_fields(value: str) -> list[str]:
    fields = [item.strip() for item in value.split(",") if item.strip()]
    if not fields:
        return DEFAULT_IMAGE_FIELDS
    return fields


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download unique diet images (flat folder, deduplicated)"
    )
    parser.add_argument("--input", type=Path, default=DIET_TEMPLATES_FILE)
    parser.add_argument(
        "--fields",
        type=str,
        default=",".join(DEFAULT_IMAGE_FIELDS),
        help="Comma-separated JSON field names to scan for image paths",
    )
    parser.add_argument(
        "--scan-templates",
        type=int,
        default=0,
        help="Only scan first N templates (0 = all)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Download at most N unique files (0 = all)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show counts and sample files without downloading",
    )
    args = parser.parse_args()

    download_unique_media_from_fields(
        dest_dir=FOOD_IMAGES_DIR,
        fields=parse_fields(args.fields),
        label="food-images",
        input_file=args.input,
        scan_templates=args.scan_templates,
        limit=args.limit,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
