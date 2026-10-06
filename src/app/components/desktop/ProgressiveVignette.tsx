/**
 * PROGRESSIVE VIGNETTE — Fatigue 50%–100%
 *
 * Smooth multi-stop radial gradient + grain dithering to eliminate banding.
 * Mouse moves a "torch" that parts the fog around the cursor.
 * At fatigue 100%: calm "time to rest" message.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useBiometrics } from "../../context/BiometricContext";
import { useSession } from "../../context/SessionContext";
import { useFrictionSettings } from "../../context/FrictionSettingsContext";
import { FRICTION_FONTS, FRICTION_COLORS } from "../friction-app/friction-styles";

interface Props {
  intensity: number; // 0–1
}

// Inline noise SVG data-URI (renders fractal noise for grain dithering)
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

export function ProgressiveVignette({ intensity }: Props) {
  const { current: biometrics } = useBiometrics();
  const { forceScreen } = useSession();
  const { interceptFatigue } = useFrictionSettings();
  const isCritical = biometrics.fatigue_percent > interceptFatigue;
  const [transitioning, setTransitioning] = useState(false);

  // Mouse tracking for fog clearing
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingPos = useRef<{ x: number; y: number } | null>(null);

  // Track mouse via window-level listener so pointer-events stays "none"
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pendingPos.current = { x: e.clientX, y: e.clientY };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (pendingPos.current && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePos({
              x: ((pendingPos.current.x - rect.left) / rect.width) * 100,
              y: ((pendingPos.current.y - rect.top) / rect.height) * 100,
            });
          }
          rafRef.current = null;
        });
      }
    };
    const onLeave = () => setMousePos(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleGoReflect = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    // Wait for the cinematic fade-to-black to complete, then navigate
    setTimeout(() => {
      forceScreen(3);
    }, 1800);
  }, [transitioning, forceScreen]);

  const edgeDarkness = 0.12 + intensity * 0.68;
  const redTint = intensity * 0.10;

  // Multi-stop gradient for ultra-smooth falloff
  const buildVignetteGradient = () => {
    const stops: string[] = [];
    const numStops = 20;
    const clearRadius = Math.max(8, 80 - intensity * 65);
    const fadeEnd = clearRadius + 35 + intensity * 18;

    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      const pos = clearRadius + (fadeEnd - clearRadius) * t;
      const easedT = t * t * (3 - 2 * t); // smoothstep
      const alpha = easedT * edgeDarkness;
      stops.push(`rgba(0, 0, 0, ${alpha.toFixed(4)}) ${pos.toFixed(1)}%`);
    }
    stops.push(`rgba(0, 0, 0, ${edgeDarkness.toFixed(3)}) 100%`);
    return `radial-gradient(ellipse at center, transparent ${clearRadius}%, ${stops.join(", ")})`;
  };

  // Build mask-image: a radial white circle (opaque = visible) with a
  // black hole at the mouse position (transparent = hidden).
  // This cuts a "torch" hole in the vignette where the mouse is.
  const buildMaskImage = () => {
    if (!mousePos) return "none";
    const radius = 10 + (1 - intensity) * 8; // vw units
    return `radial-gradient(circle ${radius}vw at ${mousePos.x}% ${mousePos.y}%, transparent 0%, transparent 30%, black 80%, black 100%)`;
  };

  const maskStyle = mousePos
    ? { WebkitMaskImage: buildMaskImage(), maskImage: buildMaskImage() }
    : {};

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
    >
      {/* ── Main vignette gradient (masked by mouse position) ── */}
      <div
        className="absolute inset-0"
        style={{
          background: buildVignetteGradient(),
          ...maskStyle,
          pointerEvents: "none",
        }}
      />

      {/* ── Grain dithering (always visible, masks banding) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.18 + intensity * 0.32,
          mixBlendMode: "overlay",
          backgroundImage: NOISE_SVG,
          backgroundSize: "200px 200px",
        }}
      />

      {/* ── Subtle red pulse at edges ── */}
      {intensity > 0.2 && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0, intensity * 0.06, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            boxShadow: `inset 0 0 ${50 + intensity * 100}px rgba(255, 95, 143, ${redTint})`,
          }}
        />
      )}

      {/* ── Critical fatigue: gentle rest message ── */}
      {isCritical && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: "rgba(6, 10, 18, 0.6)", pointerEvents: "auto" }}
        >
          {/* ── Cinematic blackout layer — fades to full black when transitioning ── */}
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: transitioning ? 1 : 0 }}
            transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
            style={{
              backgroundColor: "rgba(6, 10, 18, 1)",
              pointerEvents: "none",
            }}
          />

          {/* ── Card + button ── */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={transitioning
              ? { opacity: 0, y: -24, scale: 0.95, filter: "blur(8px)" }
              : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
            }
            transition={transitioning
              ? { duration: 0.9, ease: [0.4, 0, 0.2, 1] }
              : { duration: 0.8, delay: 0.8, ease: "easeOut" }
            }
            className="text-center max-w-sm px-10 py-8 rounded-xl relative overflow-hidden"
            style={{
              backgroundColor: "rgba(10, 16, 30, 0.85)",
              border: `1px solid ${FRICTION_COLORS.borderDefault}`,
              backdropFilter: "blur(20px)",
              boxShadow: `0 8px 40px rgba(0, 0, 0, 0.5), 0 0 1px ${FRICTION_COLORS.blueGlow}`,
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none rounded-xl"
              style={{
                background: `linear-gradient(135deg,
                  rgba(107, 95, 255, 0.06) 0%,
                  transparent 40%,
                  rgba(255, 95, 143, 0.04) 100%
                )`,
              }}
            />
            <div className="flex justify-center mb-5 relative">
              <motion.div
                animate={{
                  scale: [0.85, 1, 1, 0.85, 0.85],
                  opacity: [0.3, 0.6, 0.6, 0.3, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.25, 0.5, 0.75, 1],
                }}
                className="rounded-full"
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: `${FRICTION_COLORS.blue300}10`,
                  border: `1.5px solid ${FRICTION_COLORS.blue300}40`,
                  boxShadow: `0 0 20px ${FRICTION_COLORS.blueGlow}`,
                }}
              />
            </div>
            <div
              className="relative mb-2"
              style={{
                fontSize: "0.85rem",
                color: FRICTION_COLORS.textPrimary,
                fontFamily: FRICTION_FONTS.heading,
                letterSpacing: "0.02em",
              }}
            >
              Time to rest
            </div>
            <div
              className="relative mb-5"
              style={{
                fontSize: "0.65rem",
                color: FRICTION_COLORS.textSecondary,
                fontFamily: FRICTION_FONTS.body,
                lineHeight: 1.6,
              }}
            >
              Your cognitive capacity has been fully spent.
              <br />
              Your workspace is secured. Consider reflecting on your session.
            </div>
            <div
              className="flex gap-4 justify-center relative px-4 py-3 rounded-lg"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                border: `1px solid ${FRICTION_COLORS.borderSubtle}`,
              }}
            >
              <div className="text-center">
                <div
                  className="uppercase tracking-[0.15em] mb-0.5"
                  style={{ fontSize: "0.4rem", color: FRICTION_COLORS.textMuted, fontFamily: FRICTION_FONTS.heading }}
                >
                  Focus
                </div>
                <div className="tabular-nums" style={{ fontSize: "0.75rem", color: FRICTION_COLORS.textMuted, fontFamily: FRICTION_FONTS.heading }}>
                  {Math.round(biometrics.focus_percent * 100)}%
                </div>
              </div>
              <div style={{ width: 1, backgroundColor: FRICTION_COLORS.borderSubtle }} />
              <div className="text-center">
                <div
                  className="uppercase tracking-[0.15em] mb-0.5"
                  style={{ fontSize: "0.4rem", color: FRICTION_COLORS.textMuted, fontFamily: FRICTION_FONTS.heading }}
                >
                  Fatigue
                </div>
                <div className="tabular-nums" style={{ fontSize: "0.75rem", color: FRICTION_COLORS.red300, fontFamily: FRICTION_FONTS.heading }}>
                  {Math.round(biometrics.fatigue_percent * 100)}%
                </div>
              </div>
            </div>

            {/* Go Reflect button */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.6, ease: "easeOut" }}
              onClick={handleGoReflect}
              className="relative mt-5 w-full py-2.5 rounded-lg cursor-pointer transition-all"
              style={{
                fontFamily: FRICTION_FONTS.heading,
                fontSize: "0.6rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                color: FRICTION_COLORS.blue200,
                backgroundColor: "rgba(107, 95, 255, 0.1)",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: FRICTION_COLORS.borderActive,
                boxShadow: `0 0 20px ${FRICTION_COLORS.blueGlow}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(107, 95, 255, 0.18)";
                e.currentTarget.style.boxShadow = `0 0 30px ${FRICTION_COLORS.blueGlow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(107, 95, 255, 0.1)";
                e.currentTarget.style.boxShadow = `0 0 20px ${FRICTION_COLORS.blueGlow}`;
              }}
            >
              Go Reflect
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}