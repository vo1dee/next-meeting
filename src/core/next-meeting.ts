import type { CalendarEvent } from "../calendar/provider";

/** How long an already-started event keeps counting as the Next Meeting. */
export const GRACE_WINDOW_MS = 15 * 60_000;

function endOfLocalDay(now: Date): number {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/**
 * Candidate Event rules (CONTEXT.md): timed, not cancelled, not declined,
 * not marked Free, not yet ended, and starting before the end of the local
 * day. An event already underway stays eligible only within its Grace Window.
 */
export function isCandidate(event: CalendarEvent, now: Date): boolean {
  if (event.isAllDay || event.isCancelled) return false;
  if (event.response === "declined") return false;
  if (event.showAs === "free") return false;
  if (event.end.getTime() <= now.getTime()) return false;
  if (event.start.getTime() > endOfLocalDay(now)) return false;
  return now.getTime() - event.start.getTime() < GRACE_WINDOW_MS;
}

/** The Next Meeting: earliest-starting Candidate Event (CONTEXT.md). */
export function selectNextMeeting(events: CalendarEvent[], now: Date): CalendarEvent | undefined {
  let best: CalendarEvent | undefined;
  for (const event of events) {
    if (isCandidate(event, now) && (!best || event.start.getTime() < best.start.getTime())) {
      best = event;
    }
  }
  return best;
}

/**
 * The Agenda (Pro dial): today's Candidate Events that have not ended, in
 * start order, deduped across accounts by iCalUid.
 */
export function buildAgenda(events: CalendarEvent[], now: Date): CalendarEvent[] {
  throw new Error("TODO(T5)");
}
