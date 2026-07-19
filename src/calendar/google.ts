import type { OAuthManager } from "../auth/oauth";
import type { AccountRef } from "../settings";
import type { CalendarEvent, CalendarProvider } from "./provider";

type GoogleEvent = {
  id: string;
  iCalUID?: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  transparency?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  organizer?: { self?: boolean };
  attendees?: { self?: boolean; responseStatus?: string }[];
  conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
};

const RESPONSE_MAP: Record<string, CalendarEvent["response"]> = {
  accepted: "accepted",
  declined: "declined",
  tentative: "tentative",
  needsAction: "needsAction",
};

/** "2026-07-20" (all-day boundary) as local midnight. */
function parseLocalDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function parseBoundary(boundary: { dateTime?: string; date?: string } | undefined): Date | undefined {
  if (boundary?.dateTime) return new Date(boundary.dateTime);
  if (boundary?.date) return parseLocalDate(boundary.date);
  return undefined;
}

export class GoogleCalendarProvider implements CalendarProvider {
  readonly accountId: string;

  constructor(
    private readonly account: AccountRef,
    private readonly oauth: OAuthManager,
  ) {
    this.accountId = account.id;
  }

  async listDay(now: Date): Promise<CalendarEvent[]> {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);
    const params = new URLSearchParams({
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "50",
    });
    const json = await this.oauth.getJson<{ items?: GoogleEvent[] }>(
      this.account,
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    );
    const events: CalendarEvent[] = [];
    for (const item of json.items ?? []) {
      const start = parseBoundary(item.start);
      const end = parseBoundary(item.end);
      if (!start || !end) continue;
      events.push({
        id: item.id,
        iCalUid: item.iCalUID ?? item.id,
        accountId: this.accountId,
        title: item.summary ?? "(No title)",
        start,
        end,
        isAllDay: Boolean(item.start?.date),
        isCancelled: item.status === "cancelled",
        response: item.organizer?.self
          ? "organizer"
          : (RESPONSE_MAP[item.attendees?.find((a) => a.self)?.responseStatus ?? ""] ?? "accepted"),
        showAs: item.transparency === "transparent" ? "free" : "busy",
        structuredJoinLink:
          item.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ?? item.hangoutLink,
        location: item.location,
        description: item.description,
        webLink: item.htmlLink ?? "https://calendar.google.com/calendar/u/0/r/day",
      });
    }
    return events;
  }

  dayViewUrl(): string {
    return "https://calendar.google.com/calendar/u/0/r/day";
  }
}
