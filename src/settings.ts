/** Plugin-global settings — every key/dial instance shares these (agreed in grilling). */
export type GlobalSettings = {
  /** Calendar poll interval in minutes (PI slider 1–15). */
  refreshMinutes: number;
  /** Pre-meeting alert: flash the face from T−2m. */
  preMeetingFlash: boolean;
};

export const DEFAULT_SETTINGS: GlobalSettings = {
  refreshMinutes: 5,
  preMeetingFlash: true,
};

export function withDefaults(partial: Partial<GlobalSettings> | undefined): GlobalSettings {
  return { ...DEFAULT_SETTINGS, ...partial };
}
