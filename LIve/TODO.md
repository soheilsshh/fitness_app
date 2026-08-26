# TODO — multi-webinar support

**Status: backend + admin panel done and deployed (2026-08-26). Public
landing-page wiring is what's left — see "Still needed" below.**

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

## Still needed — public landing page
`src/data/landing-html.txt` (~3000 lines) is the actual page visitors see —
raw legacy HTML/CSS/vanilla-JS from the pre-rebrand business, not a React
component, with its own `openPaymentModal()`/modal-visibility JS and (per
`LiveChat.tsx`) a *separate* React comment feed that statically imports
`timedComments.ts`. To finish this feature:
1. Read `landing-html.txt`'s existing payment-modal trigger logic — is
   there already a timer/reveal condition to replace, or is the button just
   always clickable today (no "golden time" gating exists yet at all)?
2. Wire whatever's there to call `GET /api/webinar-programs/current` and
   show/hide the buy button per `show_buy_button`, and point the actual
   purchase action at the right program (so `POST /api/payment/create` /
   whatever it calls knows which `webinar_program_id` is being bought).
3. Change `LiveChat.tsx` from `import { timedComments } from "@/data/timedComments"`
   to fetching `GET /api/webinar-programs/current/comments` at runtime —
   otherwise switching which program is "current" won't change what
   comments play without a rebuild.
Deliberately not attempted in the same pass as the backend — didn't want to
edit 3000 lines of unfamiliar legacy JS without reading it properly first.

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
