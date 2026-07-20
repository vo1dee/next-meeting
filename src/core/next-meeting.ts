import { NOW_FLASH_MS } from "./keyface-state";
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
  const timeSinceStart = now.getTime() - event.start.getTime();
  // Already-started events stay eligible only within Grace Window.
  if (timeSinceStart > 0) return timeSinceStart < GRACE_WINDOW_MS;
  return true;
}

/** The Next Meeting: earliest-starting Candidate Event (CONTEXT.md).
 * After showing a meeting for NOW_FLASH_MS (2 min), skip it and pick the next one. */
export function selectNextMeeting(events: CalendarEvent[], now: Date): CalendarEvent | undefined {
  let best: CalendarEvent | undefined;
  for (const event of events) {
    if (!isCandidate(event, now)) continue;
    // Skip meetings that started >2min ago (already shown as NOW long enough).
    if (event.start.getTime() < now.getTime() && now.getTime() - event.start.getTime() > NOW_FLASH_MS) {
      continue;
    }
    if (!best || event.start.getTime() < best.start.getTime()) {
      best = event;
    }
  }
  return best;
}

/** Blended Pro calendars can carry the same meeting twice — keep the first sighting. */
export function dedupeByICalUid(events: CalendarEvent[]): CalendarEvent[] {
  const seen = new Set<string>();
  const out: CalendarEvent[] = [];
  for (const event of events) {
    const key = event.iCalUid || `${event.accountId}:${event.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(event);
    }
  }
  return out;
}

/**
 * The Agenda (Pro dial): today's Candidate Events, in start order, deduped
 * across accounts by iCalUid. Same eligibility rules as the key (CONTEXT.md),
 * so agenda[0] is always the Next Meeting.
 */
export function buildAgenda(events: CalendarEvent[], now: Date): CalendarEvent[] {
  return dedupeByICalUid(events.filter((event) => isCandidate(event, now))).sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
}
