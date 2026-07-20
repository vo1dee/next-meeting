import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuthError } from "../auth/auth-error";
import type { CalendarEvent } from "../calendar/provider";
import { computeKeyFace } from "./keyface-state";
import { selectNextMeeting } from "./next-meeting";
import { reducePollResults } from "./poll-results";

const NOW = new Date("2026-07-20T09:00:00");
const m = (n: number) => n * 60_000;

function meetingStartingIn(ms: number, accountId: string): CalendarEvent {
  const start = new Date(NOW.getTime() + ms);
  return {
    id: accountId,
    iCalUid: `u-${accountId}`,
    accountId,
    title: "Event",
    start,
    end: new Date(start.getTime() + 30 * 60_000),
    isAllDay: false,
    isCancelled: false,
    response: "accepted",
    showAs: "busy",
    webLink: "https://calendar.example/event",
  };
}

const ok = (events: CalendarEvent[]): PromiseSettledResult<CalendarEvent[]> => ({
  status: "fulfilled",
  value: events,
});
const authErr = (accountId: string): PromiseSettledResult<CalendarEvent[]> => ({
  status: "rejected",
  reason: new AuthError(accountId, "boom"),
});
const networkErr = (): PromiseSettledResult<CalendarEvent[]> => ({
  status: "rejected",
  reason: new Error("ECONNRESET"),
});

/** Mirrors NextMeetingService.face()'s auth-vs-countdown decision, given a poll outcome. */
function faceFor(outcome: ReturnType<typeof reducePollResults>, priorEvents: CalendarEvent[] = []) {
  if (outcome.authFailed) return { kind: "auth" } as const;
  const events = outcome.events ?? priorEvents;
  return computeKeyFace(selectNextMeeting(events, NOW), NOW, true);
}

describe("reducePollResults", () => {
  it("(a) single account, AuthError → auth, no events", () => {
    const outcome = reducePollResults([authErr("acct-1")]);
    assert.equal(outcome.authFailed, true);
    assert.deepEqual(outcome.failedAccountIds, ["acct-1"]);
    assert.equal(outcome.events, undefined);
    assert.equal(faceFor(outcome).kind, "auth");
  });

  it("(b) two accounts, one AuthError + one fulfilled → not auth, countdown from the working account", () => {
    const event = meetingStartingIn(m(16), "acct-2");
    const outcome = reducePollResults([authErr("acct-1"), ok([event])]);
    assert.equal(outcome.authFailed, false);
    assert.deepEqual(outcome.failedAccountIds, ["acct-1"]);
    assert.deepEqual(outcome.events, [event]);
    const face = faceFor(outcome);
    assert.equal(face.kind, "countdown");
    if (face.kind === "countdown") {
      assert.equal(face.text, "16m");
      assert.equal(face.urgency, "later");
    }
  });

  it("(c) two accounts, both AuthError → auth", () => {
    const outcome = reducePollResults([authErr("acct-1"), authErr("acct-2")]);
    assert.equal(outcome.authFailed, true);
    assert.deepEqual(outcome.failedAccountIds, ["acct-1", "acct-2"]);
    assert.equal(faceFor(outcome).kind, "auth");
  });

  it("(d) two accounts, one fulfilled + one transient non-auth rejection → events reflect the fulfilled one only", () => {
    const event = meetingStartingIn(m(16), "acct-1");
    const outcome = reducePollResults([ok([event]), networkErr()]);
    assert.equal(outcome.authFailed, false);
    assert.deepEqual(outcome.failedAccountIds, []);
    assert.deepEqual(outcome.events, [event]);
    assert.equal(outcome.otherErrors.length, 1);
  });

  it("single account, transient non-auth rejection → events left undefined (caller preserves its cache)", () => {
    const outcome = reducePollResults([networkErr()]);
    assert.equal(outcome.authFailed, false);
    assert.equal(outcome.events, undefined);
  });

  it("zero providers → not authFailed (that's a separate 'no accounts connected' state)", () => {
    const outcome = reducePollResults([]);
    assert.equal(outcome.authFailed, false);
    assert.equal(outcome.events, undefined);
  });
});
