export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when accessToken expires. */
  expiresAt: number;
}

/**
 * Seam over token persistence. v1 backs this with Stream Deck globalSettings
 * (plaintext, read-only calendar scopes as blast-radius mitigation — see the
 * grilling decisions); a keychain-backed store can slot in later without
 * touching auth logic.
 */
export interface TokenStore {
  get(accountId: string): Promise<TokenSet | undefined>;
  set(accountId: string, tokens: TokenSet): Promise<void>;
  delete(accountId: string): Promise<void>;
}

// GlobalSettingsTokenStore lands in T4 alongside the loopback+PKCE flow (ADR-0001).
