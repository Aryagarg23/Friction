/**
 * TASKBAR
 *
 * Windows 11 taskbar: 48px acrylic bar, centered group of start, search and
 * pinned/running apps; system tray and two-line clock on the right.
 * Friction lives only in the tray (the diamond drop target), not as an app,
 * and is the one piece styled in Friction's own --pi-* identity.
 * Colors come from the --w11-* tokens DesktopOS defines on .w11-root.
 */

import { useState, useEffect, useCallback } from "react";
import { useWindowManager } from "../../context/WindowManagerContext";
import { useSession } from "../../context/SessionContext";
import { Search, Wifi, Volume2, BatteryFull, ChevronUp } from "lucide-react";

interface AppDef {
  id: string;
  name: string;
  icon: string;
  size?: { width: number; height: number };
}

const APPS: AppDef[] = [
  { id: "vscode", name: "VS Code", icon: "⌨️", size: { width: 1000, height: 700 } },
  { id: "chrome", name: "Chrome", icon: "🌐", size: { width: 1000, height: 700 } },
  { id: "mail", name: "Mail", icon: "✉️", size: { width: 900, height: 650 } },
  { id: "slack", name: "Slack", icon: "💬", size: { width: 900, height: 650 } },
  { id: "calendar", name: "Calendar", icon: "📅", size: { width: 800, height: 600 } },
  { id: "spotify", name: "Spotify", icon: "🎵", size: { width: 950, height: 650 } },
  { id: "terminal", name: "Terminal", icon: "▶️", size: { width: 800, height: 500 } },
  { id: "notes", name: "Notes", icon: "📝", size: { width: 900, height: 620 } },
  { id: "finder", name: "Finder", icon: "📁", size: { width: 900, height: 600 } },
  { id: "calculator", name: "Calculator", icon: "🔢", size: { width: 480, height: 580 } },
  { id: "settings", name: "Settings", icon: "⚙️", size: { width: 950, height: 650 } },
];

const TRAY_ICON = { color: "var(--w11-text)" };

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);
  const h = time.getHours();
  const m = time.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const dateStr = time.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
  return (
    <button
      className="w11-tb-btn flex flex-col items-end justify-center h-10 px-2 cursor-default"
      style={{
        fontSize: "12px",
        color: "var(--w11-text)",
        lineHeight: "16px",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span>{h12}:{m} {ampm}</span>
      <span>{dateStr}</span>
    </button>
  );
}

/** Windows 11 start glyph: four blue squares, lighter at the top-left. */
function StartGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <defs>
        <linearGradient id="w11-start" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4cc2ff" />
          <stop offset="1" stopColor="#0078d4" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="8.5" height="8.5" rx="0.6" fill="url(#w11-start)" />
      <rect x="10.5" y="1" width="8.5" height="8.5" rx="0.6" fill="url(#w11-start)" />
      <rect x="1" y="10.5" width="8.5" height="8.5" rx="0.6" fill="url(#w11-start)" />
      <rect x="10.5" y="10.5" width="8.5" height="8.5" rx="0.6" fill="url(#w11-start)" />
    </svg>
  );
}

export function Dock() {
  const { windows, focusedWindowId, openWindow, isAppOpen, focusAppWindow, minimizeWindow } = useWindowManager();
  const focusedAppId = windows.find(w => w.id === focusedWindowId)?.appId ?? null;

  const handleAppClick = (app: AppDef) => {
    // Like Windows: clicking the active app's taskbar button minimizes it.
    if (focusedAppId === app.id && focusedWindowId) {
      minimizeWindow(focusedWindowId);
    } else if (isAppOpen(app.id)) {
      focusAppWindow(app.id);
    } else {
      openWindow(app.id, app.name, app.size);
    }
  };

  return (
    <div
      className="w11-font absolute bottom-0 left-0 right-0 flex items-center select-none"
      style={{
        height: "48px",
        zIndex: 5000,
        backgroundColor: "var(--w11-taskbar)",
        backdropFilter: "blur(30px) saturate(1.5)",
        WebkitBackdropFilter: "blur(30px) saturate(1.5)",
        borderTop: "1px solid var(--w11-taskbar-border)",
        color: "var(--w11-text)",
      }}
    >
      {/* Left balance so the app group sits in the true center */}
      <div className="flex-1 min-w-0" />

      {/* Centered group: start, search, pinned + running apps */}
      <div className="flex items-center h-full gap-1 shrink-0">
        <button
          aria-label="Start"
          title="Start"
          className="w11-tb-btn flex items-center justify-center cursor-default"
          style={{ width: "40px", height: "40px" }}
        >
          <StartGlyph />
        </button>
        <div
          className="flex items-center gap-2 mx-1"
          style={{
            height: "32px",
            width: "180px",
            padding: "0 12px",
            borderRadius: "999px",
            backgroundColor: "var(--w11-search)",
            border: "1px solid var(--w11-search-border)",
          }}
        >
          <Search size={15} strokeWidth={1.75} style={{ color: "var(--w11-text)", transform: "scaleX(-1)" }} />
          <span style={{ fontSize: "13px", color: "var(--w11-text-2)" }}>Search</span>
        </div>
        {APPS.map(app => (
          <TaskbarApp
            key={app.id}
            app={app}
            isRunning={isAppOpen(app.id)}
            isFocused={focusedAppId === app.id}
            onClick={() => handleAppClick(app)}
          />
        ))}
      </div>

      {/* System tray */}
      <div className="flex-1 flex items-center justify-end h-full gap-1 pr-2">
        <button
          aria-label="Show hidden icons"
          className="w11-tb-btn flex items-center justify-center cursor-default"
          style={{ width: "24px", height: "40px" }}
        >
          <ChevronUp size={14} strokeWidth={1.75} style={TRAY_ICON} />
        </button>
        <FrictionTrayIcon />
        <button
          aria-label="Network, volume, battery"
          className="w11-tb-btn flex items-center gap-2.5 h-10 px-2 cursor-default"
        >
          <Wifi size={15} strokeWidth={1.75} style={TRAY_ICON} />
          <Volume2 size={15} strokeWidth={1.75} style={TRAY_ICON} />
          <BatteryFull size={15} strokeWidth={1.75} style={TRAY_ICON} />
        </button>
        <Clock />
      </div>
    </div>
  );
}

