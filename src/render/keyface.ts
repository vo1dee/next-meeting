import type { CalendarEvent } from "../calendar/provider";
import type { KeyFace } from "../core/keyface-state";

const SIZE = 144;

type Style = { bg: string; fg: string };

const STYLES: Record<string, Style> = {
  later: { bg: "#1f7d3a", fg: "#ffffff" },
  soon: { bg: "#e8a013", fg: "#161a22" },
  imminent: { bg: "#c22f2f", fg: "#ffffff" },
  /** Bright alternate frame while flashing. */
  flash: { bg: "#ff5a4f", fg: "#161a22" },
  clear: { bg: "#161a22", fg: "#525a68" },
  auth: { bg: "#2e3340", fg: "#c8cede" },
};

function fontSize(text: string): number {
  if (text.length <= 2) return 58;
  if (text.length === 3) return 50;
  return 42;
}

/**
 * Calendar+clock glyph for the auth/clear placeholders, cut out of the
 * plugin's static default-state art (imgs/actions/key/state@2x.png) so the
 * live key face matches what's shown before the plugin finishes booting.
 * Transparent background — composites onto either style's bg.
 */
const ICON_CALENDAR =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADsAAAA/CAYAAABetLClAAAFkUlEQVR42u2aa4hVVRTHf2d35uZYJI2i9sKeSkIzPQijopL6PhHZl6yIIguMhooeSKUFRTFhRTVQ0FuJILAv9UGQlCiamTInyB6gFpEaPTTECbN7+3DXHc7s2Weftc/j3sn6w2Wzz7337L3WOmut/1pnR/2DjW6gDhgZW7DnAA0gcsyLjC5Usk5SIFuwumMTkWNub9w1940EruNb17uO8WhWO/o24tp43vUixbpemAzNpmkyKsmCtHMdE6Bh30aqsKB2ncizzqS5yfDBKizYUFhS4/t41nX6vOmABSPFei7FFH5iTBt8cNr4vKnCN3L6YuXrmBJ841rgG2ALsDhnPhwC9sio9kHFOpPmRumTPs0+ApwKLAGuz5EPFwK3AD0yLizB950KMUof8Wn25MT1s3L44GJrfnbJzGlijHNw0plAH1BzKKIHuBw9Gg5h83JhW0E29TVR/2CjpthQBPQCTwFLqRYHgPXAQ8DvCkHUMErfuAkYaYOgAMcCtwHbgdMLcu5JRY5R5Kn5wFrajx7gpYL51yTLVQ2DugE4hs7gMonyZJSfdcVojCI/9dJZ9CkKGJNoQNjzCYGNIj+d2GFhj1da0KTMJxRgCvpEu2FcvugZJykkVvSE7pXISMaNtaOvx+XK9xeVtW6ssOQhYFxJPErJhxb+DrVgykicodkGsDolSLQLLwCbczw5UxAr6sMeYEEHha2FWrAIg5oOqDuCk69p6JQjVlQV9k3uAL6V+UxgDXABsBu4E/hNvpsLPA/MAYbFHf6Ue5ybg5WF9renyBUHduyHgVes63Pl2jvAe5YllgIrgCeAjYnrW4DbgUUFLR5UHWl6UEnMd1zvkXG249GalxjtYDK7hMc7qNcV0oMiB0dNo3T1HBZsaw8K4ATpRiTLsRZRP0eslbRci1cvAboSiugLtGwpPSgNg7LTwFcewv5zync3y0eDg8BOYJcEwk8p6S2ehkG1AweA94F1wAfCmjRBKKQHNYVU1K28ZfvWX5I2vpbfzZBIvAzYBlwF7JP/zQM+km6Dz4pDwJPAr4ke1xnAacCZcq8fgR3A1pw9qAYQxYo6MYmfEoLWZbOfiLBfJnIswF5gLEPYtdJriiQePAYsT/i3jT+ADVKc/BLY354QJoSCmQxGo42uK0TQGvA08J34dZfnf8cBN0rcuE4RvSeNmrrQ1lCaIo5SRNEWngNeFna1CRgAugOUNQd4G3gjpWXkjNKxok5N4hTgVomSkWxwmXx3BdAv7c8Ws7rEsZGNwN1i0XXAxR6hBoS0PJzy/XLgaLFyZlSO+gcbJqOw3gxcWlLUPSh5eg/wojzKafgCOB+YlVBgGtYI9/bW2cbTrKoCb4qgC2i+1/HhJBn3K+47IAHO++7HKILSxyUK+6psYJWnls6DWcBdacypNRpFXfhuSRvaL1VTV8LPQzmxD1en5NnIJWBaXTgKPFuCsFtlvFJSSB5O7MMi+aTmXe05qPuE5RShlLsSm6ICyyLsrlAPqgEcBh6UR7pXgkcomfhQxu4AQVvrG0twQ/ON4j3Wf7o1wmqrh1Hgs1BOas3HA4jDjEQrxzbEIcd/xrOEDa4LQzmpNd+tFNZIXg7B3qwbBp9NCPA11zhWUQ5vAJ9nCZu7PsyIomkK2w58X4GwY1IVqSwbpTSx8lrQ98S8VoGwQxq/qPIsYprgz0iRXxZ20HxLj8ayVVkwTSH7SiIqLTyK8ghup84iri5J4PuB17XhXWtBbX82hOoNAI8XiL4PCLkgj7B5fVCbd11YRfMY4GiAoD8A1wiFJVTYoj5YFOuBC2mezBmWLqYLI8BK6T5uCF0kLtEHy8Bb8omB80QBNWmlbpOmXG6EcuOqjhLYOCxWHCnzpqYNPjlt4DsHdcTB8O84/1SasP8Z/C/skYp/ABvwB8LF86oZAAAAAElFTkSuQmCC";

