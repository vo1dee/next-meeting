import streamDeck from "@elgato/streamdeck";

import { withDefaults, type AccountRef, type GlobalSettings } from "../settings";
import { isProUser } from "../tier";

export type ProviderKind = AccountRef["provider"];

/** Free: exactly one account; Pro: blended multi-account (practical cap). */
export function maxAccounts(): number {
  return isProUser() ? 8 : 1;
}

export async function getAccounts(): Promise<AccountRef[]> {
  return withDefaults(await streamDeck.settings.getGlobalSettings<GlobalSettings>()).accounts;
}

/** TODO(T4): launch the loopback+PKCE OAuth flow (ADR-0001) and persist the account + tokens. */
export async function connectAccount(provider: ProviderKind): Promise<void> {
  if ((await getAccounts()).length >= maxAccounts()) {
    streamDeck.logger.info("Account limit reached for this tier; connect refused");
    return;
  }
  streamDeck.logger.info(`Connect ${provider} requested — OAuth flow lands in T4`);
}

/** TODO(T4): also revoke and delete the account's tokens from the TokenStore. */
export async function disconnectAccount(accountId: string): Promise<void> {
  const settings = withDefaults(await streamDeck.settings.getGlobalSettings<GlobalSettings>());
  settings.accounts = settings.accounts.filter((account) => account.id !== accountId);
  await streamDeck.settings.setGlobalSettings(settings);
}
