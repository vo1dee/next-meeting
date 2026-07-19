import type { KeyFace } from "../core/keyface-state";

/**
 * Render a KeyFace as an SVG data URI for setImage(). SVG keeps the plugin
 * dependency-free — there is no DOM canvas in the Stream Deck Node runtime.
 */
export function renderKeyFace(face: KeyFace): string {
  throw new Error("TODO(T2)");
}
