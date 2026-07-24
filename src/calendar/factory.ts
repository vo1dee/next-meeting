import { oauthManager } from "../auth/context";
import { getAccounts } from "../core/accounts";
import { GoogleCalendarProvider } from "./google";
import type { CalendarProvider } from "./provider";

/** One provider per connected account. */
export async function buildProviders(): Promise<CalendarProvider[]> {
  const accounts = await getAccounts();
  return accounts.map((account) => new GoogleCalendarProvider(account, oauthManager));
}
