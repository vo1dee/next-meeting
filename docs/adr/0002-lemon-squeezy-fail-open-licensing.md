---
status: superseded by ADR-0003
---

# Lemon Squeezy licensing with fail-open offline grace

Pro is a one-time purchase through Lemon Squeezy (merchant of record, built-in license-key activation API — no backend of our own, consistent with ADR-0001). The plugin activates a key once, caches the verdict in globalSettings, re-validates silently every ~3 days, and honors a 14-day offline grace window. Enforcement is deliberately **fail-open**: `isProUser()` reads the cache synchronously and never blocks on the network; a paying user on a flaky connection keeps Pro, and we accept the small piracy window that implies. Paddle was rejected as heavier (no first-class key API — would need our own key infrastructure); honor-system codes were rejected as unrevocable.
