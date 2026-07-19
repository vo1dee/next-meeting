import type { CalendarEvent, CalendarProvider } from "./provider";

/**
 * Deterministic fake day used until real providers land in T4, shaped after
 * the scenario the domain rules were designed against (see VERIFICATION.md T2):
 * an all-day event, an in-progress meeting, a declined one, a normal 1:1, and
 * a "Free" lunch.
 */
export class MockCalendarProvider implements CalendarProvider {
  readonly accountId = "mock";

  async listDay(now: Date): Promise<CalendarEvent[]> {
    const at = (h: number, m: number): Date => {
      const d = new Date(now);
      d.setHours(h, m, 0, 0);
      return d;
    };
    const base = {
      accountId: this.accountId,
      isAllDay: false,
      isCancelled: false,
      response: "accepted" as const,
      showAs: "busy" as const,
      webLink: "https://calendar.example/event",
    };
    return [
      { ...base, id: "1", iCalUid: "u1", title: "Payroll day", start: at(0, 0), end: at(23, 59), isAllDay: true },
      { ...base, id: "2", iCalUid: "u2", title: "Team sync", start: at(9, 0), end: at(10, 0), structuredJoinLink: "https://zoom.us/j/123456789" },
      { ...base, id: "3", iCalUid: "u3", title: "Standup", start: at(9, 30), end: at(9, 45), response: "declined" },
      { ...base, id: "4", iCalUid: "u4", title: "1:1 with Sam", start: at(10, 0), end: at(10, 30), structuredJoinLink: "https://meet.google.com/abc-defg-hij" },
      { ...base, id: "5", iCalUid: "u5", title: "Lunch", start: at(12, 0), end: at(13, 0), showAs: "free" },
    ];
  }

  dayViewUrl(): string {
    return "https://calendar.example/day";
  }
}
