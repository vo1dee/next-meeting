import streamDeck from "@elgato/streamdeck";

import { AgendaDial } from "./actions/agenda-dial";
import { NextMeetingKey } from "./actions/next-meeting-key";
import { isProUser } from "./tier";

streamDeck.actions.registerAction(new NextMeetingKey());
if (isProUser()) {
  streamDeck.actions.registerAction(new AgendaDial());
}

await streamDeck.connect();
