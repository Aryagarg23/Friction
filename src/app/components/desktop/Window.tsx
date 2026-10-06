/**
 * WINDOW COMPONENT
 * 
 * Draggable window frame for the fake apps: plain title bar, minimize,
 * maximize (fills the desktop area) and close. Double-click the title bar
 * to toggle maximize.
 */

import { useState, useRef, useEffect, type ReactNode } from "react";
import { X, Minus, Maximize2, Minimize2 } from "lucide-react";
import { useWindowManager } from "../../context/WindowManagerContext";

interface WindowProps {
  windowId: string;
  title: string;
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

  const controlIcon = { color: "var(--pi-ink-60)" };
  const controlClass = "flex items-center justify-center h-full cursor-pointer";

  return (
    <div
      ref={windowRef}
      className="absolute flex flex-col overflow-hidden"
      style={{
        left: isFullscreen ? 0 : position.x,
        top: isFullscreen ? 0 : position.y,
        width: isFullscreen ? "100%" : width,
        height: isFullscreen ? "calc(100% - 48px)" : height, // taskbar is 48px
        zIndex,
        backgroundColor: "var(--pi-surface)",
        border: isFullscreen
          ? "none"
          : `1px solid ${isFocused ? "var(--pi-ink-45)" : "var(--pi-hairline)"}`,
        fontFamily: "var(--pi-font)",
        transition: isDragging
          ? "none"
          : "left var(--pi-ease-focus), top var(--pi-ease-focus), width var(--pi-ease-focus), height var(--pi-ease-focus), border-color var(--pi-ease-hover)",
      }}
      onMouseDown={() => focusWindow(windowId)}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-3 select-none"
        style={{
          height: "32px",
          backgroundColor: "var(--pi-surface)",
          borderBottom: "1px solid var(--pi-hairline)",
          cursor: isFullscreen ? "default" : "move",
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleTitleDoubleClick}
      >
        <span
          className="truncate"
          style={{
            color: isFocused ? "var(--pi-ink)" : "var(--pi-ink-45)",
            fontWeight: 400,
            fontSize: "0.72rem",
          }}
        >
          {title}
        </span>

        {/* Controls: minimize, maximize, close */}
        <div className="window-controls flex items-center h-full -mr-3">
          <button
            aria-label="Minimize"
            onClick={() => minimizeWindow(windowId)}
            className={`${controlClass} hover:bg-[var(--pi-ink-08)]`}
            style={{ width: "42px", transition: "background-color var(--pi-ease-hover)" }}
          >
            <Minus size={13} style={controlIcon} />
          </button>
          <button
            aria-label={isFullscreen ? "Restore" : "Maximize"}
            onClick={() => toggleFullscreen(windowId)}
            className={`${controlClass} hover:bg-[var(--pi-ink-08)]`}
            style={{ width: "42px", transition: "background-color var(--pi-ease-hover)" }}
          >
            {isFullscreen ? <Minimize2 size={13} style={controlIcon} /> : <Maximize2 size={13} style={controlIcon} />}
          </button>
          <button
            aria-label="Close"
            onClick={() => closeWindow(windowId)}
            className={`${controlClass} text-[color:var(--pi-ink-60)] hover:bg-[var(--pi-ink)] hover:text-[color:var(--pi-ground)]`}
            style={{ width: "42px", transition: "background-color var(--pi-ease-hover), color var(--pi-ease-hover)" }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
