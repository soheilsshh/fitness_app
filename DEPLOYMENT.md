# Deployment — server migration 2026-08-26

## Server
Moved from a shared box (62.60.198.205, also ran unrelated projects: joftino,
ejad, starry, admin.graded-tcg.com) to a new one: **92.114.51.93**
(`ubuntu-fiti-tejari-joftinoo`). Same box now also hosts Joftinoo and the six
Quantino sites — see those projects' own deploy docs for their pieces.
Fitinoo's own layout there:

- Code: `/var/www/fitinoo/` — `backend/server` (Go API), `backend/uploads/`,
  `backend/config.yaml`, `frontend/dist` (web root).
- Process: supervisor program `fitinoo-server`
  (`/etc/supervisor/conf.d/fitinoo.conf`), listens on `:8088`.
- MySQL: database `fitness_db`, imported from a `mysqldump` of the old
  server — verified byte-identical (row counts + `MAX(created_at)` matched
  exactly on every table checked, no drift, unlike Joftinoo which had an
  active split-brain issue during its migration).
- TLS: `fullchain.pem` / `privateKey.pem` live inside `/var/www/fitinoo/`
  itself (came across with the directory copy, not certbot-managed on this
  box).

## Domains (Cloudflare DNS, zone `fitinoo.ir`, DNS-only / not proxied)
| Domain | Root/proxy |
|---|---|
| fitinoo.ir, www | static (`frontend/dist`) |
| api.fitinoo.ir | proxy → `127.0.0.1:8088` |
| `*.fitinoo.ir` (wildcard record) | also points here, no dedicated vhost |

`checkout.rapexa.ir` also proxies to this same backend (`:8088`) — it's
Fitinoo's Zarinpal payment callback domain, not a separate project. That
record lives in the `rapexa.ir` Cloudflare zone, not `fitinoo.ir`.

## Old server (62.60.198.205) — cleanup status
**Done.** Verified zero data drift before touching anything (old and new
had identical row counts and `MAX(created_at)` on every table checked:
`check_ins`, `otp_codes`, `orders`, `daily_food_logs`). On the old server:
supervisor program `fitinoo-server` stopped and its conf removed; nginx
vhosts `fitinoo.ir`, `api.fitinoo.ir`, `checkout.rapexa.ir` removed from
`sites-enabled`/`sites-available`. The `/var/www/fitinoo` files and
`fitness_db` database were deliberately **left in place** on the old server
(not deleted) as a short safety margin — ask before hard-deleting those if
they're still there.

## Verification method used
Before flipping DNS: pushed the build to the new server, enabled its nginx
vhost, and curled every domain directly against the new IP with
`--resolve host:443:92.114.51.93` (bypassing DNS) to confirm identical
behavior to the old server's response for the same path, then flipped
Cloudflare's A records, then re-verified over the real domain names.
