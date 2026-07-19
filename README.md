# Next Meeting — Stream Deck plugin

Glance + one-tap-join calendar for WFH professionals. One codebase, two Elgato Marketplace SKUs:

- **Next Meeting** (free) — `com.vo1dee.next-meeting`: countdown key, one calendar account
- **Next Meeting Pro** (paid) — `com.vo1dee.next-meeting-pro`: adds the Stream Deck + agenda dial and blended multi-account

Start here:

- [CONTEXT.md](./CONTEXT.md) — the domain glossary (Candidate Event, Next Meeting, Grace Window, Agenda, Join Link, Clear)
- [docs/adr/](./docs/adr/) — architectural decisions (local OAuth without a backend, two-SKU distribution)
- [VERIFICATION.md](./VERIFICATION.md) — per-task acceptance checklists; a task is done when its list passes

## Build

```bash
npm install
npm run typecheck
npm run build          # both SKUs
npm run build:free     # or one at a time
npm run build:pro
```

Each build bundles `src/plugin.ts` into `<uuid>.sdPlugin/bin/plugin.js`; the SKUs differ only by the injected `__PLUGIN_UUID__` / `__IS_PRO__` constants and their manifests. For local development on a machine with Stream Deck installed: `streamdeck link <uuid>.sdPlugin`.
