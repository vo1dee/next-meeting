/** A connected calendar account (display reference; tokens live in the TokenStore). */
export type AccountRef = {
  id: string;
  provider: "google" | "microsoft";
  /** Display label, e.g. the account's email address. */
  label: string;
};

/** Plugin-global settings — every key/dial instance shares these (agreed in grilling). */
export type GlobalSettings = {
  /** Calendar poll interval in minutes (PI slider 1–15). */
  refreshMinutes: number;
  /** Pre-meeting alert: flash the face from T−2m. */
  preMeetingFlash: boolean;
  /** Connected accounts; the free SKU allows exactly one. */
  accounts: AccountRef[];
};

export const DEFAULT_SETTINGS: GlobalSettings = {
  refreshMinutes: 5,
  preMeetingFlash: true,
  accounts: [],
};

export function withDefaults(partial: Partial<GlobalSettings> | undefined): GlobalSettings {
  return { ...DEFAULT_SETTINGS, ...partial };
}
