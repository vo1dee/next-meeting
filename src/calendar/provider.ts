/** A calendar event normalized from Google Calendar. */
export interface CalendarEvent {
  /** Provider-scoped event id. */
  id: string;
  /** Cross-account identity; blended Pro agendas dedupe on this. */
  iCalUid: string;
  accountId: string;
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  isCancelled: boolean;
  /** The user's own RSVP to this event. */
  response: "accepted" | "tentative" | "needsAction" | "declined" | "organizer";
  /** Free/busy transparency; "free" events are never Candidate Events. */
  showAs: "busy" | "free";
  /** Join Link from the structured API field (conferenceData / onlineMeeting), when present. */
  structuredJoinLink?: string;
  location?: string;
  description?: string;
  /** The event's web page (Google htmlLink / Graph webLink) — the no-link press fallback. */
  webLink: string;
}

export interface CalendarProvider {
  readonly accountId: string;
  /** Events overlapping the local calendar day containing `now`. */
  listDay(now: Date): Promise<CalendarEvent[]>;
  /** URL of the provider's day view — the press target when Clear. */
  dayViewUrl(now: Date): string;
}
