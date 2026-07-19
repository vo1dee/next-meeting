import type { OAuthManager } from "../auth/oauth";
import type { AccountRef } from "../settings";
import type { CalendarEvent, CalendarProvider } from "./provider";

type GraphEvent = {
  id: string;
  iCalUId?: string;
  subject?: string;
  bodyPreview?: string;
  webLink?: string;
  isAllDay?: boolean;
  isCancelled?: boolean;
  showAs?: string;
  onlineMeetingUrl?: string;
  onlineMeeting?: { joinUrl?: string };
  location?: { displayName?: string };
  responseStatus?: { response?: string };
  start?: { dateTime?: string };
  end?: { dateTime?: string };
};

const RESPONSE_MAP: Record<string, CalendarEvent["response"]> = {
  organizer: "organizer",
  accepted: "accepted",
  tentativelyAccepted: "tentative",
  declined: "declined",
  notResponded: "needsAction",
  none: "needsAction",
};

/** Graph returns naked datetimes in the requested zone; we ask for UTC and pin the Z. */
function parseUtc(dateTime: string | undefined): Date | undefined {
  if (!dateTime) return undefined;
  return new Date(dateTime.endsWith("Z") ? dateTime : `${dateTime}Z`);
}

export class GraphCalendarProvider implements CalendarProvider {
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
      startDateTime: dayStart.toISOString(),
      endDateTime: dayEnd.toISOString(),
      $top: "50",
      $orderby: "start/dateTime",
      $select:
        "id,iCalUId,subject,bodyPreview,webLink,isAllDay,isCancelled,showAs,onlineMeetingUrl,onlineMeeting,location,responseStatus,start,end",
    });
    const json = await this.oauth.getJson<{ value?: GraphEvent[] }>(
      this.account,
      `https://graph.microsoft.com/v1.0/me/calendarView?${params}`,
      { Prefer: 'outlook.timezone="UTC"' },
    );
    const events: CalendarEvent[] = [];
    for (const item of json.value ?? []) {
      const start = parseUtc(item.start?.dateTime);
      const end = parseUtc(item.end?.dateTime);
      if (!start || !end) continue;
      events.push({
        id: item.id,
        iCalUid: item.iCalUId ?? item.id,
        accountId: this.accountId,
        title: item.subject ?? "(No title)",
        start,
        end,
        isAllDay: Boolean(item.isAllDay),
        isCancelled: Boolean(item.isCancelled),
        response: RESPONSE_MAP[item.responseStatus?.response ?? ""] ?? "accepted",
        showAs: item.showAs === "free" ? "free" : "busy",
        structuredJoinLink: item.onlineMeeting?.joinUrl ?? item.onlineMeetingUrl ?? undefined,
        location: item.location?.displayName,
        description: item.bodyPreview,
        webLink: item.webLink ?? "https://outlook.office.com/calendar/view/day",
      });
    }
    return events;
  }

  dayViewUrl(): string {
    return "https://outlook.office.com/calendar/view/day";
  }
}
