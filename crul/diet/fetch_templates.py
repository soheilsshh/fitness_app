"""
Fetch all diet templates from admin-morabiha API into output/food.

Each request uses limit=100 by default and appends templates to:
    output/food/diet_templates.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

CRUL_ROOT = Path(__file__).resolve().parents[1]
if str(CRUL_ROOT) not in sys.path:
    sys.path.insert(0, str(CRUL_ROOT))

from config import (
    DIET_API_PARAMS,
    DIET_API_URL,
    DIET_PAGE_LIMIT,
    DIET_TEMPLATES_FILE,
    FOOD_DIR,
    REQUEST_DELAY_SEC,
)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

load_dotenv(CRUL_ROOT / ".env")


def build_session() -> requests.Session:
    user_cookie = os.getenv("MORABIHA_USER_COOKIE", "").strip()
    access_token = os.getenv("MORABIHA_ACCESS_TOKEN", "").strip()

    if not user_cookie or not access_token:
        raise RuntimeError(
            "Set MORABIHA_USER_COOKIE and MORABIHA_ACCESS_TOKEN in crul/.env"
        )

    session = requests.Session()
    session.cookies.set("user", user_cookie, domain="api.admin-morabiha.ir")
    session.cookies.set(
        "access_token", access_token, domain="api.admin-morabiha.ir"
    )
    session.headers.update(
        {
            "Accept": "application/json",
            "User-Agent": "MorabiyarDietFetcher/1.0",
        }
    )
    return session


def load_output() -> dict:
    if not DIET_TEMPLATES_FILE.exists():
        return {
            "total_count": 0,
            "fetched_count": 0,
            "last_page": -1,
            "page_limit": DIET_PAGE_LIMIT,
            "templates": [],
        }

    with open(DIET_TEMPLATES_FILE, encoding="utf-8") as f:
        data = json.load(f)

    data.setdefault("templates", [])
    data.setdefault("fetched_count", len(data["templates"]))
    data.setdefault("last_page", -1)
    data.setdefault("page_limit", DIET_PAGE_LIMIT)
    return data


def save_output(data: dict) -> None:
    FOOD_DIR.mkdir(parents=True, exist_ok=True)
    data["fetched_count"] = len(data["templates"])
    with open(DIET_TEMPLATES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def fetch_page(session: requests.Session, page: int, limit: int) -> tuple[list, dict]:
    params = {**DIET_API_PARAMS, "page": page, "limit": limit}
    response = session.get(DIET_API_URL, params=params, timeout=60)
    response.raise_for_status()
    body = response.json()

    if body.get("statusCode") != 200:
        raise RuntimeError(f"API error on page {page}: {body}")

    templates_payload = body.get("data", {}).get("templates")
    pagination = body.get("data", {}).get("pagination", {}) or {}

    if isinstance(templates_payload, dict):
        pagination = templates_payload.get("pagination", pagination) or {}
        templates = templates_payload.get("templates") or []
    elif isinstance(templates_payload, list):
        templates = templates_payload
    else:
        templates = []

    if not isinstance(pagination, dict):
        pagination = {}
    pagination.setdefault("page", page)
    pagination.setdefault("count", len(templates))

    return templates, pagination


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch diet templates from morabiha API"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=DIET_PAGE_LIMIT,
        help=f"Templates per page (default: {DIET_PAGE_LIMIT})",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=0,
        help="Stop after N pages (0 = fetch all)",
    )
    parser.add_argument(
        "--start-page",
        type=int,
        default=-1,
        help="Override start page (-1 = resume from saved file)",
    )
    args = parser.parse_args()

    session = build_session()
    output = load_output()

    if args.start_page >= 0:
        page = args.start_page
    else:
        page = output["last_page"] + 1

    pages_fetched = 0
    print(f"[diet-fetch] Output file: {DIET_TEMPLATES_FILE}")
    print(
        f"[diet-fetch] Starting at page {page}, limit {args.limit} per page"
    )

    while True:
        if args.max_pages and pages_fetched >= args.max_pages:
            print(f"[diet-fetch] Reached --max-pages={args.max_pages}")
            break

        print(f"[diet-fetch] Requesting page {page}...")
        templates, pagination = fetch_page(session, page, args.limit)

        known_total = isinstance(pagination.get("totalCount"), int)

        if page == 0 or output["total_count"] == 0:
            total_count = pagination.get("totalCount")
            if isinstance(total_count, int):
                output["total_count"] = total_count
            elif output["total_count"] == 0:
                output["total_count"] = len(templates)
        elif (not known_total) and output["total_count"] < output["fetched_count"] + len(templates):
            output["total_count"] = output["fetched_count"] + len(templates)

        output["page_limit"] = args.limit
        output["templates"].extend(templates)
        output["last_page"] = page
        save_output(output)

        print(
            f"[diet-fetch] Page {page}: +{len(templates)} templates "
            f"({output['fetched_count']}/{output['total_count']} total)"
        )

        pages_fetched += 1
        page += 1

        if not templates:
            print("[diet-fetch] Empty page — done.")
            break
        if known_total and output["fetched_count"] >= output["total_count"]:
            print("[diet-fetch] All templates fetched.")
            break

        time.sleep(REQUEST_DELAY_SEC)

    print(
        f"\n[diet-fetch] Done — saved {output['fetched_count']} templates "
        f"to {DIET_TEMPLATES_FILE}"
    )


if __name__ == "__main__":
    main()
