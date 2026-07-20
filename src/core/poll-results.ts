import { AuthError } from "../auth/auth-error";
import type { CalendarEvent } from "../calendar/provider";
import { dedupeByICalUid } from "./next-meeting";

export type PollOutcome = {
  /** Deduped, merged events from every provider that succeeded this poll;
   *  undefined when none did — caller should leave its existing cache untouched. */
  events: CalendarEvent[] | undefined;
  /** True only when every provider rejected AND every rejection was an AuthError —
   *  i.e. there is zero usable calendar data anywhere, not just one broken account
   *  among several. */
  authFailed: boolean;
  /** accountId of every AuthError rejection, regardless of authFailed's value —
   *  feeds the key's reauth press action and Settings' per-account badge. */
  failedAccountIds: string[];
  /** Non-auth rejection reasons, for the caller to log. */
  otherErrors: unknown[];
};

/** Reduces a poll's Promise.allSettled results into the decisions NextMeetingService needs. */
export function reducePollResults(results: PromiseSettledResult<CalendarEvent[]>[]): PollOutcome {
  const fulfilledBatches: CalendarEvent[][] = [];
  const failedAccountIds: string[] = [];
  const otherErrors: unknown[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      fulfilledBatches.push(result.value);
    } else if (result.reason instanceof AuthError) {
      if (result.reason.accountId) failedAccountIds.push(result.reason.accountId);
    } else {
      otherErrors.push(result.reason);
    }
  }

  const authFailed = results.length > 0 && fulfilledBatches.length === 0 && otherErrors.length === 0;

  return {
    events: fulfilledBatches.length > 0 ? dedupeByICalUid(fulfilledBatches.flat()) : undefined,
    authFailed,
    failedAccountIds,
    otherErrors,
  };
}
