# Next Meeting — Privacy Policy

_Last updated: 2026-07-23_

Next Meeting ("the plugin", "we", "us") is a Stream Deck plugin published by vo1dee that shows the time until your next calendar meeting and lets you join it with one press.

## What we access

When you connect a Google account, Next Meeting requests:

| Scope | Purpose |
| --- | --- |
| `openid`, `email` | Identify which account is connected, so the plugin can label it in the Property Inspector and let you manage multiple accounts. |
| `https://www.googleapis.com/auth/calendar.readonly` | Read your calendar events (title, start/end time, response status, conferencing link, web link) to determine your next meeting and today's agenda. |

Next Meeting **never requests write or delete access**. It cannot create, modify, cancel, or remove any calendar event, and it never modifies your Google Account in any way. All access is read-only.

## How your data is stored and protected

**There is no Next Meeting server.** The plugin runs entirely on your own computer, inside the Stream Deck application, and talks directly to Google's own servers over Google's standard OAuth 2.0 / HTTPS (TLS-encrypted) endpoints. We — the developer — never receive, see, log, or store your account credentials, tokens, or calendar data on any server we operate, because none exists.

Specifically:

- **Local-only storage.** Your OAuth tokens and the calendar event data used to render the key and dial are cached locally on your device, inside the Stream Deck application's own settings storage, protected by your operating system's normal user-account file permissions. This data never leaves your machine except in direct, encrypted API calls to Google.
- **No third parties.** We do not sell, share, rent, or transmit your data to any third party, advertiser, or analytics service. There are no analytics or telemetry calls in the plugin.
- **Retention.** Locally cached tokens and event data persist only until you disconnect the account in the plugin or uninstall the plugin, at which point they are deleted from local storage.
- **Revocation.** You can revoke Next Meeting's access at any time from your [Google Account permissions page](https://myaccount.google.com/permissions). Doing so immediately invalidates the local tokens; the plugin will detect this and prompt you to reconnect rather than erroring.
- **Your control.** Disconnecting an account, uninstalling the plugin, or revoking access at Google removes all locally stored data associated with that account.

## Compliance

Next Meeting's use and transfer of information received from Google APIs adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements. Calendar data is used solely to provide and improve the plugin's user-facing calendar features, is never used for advertising, and is never transferred to anyone else, except as necessary to provide the plugin's core functionality (i.e., displaying it back to you) or to comply with applicable law.

## Children's privacy

Next Meeting is not directed at children and is not intended for use by anyone under 16.

## Changes to this policy

If this policy changes, the "Last updated" date above will change accordingly. Material changes affecting how calendar data is handled will be reflected here before they take effect.

## Contact

Questions about this policy or your data: **privacy@vo1dee.com**
