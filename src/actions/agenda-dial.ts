import { action, DialDownEvent, DialRotateEvent, SingletonAction, TouchTapEvent } from "@elgato/streamdeck";

/**
 * Pro-only Agenda dial: rotate scrolls today's remaining Candidate Events,
 * press/touch joins the selected one, selection snaps back to the Next
 * Meeting after 30s idle. Only registered when __IS_PRO__ (the free manifest
 * has no Encoder action, so this never routes in the free SKU).
 */
@action({ UUID: `${__PLUGIN_UUID__}.dial` })
export class AgendaDial extends SingletonAction {
  override async onDialRotate(ev: DialRotateEvent): Promise<void> {
    // TODO(T5): move selection; reset 30s snap-back timer.
  }

  override async onDialDown(ev: DialDownEvent): Promise<void> {
    // TODO(T5): join selected (same press semantics as the key).
  }

  override async onTouchTap(ev: TouchTapEvent): Promise<void> {
    // TODO(T5): same as onDialDown.
  }
}
