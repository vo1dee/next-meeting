import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CalendarEvent } from "../calendar/provider";
import { buildAgenda, dedupeByICalUid, selectNextMeeting } from "./next-meeting";

const DAY = "2026-07-20";

function at(time: string): Date {
  return new Date(`${DAY}T${time}`);
}

function event(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: "e",
    iCalUid: "u",
    accountId: "a1",
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

function scenarioDay(now: Date): CalendarEvent[] {
  const at = (h: number, m: number): Date => {
    const date = new Date(now);
    date.setHours(h, m, 0, 0);
    return date;
  };
  const base = {
    accountId: "test",
    isAllDay: false,
    isCancelled: false,
    response: "accepted" as const,
    showAs: "busy" as const,
    webLink: "https://calendar.example/event",
  };
  return [
    { ...base, id: "1", iCalUid: "u1", title: "Payroll day", start: at(0, 0), end: at(23, 59), isAllDay: true },
    { ...base, id: "2", iCalUid: "u2", title: "Team sync", start: at(9, 0), end: at(10, 0) },
    { ...base, id: "3", iCalUid: "u3", title: "Standup", start: at(9, 30), end: at(9, 45), response: "declined" as const },
    { ...base, id: "4", iCalUid: "u4", title: "1:1 with Sam", start: at(10, 0), end: at(10, 30) },
    { ...base, id: "5", iCalUid: "u5", title: "Lunch", start: at(12, 0), end: at(13, 0), showAs: "free" as const },
  ];
}

describe("dedupeByICalUid", () => {
  it("keeps one copy of the same meeting blended from two accounts", () => {
    const work = event({ id: "w1", iCalUid: "shared-uid", accountId: "work" });
    const personal = event({ id: "p1", iCalUid: "shared-uid", accountId: "personal" });
    const other = event({ id: "o1", iCalUid: "other-uid" });
    const deduped = dedupeByICalUid([work, personal, other]);
    assert.equal(deduped.length, 2);
    assert.equal(deduped[0].accountId, "work");
  });

  it("falls back to account-scoped ids when iCalUid is missing", () => {
    const a = event({ id: "same", iCalUid: "", accountId: "a1" });
    const b = event({ id: "same", iCalUid: "", accountId: "a2" });
    assert.equal(dedupeByICalUid([a, b]).length, 2);
  });
});

describe("buildAgenda", () => {
  it("shares eligibility with the key: agenda[0] is always the Next Meeting", () => {
    const events = scenarioDay(at("09:00:00"));
    const now = at("09:16:00");
    const agenda = buildAgenda(events, now);
    assert.equal(agenda[0], selectNextMeeting(events, now));
  });

  it("sorts by start, excludes ended and declined events, dedupes across accounts", () => {
    const later = event({ id: "later", iCalUid: "later", start: at("15:00:00"), end: at("15:30:00") });
    const sooner = event({ id: "sooner", iCalUid: "sooner", start: at("11:00:00"), end: at("11:30:00") });
    const ended = event({ id: "ended", iCalUid: "ended", start: at("08:00:00"), end: at("08:30:00") });
    const declined = event({ id: "declined", iCalUid: "declined", response: "declined", start: at("12:00:00"), end: at("12:30:00") });
    const dupe = event({ id: "dupe", iCalUid: "sooner", accountId: "a2", start: at("11:00:00"), end: at("11:30:00") });
    const agenda = buildAgenda([later, sooner, ended, declined, dupe], at("09:00:00"));
    assert.deepEqual(
      agenda.map((e) => e.id),
      ["sooner", "later"],
    );
  });

  it("is empty when nothing remains", () => {
    const ended = event({ start: at("08:00:00"), end: at("08:30:00") });
    assert.deepEqual(buildAgenda([ended], at("20:00:00")), []);
  });
});
