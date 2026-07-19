import streamDeck from "@elgato/streamdeck";

import { AgendaDial } from "./actions/agenda-dial";
import { NextMeetingKey } from "./actions/next-meeting-key";
import { buildProviders } from "./calendar/factory";
import { connectPiBridge } from "./core/pi-bridge";
import { NextMeetingService } from "./core/service";
import { isProUser } from "./tier";

const service = new NextMeetingService(buildProviders);

streamDeck.actions.registerAction(new NextMeetingKey(service));
if (isProUser()) {
  streamDeck.actions.registerAction(new AgendaDial(service));
}
connectPiBridge(service);

await streamDeck.connect();
await service.start();
