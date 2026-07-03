"""
Fetch all exercise templates from admin-morabiha API.

Each page fetches templates and appends them to output/exercise_templates.json.
Re-run to resume if interrupted (continues from the next page).
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

from config import API_PARAMS, API_URL, OUTPUT_DIR, PAGE_LIMIT, REQUEST_DELAY_SEC, TEMPLATES_FILE

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
            "User-Agent": "MorabiyarFetcher/1.0",
        }
    )
    return session


def load_output() -> dict:
    if not TEMPLATES_FILE.exists():
        return {
            "total_count": 0,
            "fetched_count": 0,
            "last_page": -1,
            "page_limit": PAGE_LIMIT,
            "templates": [],
        }

    with open(TEMPLATES_FILE, encoding="utf-8") as f:
        data = json.load(f)

    data.setdefault("templates", [])
    data.setdefault("fetched_count", len(data["templates"]))
    data.setdefault("last_page", -1)
    data.setdefault("page_limit", PAGE_LIMIT)
    return data


def save_output(data: dict) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    data["fetched_count"] = len(data["templates"])
    with open(TEMPLATES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def fetch_page(session: requests.Session, page: int, limit: int) -> dict:
    params = {**API_PARAMS, "page": page, "limit": limit}
    response = session.get(API_URL, params=params, timeout=60)
    response.raise_for_status()
    body = response.json()

    if body.get("statusCode") != 200:
        raise RuntimeError(f"API error on page {page}: {body}")

    return body["data"]["templates"]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch exercise templates from morabiha API"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=PAGE_LIMIT,
        help=f"Templates per page (default: {PAGE_LIMIT})",
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
    print(f"[fetch] Output file: {TEMPLATES_FILE}")
    print(f"[fetch] Starting at page {page}, limit {args.limit} per page")

    while True:
        if args.max_pages and pages_fetched >= args.max_pages:
            print(f"[fetch] Reached --max-pages={args.max_pages}")
            break

        print(f"[fetch] Requesting page {page}...")
        try:
            batch = fetch_page(session, page, args.limit)
        except requests.HTTPError as exc:
            print(f"[error] HTTP {exc.response.status_code}: {exc}")
            raise

        pagination = batch["pagination"]
        templates = batch.get("templates") or []

        if page == 0 or output["total_count"] == 0:
            output["total_count"] = pagination.get("totalCount", 0)

        output["page_limit"] = args.limit
        output["templates"].extend(templates)
        output["last_page"] = page
        save_output(output)

        print(
            f"[fetch] Page {page}: +{len(templates)} templates "
            f"({output['fetched_count']}/{output['total_count']} total)"
        )

        pages_fetched += 1
        page += 1

        if not templates:
            print("[fetch] Empty page — done.")
            break
        if output["fetched_count"] >= output["total_count"]:
            print("[fetch] All templates fetched.")
            break

        time.sleep(REQUEST_DELAY_SEC)

    print(f"\n[done] Saved {output['fetched_count']} templates to {TEMPLATES_FILE}")


if __name__ == "__main__":
    main()
