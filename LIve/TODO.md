# TODO — multi-webinar support

**Status: DONE and deployed (2026-08-26)** — backend, admin panel, and
public landing-page wiring (buy button + live comments) all shipped and
verified in-browser on the live site. What's left is entirely on the
content/account side — see "Separately blocked" below, unchanged.

Was single-webinar: one schedule (`webinar.start_hour`/`end_hour` in
config), one stream, one buy-button/countdown state, shared across every
visitor. Now N `webinar_programs` rows exist, each with its own schedule,
stream, selling flag, "golden time" buy-button reveal, price, and comments.

## Done
- **Data model**: `models.WebinarProgram` (slug, title, video_url, start_at,
  end_at, is_selling_enabled, buy_button_reveal_at, price, comments_json,
  is_active). `PaymentTransaction.WebinarProgramID` links a purchase to
  which program it was for.
- **Scheduler**: `scheduler/webinar_programs.go` is a fully independent
  1-minute ticker — finds whichever program's window contains now and
  starts/stops/switches the RTMP→HLS stream to match. Does not touch or
  share state with the legacy single-webinar scheduler. Three guards
  (`HasActiveWebinarPrograms`) added to the legacy path so the two can't
  fight over starting/stopping the stream; when no programs exist, every
  guard is a no-op and old behavior is untouched (verified on deploy).
- **API**: `GET /api/webinar-programs/current` (active/next/last program +
  computed `show_buy_button`), `GET /api/webinar-programs/current/comments`
  (serves `comments_json` live — no rebuild needed to change comments,
  unlike the old static-imported `timedComments.ts`). Admin CRUD at
  `/api/admin/webinar-programs`.
- **Admin panel**: new "چند وبیناره" tab (`WebinarProgramsManager.tsx`) —
  create/edit/delete programs, set video path, schedule, selling + golden
  time + price, and comments as JSON (same `TimeRange[]` shape the old file
  used, so existing scripts are copy-paste portable).

## Public landing page — done
Turned out `src/data/landing-html.txt` (the ~3000-line legacy file) isn't
actually loaded by anything — the real page is a template literal
(`landingHTML`, ~3000 lines) embedded directly in `AIPage.tsx` at line
~1109, rendered via `dangerouslySetInnerHTML`. That's what got wired:

1. A gating IIFE in that embedded `<script>` fetches
   `GET /api/webinar-programs/current` on load + every 60s and hides
   `.floating-cta-btn` (the only buy-button trigger — confirmed via grep,
   there's exactly one) when `show_buy_button` is false. Defaults to
   "always visible" if no program exists yet or the request fails, so it
   can only ever hide the button, never wrongly hide it in the account's
   current single-webinar setup. `openPaymentModal()` also no-ops if
   buying isn't currently allowed, as a second layer.
2. The `/payment/create` POST now sends `webinar_program_id` (read from
   `window.__currentWebinarProgramId()`); the backend links the resulting
   `PaymentTransaction` to that program via a separate update, without
   touching `PaymentService.CreatePaymentRequest`'s existing
   promoter-assignment logic.
3. `LiveChat.tsx` now fetches
   `GET /api/webinar-programs/current/comments` once on mount instead of
   only using the static `timedComments.ts` import — falls back to the
   static file if no program exists or the fetch fails.

Verified live in-browser on `/webinar`: the comments endpoint fires and
returns 200, zero console errors, legacy `/api/webinar` calls still firing
alongside it undisturbed.

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

---

## Superseded (this file's previous content, for the record)
This file previously tracked a plan to build "simple SMS" (no-pattern)
sending on top of Faraz SMS: config, a controller, an admin-panel history
view, etc. That's moot now — `faraz_sms` was already dead code (nothing in
the codebase ever called it) before this session, and SMS transport moved
to Kavenegar entirely (see the commit that added `services/kavenegar.go`).
Not carrying the old checklist forward since building more on top of Faraz
doesn't make sense anymore, but noting it existed rather than silently
dropping it — it was overwritten by mistake when this file was rewritten
for the multi-webinar scope above (should have been read first, wasn't).
