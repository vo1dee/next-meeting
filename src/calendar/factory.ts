import { oauthManager } from "../auth/context";
import { getAccounts } from "../core/accounts";
import { GoogleCalendarProvider } from "./google";
import { MockCalendarProvider } from "./mock-provider";
import type { CalendarProvider } from "./provider";

/**
 * One provider per connected account. NEXT_MEETING_MOCK=1 substitutes the
 * deterministic mock day for on-device testing without OAuth clients.
 */
export async function buildProviders(): Promise<CalendarProvider[]> {
  if (process.env.NEXT_MEETING_MOCK === "1") return [new MockCalendarProvider()];
  const accounts = await getAccounts();
  return accounts.map((account) => new GoogleCalendarProvider(account, oauthManager));
}
