import streamDeck, {
  action,
  DialDownEvent,
  DialRotateEvent,
  SingletonAction,
  TouchTapEvent,
  WillAppearEvent,
} from "@elgato/streamdeck";

import type { NextMeetingService } from "../core/service";
import { formatCountdown } from "../core/keyface-state";

/** How long a scrolled selection sticks before snapping back to the Next Meeting. */
const SNAP_BACK_MS = 30_000;

/**
 * Pro-only Agenda dial: rotate scrolls today's remaining Candidate Events,
 * press/touch joins the selected one, selection snaps back after 30s idle.
 * Only registered when __IS_PRO__ (the free manifest has no Encoder action).
 */
@action({ UUID: `${__PLUGIN_UUID__}.dial` })
export class AgendaDial extends SingletonAction {
  private index = 0;
  private lastRotate = 0;
  private unsubscribe?: () => void;

  constructor(private readonly service: NextMeetingService) {
    super();
  }

  override onWillAppear(_ev: WillAppearEvent): void {
    this.unsubscribe ??= this.service.onChange(() => void this.render());
    void this.render();
  }

  override async onDialRotate(ev: DialRotateEvent): Promise<void> {
    const agenda = this.service.agenda();
    if (agenda.length === 0) return;
    this.index = Math.min(Math.max(this.index + ev.payload.ticks, 0), agenda.length - 1);
    this.lastRotate = Date.now();
    await this.render();
  }

  override async onDialDown(_ev: DialDownEvent): Promise<void> {
    await this.joinSelected();
  }

  override async onTouchTap(_ev: TouchTapEvent): Promise<void> {
    await this.joinSelected();
  }

  /** Joins the selected agenda entry with the key's exact press semantics. */
  private async joinSelected(): Promise<void> {
    const selected = this.selected();
    if (selected) {
      await streamDeck.system.openUrl(this.service.joinUrl(selected));
      return;
    }
    const press = this.service.pressAction();
    if (press.kind === "open") await streamDeck.system.openUrl(press.url);
  }

  private selected() {
    const agenda = this.service.agenda();
    if (agenda.length === 0) return undefined;
    if (Date.now() - this.lastRotate > SNAP_BACK_MS) this.index = 0;
    this.index = Math.min(this.index, agenda.length - 1);
    return agenda[this.index];
  }

  private async render(): Promise<void> {
    const { face } = this.service.face();
    let title = "—";
    let value = "Clear";
    if (face.kind === "auth") {
      title = "Auth";
      value = "Connect in settings";
    } else {
      const selected = this.selected();
      if (selected) {
        const untilStart = selected.start.getTime() - Date.now();
        const clock = selected.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        title = selected.title;
        value = `${clock} • ${untilStart <= 0 ? "NOW" : formatCountdown(untilStart)}`;
      }
    }
    for (const instance of this.actions) {
      if ("setFeedback" in instance) {
        await instance.setFeedback({ title, value });
      }
    }
  }
}
