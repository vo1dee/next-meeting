# Next Meeting — Stream Deck plugin

Glance + one-tap-join calendar for WFH professionals. **Next Meeting** is a single free Elgato Marketplace plugin (`com.vo1dee.next-meeting`) with the countdown key, Stream Deck + agenda dial, blended calendars, and agenda gestures.

Start here:

- [CONTEXT.md](./CONTEXT.md) — the domain glossary (Candidate Event, Next Meeting, Grace Window, Agenda, Join Link, Clear)
- [docs/adr/](./docs/adr/) — architectural decisions
- [VERIFICATION.md](./VERIFICATION.md) — per-task acceptance checklists; a task is done when its list passes

## Build

```bash
npm install
npm run typecheck
npm run build
```

The build bundles `src/plugin.ts` into `com.vo1dee.next-meeting.sdPlugin/bin/plugin.js`. For local development on a machine with Stream Deck installed: `streamdeck link com.vo1dee.next-meeting.sdPlugin`.

To produce installable `.streamDeckPlugin` files:

```bash
npx @elgato/cli validate com.vo1dee.next-meeting.sdPlugin && npx @elgato/cli pack com.vo1dee.next-meeting.sdPlugin
```

## OAuth client setup

The plugin talks to Google Calendar and Microsoft Graph directly from the user's machine over a loopback OAuth flow with PKCE — there is no backend (see [ADR-0001](./docs/adr/0001-local-oauth-no-backend.md)). Before the OAuth flows can run you must register one client per provider and inject the IDs at runtime; `OAUTH_CONFIG` in [`src/auth/oauth.ts`](./src/auth/oauth.ts) ships `REPLACE_ME` placeholders that the env variables below override.

### Google (Google Cloud Console)

1. Create a project, enable the **Google Calendar API**, and configure the OAuth consent screen. The only scope beyond identity is `https://www.googleapis.com/auth/calendar.readonly`; it is a *sensitive* scope, so a public listing requires Google verification and a hosted privacy policy (vo1dee.com).
2. Create an OAuth client of type **Desktop app**. Desktop-app clients get a client secret, but Google explicitly treats it as non-confidential for installed apps — it still must not be committed; supply it via env.
3. Loopback redirects (`http://127.0.0.1:<random port>`) are allowed automatically for Desktop-app clients; no redirect URI registration is needed.

### Microsoft (Azure portal → App registrations)

1. Register a new application. Supported account types: personal + work/school (multitenant) unless you want to narrow it.
2. Add a **Mobile and desktop applications** platform and set the redirect URI to `http://localhost` (Azure accepts loopback with any port when `http://localhost` is registered).
3. Under *Authentication*, enable **Allow public client flows**. No client secret is created — this is a public client; the token exchange relies on PKCE only.
4. API permissions: delegated `Calendars.Read` (plus `openid`, `email`, `offline_access` which are requested at runtime). No admin consent is required for these.

### Runtime configuration

| Variable | Meaning |
| --- | --- |
| `NM_GOOGLE_CLIENT_ID` | Google Desktop-app client ID |
| `NM_GOOGLE_CLIENT_SECRET` | Google Desktop-app client secret (non-confidential, but env-only) |
| `NM_MS_CLIENT_ID` | Azure application (client) ID |
| `NEXT_MEETING_MOCK=1` | Skip real providers entirely and serve the deterministic mock calendar — lets you exercise the full plugin on a device before any client is registered |

For a release build, replace the `REPLACE_ME` values in `OAUTH_CONFIG` with the registered values instead of relying on env vars (end users don't set environment variables for Stream Deck). That includes the Google client secret: Google treats Desktop-app secrets as non-confidential, so embedding it in the shipped bundle is normal and required — keeping it env-injected here is hygiene for the public *source repo*, not a runtime rule.
