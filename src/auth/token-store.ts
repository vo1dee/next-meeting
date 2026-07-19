import streamDeck from "@elgato/streamdeck";

import { withDefaults, type GlobalSettings } from "../settings";

export type TokenSet = {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when accessToken expires (with a safety margin already applied). */
  expiresAt: number;
};

/**
 * Seam over token persistence. v1 backs this with Stream Deck globalSettings
 * (plaintext; read-only calendar scopes keep the blast radius contained — see
 * the grilling decisions); a keychain-backed store can slot in later without
 * touching auth logic.
 */
export interface TokenStore {
  get(accountId: string): Promise<TokenSet | undefined>;
  set(accountId: string, tokens: TokenSet): Promise<void>;
  delete(accountId: string): Promise<void>;
}

export class GlobalSettingsTokenStore implements TokenStore {
  private async read(): Promise<GlobalSettings> {
    return withDefaults(await streamDeck.settings.getGlobalSettings<GlobalSettings>());
  }

  async get(accountId: string): Promise<TokenSet | undefined> {
    return (await this.read()).tokens[accountId];
  }

  async set(accountId: string, tokens: TokenSet): Promise<void> {
    const settings = await this.read();
    settings.tokens[accountId] = tokens;
    await streamDeck.settings.setGlobalSettings(settings);
  }

  async delete(accountId: string): Promise<void> {
    const settings = await this.read();
    delete settings.tokens[accountId];
    await streamDeck.settings.setGlobalSettings(settings);
  }
}
