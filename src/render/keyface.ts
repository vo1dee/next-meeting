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
 * Icon + two lines, pre-rendered to a flat transparent PNG (not live SVG
 * text) for the Auth and Clear placeholders. Stream Deck's on-device image
 * renderer doesn't reproduce browser SVG text-layout metrics (baseline
 * handling, font fallback) consistently, which threw off vertical centering
 * when this was live <text> — baking it removes that dependency entirely.
 * Generated via Chromium (Playwright) at 144x144, alpha-composited onto
 * either style's bg.
 */
const PLACEHOLDER_CLEAR =
  "data:image/png;base64,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";

const PLACEHOLDER_AUTH =
  "data:image/png;base64,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";

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

/** Icon + two lines for the Auth and Clear placeholders — see PLACEHOLDER_CLEAR/AUTH. */
function svgPlaceholder(style: Style, image: string, stale: boolean): string {
  const markup =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<rect width="${SIZE}" height="${SIZE}" fill="${style.bg}"/>` +
    `<image x="0" y="0" width="${SIZE}" height="${SIZE}" href="${image}"/>` +
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
      return svgPlaceholder(STYLES.clear, PLACEHOLDER_CLEAR, stale);
    case "auth":
      return svgPlaceholder(STYLES.auth, PLACEHOLDER_AUTH, false);
  }
}
