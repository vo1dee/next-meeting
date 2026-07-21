import streamDeck from "@elgato/streamdeck";

import type { CalendarEvent, CalendarProvider } from "../calendar/provider";
import { DEFAULT_SETTINGS, withDefaults, type GlobalSettings } from "../settings";
import { extractJoinLink } from "./join-link";
import { computeKeyFace, type KeyFace } from "./keyface-state";
import { buildAgenda, selectNextMeeting } from "./next-meeting";
import { reducePollResults } from "./poll-results";

export type ProvidersSource = () => Promise<CalendarProvider[]>;

export type PressAction =
  | { kind: "open"; url: string }
  | { kind: "reauth"; accountIds: string[] }
  | { kind: "alert" };

/** After this long without a successful poll the face gets a stale marker. */
const STALE_AFTER_MS = 30 * 60_000;

/**
 * Owns the calendar cache and the two clocks: the API poll (refreshMinutes)
 * and the display tick (minute boundaries, or 1 Hz while a flash state is
 * active). Actions subscribe via onChange and pull face()/agenda()/press
 * decisions from here.
 */
export class NextMeetingService {
  private events: CalendarEvent[] = [];
  private providers: CalendarProvider[] = [];
  private settings: GlobalSettings = DEFAULT_SETTINGS;
  private failedAccounts = new Set<string>();
  private authFailed = false;
  private lastPollOk = 0;
  private flashPhase = false;
  private pollTimer?: NodeJS.Timeout;
  private tickTimer?: NodeJS.Timeout;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly providersSource: ProvidersSource) {}

  async start(): Promise<void> {
    const stored: Partial<GlobalSettings> = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
    this.settings = withDefaults(stored);
    if (stored.refreshMinutes === undefined || stored.preMeetingFlash === undefined) {
      // First run: persist defaults so the PI always binds to concrete values.
      await streamDeck.settings.setGlobalSettings(this.settings);
    }
    streamDeck.settings.onDidReceiveGlobalSettings<GlobalSettings>((ev) => {
      this.settings = withDefaults(ev.settings);
      // Slider drags fire this repeatedly — reschedule the next poll instead
      // of fetching immediately; account changes call refreshNow() explicitly.
      clearTimeout(this.pollTimer);
      this.pollTimer = setTimeout(() => void this.poll(), this.settings.refreshMinutes * 60_000);
      this.notify();
    });
    await this.poll();
    this.scheduleTick();
  }

  stop(): void {
    clearTimeout(this.pollTimer);
    clearTimeout(this.tickTimer);
    this.listeners.clear();
  }

  /** Immediate re-poll — used after connecting, re-authorizing, or removing accounts. */
  async refreshNow(): Promise<void> {
    clearTimeout(this.pollTimer);
    await this.poll();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  face(): { face: KeyFace; flashPhase: boolean; stale: boolean } {
    const face: KeyFace =
      this.authFailed || this.providers.length === 0
        ? { kind: "auth" }
        : computeKeyFace(this.nextMeeting(), new Date(), this.settings.preMeetingFlash);
    const stale =
      face.kind !== "auth" && this.lastPollOk > 0 && Date.now() - this.lastPollOk > STALE_AFTER_MS;
    return { face, flashPhase: this.flashPhase, stale };
  }

  nextMeeting(): CalendarEvent | undefined {
    return selectNextMeeting(this.events, new Date());
  }

  /** Account ids currently failing auth — feeds Settings' per-account reauthorize UI. */
  failedAccountIds(): string[] {
    return [...this.failedAccounts];
  }

  /** Today's remaining Candidate Events for the Pro dial and the Pro key's agenda view. */
  agenda(): CalendarEvent[] {
    return buildAgenda(this.events, new Date());
  }

  /** Which key gesture joins vs. shows the agenda list (Pro key only). */
  holdToJoin(): boolean {
    return this.settings.holdToJoin;
  }

  /** Join URL for one agenda entry — the key's exact press semantics. */
  joinUrl(event: CalendarEvent): string {
    return extractJoinLink(event) ?? event.webLink;
  }

  /** What a press should do right now (agreed press semantics). */
  pressAction(): PressAction {
    if (this.authFailed && this.failedAccounts.size > 0) {
      return { kind: "reauth", accountIds: [...this.failedAccounts] };
    }
    if (this.providers.length === 0) return { kind: "alert" }; // no accounts: connect via the PI first
    const next = this.nextMeeting();
    if (next) return { kind: "open", url: this.joinUrl(next) };
    return { kind: "open", url: this.providers[0].dayViewUrl(new Date()) };
  }

  private async poll(): Promise<void> {
    try {
      this.providers = await this.providersSource();
      const results = await Promise.allSettled(this.providers.map((p) => p.listDay(new Date())));
      const outcome = reducePollResults(results);
      this.authFailed = outcome.authFailed;
      this.failedAccounts = new Set(outcome.failedAccountIds);
      for (const err of outcome.otherErrors) {
        // Agreed failure mode: keep serving the cached agenda — local time
        // math stays valid; the face gains a stale marker after 30 min.
        streamDeck.logger.warn("Calendar fetch failed; serving cached events", err);
      }
      if (outcome.events !== undefined) {
        this.events = outcome.events;
        this.lastPollOk = Date.now();
      }
    } catch (err) {
      streamDeck.logger.error("Poll failed", err);
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
