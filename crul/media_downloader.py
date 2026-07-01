"""Shared helpers for deduplicated flat media downloads."""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
from dotenv import load_dotenv

from config import OUTPUT_DIR, REQUEST_DELAY_SEC, STORAGE_BASE, TEMPLATES_FILE

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

load_dotenv()


def build_session() -> requests.Session:
    user_cookie = os.getenv("MORABIHA_USER_COOKIE", "").strip()
    access_token = os.getenv("MORABIHA_ACCESS_TOKEN", "").strip()

    session = requests.Session()
    if user_cookie:
        session.cookies.set("user", user_cookie)
    if access_token:
        session.cookies.set("access_token", access_token)
    return session


def resolve_url(path: str) -> str:
    if not path:
        return ""
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return urljoin(STORAGE_BASE, path.lstrip("/"))


def basename_from_api_path(path: str) -> str:
    """e.g. /files/exercise/images/1727524104398.png -> 1727524104398.png"""
    return Path(path).name


def local_media_path(dest_dir: Path, api_path: str) -> Path:
    """Local file path matching the JSON basename (no JSON changes needed)."""
    return dest_dir / basename_from_api_path(api_path)


def _lookup_rule(dest_dir: Path) -> str:
    try:
        rel = dest_dir.relative_to(OUTPUT_DIR).as_posix()
        return f"output/{rel}/<basename from JSON>"
    except Exception:
        return f"{dest_dir}/<basename from JSON>"


def iter_movements(data: dict, scan_templates: int = 0):
    templates = data.get("templates") or []
    if scan_templates:
        templates = templates[:scan_templates]

    for template in templates:
        for day in template.get("days") or []:
            for block in day.get("data") or []:
                for movement in block.get("movement_list") or []:
                    yield movement


def iter_nested_dicts(node):
    if isinstance(node, dict):
        yield node
        for value in node.values():
            yield from iter_nested_dicts(value)
    elif isinstance(node, list):
        for value in node:
            yield from iter_nested_dicts(value)


def collect_unique_media(
    data: dict,
    field: str,
    scan_templates: int = 0,
) -> tuple[dict[str, str], int]:
    """
    Return {filename: source_url} for unique media files.
    First occurrence wins; duplicates in JSON are ignored.
    """
    unique: dict[str, str] = {}
    references = 0

    for movement in iter_movements(data, scan_templates):
        api_path = (movement.get(field) or "").strip()
        if not api_path:
            continue
        references += 1
        filename = basename_from_api_path(api_path)
        if filename in unique:
            continue
        unique[filename] = resolve_url(api_path)

    return unique, references


def collect_unique_media_multi_fields(
    data: dict,
    fields: list[str],
    scan_templates: int = 0,
) -> tuple[dict[str, str], int]:
    """
    Return {filename: source_url} for unique files found under any field name.
    Scans nested template payload recursively to handle different API shapes.
    """
    templates = data.get("templates") or []
    if scan_templates:
        templates = templates[:scan_templates]

    unique: dict[str, str] = {}
    references = 0

    for template in templates:
        for node in iter_nested_dicts(template):
            for field in fields:
                api_path = (node.get(field) or "").strip()
                if not api_path:
                    continue
                references += 1
                filename = basename_from_api_path(api_path)
                if filename in unique:
                    continue
                unique[filename] = resolve_url(api_path)

    return unique, references


