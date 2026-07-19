import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";

import { reauthorizeAccounts } from "../core/accounts";
import type { NextMeetingService } from "../core/service";
import { renderKeyFace } from "../render/keyface";

/**
 * The key face: countdown ladder + one-tap join. Press semantics (agreed):
 * Join Link → event page → day view when Clear → re-auth when Auth.
 */
@action({ UUID: `${__PLUGIN_UUID__}.key` })
export class NextMeetingKey extends SingletonAction {
  private unsubscribe?: () => void;

  constructor(private readonly service: NextMeetingService) {
    super();
  }

  override onWillAppear(_ev: WillAppearEvent): void {
    this.unsubscribe ??= this.service.onChange(() => void this.render());
    void this.render();
  }

  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
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

  /** Post-join hook — auto-mute (deferred past v1.0) slots in here. */
  protected onJoined(): void {}

  /** Renders the current face onto every visible instance of this action. */
  private async render(): Promise<void> {
    const { face, flashPhase, stale } = this.service.face();
    const image = renderKeyFace(face, flashPhase, stale);
    for (const instance of this.actions) {
      await instance.setImage(image);
    }
  }
}
