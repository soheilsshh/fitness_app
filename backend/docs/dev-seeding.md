# Development Data Seeding

## Overview

This project includes a development seeding system built on top of `gorm-seed`.

The goal is to populate a local development database with realistic sample data for:

* UI development
* QA testing
* Demo environments
* Local onboarding

The seed process is idempotent and can be executed multiple times safely.

---

## Available Seed Modes

### Exercise Dataset Import

Imports the exercise catalog from a JSON dataset.

```bash
go run ./cmd/seed
```

Or:

```bash
go run ./cmd/seed -file=path/to/exercises.json
```

This command only imports exercise definitions.

---

### Development Fixtures

Loads realistic demo data for the application.

```bash
go run ./cmd/seed -dev
```

The development fixtures include:

* Coaches
* Students
* Coach profiles
* Service plans
* Subscriptions
* Orders
* Workout programs
* Nutrition programs
* Program items
* Transactions
* Notifications
* Feedbacks
* Site settings

---

## Development Accounts

Password for all fixture accounts:

```text
12345678
```

### Coaches

```text
coach.ali@fitness.dev
coach.sara@fitness.dev
```

### Students

```text
student.reza@fitness.dev
student.maryam@fitness.dev
student.amir@fitness.dev
student.neda@fitness.dev
```

### Admin

```text
admin@gmail.com
```

---

## Safety Guards

The development seed is protected against accidental execution in production.

The seed process is blocked when:

```env
APP_ENV=production
```

or

```env
APP_ENV=prod
```

Production environments must never enable development fixtures.

---

## Idempotency

Development fixtures are designed to be idempotent.

Running:

```bash
go run ./cmd/seed -dev
```

multiple times will not create duplicate records.

Example:

```bash
go run ./cmd/seed -dev
go run ./cmd/seed -dev
```

The second execution should be a no-op for existing fixture data.

---

## Database Requirements

The development seed is intended for:

* Local development databases
* Dedicated development environments
* Fresh databases

The seed uses predefined fixture identities and validation checks.

If the database already contains conflicting data, the seed process will abort with a validation error.

Example:

```text
user id=2 is occupied by a non-dev account
```

In such cases:

* Use a fresh development database
* Or remove conflicting records

---

## Fixture Storage

Fixtures are stored as embedded JSON files.

```text
internal/seed/fixtures/
```

Example:

```text
internal/seed/fixtures/users.json
internal/seed/fixtures/subscriptions.json
internal/seed/fixtures/orders.json
```

These files are embedded into the binary using `go:embed`.

---

## Architecture

The seeding system is implemented in:

```text
internal/seed/
```

Key components:

```text
internal/seed/
├── seed.go
├── registry.go
├── validate.go
├── guard.go
├── embed.go
└── fixtures/
```

### Responsibilities

* `seed.go` → entry point for development seeding
* `registry.go` → fixture registration and load ordering
* `validate.go` → pre-seed validation checks
* `guard.go` → environment and safety restrictions
* `embed.go` → embedded fixture loading

---

## Adding New Fixtures

To add a new seeded entity:

### 1. Register the model

Add the model to:

```go
models.AllModels()
```

### 2. Create a fixture file

Example:

```text
internal/seed/fixtures/new_entity.json
```

### 3. Register the fixture

Update:

```go
internal/seed/registry.go
```

Add:

* fixture registration
* dependency ordering (if required)

### 4. Test

Run:

```bash
go run ./cmd/seed -dev
```

Verify:

* no errors occur
* no duplicate records are created on subsequent runs

---

## Verification Checklist

After running:

```bash
go run ./cmd/seed -dev
```

Verify:

### Authentication

* Coach login works
* Student login works
* Admin login works

### UI

* Coach list contains records
* Coach profile pages load correctly
* Orders are visible
* Subscriptions are visible
* Notifications are visible
* Programs contain items

### Idempotency

Run the command twice and confirm record counts do not increase unexpectedly.

---

## Recommended Usage

For local development:

```bash
go run ./cmd/seed -dev
go run ./cmd/app
```

Recommended workflow:

1. Create a fresh local database
2. Run migrations
3. Execute development seed
4. Start the application
5. Use fixture accounts for UI testing

This is the preferred approach over manually inserting test records.
