# Next Meeting

A Stream Deck plugin giving WFH professionals a glance-and-one-tap-join view of their calendar: the key face shows time until the Next Meeting; pressing it joins.

## Language

**Candidate Event**:
A calendar event eligible to become the Next Meeting: timed (never all-day), not cancelled, not declined by the user, not marked Free, and not yet ended. Tentative and unanswered invitations qualify; events without a Join Link qualify.
_Avoid_: upcoming event, valid event

**Next Meeting**:
The earliest-starting Candidate Event before the end of the local calendar day, except that an event already underway remains eligible only during its Grace Window.
_Avoid_: current meeting, active event

**Clear**:
The state when no Candidate Event remains before the end of the local calendar day. The glance answer to "am I done for today?"
_Avoid_: no meetings, empty

**Grace Window**:
The short period (~15 minutes) after an event starts during which it still counts as the Next Meeting; afterwards it is treated as missed or already joined and the key rolls forward.

**Agenda**:
Today's Candidate Events that have not yet ended, in start order — what the dial scrolls through. Uses the same eligibility rules as the Next Meeting, so key and dial never disagree.
_Avoid_: schedule, event list

**Join Link**:
The video-conferencing URL detected in an event's fields (Zoom, Google Meet, Microsoft Teams, Webex). A press joins it; without one, a press opens the event's details page.
_Avoid_: meeting URL, conference link
