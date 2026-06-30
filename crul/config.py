"""Shared settings for crul API scripts."""

import os
from pathlib import Path

from dotenv import load_dotenv

_CRUL_DIR = Path(__file__).resolve().parent
load_dotenv(_CRUL_DIR / ".env")

# Templates fetched per API request (page size)
PAGE_LIMIT = int(os.getenv("API_PAGE_LIMIT", "50"))

API_URL = "https://api.admin-morabiha.ir/exerciseTemplate"
API_PARAMS = {
    "type": "عمومی",
    "target": "",
    "level": "",
    "gender": "",
    "location": "",
    "dayCount": "",
    "injury": "",
}

OUTPUT_DIR = _CRUL_DIR / "output"
TEMPLATES_FILE = OUTPUT_DIR / "exercise_templates.json"

# Flat media folders — filename matches basename in JSON (action_pic_url / action_video_ur)
IMAGES_DIR = OUTPUT_DIR / "images"
VIDEOS_DIR = OUTPUT_DIR / "videos"

STORAGE_BASE = os.getenv("MORABIHA_STORAGE_BASE", "https://storage.morabiha.com")

REQUEST_DELAY_SEC = 0.3
