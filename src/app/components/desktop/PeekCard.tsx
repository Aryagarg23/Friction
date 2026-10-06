/**
 * PEEK CARD — Moderate Focus State (0.30–0.80)
 *
 * A small card that peeks ~24px from the bottom-center.
 * Hover reveals the task queue (max ~150px expansion).
 * Below 0.50 focus: the card gently "breathes" (pulses) and
 * shows a box-breathing ball indicator even when collapsed.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "../../context/SessionContext";
import { useFrictionSettings } from "../../context/FrictionSettingsContext";
import { FRICTION_FONTS, FRICTION_COLORS } from "../friction-app/friction-styles";

interface Props {
  focus: number;
}

const PEEK_HEIGHT = 28;
const EXPANDED_HEIGHT = 170;
const BREATH_CYCLE = 8; // seconds

export function PeekCard({ focus }: Props) {
  const { tasks } = useSession();
  const activeTasks = tasks.filter(t => !t.completed);
  const [isHovered, setIsHovered] = useState(false);

  const { breathingVisualizer } = useFrictionSettings();
  const isBreathing = breathingVisualizer && focus <= 0.50;

  // Breathing ball phase calculation
  const breathPhase = useMemo(() => {
    // Returns a function that components can call to get current phase
    return { duration: BREATH_CYCLE };
  }, []);

  if (activeTasks.length === 0) return null;

  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2"
      style={{
        bottom: 52, // above dock
        zIndex: 7200,
        width: 260,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={{
          height: isHovered ? EXPANDED_HEIGHT : PEEK_HEIGHT,
          // Breathing pulse on the card when focus < 0.50
          ...(isBreathing && !isHovered
            ? { y: [0, -4, 0, -1, 0] }
            : { y: 0 }),
        }}
        transition={
          isBreathing && !isHovered
            ? {
                y: {
                  duration: BREATH_CYCLE,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.25, 0.5, 0.75, 1],
                },
                height: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
              }
            : {
                height: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
              }
        }
        className="overflow-hidden rounded-t-xl"
        style={{
          backgroundColor: "rgba(10, 15, 26, 0.65)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${FRICTION_COLORS.borderSubtle}`,
          borderBottom: "none",
          boxShadow: `0 -4px 20px rgba(0, 0, 0, 0.3), 0 0 1px ${FRICTION_COLORS.blueGlow}`,
        }}
      >
        {/* ── Peek strip (always visible) ── */}
        <div
          className="flex items-center justify-center gap-2 px-4"
          style={{ height: PEEK_HEIGHT }}
        >
          {/* Breathing ball (only when focus < 0.50) */}
          {isBreathing && <BreathingBall />}

          {/* Pill grab indicator */}
          <div
            className="rounded-full"
            style={{
              width: 28,
              height: 3,
              backgroundColor: FRICTION_COLORS.borderDefault,
            }}
          />

          {/* Task count */}
          <span
            style={{
              fontSize: "0.5rem",
              color: FRICTION_COLORS.textMuted,
              fontFamily: FRICTION_FONTS.heading,
              letterSpacing: "0.1em",
            }}
          >
            {activeTasks.length}
          </span>
        </div>

        {/* ── Expanded task list ── */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="px-3 pb-2 space-y-1"
            >
              <div
                className="uppercase tracking-[0.15em] px-1 pb-1.5"
                style={{
                  fontSize: "0.4rem",
                  color: FRICTION_COLORS.textMuted,
                  fontFamily: FRICTION_FONTS.heading,
                  borderBottom: `1px solid ${FRICTION_COLORS.borderSubtle}`,
                }}
              >
                Queue
              </div>
              {activeTasks.slice(0, 5).map((task, i) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 px-1.5 py-1 rounded-md"
                  style={{
                    backgroundColor:
                      i === 0 ? `${FRICTION_COLORS.blue300}08` : "transparent",
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        i === 0
                          ? FRICTION_COLORS.blue300
                          : task.category === "deep"
                          ? FRICTION_COLORS.red300
                          : task.category === "moderate"
                          ? FRICTION_COLORS.violet300
                          : FRICTION_COLORS.blue400,
                      opacity: i === 0 ? 1 : 0.5,
                    }}
                  />
                  <span
                    className="truncate"
                    style={{
                      fontSize: "0.6rem",
                      color:
                        i === 0
                          ? FRICTION_COLORS.textPrimary
                          : FRICTION_COLORS.textMuted,
                      fontFamily: FRICTION_FONTS.body,
                    }}
                  >
                    {task.title}
                  </span>
                  {i === 0 && (
                    <span
                      className="ml-auto shrink-0"
                      style={{
                        fontSize: "0.4rem",
                        color: FRICTION_COLORS.blue300,
                        fontFamily: FRICTION_FONTS.heading,
                        letterSpacing: "0.1em",
                      }}
                    >
                      ACTIVE
                    </span>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── Breathing Ball ──
// A small circle that scales with the 8s box breathing cycle.
function BreathingBall() {
  return (
    <motion.div
      animate={{
        scale: [0.6, 1, 1, 0.6, 0.6],
        opacity: [0.4, 0.8, 0.8, 0.4, 0.4],
      }}
      transition={{
        duration: BREATH_CYCLE,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.25, 0.5, 0.75, 1],
      }}
      className="rounded-full shrink-0"
      style={{
        width: 8,
        height: 8,
        backgroundColor: FRICTION_COLORS.blue300,
        boxShadow: `0 0 6px ${FRICTION_COLORS.blueGlow}`,
      }}
    />
  );
}
