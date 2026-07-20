import streamDeck from "@elgato/streamdeck";

import type { AccountRef } from "../settings";
import { AuthError } from "./auth-error";
import { startLoopback } from "./loopback";
import { createPkce } from "./pkce";
import type { TokenSet, TokenStore } from "./token-store";

type ProviderConfig = {
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  /** Google issues Desktop-app clients a secret it treats as non-confidential; Microsoft public clients have none. */
  clientSecret?: string;
  scopes: string[];
  extraAuthParams?: Record<string, string>;
};

// TODO(release): register the real client — Google Cloud Console "Desktop app"
// (needs the vo1dee.com privacy policy for sensitive-scope verification).
export const OAUTH_CONFIG: Record<AccountRef["provider"], ProviderConfig> = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientId: process.env.NM_GOOGLE_CLIENT_ID ?? "REPLACE_ME.apps.googleusercontent.com",
    clientSecret: process.env.NM_GOOGLE_CLIENT_SECRET ?? "REPLACE_ME",
    scopes: ["openid", "email", "https://www.googleapis.com/auth/calendar.readonly"],
    extraAuthParams: { access_type: "offline", prompt: "consent" },
  },
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
};

function toTokenSet(json: TokenResponse, previousRefresh?: string): TokenSet {
  const refreshToken = json.refresh_token ?? previousRefresh;
  if (!refreshToken) throw new Error("Token response carried no refresh token");
  return {
    accessToken: json.access_token,
    refreshToken,
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  };
}

/** Unverified JWT payload decode — used only to label the account, never for trust. */
function decodeJwtPayload(jwt: string): Record<string, unknown> {
  try {
    return JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function postForm(url: string, form: Record<string, string>): Promise<TokenResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form).toString(),
  });
  if (!response.ok) {
    throw new Error(`Token endpoint ${url} answered ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
  return (await response.json()) as TokenResponse;
}

export type OAuthResult = { accountId: string; label: string; tokens: TokenSet };

/** Full interactive loopback+PKCE flow (ADR-0001): browser consent → code → tokens. */
export async function runOAuthFlow(provider: AccountRef["provider"]): Promise<OAuthResult> {
  const config = OAUTH_CONFIG[provider];
  const { redirectUri, waitForCode, close } = await startLoopback();
  try {
    const { verifier, challenge, state } = createPkce();
    const authorize = new URL(config.authUrl);
    authorize.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: config.scopes.join(" "),
      code_challenge: challenge,
      code_challenge_method: "S256",
      state,
      ...config.extraAuthParams,
    }).toString();

    await streamDeck.system.openUrl(authorize.toString());
    const code = await waitForCode(state);

    const json = await postForm(config.tokenUrl, {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      code_verifier: verifier,
      ...(config.clientSecret ? { client_secret: config.clientSecret } : {}),
    });

    const claims = json.id_token ? decodeJwtPayload(json.id_token) : {};
    const subject = typeof claims.sub === "string" ? claims.sub : crypto.randomUUID();
    const email = [claims.email, claims.preferred_username].find((v): v is string => typeof v === "string");
    return {
      accountId: `${provider}:${subject}`,
      label: email ?? provider,
      tokens: toTokenSet(json),
    };
  } finally {
    close();
  }
}

/** Silent token maintenance + authenticated JSON GETs for the providers. */
export class OAuthManager {
  constructor(private readonly store: TokenStore) {}

  private async refresh(account: AccountRef, tokens: TokenSet): Promise<TokenSet> {
    const config = OAUTH_CONFIG[account.provider];
    let json: TokenResponse;
    try {
      json = await postForm(config.tokenUrl, {
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
        client_id: config.clientId,
        ...(config.clientSecret ? { client_secret: config.clientSecret } : {}),
      });
    } catch (err) {
      throw new AuthError(account.id, `Refresh failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    const next = toTokenSet(json, tokens.refreshToken);
    await this.store.set(account.id, next);
    return next;
  }

  private async accessToken(account: AccountRef): Promise<string> {
    const tokens = await this.store.get(account.id);
    if (!tokens) throw new AuthError(account.id, "No tokens stored for account");
    if (tokens.expiresAt > Date.now()) return tokens.accessToken;
    return (await this.refresh(account, tokens)).accessToken;
  }

  async getJson<T>(account: AccountRef, url: string, headers: Record<string, string> = {}): Promise<T> {
    let token = await this.accessToken(account);
    let response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, ...headers } });
    if (response.status === 401) {
      const tokens = await this.store.get(account.id);
      if (!tokens) throw new AuthError(account.id, "No tokens stored for account");
      token = (await this.refresh(account, tokens)).accessToken;
      response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, ...headers } });
    }
    if (response.status === 401 || response.status === 403) {
      throw new AuthError(account.id, `Calendar API answered ${response.status}`);
    }
    if (!response.ok) throw new Error(`Calendar API answered ${response.status} for ${url}`);
    return (await response.json()) as T;
  }
}
