import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CalendarEvent } from "../calendar/provider";
import { computeKeyFace, formatCountdown } from "./keyface-state";

const NOW = new Date("2026-07-20T09:00:00");

function meetingStartingIn(ms: number): CalendarEvent {
  const start = new Date(NOW.getTime() + ms);
  return {
    id: "e",
    iCalUid: "u",
    accountId: "test",
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

const m = (n: number) => n * 60_000;

describe("formatCountdown", () => {
  it("shows minutes under an hour, rounded hours above", () => {
    assert.equal(formatCountdown(m(45)), "45m");
    assert.equal(formatCountdown(m(61)), "1h");
    assert.equal(formatCountdown(m(90)), "2h");
    assert.equal(formatCountdown(30_000), "1m");
  });
});

describe("computeKeyFace ladder", () => {
  it("no Next Meeting → Clear", () => {
    assert.deepEqual(computeKeyFace(undefined, NOW, true), { kind: "clear" });
  });

  it("≥15m → later, solid", () => {
    assert.deepEqual(computeKeyFace(meetingStartingIn(m(16)), NOW, true), {
      kind: "countdown",
      text: "16m",
      title: "Event",
      nextTime: "next 09:16",
      urgency: "later",
      flash: false,
    });
  });

  it("<15m → soon; <5m → imminent, both solid", () => {
    assert.deepEqual(computeKeyFace(meetingStartingIn(m(14)), NOW, true), {
      kind: "countdown",
      text: "14m",
      title: "Event",
      nextTime: "next 09:14",
      urgency: "soon",
      flash: false,
    });
    assert.deepEqual(computeKeyFace(meetingStartingIn(m(4)), NOW, true), {
      kind: "countdown",
      text: "4m",
      title: "Event",
      nextTime: "next 09:04",
      urgency: "imminent",
      flash: false,
    });
  });

  it("≤2m → flashing only when the pre-meeting alert is on", () => {
    assert.deepEqual(computeKeyFace(meetingStartingIn(90_000), NOW, true), {
      kind: "countdown",
      text: "2m",
      title: "Event",
      nextTime: "next 09:01",
      urgency: "imminent",
      flash: true,
    });
    assert.deepEqual(computeKeyFace(meetingStartingIn(90_000), NOW, false), {
      kind: "countdown",
      text: "2m",
      title: "Event",
      nextTime: "next 09:01",
      urgency: "imminent",
      flash: false,
    });
  });

  it("started → NOW: flashing for 2 minutes, then solid", () => {
    assert.deepEqual(computeKeyFace(meetingStartingIn(-m(1)), NOW, true), { kind: "now", title: "Event", nextTime: "next 08:59", flash: true });
    assert.deepEqual(computeKeyFace(meetingStartingIn(-m(3)), NOW, true), { kind: "now", title: "Event", nextTime: "next 08:57", flash: false });
  });
});
