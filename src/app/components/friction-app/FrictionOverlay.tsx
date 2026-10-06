/**
 * FRICTION OVERLAY — "Calm Authority" Visual Identity
 *
 * OS-facing Friction UI uses blue-red grainy gradients, Space Grotesk
 * headings, DM Sans body text — distinct from the brutalist control panel.
 *
 * IDLE: Retracted edge glow. Hover/click expands.
 * ACTIVE (scaffolding): Handled by DesktopOS floating elements (FlowPill, PeekCard, RefocusPopup).
 * TERMINAL/MIRROR: Split or full-screen overlay.
 *
 * Moon Pool: General tasks are the inbox; session tasks live in the pool.
 * Pool density drives physics, color, and behavior changes.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useFrictionSettings } from "../../context/FrictionSettingsContext";
import { motion, AnimatePresence } from "motion/react";
import { useDrop } from "react-dnd";
import { useBiometricsSafe } from "../../context/BiometricContext";
import { useSession } from "../../context/SessionContext";
import { RecoveryBreathing } from "../desktop/RecoveryBreathing";
import {
  ChevronLeft, ChevronRight, Activity, Droplets, Eye, Timer,
  Maximize2, Minimize2, Plus, ArrowRight, X, Inbox,
} from "lucide-react";
import {
  FRICTION_FONTS, FRICTION_COLORS, GRAIN_OVERLAY_STYLE,
  getPoolStage, labelStyle, bodyStyle, dataStyle, cardStyle,
  btnPrimaryStyle, btnDangerStyle, taskRowStyle, blueRedGradient,
} from "./friction-styles";
import { DraggableOverlayTask, OverlayDropZone, ITEM_TYPE, type DragItem } from "./DraggableOverlayTask";
import { MoonPoolCanvas } from "./MoonPoolCanvas";
import { ReflectionPage } from "./ReflectionPage";

// ── Shared Grain Overlay component ──
function GrainOverlay({ fadeIn = false }: { fadeIn?: boolean }) {
  return (
    <div
      style={{
        ...GRAIN_OVERLAY_STYLE,
        // When fadeIn is true, start invisible and fade in after the drawer
        // width animation completes — prevents the "static flash" artifact.
        ...(fadeIn ? {
          opacity: 0,
          animation: "grainFadeIn 0.3s ease 0.5s forwards",
        } : {}),
      }}
    />
  );
}

// ── Friction Diamond Icon (shared) ──
function FrictionDiamond({ size = 10, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path
        d="M6 0.5L11 6L6 11.5L1 6L6 0.5Z"
        fill={glow ? FRICTION_COLORS.blue300 : FRICTION_COLORS.textMuted}
        style={{ filter: glow ? `drop-shadow(0 0 4px ${FRICTION_COLORS.blueGlow})` : "none" }}
      />
    </svg>
  );
}

export function FrictionOverlay() {
  const bioCtx = useBiometricsSafe();
  const { frictionEnabled, frictionOverlay } = useFrictionSettings();
  if (!bioCtx || !frictionEnabled || !frictionOverlay) return null;
  return <FrictionOverlayInner bioCtx={bioCtx} />;
}

function FrictionOverlayInner({ bioCtx }: { bioCtx: ReturnType<typeof useBiometricsSafe> & {} }) {
  const { current: biometrics, history } = bioCtx;
  const { interceptFatigue } = useFrictionSettings();
  const {
    sessionState, tasks, generalTasks, currentTaskIndex,
    triggerStrike, startSession, endSession,
    drawerScreen, setDrawerScreen, addTask, addGeneralTask,
    moveToPool, moveToGeneral, removeTask, removeGeneralTask,
    reorderTask, reorderGeneralTask,
    sessionDurationMinutes: sessionDurationMin, setSessionDuration: setSessionDurationMin,
  } = useSession();
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [splitView, setSplitView] = useState(true);
  const [drawerRetracted, setDrawerRetracted] = useState(false);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawerIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerInsideDrawerRef = useRef(false);

  const focus = biometrics.focus_percent;
  const fatigue = biometrics.fatigue_percent;
  const isActive = sessionState === "active";

  const isDrawerScreen = drawerScreen === "terminal" || drawerScreen === "mirror";

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
      if (drawerIdleRef.current) clearTimeout(drawerIdleRef.current);
    };
  }, []);

  // Auto-retract drawer screens after idle period.
  // Mirror/Reflection gets a longer timeout since the user reads, types, and clicks.
  const resetDrawerIdle = useCallback(() => {
    setDrawerRetracted(false);
    if (drawerIdleRef.current) clearTimeout(drawerIdleRef.current);
    const timeout = drawerScreen === "mirror" ? 8000 : 2500;
    drawerIdleRef.current = setTimeout(() => {
      // A resting pointer is not idle: the user is reading or about to click.
      if (pointerInsideDrawerRef.current) return;
      setDrawerRetracted(true);
    }, timeout);
  }, [drawerScreen]);

  // Reset idle timer when drawer screen changes or opens
  useEffect(() => {
    if (isDrawerScreen) {
      resetDrawerIdle();
    } else {
      setDrawerRetracted(false);
      if (drawerIdleRef.current) clearTimeout(drawerIdleRef.current);
    }
  }, [isDrawerScreen, drawerScreen, resetDrawerIdle]);

  // ESC key: collapse from full-screen back to split view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerScreen && !splitView) setSplitView(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerScreen, splitView]);

  // Note: Mirror auto-show on session end is handled by endSession() in SessionContext,
  // which already sets drawerScreen("mirror"). No duplicate effect needed here.

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const currentTask = activeTasks[0];
  const nextTask = activeTasks[1];
  const lightTasks = activeTasks.filter(t => t.category === "light");

  // overlayParams kept for control panel sub-state derivation
  const overlayParams = useMemo(() => {
    if (!isActive || fatigue > interceptFatigue)
      return { opacity: 0, width: 0, visible: false, mode: "hidden" as const };
    if (focus > 0.90 && fatigue < 0.40)
      return { opacity: 0, width: 0, visible: false, mode: "invisible" as const };
    if (focus > 0.70) {
      const t = (0.90 - focus) / 0.20;
      return { opacity: 0.15 + t * 0.25, width: 5, visible: true, mode: "hairline" as const };
    }
    if (focus > 0.50) {
      return { opacity: 0.55, width: 180, visible: true, mode: "taper" as const };
    }
    if (focus > 0.30) {
      return { opacity: 0.75, width: 260, visible: true, mode: "moderate" as const };
    }
    return { opacity: 0.9, width: 280, visible: true, mode: "recovery" as const };
  }, [focus, fatigue, isActive, interceptFatigue]);

  // ══════════════════════════════════════════════════════════
  //  FULL-SCREEN / SPLIT: Terminal or Mirror
  // ══════════════════════════════════════════════════════════
  if (isDrawerScreen) {
    const retractedWidth = 6;
    const retractedHitZone = 40; // invisible hover zone when retracted
    const expandedDrawerWidth = splitView ? "45%" : "100%";

    return (
      <>
        {/* Invisible wider hover zone when retracted — makes it easy to re-expand */}
        {drawerRetracted && (
          <div
            className="absolute top-0 right-0 bottom-[48px]"
            style={{
              width: retractedHitZone,
              zIndex: 8799,
              cursor: "pointer",
            }}
            onClick={() => resetDrawerIdle()}
            onMouseEnter={() => resetDrawerIdle()}
          />
        )}

        <motion.div
          initial={false}
          animate={{
            width: drawerRetracted ? retractedWidth : expandedDrawerWidth,
          }}
          transition={{ width: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
          onMouseEnter={() => { pointerInsideDrawerRef.current = true; if (drawerRetracted) resetDrawerIdle(); }}
          onMouseLeave={() => { pointerInsideDrawerRef.current = false; if (!drawerRetracted) resetDrawerIdle(); }}
          onMouseMove={() => { pointerInsideDrawerRef.current = true; if (!drawerRetracted) resetDrawerIdle(); }}
          onClick={() => { if (!drawerRetracted) resetDrawerIdle(); }}
          onKeyDown={() => { if (!drawerRetracted) resetDrawerIdle(); }}
          onScrollCapture={() => { if (!drawerRetracted) resetDrawerIdle(); }}
          onFocusCapture={() => { if (!drawerRetracted) resetDrawerIdle(); }}
          className="absolute top-0 right-0 bottom-[48px] flex flex-col overflow-hidden"
          style={{
            zIndex: 8800,
            backgroundColor: FRICTION_COLORS.bgDeep,
            fontFamily: FRICTION_FONTS.body,
            borderLeft: `1px solid ${FRICTION_COLORS.borderSubtle}`,
            cursor: drawerRetracted ? "pointer" : "auto",
          }}
        >
          {drawerRetracted && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(to bottom,
                  transparent 0%,
                  ${FRICTION_COLORS.blueGlow} 30%,
                  ${FRICTION_COLORS.redGlow} 70%,
                  transparent 100%
                )`,
              }}
            >
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3], scaleY: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-[2px] h-20 rounded-full"
                style={{
                  backgroundColor: FRICTION_COLORS.blue300,
                  boxShadow: `0 0 8px ${FRICTION_COLORS.blueGlow}`,
                }}
              />
            </motion.div>
          )}

          <div
            style={{
              opacity: drawerRetracted ? 0 : 1,
              pointerEvents: drawerRetracted ? "none" : "auto",
              transition: drawerRetracted
                ? "opacity 0.12s ease"
                : "opacity 0.25s ease 0.15s",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            {/* Grain removed — feTurbulence noise looked like static during transitions */}

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: blueRedGradient(0.12),
                zIndex: 0,
              }}
            />

            <div
              className="flex items-center gap-2 px-4 py-2.5 shrink-0 relative"
              style={{ borderBottom: `1px solid ${FRICTION_COLORS.borderSubtle}`, zIndex: 1 }}
            >
              <FrictionDiamond glow={isActive} />
              <span style={{ ...labelStyle, fontSize: "0.55rem", color: FRICTION_COLORS.textSecondary }}>
                {drawerScreen === "terminal" ? "Terminal" : "Mirror"}
              </span>

              <div className="flex-1" />

              {(["terminal", "mirror"] as const).map(screen => (
                <button
                  key={screen}
                  onClick={() => setDrawerScreen(screen)}
                  className="px-2.5 py-1 rounded-md cursor-pointer transition-all"
                  style={{
                    fontFamily: FRICTION_FONTS.heading,
                    fontSize: "0.5rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    backgroundColor: drawerScreen === screen ? "rgba(107, 95, 255, 0.1)" : "transparent",
                    border: `1px solid ${drawerScreen === screen ? FRICTION_COLORS.borderActive : "transparent"}`,
                    color: drawerScreen === screen ? FRICTION_COLORS.blue200 : FRICTION_COLORS.textMuted,
                  }}
                >
                  {screen === "terminal" ? (
                    <><Droplets size={9} className="inline mr-1" style={{ verticalAlign: "-1px" }} />Terminal</>
                  ) : (
                    <><Eye size={9} className="inline mr-1" style={{ verticalAlign: "-1px" }} />Mirror</>
                  )}
                </button>
              ))}

              <button
                onClick={() => setSplitView(!splitView)}
                className="px-2 py-1 rounded-md cursor-pointer transition-all hover:bg-blue-500/10 ml-1"
                title={splitView ? "Expand to full screen (ESC to return)" : "Split view"}
                style={{
                  border: `1px solid ${FRICTION_COLORS.borderDefault}`,
                  color: splitView ? FRICTION_COLORS.blue200 : FRICTION_COLORS.textMuted,
                }}
              >
                {splitView ? <Maximize2 size={10} /> : <Minimize2 size={10} />}
              </button>

              {isActive && (
                <button
                  onClick={() => setDrawerScreen("scaffolding")}
                  className="px-2 py-1 rounded-md cursor-pointer transition-all ml-1"
                  style={{
                    fontFamily: FRICTION_FONTS.heading,
                    border: `1px solid ${FRICTION_COLORS.borderDefault}`,
                    color: FRICTION_COLORS.textMuted,
                    fontSize: "0.45rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  <ChevronLeft size={8} className="inline mr-0.5" style={{ verticalAlign: "-1px" }} />
                  Back
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto relative" style={{ zIndex: 1 }}>
              {drawerScreen === "terminal" ? (
                <TerminalScreen
                  tasks={tasks}
                  generalTasks={generalTasks}
                  activeTasks={activeTasks}
                  sessionDurationMin={sessionDurationMin}
                  setSessionDurationMin={setSessionDurationMin}
                  onImmerse={startSession}
                  isSessionActive={isActive}
                  fullScreen={!splitView}
                  onAddTask={addTask}
                  onAddGeneralTask={addGeneralTask}
                  onMoveToPool={moveToPool}
                  onMoveToGeneral={moveToGeneral}
                  onRemoveTask={removeTask}
                  onRemoveGeneralTask={removeGeneralTask}
                  onReorderTask={reorderTask}
                  onReorderGeneralTask={reorderGeneralTask}
                />
              ) : (
                <ReflectionPage
                  sessionTasks={tasks}
                  fullScreen={!splitView}
                />
              )}
            </div>

            <div
              className="px-5 py-2 flex items-center justify-between shrink-0 relative"
              style={{
                borderTop: `1px solid ${FRICTION_COLORS.borderSubtle}`,
                backgroundColor: "rgba(6, 10, 18, 0.6)",
                zIndex: 1,
              }}
            >
              {isActive ? (
                <>
                  <div className="flex items-center gap-3">
                    <BoxBreathingIndicator />
                  </div>
                  <button onClick={endSession} className="cursor-pointer" style={{ ...btnDangerStyle, padding: "4px 8px", fontSize: "0.45rem" }}>
                    End
                  </button>
                </>
              ) : (
                <>
                  <span style={{ ...labelStyle, fontSize: "0.45rem", color: FRICTION_COLORS.textMuted }}>
                    Friction Daemon v2.1.0
                  </span>
                  <span style={{ ...labelStyle, fontSize: "0.45rem", color: FRICTION_COLORS.textMuted }}>
                    Idle
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════
  //  ACTIVE SESSION — Scaffolding UI now handled by DesktopOS
  //  (FlowPill, PeekCard, RefocusPopup). No sidebar needed.
  // ══════════════════════════════════════════════════════════
  return null;
}


// ══════════════════════════════════════════════════════════════
//  BOX BREATHING INDICATOR
// ══════════════════════════════════════════════════════════════

/**
 * A tiny animated square with diagonal split:
 * top-right = IN, bottom-left = OUT. Dot traces the edge
 * and breathes size in sync with the 8s cycle.
 */
function BoxBreathingIndicator() {
  const boxSize = 16;
  const BREATH_DURATION = 8;

  return (
    <div className="relative" style={{ width: boxSize + 8, height: boxSize + 8, padding: 4 }}>
     <div className="relative" style={{ width: boxSize, height: boxSize }}>
      <motion.div
        className="absolute inset-0 rounded-sm"
        animate={{ borderColor: [
          FRICTION_COLORS.blue400,
          FRICTION_COLORS.red400,
          FRICTION_COLORS.blue400,
        ]}}
        transition={{ duration: BREATH_DURATION, repeat: Infinity, ease: "easeInOut" }}
        style={{ border: "1px solid" }}
      />
      <svg className="absolute inset-0" width={boxSize} height={boxSize} style={{ pointerEvents: "none" }}>
        <line x1="0" y1="0" x2={boxSize} y2={boxSize} stroke={FRICTION_COLORS.borderSubtle} strokeWidth="0.5" />
      </svg>
      <motion.div
        animate={{
          left: [0, boxSize, boxSize, 0, 0],
          top: [0, 0, boxSize, boxSize, 0],
          width: [3, 5, 4, 2, 3],
          height: [3, 5, 4, 2, 3],
          backgroundColor: [
            FRICTION_COLORS.blue300,
            FRICTION_COLORS.blue200,
            FRICTION_COLORS.red300,
            FRICTION_COLORS.violet300,
            FRICTION_COLORS.blue300,
          ],
          boxShadow: [
            `0 0 4px ${FRICTION_COLORS.blueGlow}`,
            `0 0 6px ${FRICTION_COLORS.blueGlow}`,
            `0 0 4px ${FRICTION_COLORS.redGlow}`,
            `0 0 3px ${FRICTION_COLORS.violetGlow}`,
            `0 0 4px ${FRICTION_COLORS.blueGlow}`,
          ],
        }}
        transition={{
          duration: BREATH_DURATION,
          repeat: Infinity,
          ease: ["easeOut", "easeInOut", "easeOut", "easeInOut"],
          times: [0, 0.25, 0.5, 0.75, 1],
        }}
        className="absolute rounded-full"
        style={{
          transform: "translate(-50%, -50%)",
          zIndex: 2,
        }}
      />
     </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
//  SCREEN 1: TERMINAL — Moon Pool + General Task List
// ══════════════════════════════════════════════════════════════

type TerminalTask = { id: string; title: string; cognitiveWeight: number; completed: boolean; category: string };

interface TerminalProps {
  tasks: TerminalTask[];
  generalTasks: TerminalTask[];
  activeTasks: TerminalTask[];
  sessionDurationMin: number;
  setSessionDurationMin: (v: number) => void;
  onImmerse: () => void;
  isSessionActive: boolean;
  fullScreen?: boolean;
  onAddTask?: (task: any) => void;
  onAddGeneralTask?: (task: any) => void;
  onMoveToPool?: (id: string) => void;
  onMoveToGeneral?: (id: string) => void;
  onRemoveTask?: (id: string) => void;
  onRemoveGeneralTask?: (id: string) => void;
  onReorderTask?: (fromIndex: number, toIndex: number) => void;
  onReorderGeneralTask?: (fromIndex: number, toIndex: number) => void;
}

function TerminalScreen({
  tasks, generalTasks, activeTasks, sessionDurationMin, setSessionDurationMin,
  onImmerse, isSessionActive, fullScreen = false,
  onAddTask, onAddGeneralTask, onMoveToPool, onMoveToGeneral,
  onRemoveTask, onRemoveGeneralTask, onReorderTask, onReorderGeneralTask,
}: TerminalProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newGeneralTitle, setNewGeneralTitle] = useState("");
  const [poolDragOver, setPoolDragOver] = useState(false);
  const [generalDragOver, setGeneralDragOver] = useState(false);
  const [orbFlash, setOrbFlash] = useState(false);

  /** Generate a randomized task from native drop text (for demo variety) */
  const makeDroppedTask = (text: string, prefix: string) => {
    const weight = Math.round((Math.random() * 0.7 + 0.15) * 100) / 100;
    const category = weight > 0.6 ? "deep" : weight > 0.35 ? "moderate" : "light";
    const minutes = Math.round((Math.random() * 80 + 10) / 5) * 5;
    return {
      id: `${prefix}-${Date.now()}`,
      title: text.slice(0, 80),
      cognitiveWeight: weight,
      completed: false,
      category,
      estimatedMinutes: minutes,
    };
  };

  const totalWeight = activeTasks.reduce((sum, t) => sum + t.cognitiveWeight, 0);
  const poolDensity = Math.min(1, totalWeight / 3);
  const stage = getPoolStage(poolDensity);
  const poolSize = fullScreen ? 220 : 140;
  const orbSize = fullScreen ? 180 : poolSize;

  // Time-based glow: more session time → stronger glow (0–1 over 15–300 min)
  const timeGlow = Math.min(1, Math.max(0, (sessionDurationMin - 15) / (300 - 15)));

  // react-dnd drop target for the Moon Pool orb — accepts general tasks
  const [{ isOrbOver, canOrbDrop }, orbDropRef] = useDrop<
    DragItem,
    void,
    { isOrbOver: boolean; canOrbDrop: boolean }
  >({
    accept: ITEM_TYPE,
    canDrop: (item) => item.list === "general",
    drop: (item) => {
      // Move from general → pool (appends to bottom)
      onMoveToPool?.(item.id);
    },
    collect: (monitor) => ({
      isOrbOver: monitor.isOver({ shallow: true }),
      canOrbDrop: monitor.canDrop(),
    }),
  });

  // Merge native drag highlight with react-dnd highlight
  const orbHighlight = poolDragOver || (isOrbOver && canOrbDrop);

  return (
    <div className={fullScreen ? "flex h-full" : "px-4 py-4 space-y-4"}>
      {/* ── LEFT COLUMN: Moon Pool + Session Queue + Controls ── */}
      <div
        className={fullScreen ? "flex flex-col px-5 py-4 overflow-y-auto" : "text-center space-y-4"}
        style={fullScreen ? {
          width: "340px",
          borderRight: `1px solid ${FRICTION_COLORS.borderSubtle}`,
          backgroundColor: "rgba(6, 10, 18, 0.3)",
        } : {}}
      >
        {/* Moon Pool orb */}
        <div className="flex flex-col items-center">
          <span style={{ ...labelStyle, marginBottom: 8, display: "block" }}>
            Moon Pool
          </span>

          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{
              backgroundColor: stage.name === "critical" ? FRICTION_COLORS.red300
                : stage.name === "dense" ? FRICTION_COLORS.red400
                : stage.name === "moderate" ? FRICTION_COLORS.violet300
                : FRICTION_COLORS.blue300,
              boxShadow: `0 0 6px ${stage.particleGlow}`,
            }} />
            <span style={{ ...dataStyle, fontSize: "0.5rem", textTransform: "capitalize" as const }}>
              {stage.name} &middot; {Math.round(poolDensity * 100)}%
            </span>
          </div>

          <div
            ref={orbDropRef as any}
            className="relative rounded-full overflow-hidden"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setPoolDragOver(true); }}
            onDragLeave={() => setPoolDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setPoolDragOver(false);
              const text = e.dataTransfer.getData("text/plain")?.trim();
              if (text && onAddTask) {
                onAddTask(makeDroppedTask(text, "task-drop"));
                // Trigger orb flash
                setOrbFlash(true);
                setTimeout(() => setOrbFlash(false), 600);
              }
            }}
            style={{
              width: orbSize, height: orbSize,
              background: `radial-gradient(circle, ${stage.gradient[0]} 0%, ${stage.gradient[1]} 45%, ${stage.gradient[2]} 100%)`,
              borderWidth: orbHighlight ? 2 : 1,
              borderStyle: "solid",
              borderColor: orbHighlight
                ? FRICTION_COLORS.blue200
                : stage.border,
              boxShadow: orbHighlight
                ? `inset 0 0 60px ${FRICTION_COLORS.blueGlow}, 0 0 30px ${FRICTION_COLORS.blueGlow}`
                : `${stage.innerGlow}, 0 0 ${Math.round(8 + timeGlow * 40)}px rgba(107, 95, 255, ${(0.05 + timeGlow * 0.35).toFixed(2)}), 0 0 ${Math.round(16 + timeGlow * 80)}px rgba(107, 95, 255, ${(0.02 + timeGlow * 0.18).toFixed(2)})`,
              transition: "border-color 0.3s, box-shadow 0.5s, border-width 0.3s",
            }}
          >
            <MoonPoolCanvas
              size={orbSize}
              tasks={activeTasks.slice(0, 12).map(t => ({ id: t.id, cognitiveWeight: t.cognitiveWeight, category: t.category }))}
              density={poolDensity}
              stage={stage}
              dragOver={orbHighlight}
            />
            {/* Orb drop flash overlay */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                pointerEvents: "none",
                background: `radial-gradient(circle, ${FRICTION_COLORS.blueGlow} 0%, transparent 70%)`,
                opacity: orbFlash ? 0.7 : 0,
                transition: orbFlash ? "opacity 0.06s ease-out" : "opacity 0.55s ease-in",
                zIndex: 10,
              }}
            />
          </div>

          {orbHighlight && (
            <div className="mt-2" style={{ ...labelStyle, fontSize: "0.5rem", color: FRICTION_COLORS.blue200 }}>
              Release to add to session
            </div>
          )}
          {!orbHighlight && activeTasks.length === 0 && (
            <div className="mt-2" style={{ ...labelStyle, fontSize: "0.45rem", color: FRICTION_COLORS.textMuted }}>
              Drop tasks here or use arrows
            </div>
          )}

          <div className="mt-2" style={{ ...dataStyle, fontSize: "0.5rem", color: FRICTION_COLORS.textMuted }}>
            {activeTasks.length} session tasks
          </div>
        </div>

        {/* Session Queue — directly below Moon Pool */}
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Droplets size={11} style={{ color: FRICTION_COLORS.blue300 }} />
            <span style={{ ...labelStyle, fontSize: "0.55rem", color: FRICTION_COLORS.blue200 }}>
              Session Queue
            </span>
            <span style={{ ...dataStyle, fontSize: "0.45rem", color: FRICTION_COLORS.textMuted }}>
              {activeTasks.length}
            </span>
          </div>
          <div className="space-y-1">
            <OverlayDropZone list="pool" onDropFromOther={(id) => onMoveToPool?.(id)}>
              {activeTasks.length === 0 ? (
                <div className="text-center py-3" style={{ color: FRICTION_COLORS.textMuted, fontSize: "0.6rem", fontFamily: FRICTION_FONTS.body }}>
                  No tasks in session pool
                </div>
              ) : activeTasks.map((task, i) => (
                <DraggableOverlayTask
                  key={task.id}
                  task={task}
                  index={i}
                  list="pool"
                  onMoveToOther={onMoveToGeneral}
                  onRemove={onRemoveTask}
                  onReorder={onReorderTask}
                />
              ))}
            </OverlayDropZone>
          </div>

          {onAddTask && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newTaskTitle.trim()) {
                  onAddTask({
                    id: `task-${Date.now()}`, title: newTaskTitle.trim(),
                    cognitiveWeight: 0.5, completed: false, category: "moderate", estimatedMinutes: 30,
                  });
                  setNewTaskTitle("");
                }
              }}
              className="flex gap-1.5 mt-2"
            >
              <input
                type="text" value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add to session..."
                className="flex-1 px-2.5 py-1.5 rounded-md outline-none"
                style={{
                  fontFamily: FRICTION_FONTS.body,
                  fontSize: "0.6rem", color: FRICTION_COLORS.textPrimary,
                  backgroundColor: "rgba(107, 95, 255, 0.04)",
                  border: `1px solid ${FRICTION_COLORS.borderSubtle}`,
                  caretColor: FRICTION_COLORS.blue300,
                }}
              />
              <button type="submit" className="px-2 py-1.5 rounded-md cursor-pointer transition-all hover:bg-blue-500/10" style={{
                color: newTaskTitle.trim() ? FRICTION_COLORS.blue200 : FRICTION_COLORS.textMuted,
                border: `1px solid ${FRICTION_COLORS.borderDefault}`,
              }}>
                <Plus size={12} />
              </button>
            </form>
          )}
        </div>

        {/* Time Boundary + Immerse — bottom of left column */}
        <div style={{ height: 1, backgroundColor: FRICTION_COLORS.borderSubtle, margin: "8px 0" }} />

        <div className={fullScreen ? "w-full" : ""}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Timer size={10} style={{ color: FRICTION_COLORS.textMuted }} />
              <span style={{ ...labelStyle, fontSize: "0.5rem" }}>Time Boundary</span>
            </div>
            <span style={{ ...dataStyle, color: FRICTION_COLORS.blue200 }}>
              {sessionDurationMin >= 60
                ? `${Math.floor(sessionDurationMin / 60)}h ${sessionDurationMin % 60 ? `${sessionDurationMin % 60}m` : ""}`
                : `${sessionDurationMin}m`}
            </span>
          </div>
          <input
            type="range" min={15} max={300} step={5}
            value={sessionDurationMin}
            onChange={(e) => setSessionDurationMin(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: FRICTION_COLORS.blue300, backgroundColor: FRICTION_COLORS.borderSubtle }}
          />
        </div>

        {!isSessionActive && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onImmerse}
            className="w-full rounded-lg cursor-pointer mt-2"
            style={{
              ...btnPrimaryStyle,
              width: "100%",
              padding: fullScreen ? "10px 32px" : "12px",
              fontSize: fullScreen ? "0.7rem" : "0.65rem",
              backgroundColor: "rgba(107, 95, 255, 0.12)",
              border: `1.5px solid ${FRICTION_COLORS.borderActive}`,
              boxShadow: `0 0 30px ${FRICTION_COLORS.blueGlow}`,
            }}
          >
            Immerse
          </motion.button>
        )}
      </div>

      {/* ── RIGHT COLUMN: General Tasks (full vertical spread) ── */}
      <div
        className={fullScreen ? "flex-1 flex flex-col py-4 px-4 overflow-y-auto overflow-x-hidden min-w-0" : "space-y-4"}
        style={fullScreen ? {
          backgroundColor: generalDragOver ? "rgba(107, 95, 255, 0.08)" : "rgba(6, 10, 20, 0.15)",
          transition: "background-color 0.25s ease",
        } : {}}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setGeneralDragOver(true); }}
        onDragLeave={(e) => {
          // Only clear if we actually left the container (not entering a child)
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setGeneralDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setGeneralDragOver(false);
          const text = e.dataTransfer.getData("text/plain")?.trim();
          if (text && onAddGeneralTask) {
            onAddGeneralTask(makeDroppedTask(text, "gen-drop"));
          }
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Inbox size={11} style={{ color: generalDragOver ? FRICTION_COLORS.blue200 : FRICTION_COLORS.textSecondary, transition: "color 0.25s" }} />
          <span style={{ ...labelStyle, fontSize: "0.55rem", color: generalDragOver ? FRICTION_COLORS.blue200 : FRICTION_COLORS.textSecondary, transition: "color 0.25s" }}>
            {generalDragOver ? "Release to add to backlog" : "General Backlog"}
          </span>
          <span style={{ ...dataStyle, fontSize: "0.45rem", color: FRICTION_COLORS.textMuted }}>
            {generalTasks.length}
          </span>
        </div>
        <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
          <OverlayDropZone list="general" onDropFromOther={(id) => onMoveToGeneral?.(id)}>
            {generalTasks.length === 0 ? (
              <div className="text-center py-6" style={{ color: FRICTION_COLORS.textMuted, fontSize: "0.6rem", fontFamily: FRICTION_FONTS.body }}>
                Drag items from apps or add tasks below
              </div>
            ) : generalTasks.map((task, i) => (
              <DraggableOverlayTask
                key={task.id}
                task={task}
                index={i}
                list="general"
                onMoveToOther={onMoveToPool}
                onRemove={onRemoveGeneralTask}
                onReorder={onReorderGeneralTask}
              />
            ))}
          </OverlayDropZone>
        </div>

        {onAddGeneralTask && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newGeneralTitle.trim()) {
                onAddGeneralTask({
                  id: `gen-${Date.now()}`, title: newGeneralTitle.trim(),
                  cognitiveWeight: 0.4, completed: false, category: "moderate", estimatedMinutes: 30,
                });
                setNewGeneralTitle("");
              }
            }}
            className="flex gap-1.5 mt-2"
          >
            <input
              type="text" value={newGeneralTitle}
              onChange={(e) => setNewGeneralTitle(e.target.value)}
              placeholder="Add to backlog..."
              className="flex-1 px-2.5 py-1.5 rounded-md outline-none"
              style={{
                fontFamily: FRICTION_FONTS.body,
                fontSize: "0.6rem", color: FRICTION_COLORS.textSecondary,
                backgroundColor: "rgba(107, 95, 255, 0.03)",
                border: `1px solid ${FRICTION_COLORS.borderSubtle}`,
                caretColor: FRICTION_COLORS.blue300,
              }}
            />
            <button type="submit" className="px-2 py-1.5 rounded-md cursor-pointer transition-all hover:bg-blue-500/10" style={{
              color: newGeneralTitle.trim() ? FRICTION_COLORS.textSecondary : FRICTION_COLORS.textMuted,
              border: `1px solid ${FRICTION_COLORS.borderSubtle}`,
            }}>
              <Plus size={12} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}