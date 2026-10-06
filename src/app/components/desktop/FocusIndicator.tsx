/**
 * FOCUS INDICATOR — task strip at top center
 *
 * focus > 0.80: a thin strip with the current task. Hold the pointer on it
 *   for 1s and a "done" button appears (the tactile strike).
 * focus 0.30–0.80: a short peek tab with the task count. Hover to see the list.
 *   At focus <= 0.50 (and the breathing setting on) a small ball breathes in
 *   the tab, driven by the shared 8s breath clock (useGlobalBreath). The RAF
 *   writes straight to the SVG so React does not re-render each frame.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { useSession } from "../../context/SessionContext";
import { useFrictionSettings } from "../../context/FrictionSettingsContext";
import { useGlobalBreath } from "./useGlobalBreath";

interface Props {
  focus: number;
}

const PEEK_HEIGHT = 28;
const EXPANDED_HEIGHT = 175;
const BALL_MIN = 2.5;
const BALL_MAX = 5.5;
const EASE_FOCUS = [0.32, 0.72, 0, 1] as const;

export function FocusIndicator({ focus }: Props) {
  const { tasks, triggerStrike, completeTask } = useSession();
  const activeTasks = tasks.filter(t => !t.completed);
  const currentTask = activeTasks[0];
  const nextTask = activeTasks[1];

  const isPill = focus > 0.80;
  const { breathingVisualizer } = useFrictionSettings();
  const isBreathing = breathingVisualizer && focus <= 0.50;

  const [hoverExpanded, setHoverExpanded] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [peekHovered, setPeekHovered] = useState(false);

  const ballRef = useRef<SVGCircleElement>(null);
  const breath = useGlobalBreath(isBreathing && !isPill);

  // Breathing ball: radius and opacity follow the shared breath value.
  useEffect(() => {
    if (!isBreathing || isPill) return;
    let raf: number;
    const tick = () => {
      const t = breath.current.t;
      const ball = ballRef.current;
      if (ball) {
        ball.setAttribute("r", (BALL_MIN + t * (BALL_MAX - BALL_MIN)).toFixed(2));
        ball.style.opacity = (0.45 + t * 0.4).toFixed(2);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isBreathing, isPill, breath]);

  const handlePillEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => setHoverExpanded(true), 1000);
  }, []);
  const handlePillLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHoverExpanded(false);
  }, []);

  const handleStrike = useCallback(() => {
    if (!currentTask) return;
    completeTask(currentTask.id);
    triggerStrike(currentTask.title, nextTask?.title || "No more tasks");
    setHoverExpanded(false);
  }, [currentTask, nextTask, triggerStrike, completeTask]);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  if (!currentTask && isPill) return null;
  if (activeTasks.length === 0 && !isPill) return null;

  return (
    <div
      className="absolute"
      style={{
        zIndex: 7500,
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        fontFamily: "var(--pi-font)",
      }}
    >
      <AnimatePresence mode="wait">
        {isPill ? (
          /* ── Strip (focus > 0.80) ── */
          <motion.div
            key="pill"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.34, ease: EASE_FOCUS }}
            className="flex items-center gap-2.5"
            style={{
              marginTop: 12,
              backgroundColor: "var(--pi-surface)",
              border: "1px solid var(--pi-hairline)",
              padding: "6px 12px",
              cursor: "default",
            }}
            onMouseEnter={handlePillEnter}
            onMouseLeave={handlePillLeave}
          >
            {hoverExpanded && (
              <button
                onClick={handleStrike}
                aria-label="Mark task done"
                title="Mark done"
                className="flex items-center justify-center shrink-0 cursor-pointer text-[color:var(--pi-ink)] hover:bg-[var(--pi-ink)] hover:text-[color:var(--pi-ground)]"
                style={{
                  width: 20,
                  height: 20,
                  border: "1px solid var(--pi-ink)",
                  transition: "background-color var(--pi-ease-hover), color var(--pi-ease-hover)",
                }}
              >
                <Check size={12} />
              </button>
            )}
            <span className="pi-label shrink-0">Now</span>
            <span
              className="truncate"
              style={{ fontSize: "0.72rem", color: "var(--pi-ink)", maxWidth: "300px" }}
            >
              {currentTask?.title}
            </span>
          </motion.div>
        ) : (
          /* ── Peek tab (focus 0.30–0.80) ── */
          <motion.div
            key="peek"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.34, ease: EASE_FOCUS }}
            style={{ width: 280 }}
            onMouseEnter={() => setPeekHovered(true)}
            onMouseLeave={() => setPeekHovered(false)}
          >
            <div
              className="overflow-hidden"
              style={{
                height: peekHovered ? EXPANDED_HEIGHT : PEEK_HEIGHT,
                backgroundColor: "var(--pi-surface)",
                borderLeft: "1px solid var(--pi-hairline)",
                borderRight: "1px solid var(--pi-hairline)",
                borderBottom: "1px solid var(--pi-hairline)",
                transition: "height var(--pi-ease-focus)",
              }}
            >
              <div
                className="flex items-center justify-center gap-2 px-4"
                style={{ height: PEEK_HEIGHT }}
              >
                {isBreathing && (
                  <svg width={BALL_MAX * 2 + 2} height={BALL_MAX * 2 + 2} aria-hidden="true">
                    <circle
                      ref={ballRef}
                      cx={BALL_MAX + 1}
                      cy={BALL_MAX + 1}
                      r={BALL_MIN}
                      fill="var(--pi-ink)"
                    />
                  </svg>
                )}
                <span
                  className="pi-label"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {activeTasks.length} {activeTasks.length === 1 ? "task" : "tasks"}
                </span>
              </div>

              {peekHovered && (
                <div className="px-3 pb-2">
                  {activeTasks.slice(0, 5).map((task, i) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 py-1"
                      style={{ borderTop: "1px solid var(--pi-hairline)" }}
                    >
                      <span
                        className="truncate"
                        style={{
                          fontSize: "0.7rem",
                          color: i === 0 ? "var(--pi-ink)" : "var(--pi-ink-60)",
                        }}
                      >
                        {task.title}
                      </span>
                      {i === 0 && <span className="pi-label ml-auto shrink-0">Now</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
