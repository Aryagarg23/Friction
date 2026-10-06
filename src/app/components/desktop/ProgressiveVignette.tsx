/**
 * PROGRESSIVE VIGNETTE — Fatigue 50%–100%
 *
 * Edges darken toward ink as fatigue rises, with a faint hot tint at the
 * far edge. Grain dithers the gradient so it does not band. The fog clears
 * in a circle around the pointer. Above the intercept threshold a lockout
 * card asks the user to stop and links to the recap (screen 3).
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { useBiometrics } from "../../context/BiometricContext";
import { useSession } from "../../context/SessionContext";
import { useFrictionSettings } from "../../context/FrictionSettingsContext";

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
    // Fade the screen out, then go to the recap
    setTimeout(() => {
      forceScreen(3);
    }, 1800);
  }, [transitioning, forceScreen]);

  const edgeDarkness = 0.12 + intensity * 0.68;
  // Share of hot mixed into the ink at the edge (0–15%)
  const hotShare = intensity * 15;
  const edgeColor = (alpha: number) =>
    `color-mix(in srgb, color-mix(in srgb, var(--pi-hot) ${hotShare.toFixed(1)}%, var(--pi-shade)) ${(alpha * 100).toFixed(2)}%, transparent)`;

  // Multi-stop gradient for a smooth falloff
  const buildVignetteGradient = () => {
    const stops: string[] = [];
    const numStops = 20;
    const clearRadius = Math.max(8, 80 - intensity * 65);
    const fadeEnd = clearRadius + 35 + intensity * 18;

    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      const pos = clearRadius + (fadeEnd - clearRadius) * t;
      const easedT = t * t * (3 - 2 * t); // smoothstep
      stops.push(`${edgeColor(easedT * edgeDarkness)} ${pos.toFixed(1)}%`);
    }
    stops.push(`${edgeColor(edgeDarkness)} 100%`);
    return `radial-gradient(ellipse at center, transparent ${clearRadius}%, ${stops.join(", ")})`;
  };

  // Mask with a hole at the pointer so the fog clears around it
  const buildMaskImage = () => {
    if (!mousePos) return "none";
    const radius = 10 + (1 - intensity) * 8; // vw units
    return `radial-gradient(circle ${radius}vw at ${mousePos.x}% ${mousePos.y}%, transparent 0%, transparent 30%, black 80%, black 100%)`;
  };

  const maskStyle = mousePos
    ? { WebkitMaskImage: buildMaskImage(), maskImage: buildMaskImage() }
    : {};

  const focusPct = Math.round(biometrics.focus_percent * 100);
  const fatiguePct = Math.round(biometrics.fatigue_percent * 100);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ fontFamily: "var(--pi-font)" }}
    >
      {/* Vignette (masked around the pointer) */}
      <div
        className="absolute inset-0"
        style={{
          background: buildVignetteGradient(),
          ...maskStyle,
          pointerEvents: "none",
        }}
      />

      {/* Grain dithering, scaled by the theme's grain strength */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: `calc(var(--pi-grain-opacity) * ${(0.12 + intensity * 0.2).toFixed(3)})` as unknown as number,
          mixBlendMode: "overlay",
          backgroundImage: NOISE_SVG,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Lockout above the intercept threshold */}
      {isCritical && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backgroundColor: "color-mix(in srgb, var(--pi-ground) 75%, transparent)",
            pointerEvents: "auto",
          }}
        >
          {/* Fades the whole screen to ground before the recap opens */}
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: transitioning ? 1 : 0 }}
            transition={{ duration: 1.4, ease: [0.32, 0.72, 0, 1] }}
            style={{ backgroundColor: "var(--pi-ground)", pointerEvents: "none" }}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: transitioning ? 0 : 1 }}
            transition={{ duration: transitioning ? 0.6 : 0.34, ease: [0.32, 0.72, 0, 1] }}
            className="relative"
            style={{
              width: 320,
              padding: 24,
              backgroundColor: "var(--pi-surface)",
              border: "1px solid var(--pi-hairline)",
              color: "var(--pi-ink)",
            }}
          >
            <div style={{ fontSize: "1rem", fontWeight: 500, marginBottom: 6 }}>
              Time to stop.
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--pi-ink-60)", lineHeight: 1.5, marginBottom: 20 }}>
              You are too tired to keep working well. Take a break.
            </div>

            <div
              className="flex"
              style={{
                borderTop: "1px solid var(--pi-hairline)",
                borderBottom: "1px solid var(--pi-hairline)",
                marginBottom: 20,
              }}
            >
              <div className="flex-1" style={{ padding: "10px 0" }}>
                <div className="pi-label mb-1">Focus</div>
                <div style={{ fontSize: "1rem", fontVariantNumeric: "tabular-nums" }}>{focusPct}%</div>
              </div>
              <div style={{ width: 1, backgroundColor: "var(--pi-hairline)" }} />
              <div className="flex-1" style={{ padding: "10px 0 10px 16px" }}>
                <div className="pi-label mb-1">Fatigue</div>
                <div style={{ fontSize: "1rem", fontVariantNumeric: "tabular-nums", color: "var(--pi-hot)" }}>
                  {fatiguePct}%
                </div>
              </div>
            </div>

            <button onClick={handleGoReflect} className="pi-btn w-full">
              See recap
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
