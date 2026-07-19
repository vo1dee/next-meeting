import type { CalendarEvent } from "../calendar/provider";

/**
 * Recognized video-conferencing URLs. `[^\s"'<>]+` stops at whitespace and
 * HTML delimiters so links survive being embedded in anchor tags.
 */
const PATTERNS: RegExp[] = [
  /https:\/\/[a-z0-9.-]*zoom\.us\/(?:j|my|s|w)\/[^\s"'<>]+/i,
  /https:\/\/meet\.google\.com\/[^\s"'<>]+/i,
  /https:\/\/teams\.(?:microsoft|live)\.com\/(?:l\/meetup-join|meet)\/[^\s"'<>]+/i,
  /https:\/\/[a-z0-9.-]+\.webex\.com\/(?:meet|join)\/[^\s"'<>]+/i,
  /https:\/\/[a-z0-9.-]+\.webex\.com\/[^\s"'<>]*j\.php\?[^\s"'<>]+/i,
];

function findInText(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const haystack = text.replace(/&amp;/gi, "&");
  for (const pattern of PATTERNS) {
    const match = haystack.match(pattern);
    if (match) return match[0].replace(/[)\]}>.,;:!?'"]+$/, "");
  }
  return undefined;
}

/**
 * Resolve the Join Link for an event. Source order (agreed in grilling):
 * structured API field → location regex → description regex. Returns
 * undefined when nothing is found — the caller falls back to webLink.
 */
export function extractJoinLink(event: CalendarEvent): string | undefined {
  return event.structuredJoinLink ?? findInText(event.location) ?? findInText(event.description);
}
