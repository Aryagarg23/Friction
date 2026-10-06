/**
 * PERSONA SIMULATION HOOK
 *
 * Drives the fake OS desktop based on persona timeline position.
 *
 * Two modes of operation:
 * 1. **Forward playback** (autoplay advancing): fires sequential simulation
 *    actions as the timeline crosses their timestamps.
 * 2. **Scrub / jump** (user drags or clicks): reconciles the desktop to the
 *    nearest snapshot — opens missing apps, closes extras, focuses correctly.
 *
 * Also fires one-shot events (tactile strikes, digital moss) only during
 * forward playback to avoid replaying them on every scrub.
 */

import { useRef, useEffect } from "react";
import { useWindowManager } from "../context/WindowManagerContext";
import { useSession } from "../context/SessionContext";
import type { PersonaProfile, SimulationSnapshot } from "../data/personas";

/** App sizes from Dock — used when opening windows via simulation */
const APP_SIZES: Record<string, { width: number; height: number }> = {
  vscode:     { width: 1000, height: 700 },
  chrome:     { width: 1000, height: 700 },
  mail:       { width: 900,  height: 650 },
  slack:      { width: 900,  height: 650 },
  calendar:   { width: 800,  height: 600 },
  spotify:    { width: 950,  height: 650 },
  terminal:   { width: 800,  height: 500 },
  notes:      { width: 900,  height: 620 },
  finder:     { width: 900,  height: 600 },
  calculator: { width: 480,  height: 580 },
  settings:   { width: 950,  height: 650 },
};

const APP_TITLES: Record<string, string> = {
  vscode: "VS Code", chrome: "Chrome", mail: "Mail", slack: "Slack",
  calendar: "Calendar", spotify: "Spotify", terminal: "Terminal",
  notes: "Notes", finder: "Finder", calculator: "Calculator", settings: "Settings",
};

interface UsePersonaSimulationOptions {
  persona: PersonaProfile | null;
  timelineMinutes: number;
  isActive: boolean;         // Whether we're in persona-timeline mode at all
  isAutoPlaying: boolean;    // Whether timeline is auto-advancing
}

/**
 * Find the most recent snapshot at or before `time`.
 */
function getSnapshotAt(
  persona: PersonaProfile,
  time: number
): SimulationSnapshot | null {
  const snaps = persona.simulationSnapshots;
  let best: SimulationSnapshot | null = null;
  for (const snap of snaps) {
    if (snap.time <= time) best = snap;
    else break;
  }
  return best;
}

