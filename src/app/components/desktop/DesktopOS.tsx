/**
 * DESKTOP OS
 *
 * The fake desktop a normal person uses, with Friction's effects on top:
 * - FocusIndicator: task strip at top center (pill above 0.80 focus, peek card 0.30-0.80)
 * - RefocusPopup: pick a short reset exercise when focus <= 0.30
 * - Taper: faint warm tint and grain when focus 0.40-0.70 and fatigue > 0.45
 * - TactileStrike: small "done / next" card when a task is struck
 * - DigitalMoss: ink texture after an interruption, swept away with the mouse
 * - ProgressiveVignette: edges darken from fatigue 50%
 * - Brightness dimming: continuous function of focus
 */

import { useWindowManager } from "../../context/WindowManagerContext";
import { useBiometrics } from "../../context/BiometricContext";
import { useSession } from "../../context/SessionContext";
import { useFrictionSettings } from "../../context/FrictionSettingsContext";
import { useState, useCallback } from "react";
import { Window } from "./Window";
import { Dock } from "./Dock";
import { DigitalMoss } from "./DigitalMoss";
import { TactileStrike } from "./TactileStrike";
import { ProgressiveVignette } from "./ProgressiveVignette";
import { FocusIndicator } from "./FocusIndicator";
import { RefocusPopup } from "./RefocusPopup";
import { AnimatePresence, motion } from "motion/react";
import { GRAIN_OVERLAY_STYLE } from "../friction-app/friction-styles";

// App component imports
import { VSCodeApp } from "../apps/VSCodeApp";
import { ChromeApp } from "../apps/ChromeApp";
import { MailApp } from "../apps/MailApp";
import { SlackApp } from "../apps/SlackApp";
import { CalendarApp } from "../apps/CalendarApp";
import { SpotifyApp } from "../apps/SpotifyApp";
import { TerminalApp } from "../apps/TerminalApp";
import { NotesApp } from "../apps/NotesApp";
import { FinderApp } from "../apps/FinderApp";
import { CalculatorApp } from "../apps/CalculatorApp";
import { SettingsApp } from "../apps/SettingsApp";

const APP_COMPONENTS: Record<string, React.ComponentType> = {
  vscode: VSCodeApp,
  chrome: ChromeApp,
  mail: MailApp,
  slack: SlackApp,
  calendar: CalendarApp,
  spotify: SpotifyApp,
  terminal: TerminalApp,
  notes: NotesApp,
  finder: FinderApp,
  calculator: CalculatorApp,
  settings: SettingsApp,
};

interface DesktopIcon {
  id: string;
  name: string;
  icon: string;
  appId: string;
  gridRow: number;
  gridCol: number;
}

const DESKTOP_ICONS: DesktopIcon[] = [
  { id: "d-vscode", name: "VS Code", icon: "⌨️", appId: "vscode", gridRow: 0, gridCol: 0 },
  { id: "d-chrome", name: "Chrome", icon: "🌐", appId: "chrome", gridRow: 1, gridCol: 0 },
  { id: "d-mail", name: "Mail", icon: "✉️", appId: "mail", gridRow: 2, gridCol: 0 },
  { id: "d-slack", name: "Slack", icon: "💬", appId: "slack", gridRow: 3, gridCol: 0 },
  { id: "d-calendar", name: "Calendar", icon: "📅", appId: "calendar", gridRow: 4, gridCol: 0 },
  { id: "d-spotify", name: "Spotify", icon: "🎵", appId: "spotify", gridRow: 5, gridCol: 0 },
  { id: "d-terminal", name: "Terminal", icon: "▶️", appId: "terminal", gridRow: 0, gridCol: 1 },
  { id: "d-notes", name: "Notes", icon: "📝", appId: "notes", gridRow: 1, gridCol: 1 },
  { id: "d-finder", name: "Finder", icon: "📁", appId: "finder", gridRow: 2, gridCol: 1 },
  { id: "d-calculator", name: "Calculator", icon: "🔢", appId: "calculator", gridRow: 3, gridCol: 1 },
  { id: "d-settings", name: "Settings", icon: "⚙️", appId: "settings", gridRow: 4, gridCol: 1 },
];

const APP_SIZES: Record<string, { width: number; height: number }> = {
  vscode: { width: 1000, height: 700 },
  chrome: { width: 1000, height: 700 },
  mail: { width: 900, height: 650 },
  slack: { width: 900, height: 650 },
  calendar: { width: 800, height: 600 },
  spotify: { width: 950, height: 650 },
  terminal: { width: 800, height: 500 },
  notes: { width: 900, height: 620 },
  finder: { width: 900, height: 600 },
  calculator: { width: 480, height: 580 },
  settings: { width: 950, height: 650 },
};