const TITLE_FONT_SIZE = 21;
const TITLE_BASELINE_Y = 31;
const TITLE_LINE_HEIGHT = 24;
const TITLE_MAX_CHARS_PER_LINE = 10;
const TITLE_MAX_LINES = 2;

/** Greedy word-wrap into at most `maxLines`; anything left over is packed
 * onto the last line and ellipsized if it still doesn't fit. */
function wrapTitle(title: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = title.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || candidate.length <= maxCharsPerLine) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  if (lines.length > maxLines) {
    const overflow = lines.slice(maxLines - 1).join(" ");
    lines.length = maxLines - 1;
    lines.push(overflow);
  }
  const lastIndex = lines.length - 1;
  if (lines[lastIndex] && lines[lastIndex].length > maxCharsPerLine) {
    lines[lastIndex] = `${lines[lastIndex].slice(0, maxCharsPerLine - 1)}…`;
  }
  return lines;
}

function titleMarkup(title: string, fg: string): string {
  return wrapTitle(title, TITLE_MAX_CHARS_PER_LINE, TITLE_MAX_LINES)
    .map(
      (line, i) =>
        `<text x="8" y="${TITLE_BASELINE_Y + i * TITLE_LINE_HEIGHT}" ` +
        `font-family="-apple-system, 'Segoe UI', sans-serif" font-weight="600" ` +
        `font-size="${TITLE_FONT_SIZE}" fill="${fg}" opacity="0.95">${line}</text>`,
    )
    .join("");
}

/**
 * Icon + two centered lines — used for the Auth and Clear placeholders, so
 * both read as a clear instruction/status rather than a bare word or dash,
 * and match the calendar icon shown before the plugin finishes booting.
 * Text colour is fixed (not style.fg) since STYLES.clear's fg is
 * deliberately too dim to double as body copy here.
 */
function svgPlaceholder(style: Style, line1: string, line2: string, stale: boolean): string {
  const markup =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<rect width="${SIZE}" height="${SIZE}" fill="${style.bg}"/>` +
    `<image x="42.5" y="12" width="59" height="63" href="${ICON_CALENDAR}"/>` +
    `<text x="50%" y="92" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="-apple-system, 'Segoe UI', sans-serif" font-weight="700" ` +
    `font-size="17" fill="#e8edf7">${line1}</text>` +
    `<text x="50%" y="112" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="-apple-system, 'Segoe UI', sans-serif" font-weight="600" ` +
    `font-size="14" fill="#94a1b7">${line2}</text>` +
    (stale ? `<circle cx="${SIZE - 16}" cy="16" r="7" fill="#9aa1ad" opacity="0.8"/>` : "") +
    `</svg>`;
  return `data:image/svg+xml;charset=utf8,${encodeURIComponent(markup)}`;
}

function svgWithMetadata(style: Style, text: string, title: string, stale: boolean): string {
  const markup =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<rect width="${SIZE}" height="${SIZE}" fill="${style.bg}"/>` +
    titleMarkup(title, style.fg) +
    `<text x="130" y="125" text-anchor="end" dominant-baseline="middle" ` +
    `font-family="-apple-system, 'Segoe UI', sans-serif" font-weight="700" ` +
    `font-size="${fontSize(text)}" fill="${style.fg}">${text}</text>` +
    (stale ? `<circle cx="${SIZE - 16}" cy="16" r="7" fill="#9aa1ad" opacity="0.8"/>` : "") +
    `</svg>`;
  return `data:image/svg+xml;charset=utf8,${encodeURIComponent(markup)}`;
}

