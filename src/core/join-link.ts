import type { CalendarEvent } from "../calendar/provider";

/**
 * Resolve the Join Link for an event. Source order (agreed in grilling):
 *   1. structured API field (conferenceData / onlineMeeting.joinUrl)
 *   2. regex over location
 *   3. regex over description
 * Regexes cover Zoom, Google Meet, Microsoft Teams, and Webex.
 * Returns undefined when nothing is found — the press then opens webLink.
 */
export function extractJoinLink(event: CalendarEvent): string | undefined {
  throw new Error("TODO(T2)");
}