def download_file(session: requests.Session, url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        return True

    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        resp = session.get(url, timeout=120, stream=True)
        resp.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in resp.iter_content(chunk_size=65536):
                if chunk:
                    f.write(chunk)
        return True
    except Exception as exc:
        print(f"  [warn] failed {dest.name}: {exc}")
        if dest.exists() and dest.stat().st_size == 0:
            dest.unlink(missing_ok=True)
        return False


def download_unique_media(
    *,
    dest_dir: Path,
    field: str,
    label: str,
    input_file: Path = TEMPLATES_FILE,
    scan_templates: int = 0,
    limit: int = 0,
    dry_run: bool = False,
) -> dict:
    if not input_file.exists():
        raise FileNotFoundError(
            f"{input_file} not found. Run fetch_exercise_templates.py first."
        )

    print(f"[{label}] Loading {input_file}...")
    with open(input_file, encoding="utf-8") as f:
        data = json.load(f)

    unique, references = collect_unique_media(data, field, scan_templates)
    filenames = sorted(unique.keys())
    if limit:
        filenames = filenames[:limit]

    already = sum(
        1 for name in filenames if (dest_dir / name).exists() and (dest_dir / name).stat().st_size > 0
    )
    to_fetch = [name for name in filenames if not ((dest_dir / name).exists() and (dest_dir / name).stat().st_size > 0)]

    print(f"[{label}] JSON references: {references}")
    print(f"[{label}] Unique files: {len(unique)}")
    print(f"[{label}] This run: {len(filenames)} file(s), {already} already on disk, {len(to_fetch)} to download")
    print(f"[{label}] Save folder: {dest_dir}")
    print(f"[{label}] Lookup rule: {_lookup_rule(dest_dir)}")

    if dry_run:
        print(f"[{label}] Dry run — sample files to download:")
        for name in to_fetch[:10]:
            print(f"  - {name}")
        if len(to_fetch) > 10:
            print(f"  ... and {len(to_fetch) - 10} more")
        return {
            "references": references,
            "unique": len(unique),
            "already": already,
            "downloaded": 0,
            "failed": 0,
            "skipped": already,
        }

    session = build_session()
    downloaded = 0
    failed = 0

    for i, name in enumerate(filenames, start=1):
        dest = dest_dir / name
        if dest.exists() and dest.stat().st_size > 0:
            continue

        url = unique[name]
        print(f"[{label}] ({i}/{len(filenames)}) {name}")
        if download_file(session, url, dest):
            downloaded += 1
        else:
            failed += 1
        time.sleep(REQUEST_DELAY_SEC)

    print(
        f"\n[{label}] Done — downloaded: {downloaded}, "
        f"skipped (already existed): {already}, failed: {failed}"
    )
    return {
        "references": references,
        "unique": len(unique),
        "already": already,
        "downloaded": downloaded,
        "failed": failed,
        "skipped": already,
    }


def download_unique_media_from_fields(
    *,
    dest_dir: Path,
    fields: list[str],
    label: str,
    input_file: Path = TEMPLATES_FILE,
    scan_templates: int = 0,
    limit: int = 0,
    dry_run: bool = False,
) -> dict:
    if not input_file.exists():
        raise FileNotFoundError(
            f"{input_file} not found. Fetch templates first."
        )

    print(f"[{label}] Loading {input_file}...")
    with open(input_file, encoding="utf-8") as f:
        data = json.load(f)

    unique, references = collect_unique_media_multi_fields(
        data, fields, scan_templates
    )
    filenames = sorted(unique.keys())
    if limit:
        filenames = filenames[:limit]

    already = sum(
        1
        for name in filenames
        if (dest_dir / name).exists() and (dest_dir / name).stat().st_size > 0
    )
    to_fetch = [
        name
        for name in filenames
        if not (
            (dest_dir / name).exists()
            and (dest_dir / name).stat().st_size > 0
        )
    ]

    print(f"[{label}] Fields: {', '.join(fields)}")
    print(f"[{label}] JSON references: {references}")
    print(f"[{label}] Unique files: {len(unique)}")
    print(
        f"[{label}] This run: {len(filenames)} file(s), "
        f"{already} already on disk, {len(to_fetch)} to download"
    )
    print(f"[{label}] Save folder: {dest_dir}")
    print(f"[{label}] Lookup rule: {_lookup_rule(dest_dir)}")

    if dry_run:
        print(f"[{label}] Dry run — sample files to download:")
        for name in to_fetch[:10]:
            print(f"  - {name}")
        if len(to_fetch) > 10:
            print(f"  ... and {len(to_fetch) - 10} more")
        return {
            "references": references,
            "unique": len(unique),
            "already": already,
            "downloaded": 0,
            "failed": 0,
            "skipped": already,
        }

    session = build_session()
    downloaded = 0
    failed = 0

    for i, name in enumerate(filenames, start=1):
        dest = dest_dir / name
        if dest.exists() and dest.stat().st_size > 0:
            continue

        url = unique[name]
        print(f"[{label}] ({i}/{len(filenames)}) {name}")
        if download_file(session, url, dest):
            downloaded += 1
        else:
            failed += 1
        time.sleep(REQUEST_DELAY_SEC)

    print(
        f"\n[{label}] Done — downloaded: {downloaded}, "
        f"skipped (already existed): {already}, failed: {failed}"
    )
    return {
        "references": references,
        "unique": len(unique),
        "already": already,
        "downloaded": downloaded,
        "failed": failed,
        "skipped": already,
    }
