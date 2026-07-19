import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";

import type { NextMeetingService } from "../core/service";
import { renderKeyFace } from "../render/keyface";

/**
 * The key face: countdown ladder + one-tap join. Press semantics (agreed):
 * Join Link → event page → day view when Clear → re-auth when Auth (T4).
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
    await streamDeck.system.openUrl(this.service.pressUrl());
    await ev.action.showOk();
    this.onJoined();
  }

  /** Post-join hook — auto-mute (deferred past v1.0) slots in here. */
  protected onJoined(): void {}

  /** Renders the current face onto every visible instance of this action. */
  private async render(): Promise<void> {
    const { face, flashPhase } = this.service.face();
    const image = renderKeyFace(face, flashPhase);
    for (const instance of this.actions) {
      await instance.setImage(image);
    }
  }
}
