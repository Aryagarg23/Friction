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

const APP_ICONS: Record<string, string> = Object.fromEntries(
  DESKTOP_ICONS.map(icon => [icon.appId, icon.icon]),
);

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

/**
 * WINDOWS 11 CHROME
 *
 * The fake laptop is meant to read as an ordinary Windows 11 machine, separate
 * from Friction's cream/ink identity. These tokens and classes are scoped to
 * .w11-root and used by the wallpaper, icons, Window and Dock (taskbar).
 * Friction overlays rendered inside DesktopOS keep --pi-* and var(--pi-font).
 * Dark mode mirrors identity.css: prefers-color-scheme unless data-theme forces one.
 */
const W11_DARK_TOKENS = `
  --w11-wall-base: #06102a;
  --w11-wall-glow: radial-gradient(ellipse 70% 60% at 58% 58%, rgba(40, 110, 255, 0.45) 0%, rgba(12, 40, 120, 0.25) 45%, rgba(6, 16, 42, 0) 75%), linear-gradient(160deg, #0a1736 0%, #050c22 100%);
  --w11-petal-a: rgba(12, 60, 190, 0.85);
  --w11-petal-b: rgba(70, 140, 255, 0.75);
  --w11-petal-edge: rgba(140, 190, 255, 0.35);
  --w11-taskbar: rgba(32, 32, 32, 0.85);
  --w11-taskbar-border: rgba(255, 255, 255, 0.08);
  --w11-text: #ffffff;
  --w11-text-2: rgba(255, 255, 255, 0.72);
  --w11-text-off: rgba(255, 255, 255, 0.45);
  --w11-hover: rgba(255, 255, 255, 0.08);
  --w11-press: rgba(255, 255, 255, 0.05);
  --w11-active: rgba(255, 255, 255, 0.06);
  --w11-search: rgba(255, 255, 255, 0.06);
  --w11-search-border: rgba(255, 255, 255, 0.08);
  --w11-pill-idle: rgba(255, 255, 255, 0.55);
  --w11-titlebar: #202020;
  --w11-content: #2b2b2b;
  --w11-frame: rgba(255, 255, 255, 0.08);
  --w11-cap-hover: rgba(255, 255, 255, 0.08);
  --w11-cap-press: rgba(255, 255, 255, 0.04);
  color-scheme: dark;
`;

const W11_CSS = `
.w11-root {
  --w11-font: "Segoe UI Variable", "Segoe UI", system-ui, -apple-system, sans-serif;
  --w11-blue: #0078d4;
  --w11-wall-base: #c7d7f2;
  --w11-wall-glow: radial-gradient(ellipse 70% 60% at 58% 58%, rgba(255, 255, 255, 0.55) 0%, rgba(214, 228, 252, 0.3) 45%, rgba(199, 215, 242, 0) 75%), linear-gradient(160deg, #e3ecfa 0%, #b6cbee 100%);
  --w11-petal-a: rgba(10, 80, 220, 0.82);
  --w11-petal-b: rgba(140, 185, 255, 0.7);
  --w11-petal-edge: rgba(255, 255, 255, 0.45);
  --w11-taskbar: rgba(243, 243, 243, 0.85);
  --w11-taskbar-border: rgba(0, 0, 0, 0.08);
  --w11-text: #1a1a1a;
  --w11-text-2: rgba(0, 0, 0, 0.62);
  --w11-text-off: rgba(0, 0, 0, 0.42);
  --w11-hover: rgba(0, 0, 0, 0.05);
  --w11-press: rgba(0, 0, 0, 0.03);
  --w11-active: rgba(255, 255, 255, 0.7);
  --w11-search: rgba(255, 255, 255, 0.9);
  --w11-search-border: rgba(0, 0, 0, 0.06);
  --w11-pill-idle: rgba(0, 0, 0, 0.42);
  --w11-titlebar: #f3f3f3;
  --w11-content: #ffffff;
  --w11-frame: rgba(0, 0, 0, 0.12);
  --w11-cap-hover: rgba(0, 0, 0, 0.06);
  --w11-cap-press: rgba(0, 0, 0, 0.04);
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .w11-root {${W11_DARK_TOKENS}}
}
:root[data-theme="dark"] .w11-root {${W11_DARK_TOKENS}}

.w11-font { font-family: var(--w11-font); -webkit-font-smoothing: antialiased; }

.w11-icon { border: 1px solid transparent; border-radius: 4px; }
.w11-icon:hover { background-color: rgba(255, 255, 255, 0.1); }
.w11-icon[data-selected="true"] { background-color: rgba(255, 255, 255, 0.18); border-color: rgba(255, 255, 255, 0.35); }

.w11-tb-btn { border-radius: 4px; background-color: transparent; transition: background-color 83ms linear; }
.w11-tb-btn:hover { background-color: var(--w11-hover); }
.w11-tb-btn:active { background-color: var(--w11-press); }
.w11-tb-btn[data-active="true"] { background-color: var(--w11-active); }
.w11-tb-btn[data-active="true"]:hover { background-color: var(--w11-hover); }

.w11-cap { color: var(--w11-text); background-color: transparent; transition: background-color 83ms linear, color 83ms linear; }
.w11-cap:hover { background-color: var(--w11-cap-hover); }
.w11-cap:active { background-color: var(--w11-cap-press); }
.w11-cap[data-dim="true"] { color: var(--w11-text-off); }
.w11-cap[data-dim="true"]:hover { color: var(--w11-text); }
.w11-cap.w11-cap-close:hover { background-color: #c42b1c; color: #ffffff; }
.w11-cap.w11-cap-close:active { background-color: #c83c31; color: rgba(255, 255, 255, 0.8); }
`;

