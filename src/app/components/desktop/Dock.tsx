/**
 * TASKBAR
 *
 * One plain taskbar at the bottom: start + search on the left, pinned and
 * running apps in the middle, tray and clock on the right.
 * Friction lives only in the tray, not as a launchable app.
 * The app glyphs are emoji so the fake desktop still reads as a real one.
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

const TRAY_ICON = { color: "var(--pi-ink-60)" };
const HOVER = "hover:bg-[var(--pi-ink-08)]";
const HOVER_TRANSITION = { transition: "background-color var(--pi-ease-hover)" };

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
    <div
      className="text-right"
      style={{
        fontSize: "0.7rem",
        color: "var(--pi-ink)",
        lineHeight: "1.3",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <div>{h12}:{m} {ampm}</div>
      <div style={{ color: "var(--pi-ink-60)" }}>{dateStr}</div>
    </div>
  );
}

export function Dock() {
  const { openWindow, isAppOpen, focusAppWindow } = useWindowManager();

  const handleAppClick = (app: AppDef) => {
    if (isAppOpen(app.id)) {
      focusAppWindow(app.id);
    } else {
      openWindow(app.id, app.name, app.size);
    }
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center"
      style={{
        height: "48px",
        zIndex: 5000,
        backgroundColor: "var(--pi-surface)",
        borderTop: "1px solid var(--pi-hairline)",
        fontFamily: "var(--pi-font)",
      }}
    >
      {/* Start + search */}
      <div className="flex items-center h-full gap-1 px-2 shrink-0">
        <button
          aria-label="Start"
          className={`flex items-center justify-center h-9 w-9 cursor-pointer ${HOVER}`}
          style={HOVER_TRANSITION}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ color: "var(--pi-ink)" }}>
            <rect x="0" y="0" width="7" height="7" />
            <rect x="9" y="0" width="7" height="7" />
            <rect x="0" y="9" width="7" height="7" />
            <rect x="9" y="9" width="7" height="7" />
          </svg>
        </button>
        <div
          className="flex items-center gap-2 px-3 h-8"
          style={{
            backgroundColor: "var(--pi-ground)",
            border: "1px solid var(--pi-hairline)",
            width: "200px",
          }}
        >
          <Search size={13} style={{ color: "var(--pi-ink-45)" }} />
          <span style={{ fontSize: "0.72rem", color: "var(--pi-ink-45)" }}>Search</span>
        </div>
      </div>

      {/* Pinned + running apps */}
      <div className="flex-1 flex items-center justify-center gap-0.5 h-full px-1">
        {APPS.map(app => (
          <TaskbarApp
            key={app.id}
            app={app}
            isRunning={isAppOpen(app.id)}
            onClick={() => handleAppClick(app)}
          />
        ))}
      </div>

      {/* Tray */}
      <div className="flex items-center gap-2 h-full px-3 shrink-0">
        <button aria-label="Show hidden icons" className={`p-1 cursor-pointer ${HOVER}`} style={HOVER_TRANSITION}>
          <ChevronUp size={13} style={TRAY_ICON} />
        </button>
        <FrictionTrayIcon />
        <Wifi size={14} style={TRAY_ICON} />
        <Volume2 size={14} style={TRAY_ICON} />
        <BatteryFull size={14} style={TRAY_ICON} />
        <div style={{ width: "1px", height: "20px", backgroundColor: "var(--pi-hairline)" }} />
        <Clock />
      </div>
    </div>
  );
}

interface TaskbarAppProps {
  app: AppDef;
  isRunning: boolean;
  onClick: () => void;
}

function TaskbarApp({ app, isRunning, onClick }: TaskbarAppProps) {
  return (
    <button
      onClick={onClick}
      title={app.name}
      aria-label={app.name}
      className={`relative flex items-center justify-center cursor-pointer ${HOVER}`}
      style={{ width: "40px", height: "40px", ...HOVER_TRANSITION }}
    >
      <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{app.icon}</span>

      {/* Running indicator */}
      {isRunning && (
        <span
          className="absolute bottom-0.5"
          style={{ width: "14px", height: "2px", backgroundColor: "var(--pi-ink)" }}
        />
      )}
    </button>
  );
}

/**
 * FRICTION TRAY ICON
 *
 * A small diamond in the tray. Drop text on it to add a task to the inbox.
 * Hover explains that, since nothing else on screen does.
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
      className="relative"
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
          backgroundColor: filled ? "var(--pi-ink-08)" : "transparent",
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
