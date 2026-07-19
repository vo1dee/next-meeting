import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CalendarEvent } from "../calendar/provider";
import { extractJoinLink } from "./join-link";

function event(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: "e",
    iCalUid: "u",
    accountId: "test",
    title: "Event",
    start: new Date("2026-07-20T10:00:00"),
    end: new Date("2026-07-20T10:30:00"),
    isAllDay: false,
    isCancelled: false,
    response: "accepted",
    showAs: "busy",
    webLink: "https://calendar.example/event",
    ...overrides,
  };
}

describe("extractJoinLink", () => {
  it("prefers the structured API field over anything in the text", () => {
    const link = extractJoinLink(
      event({
        structuredJoinLink: "https://meet.google.com/abc-defg-hij",
        description: "Old link: https://zoom.us/j/999999999",
      }),
    );
    assert.equal(link, "https://meet.google.com/abc-defg-hij");
  });

  it("finds Zoom links (with params) in the location field", () => {
    const link = extractJoinLink(
      event({ location: "https://us02web.zoom.us/j/85512345678?pwd=abcDEF123" }),
    );
    assert.equal(link, "https://us02web.zoom.us/j/85512345678?pwd=abcDEF123");
  });

  it("checks location before description", () => {
    const link = extractJoinLink(
      event({
        location: "https://zoom.us/j/111",
        description: "https://zoom.us/j/222",
      }),
    );
    assert.equal(link, "https://zoom.us/j/111");
  });

  it("trims trailing punctuation around a Meet link in prose", () => {
    const link = extractJoinLink(
      event({ description: "Join here: https://meet.google.com/abc-defg-hij." }),
    );
    assert.equal(link, "https://meet.google.com/abc-defg-hij");
  });

  it("extracts Teams links from HTML anchors and decodes &amp;", () => {
    const link = extractJoinLink(
      event({
        description:
          '<a href="https://teams.microsoft.com/l/meetup-join/19%3ameeting_XYZ%40thread.v2/0?context=%7b%22Tid%22%3a%22t%22%7d&amp;anon=true">Click here to join</a>',
      }),
    );
    assert.equal(
      link,
      "https://teams.microsoft.com/l/meetup-join/19%3ameeting_XYZ%40thread.v2/0?context=%7b%22Tid%22%3a%22t%22%7d&anon=true",
    );
  });

  it("finds Webex room and j.php links", () => {
    assert.equal(
      extractJoinLink(event({ location: "https://acme.webex.com/meet/max" })),
      "https://acme.webex.com/meet/max",
    );
    assert.equal(
      extractJoinLink(event({ description: "https://acme.webex.com/acme/j.php?MTID=m123abc" })),
      "https://acme.webex.com/acme/j.php?MTID=m123abc",
    );
  });

  it("returns undefined when no conferencing link exists", () => {
    const link = extractJoinLink(
      event({ description: "Reset your PIN at https://intranet.example/pin" }),
    );
    assert.equal(link, undefined);
  });
});
