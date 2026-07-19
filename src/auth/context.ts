import { OAuthManager } from "./oauth";
import { GlobalSettingsTokenStore, type TokenStore } from "./token-store";

/** Shared auth singletons — one token store and one OAuth manager per plugin process. */
export const tokenStore: TokenStore = new GlobalSettingsTokenStore();
export const oauthManager = new OAuthManager(tokenStore);
