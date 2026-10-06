/**
 * WINDOW COMPONENT
 *
 * Windows 11 style frame for the fake apps: Mica-like 32px title bar with app
 * icon and title, caption buttons (minimize, maximize/restore, close) on the
 * right. Maximize fills the desktop above the 48px taskbar. Double-click the
 * title bar to toggle maximize. Colors come from the --w11-* tokens that
 * DesktopOS defines on .w11-root.
 */

import { useState, useRef, useEffect, type ReactNode } from "react";
import { useWindowManager } from "../../context/WindowManagerContext";

interface WindowProps {
  windowId: string;
  title: string;
  /** Emoji glyph shown left of the title, like a Windows app icon. */
  icon?: string;
  children: ReactNode;
  width: number;
  height: number;
  position: { x: number; y: number };
  zIndex: number;
  isFocused: boolean;
  isFullscreen: boolean;
}

export function Window({
  windowId,
  title,
  icon,
  children,
  width,
  height,
  position,
  zIndex,
  isFocused,
  isFullscreen,
}: WindowProps) {
  const { closeWindow, minimizeWindow, toggleFullscreen, focusWindow, updateWindowPosition } = useWindowManager();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".window-controls")) return;
    if (isFullscreen) return; // Don't allow dragging in fullscreen
    
    focusWindow(windowId);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateWindowPosition(windowId, {
        x: Math.max(0, e.clientX - dragOffset.x),
        y: Math.max(0, e.clientY - dragOffset.y),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, windowId, updateWindowPosition]);

  // Double-click title bar to toggle fullscreen
  const handleTitleDoubleClick = () => {
    toggleFullscreen(windowId);
  };

  const captionClass = "w11-cap flex items-center justify-center h-full cursor-default";
  const captionStyle = { width: "46px" };
  const dim = !isFocused;

  return (
    <div
      ref={windowRef}
      className="w11-font absolute flex flex-col overflow-hidden"
      style={{
        left: isFullscreen ? 0 : position.x,
        top: isFullscreen ? 0 : position.y,
        width: isFullscreen ? "100%" : width,
        height: isFullscreen ? "calc(100% - 48px)" : height, // taskbar is 48px
        zIndex,
        backgroundColor: "var(--w11-content)",
        color: "var(--w11-text)",
        borderRadius: isFullscreen ? 0 : "8px",
        border: isFullscreen ? "none" : "1px solid var(--w11-frame)",
        boxShadow: isFullscreen
          ? "none"
          : isFocused
            ? "0 8px 32px rgba(0, 0, 0, 0.28)"
            : "0 2px 12px rgba(0, 0, 0, 0.16)",
        transition: isDragging
          ? "none"
          : "left 250ms cubic-bezier(0.1, 0.9, 0.2, 1), top 250ms cubic-bezier(0.1, 0.9, 0.2, 1), width 250ms cubic-bezier(0.1, 0.9, 0.2, 1), height 250ms cubic-bezier(0.1, 0.9, 0.2, 1), box-shadow 150ms ease",
      }}
      onMouseDown={() => focusWindow(windowId)}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between select-none shrink-0"
        style={{
          height: "32px",
          backgroundColor: "var(--w11-titlebar)",
          cursor: "default",
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleTitleDoubleClick}
      >
        <div className="flex items-center min-w-0 h-full" style={{ paddingLeft: "12px", gap: "10px" }}>
          {icon && (
            <span aria-hidden style={{ fontSize: "14px", lineHeight: 1, opacity: isFocused ? 1 : 0.6 }}>
              {icon}
            </span>
          )}
          <span
            className="truncate"
            style={{
              color: isFocused ? "var(--w11-text)" : "var(--w11-text-off)",
              fontWeight: 400,
              fontSize: "12px",
            }}
          >
            {title}
          </span>
        </div>

        {/* Caption buttons: minimize, maximize/restore, close */}
        <div
          className="window-controls flex items-stretch h-full shrink-0">
          <button
            aria-label="Minimize"
            onClick={() => minimizeWindow(windowId)}
            className={captionClass}
            data-dim={dim}
            style={captionStyle}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <path d="M0 5.5h10" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
          <button
            aria-label={isFullscreen ? "Restore" : "Maximize"}
            onClick={() => toggleFullscreen(windowId)}
            className={captionClass}
            data-dim={dim}
            style={captionStyle}
          >
            {isFullscreen ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <rect x="0.5" y="2.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1" />
                <path d="M2.5 2.5V1.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-1" stroke="currentColor" strokeWidth="1" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <rect x="0.5" y="0.5" width="9" height="9" rx="1.2" stroke="currentColor" strokeWidth="1" />
              </svg>
            )}
          </button>
          <button
            aria-label="Close"
            onClick={() => closeWindow(windowId)}
            className={`${captionClass} w11-cap-close`}
            data-dim={dim}
            style={captionStyle}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <path d="M0.5 0.5l9 9M9.5 0.5l-9 9" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ backgroundColor: "var(--w11-content)" }}>
        {children}
      </div>
    </div>
  );
}
