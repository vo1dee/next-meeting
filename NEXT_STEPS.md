# Next Steps — from code-complete to the Elgato Marketplace

All six build tasks (T1–T6) are committed on `main`. The code is done and verified headlessly: typecheck clean, 26/26 unit tests, both SKUs build, `@elgato/cli validate` and `pack` pass. What remains is the work only you can do: run it on a real Stream Deck, register the OAuth clients, replace placeholder art, and take both SKUs through the Marketplace review.

This document walks through each step in the order you should do them. Companion docs: [README.md](./README.md) (build + OAuth client setup), [VERIFICATION.md](./VERIFICATION.md) (the remaining acceptance boxes), [CONTEXT.md](./CONTEXT.md) (glossary), [docs/adr/](./docs/adr/) (decisions).

---

## 1. Build and run locally (on a machine with Stream Deck)

The plugin runs inside the Stream Deck desktop app — there is no standalone mode. You need a Mac (macOS 12+) or Windows (10+) machine with the [Stream Deck app](https://www.elgato.com/downloads) ≥ 6.5 installed. A physical Stream Deck device is strongly recommended; for dial testing you specifically need a Stream Deck **+** (that's the only hardware with encoders).

### One-time setup

```bash
git clone <this repo>          # remember: the folder name has a space — quote paths
cd "next meeting"
npm install                    # Node 20+ locally (runtime inside Stream Deck is its own bundled Node 20)
npm i -g @elgato/cli           # the `streamdeck` command
streamdeck dev                 # enables developer mode in the Stream Deck app (once per machine)
```

### Build and install into the app

```bash
npm run build                  # bundles src/plugin.ts into both <uuid>.sdPlugin/bin/plugin.js
streamdeck link com.vo1dee.next-meeting.sdPlugin        # free SKU
streamdeck link com.vo1dee.next-meeting-pro.sdPlugin    # pro SKU (only one needed at a time)
```

`link` symlinks the folder into the app's plugin directory, so subsequent rebuilds are picked up with a restart rather than a reinstall:

```bash
npm run watch:pro              # or watch:free — rebuild on file change
streamdeck restart com.vo1dee.next-meeting-pro          # reload the running plugin
```

### Run without any OAuth client (mock mode)

`NEXT_MEETING_MOCK=1` swaps in the deterministic mock calendar, so the full key/dial/PI experience works before any Google/Microsoft client exists. The Stream Deck app launches the plugin itself, so set the variable where the *app* can see it (e.g. on macOS `launchctl setenv NEXT_MEETING_MOCK 1` then restart the app; on Windows set it as a user environment variable and restart). This is the fastest way to run the on-device boxes in VERIFICATION.md that don't involve real accounts.

### Debugging

- **Logs**: the plugin writes rotating logs to `<uuid>.sdPlugin/logs/`; the Stream Deck app's own logs are in `%appdata%\Elgato\StreamDeck\logs` (Windows) / `~/Library/Logs/ElgatoStreamDeck` (macOS).
- **Node inspector**: T6 removed `"Debug": "enabled"` from the manifests for release. While developing, temporarily re-add it under `"Nodejs"` (don't commit), restart the plugin, and attach via `chrome://inspect`.
- **Property inspector**: with developer mode on, the PI is a normal web view — `http://localhost:23654/` lists debuggable PI pages.
- **Tests/typecheck** (any machine, no Stream Deck needed): `npm test`, `npm run typecheck`.

### What to verify on device

Work through the unticked boxes in [VERIFICATION.md](./VERIFICATION.md) top to bottom — T1's smoke install, T2's runtime ticks, all of T3 (PI look, sliders, persistence), T4's OAuth flows (after step 2 below), T5's dial behavior, and T6's fresh-machine install + 1-hour idle memory/CPU sanity check.

---

## 2. Register the OAuth clients

Follow the step-by-step in [README.md → "OAuth client setup"](./README.md#oauth-client-setup). Summary of what you'll create:

| Provider | Where | Client type | Key settings |
| --- | --- | --- | --- |
| Google | [console.cloud.google.com](https://console.cloud.google.com) | **Desktop app** | Enable Google Calendar API; scope `calendar.readonly`; loopback redirect is automatic |
| Microsoft | [portal.azure.com](https://portal.azure.com) → App registrations | **Public client** | "Mobile and desktop" platform, redirect `http://localhost`, allow public client flows, delegated `Calendars.Read` |

During development, inject the IDs via env vars (`NM_GOOGLE_CLIENT_ID`, `NM_GOOGLE_CLIENT_SECRET`, `NM_MS_CLIENT_ID`). For the release build, bake all three values into `OAUTH_CONFIG` in `src/auth/oauth.ts` — end users can't set env vars. That includes the Google "secret": for installed apps Google explicitly treats it as non-confidential, and every shipped desktop app embeds it. Keeping it out of the *repo* is hygiene for a public codebase, not a runtime requirement.

### Google verification (start this early — it gates the public listing)

`calendar.readonly` is a Google **sensitive** scope:

- While your consent screen is in **Testing** mode: up to 100 test users, and refresh tokens expire after 7 days — fine for development, unusable for real users.
- **In production, unverified**: users see an "unverified app" warning and you're capped at 100 users.
- **Verification** requires: a homepage you own, a **privacy policy hosted on your domain** (vo1dee.com — this is why it's a blocker), scope justification text, and Google's review (typically days to a few weeks). `calendar.readonly` is sensitive but not *restricted*, so no paid security assessment is needed.

Microsoft needs no equivalent review for `Calendars.Read`; optionally complete [publisher verification](https://learn.microsoft.com/en-us/entra/identity-platform/publisher-verification-overview) to remove the "unverified publisher" hint on the consent screen.

---

## 3. Replace the placeholder art

Elgato's [plugin guidelines](https://docs.elgato.com/guidelines/stream-deck/plugins/) are enforced at review; wrong art is a top rejection reason. Required assets per SKU:

| Asset | Size (@1x / @2x) | Format | Style rules |
| --- | --- | --- | --- |
| Plugin icon (`imgs/plugin/icon`) | 256×256 / 512×512 | PNG | Full-color, must reflect functionality |
| Category icon (`imgs/plugin/category-icon`) | 28×28 / 56×56 | SVG or PNG | Monochromatic, white (#FFFFFF) on transparent |
| Action list icons (`imgs/actions/*/icon`) | 20×20 / 40×40 | SVG or PNG | Monochromatic white on transparent — **colored/solid-background action icons get rejected** |
| Key state images (`imgs/actions/*/state`) | 72×72 / 144×144 | SVG/PNG/GIF | Ours is drawn at runtime, but the manifest default still shows in the action list |

Current placeholders are the wrong sizes (e.g. plugin icon is 288×288) — regenerate at the exact sizes above. You'll also need **Marketplace listing media** (product icon, thumbnail, gallery screenshots showing the key and dial in use) which live in the listing, not the plugin folder.

---

## 4. Publish to the Elgato Marketplace

### One-time Maker setup

1. Sign in at [Maker Console](https://maker.elgato.com/) and **create your organization** — its name becomes your public Maker identity and matches your `com.vo1dee.*` UUIDs.
2. **Sign the Maker Agreement.** Both are prerequisites for any submission.
3. For the paid Pro SKU: complete **Stripe Connect** onboarding and confirm your payout country is supported (see [Become a Maker](https://docs.elgato.com/makers/general/become-a-maker) for exclusions). Revenue split is **70/30** (you keep 70%). Free products have no country restrictions — worst case, the free SKU can ship while payment setup is pending.

### Per-SKU submission (you'll do this twice)

1. Re-pack from a clean tree so the installers contain the final art and baked-in client IDs:
   ```bash
   npx @elgato/cli validate com.vo1dee.next-meeting.sdPlugin && npx @elgato/cli pack com.vo1dee.next-meeting.sdPlugin
   npx @elgato/cli validate com.vo1dee.next-meeting-pro.sdPlugin && npx @elgato/cli pack com.vo1dee.next-meeting-pro.sdPlugin
   ```
2. In Maker Console → Products → new product: upload the `.streamDeckPlugin`, fill in description, language, type, support links, and the listing media, and set pricing for Pro.
3. **Choose names carefully — the product name and monetization model cannot be changed later in Maker Console** (only via maker@elgato.com).
4. Submit for review. Typical turnaround is **4–10 business days**. You can uncheck "automatically publish after approval" to control the go-live moment — useful for shipping the free and Pro listings simultaneously.
5. Listing content rules from our own checklist (VERIFICATION.md T6): the **free listing links to Pro**; the **Pro listing must not mention auto-mute** (deferred past v1.0).

### Review-proofing checklist

Things Elgato commonly rejects that apply to us: action list icons must be monochrome white (see §3); the PI must auto-save settings (ours does — no Save button); actions must be meaningfully configurable; UUIDs must never change after publishing (ours are final: `com.vo1dee.next-meeting` / `com.vo1dee.next-meeting-pro`).

### Optional: DRM for the Pro SKU

Marketplace plugins can opt into Elgato DRM — worth considering for the paid SKU. It requires `SDKVersion: 3`, Stream Deck ≥ 6.9, and `@elgato/streamdeck` v2+; we ship SDKVersion 2 / ≥ 6.5 / SDK 1.4, so DRM would mean raising all three. Reasonable to defer to a post-launch version; if you enable it later, test the DRM-processed build via Maker Console's Versions tab before releasing.

### Updates after launch

Bump `Version` in the manifest (four-part `x.y.z.w`, currently `0.1.0.0`), re-pack, and submit the new file with release notes in Maker Console. Only the most recent approved version is served to users.

---

## 5. Everything else worth knowing

- **Support channels**: [Marketplace Makers Discord](https://discord.gg/4rTB7cYzyj) and maker@elgato.com — the Discord is the fastest route for review questions.
- **The SKU boundary is the manifest** (ADR-0003): both installers contain the same bundle; the free manifest simply never registers the dial action, and `isProUser()` is baked at build time. Don't "fix" the dial code appearing in the free bundle — that's by design.
- **Tokens live in Stream Deck's globalSettings** — uninstalling the plugin orphans them; users can revoke access anytime from their Google/Microsoft account pages, which the plugin surfaces as the Auth face (press to re-auth).
- **Node version**: the plugin runs on Stream Deck's bundled Node 20. Your local Node 22 is fine for building/testing, but don't introduce Node-22-only APIs.
- **Release-build hygiene**: before the final pack, confirm `REPLACE_ME` no longer appears in the bundle (`grep -r REPLACE_ME */bin/plugin.js` should be empty) and `NEXT_MEETING_MOCK` is unset on your machine.
- **Open code-review follow-ups** (from the post-T6 review). Four are worth fixing **before** Marketplace submission because they're user-visible on device:
  1. Dial press/touch only handles the "open" action — in the Auth state it silently does nothing, where the key re-runs OAuth (spec says the dial has the key's exact press semantics).
  2. Dial join skips the key's `showOk()` feedback and the `onJoined()` auto-mute seam.
  3. In `service.ts` `poll()`, one failing account discards the healthy accounts' results and drives the stale marker for everything — with two accounts (the Pro selling point), one revoked login freezes the whole face. Stale also never shows when failures start from cold start.
  4. Dial snap-back is lazy: the 30 s constant is right, but the strip only re-renders on service ticks, so the old selection can linger up to ~60 s.

  Post-launch cleanup candidates (quality, not behavior): the Google/Microsoft providers duplicate the day-window computation; provider quirks are split across three dispatch points (`extraAuthParams`, a hard-coded refresh branch, the factory); `AgendaDial.selected()` mutates state from a getter-named method.

## Suggested order of attack

1. On-device pass with `NEXT_MEETING_MOCK=1` (needs only a Stream Deck machine) — flushes out runtime issues cheapest.
2. Register both OAuth clients; repeat the on-device pass with real accounts (T4 boxes).
3. In parallel: host the privacy policy on vo1dee.com and submit Google verification (longest external lead time), and create the Maker org + Stripe Connect.
4. Final art, bake client IDs, re-validate/re-pack, fresh-machine install test.
5. Submit both SKUs; publish together once approved.

Sources: [Distribution — Stream Deck SDK](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/) · [Plugin Guidelines](https://docs.elgato.com/guidelines/stream-deck/plugins/) · [Become a Maker](https://docs.elgato.com/makers/general/become-a-maker) · [Managing Products](https://docs.elgato.com/maker-console/managing-products/)
