# Changelog

All notable changes to Next Meeting are documented in this file.

## 1.0.0 — 2026-07-24

First public release of the Next Meeting Stream Deck plugin.

- Shows the next eligible calendar meeting and its countdown on a Stream Deck key.
- Opens a meeting's join link with one press.
- Blends connected Google Calendar accounts while deduplicating shared events.
- Provides an Agenda Dial for browsing and joining today's upcoming meetings.
- Uses local OAuth 2.0 with PKCE and read-only Google Calendar access.

### Production readiness

- Removed the runtime mock-calendar mode and its development provider.
- Removed placeholder OAuth values; credentials must be supplied by the controlled release environment.
- Removed development-only documentation and references from the release path.