const AGENDA_STYLE: Style = STYLES.later;
const AGENDA_LABEL_Y = 14;
const AGENDA_MAX_ROWS = 2;
/** Vertical space allotted per entry (time line + title line). */
const AGENDA_ROW_HEIGHT = 60;
const AGENDA_TIME_Y = 36;
const AGENDA_TITLE_Y = 56;
const AGENDA_TIME_FONT_SIZE = 12;
const AGENDA_TITLE_FONT_SIZE = 17;
const AGENDA_TITLE_MAX_CHARS = 13;

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength - 1) + "…" : text;
}

function agendaRowsMarkup(entries: CalendarEvent[], fg: string): string {
  if (entries.length === 0) {
    return (
      `<text x="72" y="76" text-anchor="middle" font-family="-apple-system, 'Segoe UI', sans-serif" ` +
      `font-size="14" fill="${fg}" opacity="0.8">No more meetings</text>`
    );
  }
  return entries
    .slice(0, AGENDA_MAX_ROWS)
    .map((entry, i) => {
      const clock = entry.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const title = truncate(entry.title, AGENDA_TITLE_MAX_CHARS);
      const y = i * AGENDA_ROW_HEIGHT;
      return (
        `<text x="8" y="${AGENDA_TIME_Y + y}" font-family="-apple-system, 'Segoe UI', sans-serif" ` +
        `font-weight="600" font-size="${AGENDA_TIME_FONT_SIZE}" fill="${fg}" opacity="0.7">${clock}</text>` +
        `<text x="8" y="${AGENDA_TITLE_Y + y}" font-family="-apple-system, 'Segoe UI', sans-serif" ` +
        `font-weight="700" font-size="${AGENDA_TITLE_FONT_SIZE}" fill="${fg}">${title}</text>`
      );
    })
    .join("");
}

/** Pro key's agenda view — today's next two Candidate Events, toggled in by the other press gesture. */
export function renderAgendaFace(entries: CalendarEvent[], stale: boolean): string {
  const markup =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<rect width="${SIZE}" height="${SIZE}" fill="${AGENDA_STYLE.bg}"/>` +
    `<text x="8" y="${AGENDA_LABEL_Y}" font-family="-apple-system, 'Segoe UI', sans-serif" ` +
    `font-weight="700" font-size="10" letter-spacing="1" fill="${AGENDA_STYLE.fg}" opacity="0.7">AGENDA</text>` +
    agendaRowsMarkup(entries, AGENDA_STYLE.fg) +
    (stale ? `<circle cx="${SIZE - 16}" cy="16" r="7" fill="#9aa1ad" opacity="0.8"/>` : "") +
    `</svg>`;
  return `data:image/svg+xml;charset=utf8,${encodeURIComponent(markup)}`;
}

/**
 * Render a KeyFace as an SVG data URI for setImage(). Flashing is the
 * caller's clock: it alternates `flashPhase` at 1 Hz and re-renders; the
 * bright frame is used when the face flashes and the phase is on. `stale`
 * adds a small grey dot (calendar data older than the stale threshold).
 */
export function renderKeyFace(face: KeyFace, flashPhase = false, stale = false): string {
  switch (face.kind) {
    case "countdown": {
      const style = face.flash && flashPhase ? STYLES.flash : STYLES[face.urgency];
      return svgWithMetadata(style, face.text, face.title, stale);
    }
    case "now":
      return svgWithMetadata(face.flash && flashPhase ? STYLES.flash : STYLES.imminent, "NOW", face.title, stale);
    case "clear":
      return svgPlaceholder(STYLES.clear, "No upcoming", "meeting", stale);
    case "auth":
      return svgPlaceholder(STYLES.auth, "Connect", "calendar", false);
  }
}