export function DesktopOS() {
  const { windows, focusedWindowId, openWindow, isAppOpen, focusAppWindow } = useWindowManager();
  const { current: biometrics } = useBiometrics();
  const { sessionState, tactileStrikeData, mossActive, mossKeywords, clearMoss } = useSession();
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  const handleIconDoubleClick = useCallback((icon: DesktopIcon) => {
    if (isAppOpen(icon.appId)) {
      focusAppWindow(icon.appId);
    } else {
      openWindow(icon.appId, icon.name, APP_SIZES[icon.appId]);
    }
  }, [isAppOpen, focusAppWindow, openWindow]);

  const handleDesktopClick = useCallback(() => {
    setSelectedIcon(null);
  }, []);

  const focus = biometrics.focus_percent;
  const fatigue = biometrics.fatigue_percent;
  const fx = useFrictionSettings();
  // Every Friction effect needs an active session and the master switch.
  const isActive = sessionState === "active" && fx.frictionEnabled;
  const mossShown = mossActive && fx.frictionEnabled && fx.digitalMoss;
  const interceptActive = isActive && fx.progressiveVignette && fatigue > fx.interceptFatigue;

  // ── Continuous brightness as a function of focus ──
  // High focus = full brightness (user is working, don't dim)
  // Low focus = slightly dimmed (subtle, not annoying)
  const brightness = isActive
    ? 0.85 + focus * 0.15 // range: 0.85 (low focus) to 1.0 (high focus)
    : 1.0;

  // ── Taper Ambient: warm color shift when focus 0.50-0.70 and fatigue rising ──
  const isTapering = isActive && fx.taperAmbient && focus >= 0.40 && focus <= 0.70 && fatigue > 0.45;
  const taperIntensity = isTapering
    ? Math.min(1, (fatigue - 0.45) / 0.4) * (1 - Math.abs(focus - 0.55) / 0.25)
    : 0;

  // Faint warm tint for taper state (same 0-6% strength as before, now the hot token)
  const taperWarmth = taperIntensity > 0
    ? `color-mix(in srgb, var(--pi-hot) ${(taperIntensity * 6).toFixed(2)}%, transparent)`
    : "transparent";

  // Slight grain increase during taper
  const grainOpacity = taperIntensity > 0
    ? 0.03 + taperIntensity * 0.04
    : 0;

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        backgroundColor: "var(--pi-ground)",
        fontFamily: "var(--pi-font)",
        filter: `brightness(${brightness})`,
        transition: "filter 1.5s ease",
      }}
      onClick={handleDesktopClick}
    >
      {/* Wallpaper: flat ground with faint grain */}
      <div className="absolute inset-0" style={{ backgroundColor: "var(--pi-ground)" }} />
      <div style={GRAIN_OVERLAY_STYLE} />

      {/* Desktop Icons */}
      <div className="absolute inset-0 p-4" style={{ paddingBottom: "56px" }}>
        {DESKTOP_ICONS.map(icon => {
          const isSelected = selectedIcon === icon.id;
          return (
            <div
              key={icon.id}
              className="absolute flex flex-col items-center justify-center cursor-pointer select-none"
              style={{
                top: `${12 + icon.gridRow * 90}px`,
                left: `${12 + icon.gridCol * 90}px`,
                width: "76px",
                height: "82px",
                backgroundColor: isSelected ? "var(--pi-ink-08)" : "transparent",
                border: isSelected ? "1px solid var(--pi-hairline)" : "1px solid transparent",
                transition: "background-color var(--pi-ease-hover), border-color var(--pi-ease-hover)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIcon(icon.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleIconDoubleClick(icon);
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: "42px",
                  height: "42px",
                  fontSize: "1.7rem",
                }}
              >
                {icon.icon}
              </div>
              <span
                className="text-center mt-0.5 px-1"
                style={{
                  fontSize: "0.65rem",
                  color: "var(--pi-ink)",
                  lineHeight: "1.2",
                  maxWidth: "72px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {icon.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Taper warm overlay */}
      {taperIntensity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: taperWarmth,
            transition: "background-color 2s ease",
            zIndex: 4000,
          }}
        />
      )}

      {/* Taper grain boost */}
      {grainOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: GRAIN_OVERLAY_STYLE.backgroundImage,
            backgroundSize: GRAIN_OVERLAY_STYLE.backgroundSize,
            opacity: `calc(var(--pi-grain-opacity) * ${grainOpacity.toFixed(3)})` as unknown as number,
            transition: "opacity 2s ease",
            zIndex: 4001,
          }}
        />
      )}

      {/* Windows */}
      <AnimatePresence>
        {windows.map(win => {
          const AppComponent = APP_COMPONENTS[win.appId];
          if (!AppComponent) return null;
          return (
            <Window
              key={win.id}
              windowId={win.id}
              title={win.title}
              position={win.position}
              width={win.size.width}
              height={win.size.height}
              isFullscreen={win.isFullscreen}
              isFocused={focusedWindowId === win.id}
              zIndex={win.zIndex}
            >
              <AppComponent />
            </Window>
          );
        })}
      </AnimatePresence>

      {/* OS-level Friction effects */}

      {/* Focus Indicator — pill (>0.80) morphs to peek card (0.30–0.80) */}
      {isActive && focus > 0.30 && !mossShown && (
        <FocusIndicator focus={focus} />
      )}

      {/* Refocus Popup — 3 exercise options when focus < 0.30; hidden under the hard intercept */}
      <AnimatePresence>
        {isActive && focus <= 0.30 && !interceptActive && !mossShown && (
          <RefocusPopup />
        )}
      </AnimatePresence>

      {/* Moss — ink texture after an interruption */}
      {mossShown && (
        <DigitalMoss
          keywords={mossKeywords}
          onClear={clearMoss}
        />
      )}

      {/* Tactile Strike — "done / next" card when a task is struck */}
      <AnimatePresence>
        {tactileStrikeData && fx.frictionEnabled && fx.tactileStrike && (
          <TactileStrike
            key="tactile-strike"
            completedTask={tactileStrikeData.completed}
            nextTask={tactileStrikeData.next}
          />
        )}
      </AnimatePresence>

      {/* Progressive Vignette — starts at fatigue 50%, increases to 100% */}
      <AnimatePresence>
        {isActive && fx.progressiveVignette && fatigue > 0.50 && (
          <motion.div
            key="progressive-vignette"
            className="absolute inset-0"
            style={{ zIndex: 9000, pointerEvents: "none" }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
          >
            <ProgressiveVignette intensity={Math.min(1, (fatigue - 0.50) / 0.50)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock */}
      <Dock />
    </div>
  );
}