export function usePersonaSimulation({
  persona,
  timelineMinutes,
  isActive,
  isAutoPlaying,
}: UsePersonaSimulationOptions) {
  const wm = useWindowManager();
  const session = useSession();

  // Store latest refs to avoid stale closures in effects
  const wmRef = useRef(wm);
  wmRef.current = wm;

  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Track the last timeline minute we processed (for forward-only event detection)
  const lastProcessedTime = useRef<number>(-1);
  // Track which persona is loaded (to reset on persona change)
  const currentPersonaId = useRef<string | null>(null);

  // ── Reset on persona change ───────────────────────────────
  useEffect(() => {
    if (!persona) {
      currentPersonaId.current = null;
      return;
    }
    if (persona.id !== currentPersonaId.current) {
      currentPersonaId.current = persona.id;
      lastProcessedTime.current = -1;
      // Close existing windows to start fresh
      wmRef.current.closeAllWindows();
      // Load the story's own tasks and length, so the desktop and the Friction
      // panel show the same work the story is talking about.
      sessionRef.current.setTasks(persona.tasks.map(t => ({ ...t, completed: false })));
      sessionRef.current.setSessionDuration(persona.sessionDurationMinutes);
    }
  }, [persona?.id]);

  // ── Main effect: react to timeline changes ────────────────
  useEffect(() => {
    if (!isActive || !persona) return;

    const { openWindow, closeAppById, focusAppWindow, windows } = wmRef.current;
    const { triggerStrike, activateMoss, clearMoss } = sessionRef.current;

    const prevTime = lastProcessedTime.current;
    const isForward = timelineMinutes > prevTime;
    const isSmallStep = isForward && (timelineMinutes - prevTime) <= 3;

    // Helper: check if an app is currently open
    const appIsOpen = (appId: string) => windows.some(w => w.appId === appId);

    // Helper: fire one-shot simulation actions between two time points
    const fireActions = (from: number, to: number) => {
      for (const action of persona.simulationActions) {
        if (action.time > from && action.time <= to) {
          switch (action.action) {
            case "open":
              if (action.appId && !appIsOpen(action.appId)) {
                const size = action.appSize || APP_SIZES[action.appId] || { width: 800, height: 600 };
                const title = action.appTitle || APP_TITLES[action.appId] || action.appId;
                openWindow(action.appId, title, size);
              }
              break;
            case "close":
              if (action.appId) closeAppById(action.appId);
              break;
            case "focus":
              if (action.appId) focusAppWindow(action.appId);
              break;
            case "strike":
              if (action.strikeTask) {
                triggerStrike(action.strikeTask, action.strikeNext || "Session complete");
              }
              break;
            case "moss":
              if (action.mossKeywords) activateMoss(action.mossKeywords);
              break;
            case "clear-moss":
              clearMoss();
              break;
          }
        }
      }
    };

    // Helper: reconcile desktop to a snapshot
    const reconcile = (snapshot: SimulationSnapshot) => {
      const currentAppIds = windows.map(w => w.appId);
      const desiredApps = snapshot.openApps;

      // Close apps that shouldn't be open
      for (const appId of currentAppIds) {
        if (!desiredApps.includes(appId)) {
          closeAppById(appId);
        }
      }

      // Open apps that should be open but aren't
      for (const appId of desiredApps) {
        if (!appIsOpen(appId)) {
          const size = APP_SIZES[appId] || { width: 800, height: 600 };
          const title = APP_TITLES[appId] || appId;
          openWindow(appId, title, size);
        }
      }

      // Focus the right app (slight delay to let opens settle)
      setTimeout(() => {
        wmRef.current.focusAppWindow(snapshot.focusedApp);
      }, 60);
    };

    if (isForward && isSmallStep && isAutoPlaying) {
      // Small forward step during autoplay → fire sequential actions
      fireActions(prevTime, timelineMinutes);
    } else {
      // Jump (scrub, beat click, or large step) → reconcile from snapshot
      const snapshot = getSnapshotAt(persona, timelineMinutes);
      if (snapshot) {
        reconcile(snapshot);
      }
      // Moss is state, not just an event: jumping onto a moss step must show it,
      // and jumping past or before it must clear it.
      const lastMossAction = persona.simulationActions
        .filter(a => (a.action === "moss" || a.action === "clear-moss") && a.time <= timelineMinutes)
        .pop();
      const { mossActive } = sessionRef.current;
      if (lastMossAction?.action === "moss" && lastMossAction.mossKeywords) {
        if (!mossActive) activateMoss(lastMossAction.mossKeywords);
      } else if (mossActive) {
        clearMoss();
      }
    }

    // Tasks finished by this point in the story, whichever way the timeline moved.
    const finished = new Set(
      persona.simulationActions
        .filter(a => a.action === "strike" && a.time <= timelineMinutes && a.strikeTask)
        .map(a => a.strikeTask as string)
    );
    const tasksNow = persona.tasks.map(t => ({ ...t, completed: finished.has(t.title) }));
    const current = sessionRef.current.tasks;
    const changed =
      current.length !== tasksNow.length ||
      current.some((t, i) => t.id !== tasksNow[i].id || t.completed !== tasksNow[i].completed);
    if (changed) sessionRef.current.setTasks(tasksNow);

    lastProcessedTime.current = timelineMinutes;
  }, [timelineMinutes, isActive, isAutoPlaying, persona]);

  // ── Cleanup when leaving persona mode ─────────────────────
  useEffect(() => {
    if (!isActive) {
      lastProcessedTime.current = -1;
    }
  }, [isActive]);
}
