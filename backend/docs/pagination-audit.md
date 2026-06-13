# Pagination Audit Report

## Overview

This document reviews all list-based API endpoints and verifies:

1. Whether pagination parameters are supported.
2. Whether pagination is applied at the database query level.
3. Whether pagination metadata is returned in the response.

---

## Paginated List Endpoints

Common pattern: `page` + `pageSize`.

Most responses return:

```json
{
  "items": [...],
  "page": 1,
  "pageSize": 20,
  "total": 100
}
```

| Endpoint               | Pagination Parameters                 | Applied in DB Query | Metadata |
| ---------------------- | ------------------------------------- | ------------------- | -------- |
| `GET /coaches`         | `page`, `pageSize`                    | ✅                   | ✅        |
| `GET /coach/plans`     | `page`, `pageSize`, `query`, `tag`    | ✅                   | ✅        |
| `GET /coach/students`  | `page`, `pageSize`, `status`, `query` | ✅                   | ✅        |
| `GET /coach/exercises` | `page`, `pageSize` + filters          | ✅                   | ✅        |
| `GET /me/orders`       | `page`, `pageSize`, `status`          | ✅                   | ✅        |
| `GET /admin/students`  | `page`, `pageSize`, `status`, `query` | ✅                   | ✅        |
| `GET /admin/plans`     | `page`, `pageSize`, `query`, `tag`    | ✅                   | ✅        |
| `GET /admin/feedbacks` | `page`, `pageSize`                    | ✅                   | ✅        |
| `GET /admin/coaches`   | `page`, `pageSize`, `query`           | ✅                   | ✅        |
| `GET /admin/exercises` | `page`, `pageSize` + filters          | ✅                   | ✅        |

---

## Special Cases

### `GET /subscriptions`

#### Current State

* Uses `page` + `limit` instead of `page` + `pageSize`.
* Pagination is correctly applied at the database level using `Offset` and `Limit`.
* Response metadata does not include `total`.

#### Recommendation

Standardize the endpoint to match the rest of the API:

```json
{
  "items": [...],
  "page": 1,
  "pageSize": 20,
  "total": 125
}
```

#### Status

⚠️ Needs improvement.

---

### `GET /admin/users`

#### Current State

* Pagination parameters are supported.
* All users are loaded from the database first.
* Filtering and pagination are performed in memory.
* Response metadata includes `items`, `page`, `pageSize`, and `total`.

#### Concerns

As the number of users grows:

* Memory usage increases.
* Response time increases.
* Pagination loses most of its performance benefits.

#### Recommendation

Move filtering and pagination to SQL/GORM queries:

```go
db.Where(...)
  .Offset(...)
  .Limit(...)
  .Find(...)
```

Use a separate `Count()` query to calculate the total number of matching records.

#### Status

⚠️ Needs improvement.

---

## Non-Paginated Endpoints

The following endpoints intentionally do not use pagination.

| Endpoint                             | Reason                                    |
| ------------------------------------ | ----------------------------------------- |
| `GET /subscriptions/current`         | Returns a single subscription             |
| `GET /programs/current`              | Returns the active program only           |
| `GET /coach/students/:id/programs`   | Returns a single active program structure |
| `GET /coach/exercises/categories`    | Small fixed category list                 |
| `GET /site-settings`                 | Configuration data                        |
| `GET /admin/dashboard/monthly-sales` | Fixed-size aggregate (12 months)          |
| `GET /coaches/:slug/plans`           | Typically small number of plans per coach |
| `GET /admin/users/:id`               | User details endpoint                     |
| `GET /admin/users/:id/body`          | User-specific body photos                 |
| `GET /me`                            | Profile endpoint containing user photos   |

These endpoints are currently reasonable without pagination because they either return a single resource or a naturally limited dataset.

---

## Potential Future Candidates for Pagination

The following endpoints are acceptable today but may require pagination if data volume grows significantly:

| Endpoint                        | Reason                                             |
| ------------------------------- | -------------------------------------------------- |
| `GET /me/programs`              | User subscription/program history may become large |
| `GET /admin/users/:id/programs` | Program history may grow over time                 |
| `GET /me`                       | Body progress photos may accumulate                |
| `GET /admin/users/:id/body`     | Large number of uploaded photos possible           |

---

## Summary

### Fully Implemented

The following areas correctly implement pagination:

* Coaches
* Coach Plans
* Coach Students
* Coach Exercises
* Orders
* Admin Students
* Admin Plans
* Admin Feedbacks
* Admin Coaches
* Admin Exercises

### Needs Improvement

1. **`GET /admin/users`**

   * Pagination is performed in memory.
   * Should be moved to database-level pagination.

2. **`GET /subscriptions`**

   * Missing `total` in the response.
   * Uses `limit` instead of the API-wide `pageSize` convention.

### Conclusion

Pagination support is implemented consistently across the majority of list endpoints. The overall design is in good shape, with only two notable improvements required:

* Move `GET /admin/users` pagination into SQL/GORM queries.
* Add `total` and standardize parameter naming in `GET /subscriptions`.

Once these issues are addressed, pagination can be considered fully consistent across the API.
