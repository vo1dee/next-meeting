# Verification Reference

How to use: after each task is delivered, walk its checklist top to bottom. Every box must pass before the task is approved and the next one starts. Definitions of Candidate Event, Next Meeting, Grace Window, Agenda, Join Link, and Clear are in [CONTEXT.md](./CONTEXT.md); architectural decisions are in [docs/adr/](./docs/adr/).

## Task 1 — Scaffold & manifests

- [x] `npm install` completes, then `npm run typecheck` exits 0
- [x] `npm run build` emits `com.vo1dee.next-meeting.sdPlugin/bin/plugin.js` and `com.vo1dee.next-meeting-pro.sdPlugin/bin/plugin.js`, each with a `bin/package.json` marking ESM
- [x] Both manifests validate: `npx @elgato/cli validate <dir>` passes for both SKUs (2026-07-19; note — plugin-level Icon/CategoryIcon must be PNG, so those placeholders are PNGs while action icons stay SVG)
- [x] Free manifest: exactly one action `com.vo1dee.next-meeting.key`, `Controllers: ["Keypad"]` — no Encoder action anywhere (ADR-0003 boundary)
- [x] Pro manifest: two actions — `...pro.key` (Keypad) and `...pro.dial` (Encoder, `$B1` layout, rotate/push/touch descriptions)
- [x] Both manifests: SDKVersion 2, Node 20, Stream Deck ≥ 6.5, mac ≥ 12 + windows ≥ 10, `UserTitleEnabled: false` on key actions (we own the rendered face)
- [x] All `Icon`/`Image` paths referenced by the manifests resolve to a file (checked by the CLI validator)
- [ ] On a machine with Stream Deck installed: `streamdeck link com.vo1dee.next-meeting.sdPlugin` and the plugin appears in the app (smoke only; actions are stubs)

## Task 2 — Core plugin logic (mock calendar)

Selection rules — unit tests (node:test) over `MockCalendarProvider`'s scenario day (`npm test`, 21/21 passing 2026-07-19):
- [x] At 9:14:59: Next Meeting = "Team sync" (in Grace Window); at 9:15:01: rolls to "1:1 with Sam" — the all-day event, the declined standup, and the Free lunch are never selected
- [x] Grace Window edges: started+14:59 still selected, started+15:01 not
- [x] Tentative and needsAction responses qualify; declined and cancelled never do
- [x] After the last Candidate ends: Clear; horizon = end of local day (a 00:05 tomorrow meeting does not show today)

Key-face ladder — unit tests:
- [x] ≥15m → countdown/later; <15m → soon; <5m → imminent; ≤2m → imminent+flash (flash suppressed when the toggle is off)
- [x] Started: NOW+flash for 2 min, then NOW solid for the rest of the Grace Window
- [x] Countdown text: "45m" under an hour, "2h" above; Clear renders "—"

Join Link extraction — fixture tests:
- [x] Structured field wins even when the description contains other URLs
- [x] Regex fallback finds Zoom, Meet, Teams, and Webex URLs in location and description (including Teams URLs wrapped in HTML anchors)
- [x] No detectable link → `undefined` (caller falls back to webLink)

Press semantics:
- [ ] Join Link → opened in default browser; no link → event webLink; Clear → provider day view; Auth → OAuth flow restarts (Auth re-auth lands in T4; until then Auth presses open the day view)
- [x] `onJoined()` hook exists and is a no-op (auto-mute seam)

Runtime behavior (manual, `streamdeck link` + mock provider):
- [ ] Key face updates on minute boundaries; flashing renders at 1 Hz only while a flash state is active
- [ ] API polling respects the configured interval; display ticks are independent of polling

## Task 3 — Property Inspector

Delivered 2026-07-19: sdpi-components v4 vendored into each SKU's `ui/` (PI works offline); account connect/disconnect routed through `pi-bridge.ts` at the UI-controller level so key and dial share one implementation; the free "Get Pro" button points at a vo1dee.com placeholder URL until the listing exists (T6). The boxes below are on-device acceptance checks — they need a machine with Stream Deck installed.

- [ ] PI renders with Elgato's native look (sdpi components) in both SKUs
- [ ] Refresh slider: range 1–15 min, default 5; persists to globalSettings and survives Stream Deck restart
- [ ] Pre-meeting flash toggle: default on; persists
- [ ] Settings are plugin-global: changing them from any key instance affects all instances; key and dial PIs show the same values
- [ ] Free PI: one account section + "Get Pro" link to the Marketplace listing; no second-account UI
- [ ] Pro PI: multi-account list (add/remove)
- [ ] Connect buttons trigger the (stub until T4) OAuth flow and reflect connection state

## Task 4 — OAuth & real calendar providers

- [ ] Google: loopback+PKCE flow completes from a cold start; only read-only scopes requested (`calendar.readonly`)
- [ ] Microsoft: same with `Calendars.Read`; public client, no secret anywhere in the repo
- [ ] Tokens persist via TokenStore in globalSettings; access-token refresh works silently
- [ ] Revoking access at the provider → key face shows "Auth" (no crash, no error loop); press restarts OAuth from the key
- [ ] Fetch failure keeps serving the cached agenda; stale indicator appears after ~30 min of failures
- [ ] Free build: connecting a second account is impossible by construction (single-account code path)
- [ ] Privacy policy page live on vo1dee.com; Google verification submitted (release blocker for public listing, not for code review)

## Task 5 — Pro build (dial + multi-account)

- [ ] Dial strip shows time • title • countdown for the selection; rotate moves through the Agenda (same eligibility as the key — verified by a shared-fixture test)
- [ ] Press and touch-tap join the selected event with the key's exact press semantics
- [ ] 30s idle → selection snaps back to the Next Meeting; empty Agenda → Clear on the strip
- [ ] Two accounts blended in start order; the same event on both accounts (same iCalUid) appears once
- [ ] Free bundle diff check: free build registers no dial action and contains no dial/multi-account UI

## Task 6 — Packaging & Marketplace submission

- [ ] `Nodejs.Debug` removed/disabled in both manifests
- [ ] `streamdeck validate` and `streamdeck pack` succeed for both SKUs
- [ ] Placeholder SVGs replaced with final art (including Marketplace-required PNG sizes)
- [ ] Fresh-machine install test of both `.streamDeckPlugin` files: connect account, see countdown, join a real meeting
- [ ] Maker org created, Maker Agreement signed, Stripe Connect payout country confirmed (prerequisite for the paid listing — ADR-0003)
- [ ] Listings: free listing links to Pro; Pro listing does NOT mention auto-mute (deferred past v1.0)
- [ ] Memory/CPU sanity: idle plugin steady-state after 1h — no timer leaks, no unbounded arrays
