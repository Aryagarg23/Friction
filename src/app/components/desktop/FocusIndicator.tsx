/**
 * FOCUS INDICATOR — Unified pill ↔ peek card (both at TOP)
 *
 * Breathing uses a global RAF clock (useGlobalBreath) so all Friction
 * components breathe in perfect sync. Direct DOM manipulation via refs
 * keeps it at 60fps with zero React re-renders.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { useSession } from "../../context/SessionContext";
import { useFrictionSettings } from "../../context/FrictionSettingsContext";
import { FRICTION_FONTS, FRICTION_COLORS, GRAIN_OVERLAY_STYLE } from "../friction-app/friction-styles";
import { useGlobalBreath } from "./useGlobalBreath";

interface Props {
  focus: number;
}

const PEEK_HEIGHT = 28;
const BREATH_AMPLITUDE = 10;
const EXPANDED_HEIGHT = 175;

export function FocusIndicator({ focus }: Props) {
  const { tasks, triggerStrike, completeTask } = useSession();
  const activeTasks = tasks.filter(t => !t.completed);
  const currentTask = activeTasks[0];
  const nextTask = activeTasks[1];

  const isPill = focus > 0.80;
  const { breathingVisualizer } = useFrictionSettings();
  const isBreathing = breathingVisualizer && focus <= 0.50;

  // Pill hover state
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [shredding, setShredding] = useState(false);
  const [shredChars, setShredChars] = useState<
    { char: string; x: number; y: number; rot: number; delay: number }[]
  >([]);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Peek hover state — ref updated SYNCHRONOUSLY to avoid RAF race
  const [peekHovered, setPeekHovered] = useState(false);
  const peekHoveredRef = useRef(false);

  // ── Direct DOM refs for breathing ──
  const cardRef = useRef<HTMLDivElement>(null);
  const grabBarRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);

  // ── Global breath clock (only active when breathing & in peek mode) ──
  const breath = useGlobalBreath(isBreathing && !isPill);

  const handlePeekEnter = useCallback(() => {
    peekHoveredRef.current = true;
    const card = cardRef.current;
    if (card) {
      // Restore normal styles — clear all RAF-driven overrides
      card.style.clipPath = "";
      card.style.backdropFilter = "blur(20px)";
      card.style.WebkitBackdropFilter = "blur(20px)";
      card.style.borderColor = "";
      card.style.boxShadow = "";
      card.style.transition = "height 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
    }
    if (grabBarRef.current) grabBarRef.current.style.backgroundColor = "";
    if (grainRef.current) grainRef.current.style.opacity = "";
    if (washRef.current) washRef.current.style.background = "";
    setPeekHovered(true);
  }, []);

  const handlePeekLeave = useCallback(() => {
    peekHoveredRef.current = false;
    const card = cardRef.current;
    if (card) {
      // Remove CSS transition so RAF takes over immediately with no fight
      card.style.transition = "none";
      // Disable expensive backdrop blur during breathing — RAF drives visuals
      if (isBreathing) {
        card.style.backdropFilter = "none";
        card.style.WebkitBackdropFilter = "none";
      }
    }
    setPeekHovered(false);
  }, [isBreathing]);

  // ── Breathing DOM update loop (reads global breath ref, writes to DOM) ──
  useEffect(() => {
    if (!isBreathing || isPill) return;

    // Disable backdrop blur for the duration of breathing — it forces
    // expensive re-compositing on every frame when height/clip changes.
    const card = cardRef.current;
    if (card) {
      card.style.backdropFilter = "none";
      card.style.WebkitBackdropFilter = "none";
    }

    let raf: number;
    const tick = () => {
      const b = breath.current;
      const t = b.t;
      const r = b.color[0];
      const g = b.color[1];
      const bl = b.color[2];

      const card = cardRef.current;
      const bar = grabBarRef.current;
      const grain = grainRef.current;
      const wash = washRef.current;

      if (card && !peekHoveredRef.current) {
        // Use clip-path instead of height to avoid layout reflow.
        // Card stays at fixed height; clip reveals/hides the bottom portion.
        const clipBottom = (1 - t) * BREATH_AMPLITUDE;
        card.style.clipPath = `inset(0px 0px ${clipBottom}px 0px round 0 0 12px 12px)`;
        card.style.borderColor = `rgba(${r},${g},${bl},0.25)`;

        if (t > 0.5) {
          const s1 = 14 + t * 8;
          const a1 = (0.08 + t * 0.15).toFixed(2);
          const s2 = 28 + t * 12;
          const a2 = (t * 0.06).toFixed(2);
          card.style.boxShadow =
            `0 0 ${s1}px rgba(255,95,143,${a1}),0 0 ${s2}px rgba(255,95,143,${a2})`;
        } else {
          const inv = 1 - t;
          const s1 = 14 + inv * 8;
          const a1 = (0.08 + inv * 0.15).toFixed(2);
          const s2 = 28 + inv * 12;
          const a2 = (inv * 0.06).toFixed(2);
          card.style.boxShadow =
            `0 0 ${s1}px rgba(107,95,255,${a1}),0 0 ${s2}px rgba(107,95,255,${a2})`;
        }

        if (bar) bar.style.backgroundColor = `rgba(${r},${g},${bl},0.38)`;
        if (grain) grain.style.opacity = String(0.2 + t * 0.25);
        if (wash) {
          wash.style.background =
            `linear-gradient(180deg,rgba(${r},${g},${bl},0.04) 0%,transparent 70%)`;
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // Restore backdrop blur when breathing stops
      if (card) {
        card.style.backdropFilter = "blur(20px)";
        card.style.WebkitBackdropFilter = "blur(20px)";
        card.style.clipPath = "";
      }
    };
  }, [isBreathing, isPill, breath]);

  // ── Pill hover handlers ──
  const handlePillEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => setHoverExpanded(true), 1000);
  }, []);
  const handlePillLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHoverExpanded(false);
  }, []);

  const handleStrike = useCallback(() => {
    if (!currentTask) return;
    const chars = currentTask.title.split("").map((char, i) => ({
      char,
      x: (Math.random() - 0.5) * 600,
      y: (Math.random() - 0.5) * 400 - 100,
      rot: (Math.random() - 0.5) * 720,
      delay: i * 0.015,
    }));
    setShredChars(chars);
    setShredding(true);
    // Actually complete the task so the list advances
    completeTask(currentTask.id);
    const next = nextTask?.title || "Session complete";
    triggerStrike(currentTask.title, next);
    setTimeout(() => {
      setShredding(false);
      setShredChars([]);
      setHoverExpanded(false);
    }, 1200);
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
      }}
    >
      <AnimatePresence mode="wait">
        {isPill ? (
          /* ════════════════════════════════════════
           *  PILL MODE (focus > 0.80)
           * ════════════════════════════════════════ */
          shredding ? (
            <motion.div
              key="shred"
              className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-full"
              style={{
                marginTop: 20,
                backgroundColor: "rgba(10, 15, 26, 0.55)",
                backdropFilter: "blur(20px)",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: FRICTION_COLORS.borderSubtle,
                minWidth: 200,
                overflow: "visible",
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 0.4 }}
                style={{ backgroundColor: FRICTION_COLORS.blue300, filter: "blur(8px)" }}
              />
              <div className="relative" style={{ height: 18 }}>
                {shredChars.map((c, i) => (
                  <motion.span
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                    animate={{ x: c.x, y: c.y, opacity: 0, rotate: c.rot, scale: 0.2 }}
                    transition={{ duration: 0.8, delay: c.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="inline-block"
                    style={{
                      fontSize: "0.7rem",
                      color: FRICTION_COLORS.textPrimary,
                      fontFamily: FRICTION_FONTS.body,
                      position: "absolute",
                      left: `${i * 0.55}em`,
                      filter: "blur(0.5px)",
                    }}
                  >
                    {c.char}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="pill"
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex items-center gap-2.5 rounded-full"
              style={{
                marginTop: 20,
                backgroundColor: "rgba(10, 15, 26, 0.55)",
                backdropFilter: "blur(20px)",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: FRICTION_COLORS.borderSubtle,
                boxShadow: `0 4px 24px rgba(0, 0, 0, 0.3), 0 0 1px ${FRICTION_COLORS.blueGlow}`,
                padding: "8px 18px",
                cursor: "default",
              }}
              onMouseEnter={handlePillEnter}
              onMouseLeave={handlePillLeave}
            >
              <AnimatePresence>
                {hoverExpanded && (
                  <motion.button
                    initial={{ width: 0, opacity: 0, scale: 0.5 }}
                    animate={{ width: 22, opacity: 1, scale: 1 }}
                    exit={{ width: 0, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    onClick={handleStrike}
                    className="flex items-center justify-center rounded-full shrink-0 cursor-pointer overflow-hidden"
                    style={{
                      width: 22, height: 22,
                      backgroundColor: `${FRICTION_COLORS.blue300}15`,
                      borderWidth: 1.5,
                      borderStyle: "solid",
                      borderColor: FRICTION_COLORS.borderActive,
                    }}
                    whileHover={{ backgroundColor: `${FRICTION_COLORS.blue300}30`, borderColor: FRICTION_COLORS.blue300 }}
                    whileTap={{ scale: 0.85 }}
                  >
                    <Check size={12} style={{ color: FRICTION_COLORS.blue300 }} />
                  </motion.button>
                )}
              </AnimatePresence>

              <motion.div
                animate={{ opacity: [0.3, 0.65, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: FRICTION_COLORS.blue300 }}
              />

              <span
                className="truncate"
                style={{
                  fontSize: "0.7rem",
                  color: FRICTION_COLORS.textSecondary,
                  maxWidth: "300px",
                  fontFamily: FRICTION_FONTS.body,
                  letterSpacing: "0.02em",
                }}
              >
                {currentTask?.title}
              </span>
            </motion.div>
          )
        ) : (
          /* ════════════════════════════════════════
           *  PEEK MODE (focus 0.30–0.80) — flush with top
           * ════════════════════════════════════════ */
          <motion.div
            key="peek"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: 280 }}
            onMouseEnter={handlePeekEnter}
            onMouseLeave={handlePeekLeave}
          >
            <div
              ref={cardRef}
              className="overflow-hidden relative"
              style={{
                // When breathing, card is at max breath height; clip-path handles the "shrink".
                // When hovered, expands to full EXPANDED_HEIGHT.
                // Otherwise, collapsed to PEEK_HEIGHT.
                height: peekHovered
                  ? EXPANDED_HEIGHT
                  : isBreathing
                  ? PEEK_HEIGHT + BREATH_AMPLITUDE
                  : PEEK_HEIGHT,
                backgroundColor: "rgba(10, 15, 26, 0.75)",
                backdropFilter: "blur(20px)",
                borderTopWidth: 0,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderBottomWidth: 1,
                borderStyle: "solid",
                borderColor: FRICTION_COLORS.borderSubtle,
                borderRadius: "0 0 12px 12px",
                boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 1px ${FRICTION_COLORS.blueGlow}`,
                // NO CSS transitions during breathing — RAF drives all properties directly.
                // Hover enter/leave handlers set transition imperatively via cardRef.
                transition: "none",
                willChange: isBreathing ? "clip-path, box-shadow, border-color" : undefined,
              }}
            >
              {/* Grain overlay */}
              <div
                ref={grainRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                  ...GRAIN_OVERLAY_STYLE,
                  opacity: 0.2,
                  borderRadius: "0 0 12px 12px",
                }}
              />

              {/* Breathing color wash */}
              <div
                ref={washRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "transparent",
                  borderRadius: "0 0 12px 12px",
                }}
              />

              {/* ── Peek strip (always visible) ── */}
              <div
                className="flex items-center justify-center gap-3 px-4 relative"
                style={{ height: PEEK_HEIGHT }}
              >
                <div
                  ref={grabBarRef}
                  className="rounded-full"
                  style={{
                    width: 32,
                    height: 3,
                    backgroundColor: FRICTION_COLORS.borderDefault,
                  }}
                />

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
                {peekHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="px-3 pb-2 space-y-1 relative"
                  >
                    <div
                      className="uppercase tracking-[0.15em] px-1 pb-1.5"
                      style={{
                        fontSize: "0.4rem",
                        color: FRICTION_COLORS.textMuted,
                        fontFamily: FRICTION_FONTS.heading,
                        borderBottomWidth: 1,
                        borderBottomStyle: "solid" as const,
                        borderBottomColor: FRICTION_COLORS.borderSubtle,
                      }}
                    >
                      Queue
                    </div>
                    {activeTasks.slice(0, 5).map((task, i) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 px-1.5 py-1 rounded-md"
                        style={{
                          backgroundColor: i === 0 ? `${FRICTION_COLORS.blue300}08` : "transparent",
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
                            color: i === 0 ? FRICTION_COLORS.textPrimary : FRICTION_COLORS.textMuted,
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}