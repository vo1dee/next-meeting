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

The build bundles `src/plugin.ts` into `com.vo1dee.next-meeting.sdPlugin/bin/plugin.js`.

To produce installable `.streamDeckPlugin` files:

```bash
npx @elgato/cli validate com.vo1dee.next-meeting.sdPlugin && npx @elgato/cli pack com.vo1dee.next-meeting.sdPlugin
```

## OAuth client setup

The plugin talks to Google Calendar directly from the user's machine over a loopback OAuth flow with PKCE — there is no backend (see [ADR-0001](./docs/adr/0001-local-oauth-no-backend.md)). The release environment must provide its registered OAuth client values when building the plugin; no credentials are committed to this repository.

### Google (Google Cloud Console)

1. Create a project, enable the **Google Calendar API**, and configure the OAuth consent screen. The only scope beyond identity is `https://www.googleapis.com/auth/calendar.readonly`; it is a *sensitive* scope, so a public listing requires Google verification and a hosted privacy policy (vo1dee.com).
2. Create an OAuth client of type **Desktop app**. Desktop-app clients get a client secret, but Google explicitly treats it as non-confidential for installed apps. Provide its values through the release build environment.
3. Loopback redirects (`http://127.0.0.1:<random port>`) are allowed automatically for Desktop-app clients; no redirect URI registration is needed.

### Release configuration

| Variable | Meaning |
| --- | --- |
| `NM_GOOGLE_CLIENT_ID` | Google Desktop-app client ID |
| `NM_GOOGLE_CLIENT_SECRET` | Google Desktop-app client secret |

Set these only in the controlled release build environment. The plugin fails fast with a clear configuration error if either is absent.
