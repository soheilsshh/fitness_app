"""Shared settings for crul API scripts."""

import os
from pathlib import Path

from dotenv import load_dotenv

_CRUL_DIR = Path(__file__).resolve().parent
load_dotenv(_CRUL_DIR / ".env")

# Templates fetched per API request (page size)
PAGE_LIMIT = int(os.getenv("API_PAGE_LIMIT", "50"))
DIET_PAGE_LIMIT = int(os.getenv("API_DIET_PAGE_LIMIT", "100"))

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

DIET_API_URL = "https://api.admin-morabiha.ir/dietTemplate"
DIET_API_PARAMS = {
    "type": "عمومی",
    "target": "",
    "limitation": "",
    "gender": "",
    "calorie": "",
}

OUTPUT_DIR = _CRUL_DIR / "output"
# Canonical seed location used by the Go API — each dataset in its own folder.
_BACKEND_DATA = _CRUL_DIR.parent / "backend" / "data"

_EXERCISE_TPL = _BACKEND_DATA / "exercise-templates"
_DIET_TPL = _BACKEND_DATA / "diet-templates"
_EXERCISES_FA = _BACKEND_DATA / "exercises-fa"

TEMPLATES_FILE = Path(
    os.getenv("CRUL_EXERCISE_TEMPLATES_FILE", str(_EXERCISE_TPL / "exercise_templates.json"))
)
DIET_TEMPLATES_FILE = Path(
    os.getenv("CRUL_DIET_TEMPLATES_FILE", str(_DIET_TPL / "diet_templates.json"))
)

# Template media — MUST stay under exercise-templates/ (not exercises-fa/)
IMAGES_DIR = Path(os.getenv("CRUL_IMAGES_DIR", str(_EXERCISE_TPL / "images")))
VIDEOS_DIR = Path(os.getenv("CRUL_VIDEOS_DIR", str(_EXERCISE_TPL / "videos")))

FOOD_DIR = OUTPUT_DIR / "food"
FOOD_IMAGES_DIR = Path(os.getenv("CRUL_FOOD_IMAGES_DIR", str(_DIET_TPL / "images")))

# Catalog media (separate from template media)
CATALOG_IMAGES_DIR = _EXERCISES_FA / "images"
CATALOG_VIDEOS_DIR = _EXERCISES_FA / "videos"

STORAGE_BASE = os.getenv("MORABIHA_STORAGE_BASE", "https://storage.morabiha.com")

REQUEST_DELAY_SEC = 0.3