/** Bloom petals: [rotation deg, width %, height %, layer opacity]. Back row first. */
const BLOOM_PETALS: [number, number, number, number][] = [
  [-95, 30, 58, 0.55],
  [-52, 32, 64, 0.6],
  [-12, 32, 66, 0.6],
  [28, 32, 64, 0.6],
  [70, 30, 58, 0.55],
  [-72, 26, 52, 0.85],
  [-30, 28, 58, 0.9],
  [10, 28, 58, 0.9],
  [50, 26, 52, 0.85],
  [-10, 22, 44, 1],
];

function BloomWallpaper() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0" style={{ backgroundColor: "var(--w11-wall-base)", backgroundImage: "var(--w11-wall-glow)" }} />
      <div
        className="absolute"
        style={{
          left: "58%",
          top: "62%",
          width: "min(95vh, 110%)",
          aspectRatio: "1 / 1",
          transform: "translate(-50%, -50%)",
          filter: "blur(1.5px)",
        }}
      >
        {BLOOM_PETALS.map(([rot, w, h, op], i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: `${w}%`,
              height: `${h}%`,
              transformOrigin: "50% 100%",
              transform: `translate(-50%, -100%) rotate(${rot}deg)`,
              borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%",
              backgroundImage: "linear-gradient(to top, var(--w11-petal-a) 0%, var(--w11-petal-b) 100%)",
              boxShadow: "inset 0 0 36px var(--w11-petal-edge), 0 0 24px rgba(0, 40, 140, 0.18)",
              opacity: op,
            }}
          />
        ))}
      </div>
    </div>
  );
}

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
      className="w11-root relative w-full h-full overflow-hidden"
      style={{
        backgroundColor: "var(--w11-wall-base)",
        // Friction overlays rendered below inherit this; OS chrome sets .w11-font itself.
        fontFamily: "var(--pi-font)",
        filter: `brightness(${brightness})`,
        transition: "filter 1.5s ease",
      }}
      onClick={handleDesktopClick}
    >
      <style>{W11_CSS}</style>

      {/* Wallpaper: Windows 11 Bloom, CSS only */}
      <BloomWallpaper />

      {/* Desktop Icons */}
      <div className="w11-font absolute inset-0 p-4" style={{ paddingBottom: "56px" }}>
        {DESKTOP_ICONS.map(icon => {
          const isSelected = selectedIcon === icon.id;
          return (
            <div
              key={icon.id}
              className="w11-icon absolute flex flex-col items-center justify-start cursor-default select-none"
              data-selected={isSelected}
              style={{
                top: `${12 + icon.gridRow * 90}px`,
                left: `${12 + icon.gridCol * 90}px`,
                width: "76px",
                height: "82px",
                paddingTop: "6px",
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
                  fontSize: "2rem",
                  lineHeight: 1,
                  filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))",
                }}
              >
                {icon.icon}
              </div>
              <span
                className="text-center mt-1 px-1"
                style={{
                  fontSize: "12px",
                  color: "#ffffff",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.75), 0 0 1px rgba(0, 0, 0, 0.6)",
                  lineHeight: "16px",
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
          if (!AppComponent || win.isMinimized) return null;
          return (
            <Window
              key={win.id}
              windowId={win.id}
              title={win.title}
              icon={APP_ICONS[win.appId]}
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