import streamDeck from "@elgato/streamdeck";

import { tokenStore } from "../auth/context";
import { runOAuthFlow } from "../auth/oauth";
import { withDefaults, type AccountRef, type GlobalSettings } from "../settings";

export type ProviderKind = AccountRef["provider"];

/** A practical cap for blended calendar accounts. */
export function maxAccounts(): number {
  return 8;
}

async function readSettings(): Promise<GlobalSettings> {
  return withDefaults(await streamDeck.settings.getGlobalSettings<GlobalSettings>());
}

export async function getAccounts(): Promise<AccountRef[]> {
  return (await readSettings()).accounts;
}

/** Interactive loopback+PKCE flow (ADR-0001); persists the account and its tokens. */
export async function connectAccount(provider: ProviderKind): Promise<boolean> {
  if ((await getAccounts()).length >= maxAccounts()) {
    streamDeck.logger.info("Account limit reached; connect refused");
    return false;
  }
  try {
    const result = await runOAuthFlow(provider);
    await tokenStore.set(result.accountId, result.tokens);
    const settings = await readSettings();
    if (!settings.accounts.some((account) => account.id === result.accountId)) {
      settings.accounts.push({ id: result.accountId, provider, label: result.label });
      await streamDeck.settings.setGlobalSettings(settings);
    }
    return true;
  } catch (err) {
    streamDeck.logger.error(`Connecting ${provider} failed`, err);
    return false;
  }
}

/** Re-run consent for accounts whose refresh tokens died (press-on-Auth semantics). */
export async function reauthorizeAccounts(accountIds: string[]): Promise<boolean> {
  const settings = await readSettings();
  let anySuccess = false;
  for (const accountId of accountIds) {
    const account = settings.accounts.find((a) => a.id === accountId);
    if (!account) continue;
    try {
      const result = await runOAuthFlow(account.provider);
      await tokenStore.set(result.accountId, result.tokens);
      if (result.accountId !== account.id) {
        await tokenStore.delete(account.id);
        account.id = result.accountId;
      }
      account.label = result.label;
      anySuccess = true;
    } catch (err) {
      streamDeck.logger.error(`Re-authorizing ${account.label} failed`, err);
    }
  }
  if (anySuccess) await streamDeck.settings.setGlobalSettings(settings);
  return anySuccess;
}

export async function disconnectAccount(accountId: string): Promise<void> {
  await tokenStore.delete(accountId);
  const settings = await readSettings();
  settings.accounts = settings.accounts.filter((account) => account.id !== accountId);
  await streamDeck.settings.setGlobalSettings(settings);
}
