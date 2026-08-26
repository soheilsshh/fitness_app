# TODO — multi-webinar support

Current system is single-webinar: one schedule (`webinar.start_hour` /
`end_hour` in config), one stream, one buy-button/countdown state, shared
across every visitor. Needs to become N webinars (e.g. 6), each with its own
schedule, its own stream, its own comments/marketing copy, its own "golden
time" buy-button window, and its own on/off switch for whether it sells
anything at all.

**This is a real feature, not a config tweak — scoped here, not started.**
Don't attempt it as a side effect of another change; it touches the DB
schema, the admin panel, the scheduler, and the public frontend all at once.

## 1. Data model
New `webinars` table:
- `id`, `slug` (used in URLs), `title`, `is_active`
- `start_at` / schedule fields (today's `webinar.start_hour/minute`,
  `end_hour`, `duration_minutes` — per-row instead of global config)
- `is_selling_enabled` (bool) — some webinars sell nothing at all
- `buy_button_reveal_at` — the "golden time"; before this, no buy button
  regardless of `is_selling_enabled`
- `price`, `merchant_id` override (or inherit the shared one)
- `stream_source` (which video file / RTMP source this webinar plays)
- `comment_script` / `marketing_copy` — per-webinar canned comments and copy
  (today's comment system is presumably global — needs an FK to webinar)

Existing single-webinar tables/config that currently assume "the one
webinar" need an added `webinar_id` FK: whatever drives the live comment
feed, `payment_transactions` (already has `type` — add which webinar it
was for), landing activity tracking.

## 2. Scheduler
`scheduler/scheduler.go` currently reads one `webinar.start_hour` etc. from
config and drives one stream (RTMP → HLS, `./videos/video1.mp4`). Needs to
loop over active `webinars` rows and run N independent instances of
whatever that scheduling logic does — stream start/stop, per-webinar
reminder timing. Check for shared global state (single "is streaming" flag,
single HLS output path — `hls_media/stream.m3u8` is presumably hardcoded to
one filename) that would collide if two webinars' windows ever overlap.

## 3. Admin panel
CRUD for the `webinars` table: create/edit/delete, set schedule, set
`is_selling_enabled` and `buy_button_reveal_at` per row, upload/assign the
video source, edit the comment script. This is the actual day-to-day
interface the account owner will use, so it needs to be usable, not just
functional — probably the single biggest chunk of this task.

## 4. Public frontend
- Webinar picker/router: which `/webinar/:slug` (or however routed) shows
  which stream + comments + buy button.
- Buy button visibility: `now >= buy_button_reveal_at AND is_selling_enabled`
  — currently this logic is presumably a single global timer; needs to
  become per-webinar-instance state, re-evaluated per page load / socket
  update.
- Comments: per-webinar feed, not the global one.

## 5. Payment
`payment.rapexa.ir` → `live.rapexa.ir` callback already correctly identifies
which product these payments are for (LIve), but not which *webinar* within
LIve. Add webinar identification to the payment request (so verify/callback
knows which webinar's access to grant) — probably a webinar_id in the
Zarinpal `metadata` or encoded in the order description, then read back on
verify.

## Separately blocked / needs input before or alongside this
- **No real webinar video content exists yet.** The stream scheduler is
  already trying to play `./videos/video1.mp4` on this server and failing
  (`no such file or directory`) — that's true today with ONE webinar, will
  be true ×6 here. Need the actual video files before any of this is
  testable end-to-end.
- **Kavenegar templates for the 4 SMS patterns already migrated** (see
  `sms-templates-needed.md` in the repo root or Q-Tech docs) need to exist
  before SMS actually sends anything — currently fails loudly and logs,
  doesn't crash, but nothing is delivered.
- **Zarinpal merchant** already pointed at the shared production merchant
  (`fcbfe898-c7bf-4bee-9ac4-e37e79f730f5`) with `sandbox: false` — i.e. this
  is already taking real payments for the single existing webinar. Confirm
  that's intended before this becomes 6 webinars each capable of charging.
