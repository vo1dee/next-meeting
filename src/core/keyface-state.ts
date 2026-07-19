import type { CalendarEvent } from "../calendar/provider";

/**
 * The five-step urgency ladder (agreed in grilling):
 *   >= 15m  countdown, later     (green,  solid)
 *   <  15m  countdown, soon      (amber,  solid)
 *   <   5m  countdown, imminent  (red,    solid)
 *   <=  2m  countdown, imminent  (red,    FLASH — pre-meeting alert toggle)
 *   started "NOW"                (red,    FLASH first 2m, then solid through Grace Window)
 *   none    Clear "—"            (dim)
 *   token failure "Auth"         (grey)
 */
export type KeyFace =
  | { kind: "countdown"; text: string; urgency: "later" | "soon" | "imminent"; flash: boolean }
  | { kind: "now"; flash: boolean }
  | { kind: "clear" }
  | { kind: "auth" };

export function computeKeyFace(next: CalendarEvent | undefined, now: Date, preMeetingFlash: boolean): KeyFace {
  throw new Error("TODO(T2)");
}
