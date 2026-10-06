/**
 * MOON POOL STAGES
 *
 * The pool on the Plan screen shows how heavy the session is. Its colors
 * and particle physics change with density (summed task weight / 3):
 * still -> shallow -> moderate -> dense -> critical.
 *
 * The pool keeps its own violet-to-rose palette on purpose: it is the one
 * licensed break from the ink-on-paper system on this surface.
 */

// ── MOON POOL DENSITY STAGES ────────────────────────────────

export interface PoolStage {
  name: string;
  /** Core gradient colors [center, mid, outer] */
  gradient: [string, string, string];
  /** Particle color */
  particleColor: string;
  /** Particle glow color */
  particleGlow: string;
  /** Border color */
  border: string;
  /** Box shadow (inset glow) */
  innerGlow: string;
  /** Orbit speed multiplier (1 = normal) */
  orbitSpeed: number;
  /** Drift amplitude in px (how far particles wander) */
  driftAmplitude: number;
  /** Ripple opacity */
  rippleOpacity: number;
  /** Ripple speed (duration in seconds) */
  rippleSpeed: number;
  /** Additional ring count */
  extraRings: number;
}

export function getPoolStage(density: number): PoolStage {
  if (density < 0.15) {
    // Stage 0: Still — deep indigo void, near-frozen molecules
    return {
      name: "still",
      gradient: [
        "rgba(16, 18, 42, 0.4)",
        "rgba(10, 14, 30, 0.7)",
        "rgba(6, 10, 20, 0.95)",
      ],
      particleColor: "rgba(107, 95, 255, 0.15)",
      particleGlow: "rgba(107, 95, 255, 0.05)",
      border: "rgba(107, 95, 255, 0.06)",
      innerGlow: "inset 0 0 30px rgba(107, 95, 255, 0.03)",
      orbitSpeed: 0.15,
      driftAmplitude: 0.5,
      rippleOpacity: 0.04,
      rippleSpeed: 10,
      extraRings: 0,
    };
  }
  if (density < 0.35) {
    // Stage 1: Shallow — cool violet gas, gentle molecular drift
    const t = (density - 0.15) / 0.20;
    return {
      name: "shallow",
      gradient: [
        `rgba(50, 40, 130, ${0.06 + t * 0.08})`,
        `rgba(25, 20, 80, ${0.08 + t * 0.06})`,
        "rgba(6, 10, 20, 0.92)",
      ],
      particleColor: `rgba(107, 95, 255, ${0.25 + t * 0.15})`,
      particleGlow: `rgba(107, 95, 255, ${0.08 + t * 0.07})`,
      border: `rgba(107, 95, 255, ${0.08 + t * 0.06})`,
      innerGlow: `inset 0 0 40px rgba(107, 95, 255, ${0.04 + t * 0.04})`,
      orbitSpeed: 0.3 + t * 0.2,
      driftAmplitude: 1 + t * 1.5,
      rippleOpacity: 0.06 + t * 0.04,
      rippleSpeed: 8 - t * 2,
      extraRings: 1,
    };
  }
  if (density < 0.60) {
    // Stage 2: Moderate — bright violet, molecules accelerating
    const t = (density - 0.35) / 0.25;
    return {
      name: "moderate",
      gradient: [
        `rgba(120, 60, 200, ${0.08 + t * 0.1})`,
        `rgba(70, 35, 140, ${0.1 + t * 0.08})`,
        "rgba(6, 10, 20, 0.88)",
      ],
      particleColor: `rgba(176, 109, 255, ${0.3 + t * 0.15})`,
      particleGlow: `rgba(144, 64, 224, ${0.1 + t * 0.08})`,
      border: `rgba(144, 64, 224, ${0.12 + t * 0.08})`,
      innerGlow: `inset 0 0 50px rgba(144, 64, 224, ${0.06 + t * 0.06}), 0 0 20px rgba(144, 64, 224, ${0.03 + t * 0.03})`,
      orbitSpeed: 0.6 + t * 0.5,
      driftAmplitude: 3 + t * 3,
      rippleOpacity: 0.1 + t * 0.06,
      rippleSpeed: 5 - t * 1,
      extraRings: 2,
    };
  }
  if (density < 0.85) {
    // Stage 3: Dense — rose-violet, viscous, heavy
    const t = (density - 0.60) / 0.25;
    return {
      name: "dense",
      gradient: [
        `rgba(217, 74, 120, ${0.12 + t * 0.12})`,
        `rgba(140, 40, 80, ${0.15 + t * 0.1})`,
        `rgba(10, 8, 18, 0.85)`,
      ],
      particleColor: `rgba(255, 95, 143, ${0.35 + t * 0.2})`,
      particleGlow: `rgba(255, 95, 143, ${0.12 + t * 0.1})`,
      border: `rgba(255, 95, 143, ${0.15 + t * 0.1})`,
      innerGlow: `inset 0 0 60px rgba(255, 95, 143, ${0.08 + t * 0.08}), 0 0 25px rgba(255, 95, 143, ${0.04 + t * 0.04})`,
      orbitSpeed: 1.2 + t * 0.8,
      driftAmplitude: 6 + t * 4,
      rippleOpacity: 0.15 + t * 0.05,
      rippleSpeed: 3 - t * 0.5,
      extraRings: 3,
    };
  }
  // Stage 4: Critical — deep rose, chaotic molecular storm
  const t = Math.min(1, (density - 0.85) / 0.15);
  return {
    name: "critical",
    gradient: [
      `rgba(168, 51, 96, ${0.2 + t * 0.15})`,
      `rgba(110, 25, 60, ${0.25 + t * 0.1})`,
      `rgba(10, 5, 12, 0.9)`,
    ],
    particleColor: `rgba(255, 95, 143, ${0.5 + t * 0.3})`,
    particleGlow: `rgba(255, 95, 143, ${0.2 + t * 0.15})`,
    border: `rgba(255, 95, 143, ${0.25 + t * 0.15})`,
    innerGlow: `inset 0 0 80px rgba(255, 95, 143, ${0.15 + t * 0.1}), 0 0 40px rgba(255, 95, 143, ${0.08 + t * 0.06})`,
    orbitSpeed: 2.5 + t * 1.5,
    driftAmplitude: 10 + t * 5,
    rippleOpacity: 0.2,
    rippleSpeed: 2,
    extraRings: 4,
  };
}
