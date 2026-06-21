# Development Data Seeding & Datasets Guide

## Overview

This project includes a robust data seeding and dataset import system built on top of `gorm-seed` and custom CSV/JSON parsers. 

In **Fitino**, data seeding is split into two distinct categories:
1. **Global Reference Catalogs (Production & Dev):** Core datasets required for the application's core features (Exercises and Food nutrition facts).
2. **Development Fixtures (Dev-only):** Realistic sample data (Coaches, Students, Subscriptions, and Active Programs) used for UI development, QA testing, and local demos.

The seeding process is completely **idempotent** and can be safely executed multiple times without duplicating database records.

---

## Directory Structure

All raw dataset files must be stored in the centralized `data` directory at the root of the backend:

```text
backend/
├── cmd/
│   └── seed/
│       └── main.go              # CLI Entrypoint for seeding
├── data/                        # Centralized Dataset Storage
│   ├── exercises.fa.json        # Global Exercise Catalog
│   └── Persian_food_facts.csv    # Global Food Nutrition Dataset
└── internal/
    └── seed/                    # Dev fixtures logic & registry

---

## 1. Global Reference Catalogs (Core Datasets)

These commands import production-ready reference catalogs that the application relies on for coach auto-completions and system-wide lookups.

### Exercise Dataset Import

Imports the system-wide exercise catalog from the localized JSON dataset.

```bash
cd backend
go run ./cmd/seed

```

* **Default Path:** `data/exercises.fa.json`
* **Custom Path:** Use the `-file` flag (e.g., `go run ./cmd/seed -file=custom/path.json`)

### Food Facts Dataset Import (New)

Parses and imports the comprehensive Persian food facts dataset, mapping macronutrients (Calories, Protein, Carbs, Fat, and nullable Sugar/Fiber).

```bash
cd backend
go run ./cmd/seed -foods

```

* **Default Path:** `data/Persian_food_facts.csv`
* **Idempotency Logic:** Uses a unique `ExternalID` generated from a deterministic SHA-256 hash of `lowercase(Name|Unit|Amount)`. Running this multiple times performs an **Upsert** (inserts missing items, updates existing ones).
* **Data Normalization:** The parser automatically sanitizes Persian decimal points (`٫`), commas, and converts missing/hyphenated values (`—`) into database `NULL` pointers.

---

## 2. Development Fixtures (Mock Data)

To populate a local development database with mock relationships for authentication, UI building, and feature testing, use the `-dev` flag:

```bash
cd backend
go run ./cmd/seed -dev

```

### What gets seeded in Dev Mode?

* **Users & Roles:** Admin, Coach, and Student accounts with pre-configured login credentials.
* **Core Flows:** Realistic subscription tracking, payment orders, support tickets, and active coach-student assignments.
* **Nutrition & Workout Programs:** Pre-assigned sample program items generated for UI testing.

---

## Complete Seeding Workflow for New Developers

When setting up the local environment for the first time, follow this exact sequence:

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Run database Auto-Migrations (starts the API server temporarily)
# This ensures all tables (including `exercises` and `foods`) are created by GORM.
./run.sh  # or run.bat on Windows

# 3. Seed Global Exercises Catalog
go run ./cmd/seed

# 4. Seed Global Food Facts Catalog (7,300+ items)
go run ./cmd/seed -foods

# 5. (Optional) Seed Local Development Mock Data for UI/QA
go run ./cmd/seed -dev

```

---

## Maintenance: Adding or Modifying Seed Data

### Modifying Food / Exercise Datasets

Simply edit or replace the files inside `backend/data/`. Since the script uses the `Upsert` strategy, you can re-run `go run ./cmd/seed -foods` or `go run ./cmd/seed` at any time to sync the changes without losing or duplicating existing data.

### Adding New Dev Fixtures (Code Structure)

To add a new seeded entity to the `-dev` flow:

1. Register the new GORM model inside `models.AllModels()` to enable auto-migration.
2. Create a new JSON fixture file under `internal/seed/fixtures/your_entity.json`.
3. Register the fixture and its execution order/dependencies inside `internal/seed/registry.go`.
4. Test the idempotency by running `go run ./cmd/seed -dev` twice and verifying that no duplicate records are created.