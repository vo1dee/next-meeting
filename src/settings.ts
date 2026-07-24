import type { TokenSet } from "./auth/token-store";

/** A connected calendar account (display reference; tokens live in the TokenStore). */
export type AccountRef = {
  id: string;
  provider: "google";
  /** Display label, e.g. the account's email address. */
  label: string;
};

/** Plugin-global settings — every key/dial instance shares these (agreed in grilling). */
export type GlobalSettings = {
  /** Calendar poll interval in minutes. Fixed at 1 — the PI slider is commented out. */
  refreshMinutes: number;
  /** Pre-meeting alert: flash the face from T−2m. */
  preMeetingFlash: boolean;
  /** Key gesture mapping: when true, press-and-hold joins and a quick tap
   * shows the agenda list; when false (default) it's the other way round. */
  holdToJoin: boolean;
  /** Connected calendar accounts. */
  accounts: AccountRef[];
  /** OAuth tokens keyed by account id (GlobalSettingsTokenStore backing). */
  tokens: Record<string, TokenSet>;
};

export const DEFAULT_SETTINGS: GlobalSettings = {
  refreshMinutes: 1,
  preMeetingFlash: true,
  holdToJoin: false,
  accounts: [],
  tokens: {},
};

export function withDefaults(partial: Partial<GlobalSettings> | undefined): GlobalSettings {
  return { ...DEFAULT_SETTINGS, ...partial };
}
