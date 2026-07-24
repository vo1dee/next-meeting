/**
 * Compile-time plugin UUID injected by rollup (@rollup/plugin-replace).
 */
declare const __PLUGIN_UUID__: string;

/**
 * Google OAuth client credentials, baked in at build time by rollup for
 * release builds (see rollup.config.mjs and NEXT_STEPS.md § "Register the
 * OAuth clients"). Empty string in local/dev builds, where src/auth/oauth.ts
 * falls back to the NM_GOOGLE_CLIENT_ID / NM_GOOGLE_CLIENT_SECRET env vars.
 */
declare const __GOOGLE_CLIENT_ID__: string;
declare const __GOOGLE_CLIENT_SECRET__: string;
