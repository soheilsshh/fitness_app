# Development Data Seeding & Datasets Guide

## Folder layout (one dataset = one folder)

```text
data/
├── exercises-fa/          # Persian catalog + its media (seeded)
├── exercises-en/          # English twin JSON only (not seeded)
├── foods/                 # CSV (seeded)
├── exercise-templates/    # Workout templates + their media (seeded)
└── diet-templates/        # Diet templates + their images (seeded)
```

Path resolution: `FITINO_DATA_DIR` → `<binary>/data` → `./data`

## Startup auto-seed

`seed.catalogs: true`, `seed.dev_data: false` → seeds FA exercises, foods, both template JSONs. No fake coaches/students.

## Media (do not mix folders)

- Catalog: `data/exercises-fa/images` + `videos` (paths in JSON: `images/...`, `videos/...`)
- Templates: `data/exercise-templates/images` + `videos`
- Diet: `data/diet-templates/images`

## CLI

```bash
cd backend
go run ./cmd/seed -catalogs
go run ./cmd/seed -catalogs -force
go run ./cmd/seed -dev   # fake users only; blocked in production
```
