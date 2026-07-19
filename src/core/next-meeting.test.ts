import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MockCalendarProvider } from "../calendar/mock-provider";
import type { CalendarEvent } from "../calendar/provider";
import { isCandidate, selectNextMeeting } from "./next-meeting";

const DAY = "2026-07-20";

function at(time: string): Date {
  return new Date(`${DAY}T${time}`);
}

function event(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: "e",
    iCalUid: "u",
    accountId: "test",
    title: "Event",
    start: at("10:00:00"),
    end: at("10:30:00"),
    isAllDay: false,
    isCancelled: false,
    response: "accepted",
    showAs: "busy",
    webLink: "https://calendar.example/event",
    ...overrides,
  };
}

describe("the scenario day (mock provider)", async () => {
  const events = await new MockCalendarProvider().listDay(at("09:00:00"));
  const titleAt = (time: string) => selectNextMeeting(events, at(time))?.title;

  it("selects the ongoing meeting within its Grace Window, never the all-day event", () => {
    assert.equal(titleAt("09:10:00"), "Team sync");
    assert.equal(titleAt("09:14:59"), "Team sync");
  });

  it("rolls forward when the Grace Window closes, skipping the declined standup", () => {
    assert.equal(titleAt("09:15:01"), "1:1 with Sam");
    assert.equal(titleAt("09:16:00"), "1:1 with Sam");
  });

  it("is Clear after the last Candidate ends — the Free lunch never counts", () => {
    assert.equal(titleAt("11:00:00"), undefined);
  });
});

describe("candidate rules", () => {
  const now = at("09:00:00");

  it("accepts tentative and unanswered invitations", () => {
    assert.equal(isCandidate(event({ response: "tentative" }), now), true);
    assert.equal(isCandidate(event({ response: "needsAction" }), now), true);
  });

  it("rejects declined and cancelled events", () => {
    assert.equal(isCandidate(event({ response: "declined" }), now), false);
    assert.equal(isCandidate(event({ isCancelled: true }), now), false);
  });

  it("rejects all-day and Free events", () => {
    assert.equal(isCandidate(event({ isAllDay: true }), now), false);
    assert.equal(isCandidate(event({ showAs: "free" }), now), false);
  });

  it("rejects ended events", () => {
    assert.equal(isCandidate(event({ start: at("08:00:00"), end: at("08:30:00") }), now), false);
  });

  it("horizon: an event after end of the local day is not a Candidate", () => {
    const lateEvening = at("23:00:00");
    const tomorrow = event({
      start: new Date(`${DAY}T00:05:00`),
      end: new Date(`${DAY}T00:35:00`),
    });
    tomorrow.start.setDate(tomorrow.start.getDate() + 1);
    tomorrow.end.setDate(tomorrow.end.getDate() + 1);
    assert.equal(isCandidate(tomorrow, lateEvening), false);
    assert.equal(selectNextMeeting([tomorrow], lateEvening), undefined);
  });
});
