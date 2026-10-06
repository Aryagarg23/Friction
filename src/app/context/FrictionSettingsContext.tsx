/**
 * FRICTION SETTINGS CONTEXT
 *
 * The toggles in Settings > Friction. They live here instead of in the
 * Settings window's own state, because that state is destroyed whenever the
 * window closes and nothing outside the window could read it.
 *
 * Not wired to anything yet: frictionSensitivity and recoveryDuration.
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

export interface FrictionSettings {
  frictionEnabled: boolean;
  frictionOverlay: boolean;
  digitalMoss: boolean;
  tactileStrike: boolean;
  progressiveVignette: boolean;
  breathingVisualizer: boolean;
  taperAmbient: boolean;
  /** Fatigue percent (80-100) above which the hard intercept starts. */
  interceptThreshold: number;
}

export const DEFAULT_FRICTION_SETTINGS: FrictionSettings = {
  frictionEnabled: true,
  frictionOverlay: true,
  digitalMoss: true,
  tactileStrike: true,
  progressiveVignette: true,
  breathingVisualizer: true,
  taperAmbient: true,
  interceptThreshold: 95,
};

interface FrictionSettingsValue extends FrictionSettings {
  update: <K extends keyof FrictionSettings>(key: K, value: FrictionSettings[K]) => void;
  /** interceptThreshold as a 0-1 fatigue fraction. */
  interceptFatigue: number;
}

const FrictionSettingsContext = createContext<FrictionSettingsValue | null>(null);

export function FrictionSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<FrictionSettings>(DEFAULT_FRICTION_SETTINGS);

  const update = useCallback(<K extends keyof FrictionSettings>(key: K, value: FrictionSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const value = useMemo<FrictionSettingsValue>(
    () => ({ ...settings, update, interceptFatigue: settings.interceptThreshold / 100 }),
    [settings, update],
  );

  return <FrictionSettingsContext.Provider value={value}>{children}</FrictionSettingsContext.Provider>;
}

const FALLBACK: FrictionSettingsValue = {
  ...DEFAULT_FRICTION_SETTINGS,
  update: () => {},
  interceptFatigue: DEFAULT_FRICTION_SETTINGS.interceptThreshold / 100,
};

export function useFrictionSettings(): FrictionSettingsValue {
  return useContext(FrictionSettingsContext) ?? FALLBACK;
}
