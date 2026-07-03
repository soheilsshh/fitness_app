"""
Download exercise videos (deduplicated, flat folder).

Reads action_video_ur from exercise_templates.json.
Saves each unique video once as output/videos/<filename>.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

CRUL_ROOT = Path(__file__).resolve().parents[1]
if str(CRUL_ROOT) not in sys.path:
    sys.path.insert(0, str(CRUL_ROOT))

from config import TEMPLATES_FILE, VIDEOS_DIR
from media_downloader import download_unique_media

FIELD = "action_video_ur"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download unique exercise videos (flat folder, deduplicated)"
    )
    parser.add_argument("--input", type=Path, default=TEMPLATES_FILE)
    parser.add_argument(
        "--scan-templates",
        type=int,
        default=0,
        help="Only scan first N templates when collecting URLs (0 = all)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Download at most N unique video files (0 = all)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show counts and sample files without downloading",
    )
    args = parser.parse_args()

    download_unique_media(
        dest_dir=VIDEOS_DIR,
        field=FIELD,
        label="videos",
        input_file=args.input,
        scan_templates=args.scan_templates,
        limit=args.limit,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
