import streamDeck from "@elgato/streamdeck";

import { connectAccount, disconnectAccount, getAccounts, maxAccounts } from "./accounts";
import type { NextMeetingService } from "./service";

type PiMessage = { event?: string; provider?: string; accountId?: string };

async function pushAccounts(): Promise<void> {
  await streamDeck.ui.current?.sendToPropertyInspector({
    event: "accounts",
    accounts: await getAccounts(),
    maxAccounts: maxAccounts(),
  });
}

/**
 * Routes property-inspector messages. Registered once at the UI-controller
 * level: the key and (in Pro) the dial share the same PI and account state.
 * Slider/toggle persistence needs no routing — sdpi-components write those
 * straight to globalSettings.
 */
export function connectPiBridge(service: NextMeetingService): void {
  streamDeck.ui.onDidAppear(() => void pushAccounts());
  streamDeck.ui.onSendToPlugin((ev) => {
    const message = (typeof ev.payload === "object" && ev.payload !== null ? ev.payload : {}) as PiMessage;
    void (async () => {
      switch (message.event) {
        case "getAccounts":
          break;
        case "connectAccount":
          if (message.provider === "google") {
            if (await connectAccount(message.provider)) await service.refreshNow();
          }
          break;
        case "disconnectAccount":
          if (message.accountId) {
            await disconnectAccount(message.accountId);
            await service.refreshNow();
          }
          break;
        default:
          return;
      }
      await pushAccounts();
    })();
  });
}
