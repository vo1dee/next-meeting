import type { CalendarEvent } from "../calendar/provider";

/** How long an already-started event keeps counting as the Next Meeting. */
export const GRACE_WINDOW_MS = 15 * 60_000;

/**
 * Candidate Event rules (CONTEXT.md): timed, not cancelled, not declined,
 * not marked Free, and not yet ended.
 */
export function isCandidate(event: CalendarEvent, now: Date): boolean {
  throw new Error("TODO(T2)");
}

/**
 * The Next Meeting: earliest-starting Candidate Event before end of the local
 * day; an event already underway is eligible only within its Grace Window.
 */
export function selectNextMeeting(events: CalendarEvent[], now: Date): CalendarEvent | undefined {
  throw new Error("TODO(T2)");
}

/**
 * The Agenda (Pro dial): today's Candidate Events that have not ended, in
 * start order, deduped across accounts by iCalUid.
 */
export function buildAgenda(events: CalendarEvent[], now: Date): CalendarEvent[] {
  throw new Error("TODO(T5)");
}
