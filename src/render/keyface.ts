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

function svgWithMetadata(style: Style, text: string, title: string, nextTime: string, stale: boolean): string {
  const markup =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<rect width="${SIZE}" height="${SIZE}" fill="${style.bg}"/>` +
    `<text x="8" y="16" font-family="-apple-system, 'Segoe UI', sans-serif" font-weight="500" ` +
    `font-size="13" fill="${style.fg}" opacity="0.9">${title}</text>` +
    `<text x="136" y="95" text-anchor="end" dominant-baseline="middle" ` +
    `font-family="-apple-system, 'Segoe UI', sans-serif" font-weight="700" ` +
    `font-size="${fontSize(text)}" fill="${style.fg}">${text}</text>` +
    `<text x="136" y="130" text-anchor="end" font-family="-apple-system, 'Segoe UI', sans-serif" font-weight="500" ` +
    `font-size="9" fill="${style.fg}" opacity="0.8">${nextTime}</text>` +
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
      return svgWithMetadata(style, face.text, face.title, face.nextTime, stale);
    }
    case "now":
      return svgWithMetadata(face.flash && flashPhase ? STYLES.flash : STYLES.imminent, "NOW", face.title, face.nextTime, stale);
    case "clear":
      return svg(STYLES.clear, "—", stale);
    case "auth":
      return svg(STYLES.auth, "Auth", false);
  }
}
