/**
 * FRICTION OVERLAY
 *
 * The right-side drawer over the fake desktop. It shows two screens:
 *   Plan  (drawerScreen "terminal"): pick tasks, set a length, start.
 *   Recap (drawerScreen "mirror"):   look back at the last session.
 * The Session screen itself ("scaffolding") is drawn by DesktopOS.
 *
 * The drawer can be split (45%) or full screen, and it retracts to a thin
 * edge after a short idle period unless the pointer is resting inside it.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useFrictionSettings } from "../../context/FrictionSettingsContext";
import { motion } from "motion/react";
import { useBiometricsSafe } from "../../context/BiometricContext";
import { useSession } from "../../context/SessionContext";
import { Maximize2, Minimize2, Plus } from "lucide-react";
import {
  FRICTION_FONTS, FRICTION_COLORS, labelStyle, bodyStyle, dataStyle, btnPrimaryStyle,
} from "./friction-styles";
import { DraggableOverlayTask, OverlayDropZone } from "./DraggableOverlayTask";
import { ReflectionPage } from "./ReflectionPage";
import { MoonPool } from "./MoonPool";

import { NO_AUTOFILL } from "@/app/lib/noAutofill";
const PANEL_EASE = [0.32, 0.72, 0, 1] as const;

export function FrictionOverlay() {
  const bioCtx = useBiometricsSafe();
  const { frictionEnabled, frictionOverlay } = useFrictionSettings();
  if (!bioCtx || !frictionEnabled || !frictionOverlay) return null;
  return <FrictionOverlayInner />;
}

function FrictionOverlayInner() {
  const {
    sessionState, tasks, generalTasks,
    startSession, endSession,
    drawerScreen, setDrawerScreen, addTask, addGeneralTask,
    moveToPool, moveToGeneral, removeTask, removeGeneralTask,
    reorderTask, reorderGeneralTask,
    sessionDurationMinutes: sessionDurationMin, setSessionDuration: setSessionDurationMin,
  } = useSession();
  const [splitView, setSplitView] = useState(true);
  const [drawerRetracted, setDrawerRetracted] = useState(false);
  const drawerIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerInsideDrawerRef = useRef(false);

  const isActive = sessionState === "active";
  const isDrawerScreen = drawerScreen === "terminal" || drawerScreen === "mirror";

  useEffect(() => {
    return () => {
      if (drawerIdleRef.current) clearTimeout(drawerIdleRef.current);
    };
  }, []);

  // Auto-retract after an idle period. Recap gets longer because people
  // read and type there.
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

  useEffect(() => {
    if (isDrawerScreen) {
      resetDrawerIdle();
    } else {
      setDrawerRetracted(false);
      if (drawerIdleRef.current) clearTimeout(drawerIdleRef.current);
    }
  }, [isDrawerScreen, drawerScreen, resetDrawerIdle]);

  // Escape: go from full screen back to split view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerScreen && !splitView) setSplitView(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerScreen, splitView]);

  // Recap opening on session end is handled by endSession() in SessionContext.

  const activeTasks = tasks.filter(t => !t.completed);

  if (!isDrawerScreen) return null;

  const retractedWidth = 6;
  const retractedHitZone = 40;
  const expandedDrawerWidth = splitView ? "45%" : "100%";

  return (
    <>
      {/* Wider invisible hover zone while retracted, so it is easy to reopen */}
      {drawerRetracted && (
        <div
          className="absolute top-0 right-0 bottom-[48px]"
          style={{ width: retractedHitZone, zIndex: 8799, cursor: "pointer" }}
          onClick={() => resetDrawerIdle()}
          onMouseEnter={() => resetDrawerIdle()}
        />
      )}

      <motion.div
        initial={false}
        animate={{ width: drawerRetracted ? retractedWidth : expandedDrawerWidth }}
        transition={{ width: { duration: 0.34, ease: PANEL_EASE } }}
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
          backgroundColor: FRICTION_COLORS.bgPrimary,
          color: FRICTION_COLORS.textPrimary,
          fontFamily: FRICTION_FONTS.body,
          // A heavy ink edge marks where the laptop ends and the Friction app begins.
          borderLeft: `2px solid ${FRICTION_COLORS.textPrimary}`,
          cursor: drawerRetracted ? "pointer" : "auto",
        }}
      >
        {/* Retracted: one short line marks where the drawer is */}
        {drawerRetracted && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div style={{ width: 1, height: 48, backgroundColor: FRICTION_COLORS.textMuted }} />
          </div>
        )}

        <div
          style={{
            opacity: drawerRetracted ? 0 : 1,
            pointerEvents: drawerRetracted ? "none" : "auto",
            transition: drawerRetracted ? "opacity 120ms ease" : "opacity 200ms ease 140ms",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* Product name: says which part of the demo this is */}
          <div
            className="flex items-baseline gap-3 px-4 pt-3 pb-2 shrink-0"
            style={{ backgroundColor: FRICTION_COLORS.textPrimary, color: FRICTION_COLORS.bgPrimary }}
          >
            <span style={{ fontSize: "1rem", fontWeight: 500, letterSpacing: "0.01em" }}>Friction</span>
            <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>The app being demoed</span>
          </div>

          {/* Header: screen tabs and the split / full screen toggle */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 shrink-0"
            style={{ borderBottom: `1px solid ${FRICTION_COLORS.borderDefault}` }}
          >
            {(["terminal", "mirror"] as const).map(screen => (
              <button
                key={screen}
                type="button"
                className="pi-btn"
                aria-pressed={drawerScreen === screen}
                onClick={() => setDrawerScreen(screen)}
                style={{ padding: "4px 10px", fontSize: "0.7rem" }}
              >
                {screen === "terminal" ? "Plan" : "Recap"}
              </button>
            ))}

            <div className="flex-1" />

            {isActive && (
              <button
                type="button"
                className="pi-btn"
                onClick={() => setDrawerScreen("scaffolding")}
                style={{ padding: "4px 10px", fontSize: "0.7rem" }}
              >
                Back to session
              </button>
            )}

            <button
              type="button"
              className="pi-btn"
              onClick={() => setSplitView(!splitView)}
              title={splitView ? "Full screen (Esc to go back)" : "Split view"}
              aria-label={splitView ? "Full screen" : "Split view"}
              style={{ padding: "5px 7px", lineHeight: 0 }}
            >
              {splitView ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {drawerScreen === "terminal" ? (
              <PlanScreen
                generalTasks={generalTasks}
                activeTasks={activeTasks}
                sessionDurationMin={sessionDurationMin}
                setSessionDurationMin={setSessionDurationMin}
                onStart={startSession}
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
              <ReflectionPage sessionTasks={tasks} fullScreen={!splitView} />
            )}
          </div>

          {/* Footer only exists while a session runs */}
          {isActive && (
            <div
              className="px-4 py-2 flex items-center justify-between shrink-0"
              style={{ borderTop: `1px solid ${FRICTION_COLORS.borderDefault}` }}
            >
              <BreathingSquare />
              <button
                type="button"
                className="pi-btn"
                onClick={endSession}
                style={{ padding: "4px 10px", fontSize: "0.7rem" }}
              >
                End session
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}


// ── Breathing square ─────────────────────────────────────────
// A slow 8 second cycle (4 in, 4 out) for anyone who wants a pace to
// breathe to. Kept faint on purpose.

function BreathingSquare() {
  const size = 12;
  return (
    <div
      aria-hidden
      className="relative"
      style={{ width: size, height: size, border: `1px solid ${FRICTION_COLORS.borderDefault}` }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: FRICTION_COLORS.textMuted, transformOrigin: "center" }}
        animate={{ scale: [0.2, 1, 0.2], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}


// ── Helpers ──────────────────────────────────────────────────

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Summed cognitive weight, scaled so 3 full-weight tasks = 1. */
function loadWord(totalWeight: number): string {
  const density = totalWeight / 3;
  if (density < 0.35) return "light";
  if (density < 0.6) return "medium";
  if (density < 0.85) return "heavy";
  return "very heavy";
}


// ══════════════════════════════════════════════════════════════
//  PLAN SCREEN (drawerScreen "terminal")
// ══════════════════════════════════════════════════════════════

type PlanTask = {
  id: string;
  title: string;
  cognitiveWeight: number;
  completed: boolean;
  category: string;
  estimatedMinutes?: number;
};

interface PlanProps {
  generalTasks: PlanTask[];
  activeTasks: PlanTask[];
  sessionDurationMin: number;
  setSessionDurationMin: (v: number) => void;
  onStart: () => void;
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

/** Turn text dropped from another app into a task. Weight is random for demo variety. */
function makeDroppedTask(text: string, prefix: string) {
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
}

function PlanScreen({
  generalTasks, activeTasks, sessionDurationMin, setSessionDurationMin,
  onStart, isSessionActive, fullScreen = false,
  onAddTask, onAddGeneralTask, onMoveToPool, onMoveToGeneral,
  onRemoveTask, onRemoveGeneralTask, onReorderTask, onReorderGeneralTask,
}: PlanProps) {
  const totalWeight = activeTasks.reduce((sum, t) => sum + t.cognitiveWeight, 0);
  const workMinutes = activeTasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
  const fill = sessionDurationMin > 0 ? workMinutes / sessionDurationMin : 0;
  const overTime = fill > 1;

  const sessionColumn = (
    <div className="space-y-6">
      <MoonPool
        tasks={activeTasks}
        sessionDurationMin={sessionDurationMin}
        size={fullScreen ? 200 : 150}
        onMoveToPool={onMoveToPool}
        onDropText={onAddTask ? (text) => onAddTask(makeDroppedTask(text, "task-drop")) : undefined}
      />

      {/* How heavy is this session */}
      <div>
        <p style={{ ...bodyStyle, margin: 0 }}>
          {activeTasks.length === 0 ? (
            "No tasks in this session yet."
          ) : (
            <>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {activeTasks.length} {activeTasks.length === 1 ? "task" : "tasks"} · about {formatMinutes(workMinutes)} of work
              </span>
              {" · "}{loadWord(totalWeight)}
            </>
          )}
        </p>
        <div
          className="mt-2"
          style={{ height: 1, backgroundColor: FRICTION_COLORS.borderDefault, position: "relative" }}
          aria-hidden
        >
          <div
            style={{
              position: "absolute", left: 0, top: -1, height: 3,
              width: `${Math.min(1, fill) * 100}%`,
              backgroundColor: overTime ? FRICTION_COLORS.warning : FRICTION_COLORS.textPrimary,
              transition: "width var(--pi-ease-focus)",
            }}
          />
        </div>
        {overTime && (
          <p style={{ ...bodyStyle, fontSize: "0.75rem", margin: "6px 0 0", color: FRICTION_COLORS.warning }}>
            This is more work than the session length.
          </p>
        )}
      </div>

      <TaskSection
        title="This session"
        list="pool"
        tasks={activeTasks}
        emptyText="Nothing here yet. Drag a task in from Later."
        onNativeText={onAddTask ? (text) => onAddTask(makeDroppedTask(text, "task-drop")) : undefined}
        onDropFromOther={(id) => onMoveToPool?.(id)}
        onMoveToOther={onMoveToGeneral}
        onRemove={onRemoveTask}
        onReorder={onReorderTask}
        onAdd={onAddTask ? (title) => onAddTask({
          id: `task-${Date.now()}`, title,
          cognitiveWeight: 0.5, completed: false, category: "moderate", estimatedMinutes: 30,
        }) : undefined}
      />

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label htmlFor="friction-session-length" style={labelStyle}>Session length</label>
          <span style={dataStyle}>{formatMinutes(sessionDurationMin)}</span>
        </div>
        <input {...NO_AUTOFILL}
          id="friction-session-length"
          type="range" min={15} max={300} step={5}
          value={sessionDurationMin}
          onChange={(e) => setSessionDurationMin(Number(e.target.value))}
          className="pi-range cursor-pointer"
        />
      </div>

      {!isSessionActive && (
        <button
          type="button"
          className="pi-btn"
          onClick={onStart}
          style={{ ...btnPrimaryStyle, width: "100%", padding: "10px 14px" }}
        >
          Start session
        </button>
      )}
    </div>
  );

  const laterColumn = (
    <TaskSection
      title="Later"
      list="general"
      tasks={generalTasks}
      emptyText="Nothing here yet. Drag text in or type a task."
      onNativeText={onAddGeneralTask ? (text) => onAddGeneralTask(makeDroppedTask(text, "gen-drop")) : undefined}
      onDropFromOther={(id) => onMoveToGeneral?.(id)}
      onMoveToOther={onMoveToPool}
      onRemove={onRemoveGeneralTask}
      onReorder={onReorderGeneralTask}
      onAdd={onAddGeneralTask ? (title) => onAddGeneralTask({
        id: `gen-${Date.now()}`, title,
        cognitiveWeight: 0.4, completed: false, category: "moderate", estimatedMinutes: 30,
      }) : undefined}
    />
  );

  if (fullScreen) {
    return (
      <div className="flex h-full">
        <div
          className="px-5 py-5 overflow-y-auto shrink-0"
          style={{ width: 360, borderRight: `1px solid ${FRICTION_COLORS.borderDefault}` }}
        >
          {sessionColumn}
        </div>
        <div className="flex-1 min-w-0 px-5 py-5 overflow-y-auto">
          {laterColumn}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 space-y-8">
      {sessionColumn}
      {laterColumn}
    </div>
  );
}


// ── One ruled task list with its heading and add field ───────

function TaskSection({
  title, list, tasks, emptyText, onNativeText, onDropFromOther,
  onMoveToOther, onRemove, onReorder, onAdd,
}: {
  title: string;
  list: "pool" | "general";
  tasks: PlanTask[];
  emptyText: string;
  onNativeText?: (text: string) => void;
  onDropFromOther: (id: string) => void;
  onMoveToOther?: (id: string) => void;
  onRemove?: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onAdd?: (title: string) => void;
}) {
  const [nativeOver, setNativeOver] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <section
      // Text dragged in from other apps arrives as a native drop.
      onDragOver={(e) => {
        // Task rows dragged by react-dnd carry no plain text; only real text counts.
        if (!onNativeText || !Array.from(e.dataTransfer.types).includes("text/plain")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setNativeOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setNativeOver(false);
      }}
      onDrop={(e) => {
        setNativeOver(false);
        if (!onNativeText) return;
        e.preventDefault();
        const text = e.dataTransfer.getData("text/plain")?.trim();
        if (text) onNativeText(text);
      }}
    >
      <div className="flex items-baseline justify-between mb-1">
        <span style={labelStyle}>{nativeOver ? "Drop to add" : title}</span>
        <span style={{ ...dataStyle, color: FRICTION_COLORS.textMuted }}>{tasks.length}</span>
      </div>

      <OverlayDropZone list={list} onDropFromOther={onDropFromOther} forceHighlight={nativeOver}>
        {tasks.length === 0 ? (
          <div className="py-3" style={{ ...bodyStyle, fontSize: "0.8rem", color: FRICTION_COLORS.textMuted }}>
            {emptyText}
          </div>
        ) : tasks.map((task, i) => (
          <DraggableOverlayTask
            key={task.id}
            task={task}
            index={i}
            list={list}
            onMoveToOther={onMoveToOther}
            onRemove={onRemove}
            onReorder={onReorder}
          />
        ))}
      </OverlayDropZone>

      {onAdd && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = draft.trim();
            if (!value) return;
            onAdd(value);
            setDraft("");
          }}
          className="flex items-center gap-2 mt-1"
          style={{ borderBottom: `1px solid ${FRICTION_COLORS.borderDefault}` }}
        >
          <input {...NO_AUTOFILL}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a task"
            aria-label={`Add a task to ${title}`}
            className="flex-1 min-w-0 py-2 outline-none"
            style={{
              ...bodyStyle,
              fontSize: "0.8rem",
              background: "transparent",
              border: "none",
              caretColor: FRICTION_COLORS.textPrimary,
            }}
          />
          <button
            type="submit"
            aria-label="Add task"
            className="cursor-pointer p-1"
            style={{
              background: "none",
              border: "none",
              lineHeight: 0,
              color: draft.trim() ? FRICTION_COLORS.textPrimary : FRICTION_COLORS.textMuted,
              transition: "color var(--pi-ease-hover)",
            }}
          >
            <Plus size={14} />
          </button>
        </form>
      )}
    </section>
  );
}
