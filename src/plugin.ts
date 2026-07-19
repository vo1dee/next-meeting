import streamDeck from "@elgato/streamdeck";

import { AgendaDial } from "./actions/agenda-dial";
import { NextMeetingKey } from "./actions/next-meeting-key";
import { MockCalendarProvider } from "./calendar/mock-provider";
import { connectPiBridge } from "./core/pi-bridge";
import { NextMeetingService } from "./core/service";
import { isProUser } from "./tier";

// TODO(T4): swap the mock for real Google/Microsoft providers behind auth.
const service = new NextMeetingService(new MockCalendarProvider());

streamDeck.actions.registerAction(new NextMeetingKey(service));
if (isProUser()) {
  streamDeck.actions.registerAction(new AgendaDial());
}

connectPiBridge();

await streamDeck.connect();
await service.start();
