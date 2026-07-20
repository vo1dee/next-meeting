import type { CalendarEvent } from "../calendar/provider";

/** The five-step urgency ladder thresholds (agreed in grilling). */
export const SOON_MS = 15 * 60_000;
export const IMMINENT_MS = 5 * 60_000;
export const ALERT_MS = 2 * 60_000;
/** How long NOW keeps flashing after the meeting starts. */
export const NOW_FLASH_MS = 2 * 60_000;

export type KeyFace =
  | { kind: "countdown"; text: string; title: string; nextTime: string; urgency: "later" | "soon" | "imminent"; flash: boolean }
  | { kind: "now"; title: string; nextTime: string; flash: boolean }
  | { kind: "clear" }
  | { kind: "auth" };

/** "45m" under an hour, "2h" (rounded) above; floors at "1m". */
export function formatCountdown(msUntilStart: number): string {
  const minutes = Math.max(1, Math.ceil(msUntilStart / 60_000));
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round(minutes / 60)}h`;
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function formatNextTime(date: Date): string {
  return formatTime(date);
}

function truncateTitle(title: string, maxLength = 12): string {
  return title.length > maxLength ? title.slice(0, maxLength - 1) + "…" : title;
}

/**
 * Ladder: ≥15m later (green) → <15m soon (amber) → <5m imminent (red) →
 * ≤2m imminent+flash (if the pre-meeting alert is on) → started: NOW,
 * flashing for the first 2 minutes then solid through the Grace Window.
 * Auth is decided by the caller (token state, not meeting math).
 */
export function computeKeyFace(next: CalendarEvent | undefined, now: Date, preMeetingFlash: boolean): KeyFace {
  if (!next) return { kind: "clear" };
  const title = truncateTitle(next.title);
  const nextTime = formatNextTime(next.start);
  const untilStart = next.start.getTime() - now.getTime();
  if (untilStart <= 0) return { kind: "now", title, nextTime, flash: -untilStart < NOW_FLASH_MS };
  const text = formatCountdown(untilStart);
  if (untilStart <= ALERT_MS) return { kind: "countdown", text, title, nextTime, urgency: "imminent", flash: preMeetingFlash };
  if (untilStart < IMMINENT_MS) return { kind: "countdown", text, title, nextTime, urgency: "imminent", flash: false };
  if (untilStart < SOON_MS) return { kind: "countdown", text, title, nextTime, urgency: "soon", flash: false };
  return { kind: "countdown", text, title, nextTime, urgency: "later", flash: false };
}
