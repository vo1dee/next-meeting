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

const TITLE_FONT_SIZE = 21;
const TITLE_BASELINE_Y = 21;
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

function svg(style: Style, text: string, stale: boolean): string {
  const markup =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<rect width="${SIZE}" height="${SIZE}" fill="${style.bg}"/>` +
    `<text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="-apple-system, 'Segoe UI', sans-serif" font-weight="700" ` +
    `font-size="${fontSize(text)}" fill="${style.fg}">${text}</text>` +
    (stale ? `<circle cx="${SIZE - 16}" cy="16" r="7" fill="#9aa1ad" opacity="0.8"/>` : "") +
    `</svg>`;
  return `data:image/svg+xml;charset=utf8,${encodeURIComponent(markup)}`;
}

function svgWithMetadata(style: Style, text: string, title: string, stale: boolean): string {
  const markup =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<rect width="${SIZE}" height="${SIZE}" fill="${style.bg}"/>` +
    titleMarkup(title, style.fg) +
    `<text x="130" y="95" text-anchor="end" dominant-baseline="middle" ` +
    `font-family="-apple-system, 'Segoe UI', sans-serif" font-weight="700" ` +
    `font-size="${fontSize(text)}" fill="${style.fg}">${text}</text>` +
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
      return svg(STYLES.clear, "—", stale);
    case "auth":
      return svg(STYLES.auth, "Auth", false);
  }
}
