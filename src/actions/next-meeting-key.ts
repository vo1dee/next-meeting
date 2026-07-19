import { action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";

/**
 * The key face: countdown ladder + one-tap join. Press semantics (agreed):
 * Join Link → event page → day view when Clear → re-auth when Auth.
 */
@action({ UUID: `${__PLUGIN_UUID__}.key` })
export class NextMeetingKey extends SingletonAction {
  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    // TODO(T2): start the render loop (minute tick; 1 Hz only while flashing).
  }

  override async onWillDisappear(ev: WillDisappearEvent): Promise<void> {
    // TODO(T2): stop the render loop when no instances remain visible.
  }

  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    // TODO(T2): press semantics; TODO(T2): empty onJoined() hook seam
    // (auto-mute deferred past v1.0 — see grilling decision).
  }
}
