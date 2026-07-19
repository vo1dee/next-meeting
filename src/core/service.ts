import streamDeck from "@elgato/streamdeck";

import type { CalendarEvent, CalendarProvider } from "../calendar/provider";
import { DEFAULT_SETTINGS, withDefaults, type GlobalSettings } from "../settings";
import { extractJoinLink } from "./join-link";
import { computeKeyFace, type KeyFace } from "./keyface-state";
import { selectNextMeeting } from "./next-meeting";

/**
 * Owns the calendar cache and the two clocks: the API poll (refreshMinutes)
 * and the display tick (minute boundaries, or 1 Hz while a flash state is
 * active). Actions subscribe via onChange and pull face()/pressUrl().
 */
export class NextMeetingService {
  private events: CalendarEvent[] = [];
  private settings: GlobalSettings = DEFAULT_SETTINGS;
  private authFailed = false;
  private flashPhase = false;
  private pollTimer?: NodeJS.Timeout;
  private tickTimer?: NodeJS.Timeout;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly provider: CalendarProvider) {}

  async start(): Promise<void> {
    this.settings = withDefaults(await streamDeck.settings.getGlobalSettings<GlobalSettings>());
    streamDeck.settings.onDidReceiveGlobalSettings<GlobalSettings>((ev) => {
      this.settings = withDefaults(ev.settings);
      clearTimeout(this.pollTimer);
      void this.poll();
    });
    await this.poll();
    this.scheduleTick();
  }

  stop(): void {
    clearTimeout(this.pollTimer);
    clearTimeout(this.tickTimer);
    this.listeners.clear();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  face(): { face: KeyFace; flashPhase: boolean } {
    const face: KeyFace = this.authFailed
      ? { kind: "auth" }
      : computeKeyFace(this.nextMeeting(), new Date(), this.settings.preMeetingFlash);
    return { face, flashPhase: this.flashPhase };
  }

  nextMeeting(): CalendarEvent | undefined {
    return selectNextMeeting(this.events, new Date());
  }

  /**
   * The URL a press opens: Join Link → event page → day view when Clear.
   * TODO(T4): the Auth state re-triggers the OAuth flow instead.
   */
  pressUrl(): string {
    const next = this.authFailed ? undefined : this.nextMeeting();
    if (!next) return this.provider.dayViewUrl(new Date());
    return extractJoinLink(next) ?? next.webLink;
  }

  private async poll(): Promise<void> {
    try {
      this.events = await this.provider.listDay(new Date());
      this.authFailed = false;
    } catch (err) {
      // Agreed failure mode: keep serving the cached agenda — local time math
      // stays valid. TODO(T4): set authFailed on auth errors specifically.
      streamDeck.logger.warn("Calendar fetch failed; serving cached events", err);
    }
    this.pollTimer = setTimeout(() => void this.poll(), this.settings.refreshMinutes * 60_000);
    this.notify();
  }

  private scheduleTick(): void {
    const { face } = this.face();
    const flashing = (face.kind === "countdown" || face.kind === "now") && face.flash;
    const delay = flashing ? 500 : 60_000 - (Date.now() % 60_000) + 50;
    this.tickTimer = setTimeout(() => {
      this.flashPhase = flashing ? !this.flashPhase : false;
      this.notify();
      this.scheduleTick();
    }, delay);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
