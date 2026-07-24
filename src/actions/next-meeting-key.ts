import streamDeck, {
  action,
  KeyDownEvent,
  KeyUpEvent,
  SingletonAction,
  WillAppearEvent,
} from "@elgato/streamdeck";

import { reauthorizeAccounts } from "../core/accounts";
import type { NextMeetingService } from "../core/service";
import { renderAgendaFace, renderKeyFace } from "../render/keyface";

/** Held this long counts as a long press rather than a tap. */
const LONG_PRESS_MS = 450;
/** Agenda view auto-reverts to the countdown after this long (mirrors the dial's snap-back). */
const AGENDA_REVERT_MS = 10_000;

/**
 * The key face: countdown ladder + one-tap join. Press semantics (agreed):
 * Join Link → event page → day view when Clear → re-auth when Auth.
 *
 * A second gesture lets the user toggle a temporary agenda list: whichever of tap / press-and-hold isn't mapped
 * to Join toggles a temporary agenda list view (settings: holdToJoin).
 */
@action({ UUID: `${__PLUGIN_UUID__}.key` })
export class NextMeetingKey extends SingletonAction {
  private unsubscribe?: () => void;
  private longPressTimer?: ReturnType<typeof setTimeout>;
  private longPressFired = false;
  private showingAgenda = false;
  private agendaRevertTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly service: NextMeetingService) {
    super();
  }

  override onWillAppear(_ev: WillAppearEvent): void {
    this.unsubscribe ??= this.service.onChange(() => void this.render());
    void this.render();
  }

  override onKeyDown(ev: KeyDownEvent): void {
    this.longPressFired = false;
    this.longPressTimer = setTimeout(() => {
      this.longPressFired = true;
      void this.handleGesture("long", ev);
    }, LONG_PRESS_MS);
  }

  override async onKeyUp(ev: KeyUpEvent): Promise<void> {
    clearTimeout(this.longPressTimer);
    if (this.longPressFired) return; // already handled when the hold threshold fired
    await this.handleGesture("short", ev);
  }

  /** Post-join hook — auto-mute (deferred past v1.0) slots in here. */
  protected onJoined(): void {}

  private async handleGesture(gesture: "short" | "long", ev: KeyDownEvent | KeyUpEvent): Promise<void> {
    const joinGesture = this.service.holdToJoin() ? "long" : "short";
    if (gesture === joinGesture) {
      await this.join(ev);
    } else {
      this.toggleAgenda();
    }
  }

  private async join(ev: KeyDownEvent | KeyUpEvent): Promise<void> {
    const press = this.service.pressAction();
    switch (press.kind) {
      case "open":
        await streamDeck.system.openUrl(press.url);
        await ev.action.showOk();
        this.onJoined();
        break;
      case "reauth":
        if (await reauthorizeAccounts(press.accountIds)) {
          await this.service.refreshNow();
          await ev.action.showOk();
        } else {
          await ev.action.showAlert();
        }
        break;
      case "alert":
        await ev.action.showAlert();
        break;
    }
  }

  private toggleAgenda(): void {
    this.showingAgenda = !this.showingAgenda;
    clearTimeout(this.agendaRevertTimer);
    if (this.showingAgenda) {
      this.agendaRevertTimer = setTimeout(() => {
        this.showingAgenda = false;
        void this.render();
      }, AGENDA_REVERT_MS);
    }
    void this.render();
  }

  /** Renders the current face onto every visible instance of this action. */
  private async render(): Promise<void> {
    const { face, flashPhase, stale } = this.service.face();
    const image =
      this.showingAgenda ? renderAgendaFace(this.service.agenda(), stale) : renderKeyFace(face, flashPhase, stale);
    for (const instance of this.actions) {
      await instance.setImage(image);
    }
  }
}