interface TaskbarAppProps {
  app: AppDef;
  isRunning: boolean;
  isFocused: boolean;
  onClick: () => void;
}

function TaskbarApp({ app, isRunning, isFocused, onClick }: TaskbarAppProps) {
  return (
    <button
      onClick={onClick}
      title={app.name}
      aria-label={app.name}
      data-active={isFocused}
      className="w11-tb-btn relative flex items-center justify-center cursor-default"
      style={{ width: "40px", height: "40px" }}
    >
      <span style={{ fontSize: "22px", lineHeight: 1 }}>{app.icon}</span>

      {/* Running indicator: wide blue pill for the focused window, short gray dash otherwise */}
      {isRunning && (
        <span
          className="absolute"
          style={{
            bottom: "1px",
            left: "50%",
            transform: "translateX(-50%)",
            width: isFocused ? "16px" : "6px",
            height: "3px",
            borderRadius: "999px",
            backgroundColor: isFocused ? "var(--w11-blue)" : "var(--w11-pill-idle)",
            transition: "width 167ms cubic-bezier(0.1, 0.9, 0.2, 1), background-color 167ms linear",
          }}
        />
      )}
    </button>
  );
}

/**
 * FRICTION TRAY ICON
 *
 * A small diamond in the tray. Drop text on it to add a task to the inbox.
 * Hover explains that, since nothing else on screen does. This is Friction,
 * not Windows, so it keeps the --pi-* ink/paper identity and var(--pi-font).
 */
function FrictionTrayIcon() {
  const { sessionState, addGeneralTask } = useSession();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const isActive = sessionState === "active";

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const text = e.dataTransfer.getData("text/plain")?.trim();
    if (text) {
      addGeneralTask({
        id: `task-drop-${Date.now()}`,
        title: text.slice(0, 80),
        cognitiveWeight: 0.5,
        completed: false,
        category: "moderate",
        estimatedMinutes: 30,
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
    }
  }, [addGeneralTask]);

  const message = isDragOver
    ? "Drop to add a task"
    : justAdded
      ? "Added to inbox"
      : showTooltip
        ? "Friction. Drag text here to add a task."
        : null;

  const filled = isDragOver || justAdded;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ fontFamily: "var(--pi-font)", width: "28px", height: "40px" }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => { setShowTooltip(false); setIsDragOver(false); }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="flex items-center justify-center cursor-pointer"
        style={{
          width: "22px",
          height: "22px",
          backgroundColor: filled ? "var(--pi-surface)" : "transparent",
          outline: isDragOver ? "1px solid var(--pi-ink)" : "none",
          transition: "background-color var(--pi-ease-hover)",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 0.5L11 6L6 11.5L1 6L6 0.5Z"
            fill={isActive || filled ? "var(--pi-ink)" : "transparent"}
            stroke={isActive || filled ? "var(--pi-ink)" : "var(--pi-ink-45)"}
            strokeWidth="1"
          />
        </svg>
      </div>

      {message && (
        <div
          className="absolute bottom-full right-0 mb-3 pointer-events-none whitespace-nowrap"
          style={{
            zIndex: 9100,
            padding: "6px 10px",
            backgroundColor: "var(--pi-surface)",
            border: "1px solid var(--pi-hairline)",
            color: "var(--pi-ink)",
            fontFamily: "var(--pi-font)",
            fontSize: "0.7rem",
            fontWeight: 400,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
