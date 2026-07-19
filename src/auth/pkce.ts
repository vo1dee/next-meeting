import { createHash, randomBytes } from "node:crypto";

function base64Url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export type Pkce = { verifier: string; challenge: string; state: string };

/** PKCE verifier/challenge pair plus a CSRF state token (ADR-0001). */
export function createPkce(): Pkce {
  const verifier = base64Url(randomBytes(32));
  return {
    verifier,
    challenge: base64Url(createHash("sha256").update(verifier).digest()),
    state: base64Url(randomBytes(16)),
  };
}
