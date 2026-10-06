/**
 * WINDOW MANAGER CONTEXT
 * 
 * Manages open app windows, focus, z-index, and window positions.
 * Each app can be opened, closed, minimized, focused, and dragged.
 */

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  isMinimized: boolean;
  isFullscreen: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface WindowManagerContextValue {
  windows: WindowState[];
  focusedWindowId: string | null;
  openWindow: (appId: string, title: string, size?: { width: number; height: number }) => void;
  closeWindow: (windowId: string) => void;
  closeAllWindows: () => void;
  closeAppById: (appId: string) => void;
  minimizeWindow: (windowId: string) => void;
  toggleFullscreen: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  focusAppWindow: (appId: string) => void;
  updateWindowPosition: (windowId: string, position: { x: number; y: number }) => void;
  isAppOpen: (appId: string) => boolean;
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(null);

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) return {
    windows: [],
    focusedWindowId: null,
    openWindow: () => {},
    closeWindow: () => {},
    closeAllWindows: () => {},
    closeAppById: () => {},
    minimizeWindow: () => {},
    toggleFullscreen: () => {},
    focusWindow: () => {},
    focusAppWindow: () => {},
    updateWindowPosition: () => {},
    isAppOpen: () => false,
  } as unknown as WindowManagerContextValue;
  return ctx;
}

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const zIndexRef = useRef(1000);

  const getNextZ = () => {
    const z = zIndexRef.current;
    zIndexRef.current += 1;
    return z;
  };

  const openWindow = useCallback((appId: string, title: string, size = { width: 800, height: 600 }) => {
    setWindows(prev => {
      const existing = prev.find(w => w.appId === appId);
      if (existing) {
        const z = getNextZ();
        // Defer focus setter to avoid calling setState inside setState updater
        setTimeout(() => setFocusedWindowId(existing.id), 0);
        return prev.map(w => w.id === existing.id ? { ...w, isMinimized: false, zIndex: z } : w);
      }
      const cascade = prev.length * 30;
      const z = getNextZ();
      const newWindow: WindowState = {
        id: `window-${Date.now()}`,
        appId,
        title,
        isMinimized: false,
        isFullscreen: false,
        zIndex: z,
        position: { x: 100 + cascade, y: 80 + cascade },
        size,
      };
      setTimeout(() => setFocusedWindowId(newWindow.id), 0);
      return [...prev, newWindow];
    });
  }, []);

  const closeWindow = useCallback((windowId: string) => {
    setWindows(prev => {
      const remaining = prev.filter(w => w.id !== windowId);
      setTimeout(() => {
        setFocusedWindowId(f =>
          f === windowId
            ? (remaining.length > 0 ? remaining[remaining.length - 1].id : null)
            : f
        );
      }, 0);
      return remaining;
    });
  }, []);

  const closeAllWindows = useCallback(() => {
    setWindows([]);
    setFocusedWindowId(null);
  }, []);

  const closeAppById = useCallback((appId: string) => {
    setWindows(prev => {
      const target = prev.find(w => w.appId === appId);
      if (!target) return prev;
      const remaining = prev.filter(w => w.id !== target.id);
      setTimeout(() => {
        setFocusedWindowId(f =>
          f === target.id
            ? (remaining.length > 0 ? remaining[remaining.length - 1].id : null)
            : f
        );
      }, 0);
      return remaining;
    });
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    setWindows(prev =>
      prev.map(w => (w.id === windowId ? { ...w, isMinimized: true } : w))
    );
    // A minimized window cannot keep focus, or the taskbar would still mark it active.
    setFocusedWindowId(prev => (prev === windowId ? null : prev));
  }, []);

  const toggleFullscreen = useCallback((windowId: string) => {
    setWindows(prev =>
      prev.map(w => (w.id === windowId ? { ...w, isFullscreen: !w.isFullscreen } : w))
    );
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    const z = getNextZ();
    setWindows(prev =>
      prev.map(w => (w.id === windowId ? { ...w, zIndex: z, isMinimized: false } : w))
    );
    setFocusedWindowId(windowId);
  }, []);

  const focusAppWindow = useCallback((appId: string) => {
    setWindows(prev => {
      const target = prev.find(w => w.appId === appId);
      if (!target) return prev;
      const z = getNextZ();
      setTimeout(() => setFocusedWindowId(target.id), 0);
      return prev.map(w => (w.id === target.id ? { ...w, zIndex: z, isMinimized: false } : w));
    });
  }, []);

  const updateWindowPosition = useCallback((windowId: string, position: { x: number; y: number }) => {
    setWindows(prev =>
      prev.map(w => (w.id === windowId ? { ...w, position } : w))
    );
  }, []);

  const isAppOpen = useCallback((appId: string) => {
    return windows.some(w => w.appId === appId);
  }, [windows]);

  return (
    <WindowManagerContext.Provider
      value={{
        windows,
        focusedWindowId,
        openWindow,
        closeWindow,
        closeAllWindows,
        closeAppById,
        minimizeWindow,
        toggleFullscreen,
        focusWindow,
        focusAppWindow,
        updateWindowPosition,
        isAppOpen,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
}