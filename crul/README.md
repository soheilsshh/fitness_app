# CRUL Data Pipelines

This folder contains modular Python pipelines for:

- **Exercise templates** (fetch JSON, download images/videos, normalize media paths)
- **Diet templates** (fetch JSON, download images, normalize media paths)

The code is split by domain under `exercise/` and `diet/`, while shared modules stay at the root.

---

## Folder Structure

- `config.py`  
  Central configuration (API URLs, query params, output paths, limits).

- `media_downloader.py`  
  Shared media download engine (deduplication by filename, skip already-downloaded files, dry-run support).

- `exercise/`
  - `fetch_templates.py` — fetch exercise templates into JSON
  - `download_images.py` — download unique exercise images
  - `download_videos.py` — download unique exercise videos
  - `normalize_media_paths.py` — rewrite media paths in exercise JSON to local relative paths

- `diet/`
  - `fetch_templates.py` — fetch diet templates into JSON
  - `download_images.py` — download unique diet images
  - `normalize_media_paths.py` — rewrite media paths in diet JSON to local relative paths

- `output/`
  - `exercise/exercise_templates.json`
  - `exercise/images/`
  - `exercise/videos/`
  - `food/diet_templates.json`
  - `food/images/`
  - (optional) `food/videos/` if you add video download for diet later

---

## Prerequisites

From `crul/`:

```bash
pip install -r requirements.txt
```

Set cookies in `.env` (see `.env.example`):

- `MORABIHA_USER_COOKIE`
- `MORABIHA_ACCESS_TOKEN`

---

## Run Commands

### Exercise

Fetch templates:

```bash
python exercise/fetch_templates.py
```

Download images:

```bash
python exercise/download_images.py
```

Download videos:

```bash
python exercise/download_videos.py
```

Normalize JSON media paths (`/files/...` -> `images/...` and `videos/...`):

```bash
python exercise/normalize_media_paths.py --create-backup
```

### Diet

Fetch templates:

```bash
python diet/fetch_templates.py
```

Download images:

```bash
python diet/download_images.py
```

Normalize JSON media paths (`/files/...` -> `images/...` and `videos/...` when fields exist):

```bash
python diet/normalize_media_paths.py --create-backup
```

---

## Dry-Run / Small Tests

Use these before heavy runs:

```bash
python exercise/download_images.py --dry-run --scan-templates 5
python exercise/download_videos.py --dry-run --scan-templates 5
python diet/download_images.py --dry-run --scan-templates 5
python exercise/normalize_media_paths.py --dry-run
python diet/normalize_media_paths.py --dry-run
```

---

## How Deduplication Works

Media download scripts save files by **basename** (example: `1727524104398.png`), and skip if the file already exists and is non-empty.

This prevents repeated downloads when the same media path appears across many templates.

---

## Notes

### API links and params

Configured in `config.py`:

- Exercise API: `https://api.admin-morabiha.ir/exerciseTemplate`
- Diet API: `https://api.admin-morabiha.ir/dietTemplate`

Query defaults:

- `API_PARAMS` for exercise
- `DIET_API_PARAMS` for diet

Page limits:

- `PAGE_LIMIT` (exercise, default `50`)
- `DIET_PAGE_LIMIT` (diet, default `100`)

### Cookie setup

Cookies are required for authenticated API access.

Get values from browser DevTools:

1. Open `admin-morabiha.ir` and log in
2. DevTools -> Application -> Cookies -> `api.admin-morabiha.ir`
3. Copy:
   - `user`
   - `access_token`
4. Put them into `crul/.env`

If token expires, update `.env` and rerun.

---

## Git / Large Files

Large generated media folders are ignored in the repo:

- `crul/output/food/images/`
- `crul/output/exercise/images/`
- `crul/output/exercise/videos/`

