/**
 * FRICTION STYLE TOKENS
 *
 * Thin JS handles onto the Presentation Identity CSS variables in
 * src/styles/identity.css, so inline styles follow light/dark automatically.
 * Values are var() strings: do not append hex alpha suffixes to them; use
 * color-mix(in srgb, <token> N%, transparent) instead.
 */

import type React from "react";

// ── TYPOGRAPHY ──────────────────────────────────────────────

export const FRICTION_FONTS = {
  heading: "var(--pi-font)",
  body: "var(--pi-font)",
  mono: "var(--pi-font)", // Space Grotesk only; pair with tabular-nums for digits
} as const;

// ── COLOR PALETTE ───────────────────────────────────────────

export const FRICTION_COLORS = {
  // Surfaces
  bgDeep: "var(--pi-ground)",
  bgPrimary: "var(--pi-ground)",
  bgElevated: "var(--pi-surface)",
  bgGlass: "var(--pi-surface)",

  // Former violet scale -> ink and the technical blue
  blue100: "var(--pi-ink)",
  blue200: "var(--pi-ink)",
  blue300: "var(--pi-blue)",
  blue400: "var(--pi-blue)",
  blue500: "var(--pi-blue)",
  blueGlow: "transparent",

  // Former rose scale -> the warning accent
  red100: "var(--pi-hot)",
  red200: "var(--pi-hot)",
  red300: "var(--pi-hot)",
  red400: "var(--pi-hot)",
  red500: "var(--pi-hot)",
  redGlow: "transparent",

  violet300: "var(--pi-ink-60)",
  violet400: "var(--pi-ink-60)",
  violetGlow: "transparent",

  // Text
  textPrimary: "var(--pi-ink)",
  textSecondary: "var(--pi-ink-60)",
  textMuted: "var(--pi-ink-45)",
  textAccent: "var(--pi-blue)",

  // Borders
  borderSubtle: "var(--pi-hairline)",
  borderDefault: "var(--pi-hairline)",
  borderActive: "var(--pi-ink)",
  borderDanger: "var(--pi-hot)",

  // Functional
  success: "var(--pi-ink)",
  warning: "var(--pi-hot)",
  danger: "var(--pi-hot)",
} as const;

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

// ── GRAIN TEXTURE ───────────────────────────────────────────

export const GRAIN_OVERLAY_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  opacity: "calc(var(--pi-grain-opacity) * 0.12)" as unknown as number,
  pointerEvents: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  backgroundSize: "200px 200px",
  zIndex: 0,
};

// ── PANEL ───────────────────────────────────────────────────

export const GLASS_PANEL_STYLE: React.CSSProperties = {
  backgroundColor: FRICTION_COLORS.bgElevated,
  border: `1px solid ${FRICTION_COLORS.borderSubtle}`,
};

// ── SHARED COMPONENT STYLES ─────────────────────────────────

/** Eyebrow label: uppercase, 0.65rem, 0.14em tracking, ink at 60% */
export const labelStyle: React.CSSProperties = {
  fontFamily: FRICTION_FONTS.heading,
  fontSize: "0.65rem",
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: FRICTION_COLORS.textSecondary,
};

export const bodyStyle: React.CSSProperties = {
  fontFamily: FRICTION_FONTS.body,
  fontSize: "0.85rem",
  fontWeight: 400,
  lineHeight: 1.5,
  color: FRICTION_COLORS.textPrimary,
};

/** Numbers that line up in columns */
export const dataStyle: React.CSSProperties = {
  fontFamily: FRICTION_FONTS.mono,
  fontSize: "0.75rem",
  fontWeight: 400,
  fontVariantNumeric: "tabular-nums",
  color: FRICTION_COLORS.textPrimary,
};

export const cardStyle: React.CSSProperties = {
  backgroundColor: FRICTION_COLORS.bgElevated,
  border: `1px solid ${FRICTION_COLORS.borderSubtle}`,
  borderRadius: 0,
};

/** Primary button: ink outline. Pair with className="pi-btn" for the hover invert. */
export const btnPrimaryStyle: React.CSSProperties = {
  fontFamily: FRICTION_FONTS.heading,
  fontSize: "0.75rem",
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: FRICTION_COLORS.textPrimary,
  backgroundColor: "transparent",
  border: `1px solid ${FRICTION_COLORS.textPrimary}`,
  borderRadius: 0,
  cursor: "pointer",
  padding: "8px 14px",
};

/** Ending or stopping something: still ink, never the warning color. */
export const btnDangerStyle: React.CSSProperties = {
  ...btnPrimaryStyle,
  fontSize: "0.65rem",
  padding: "5px 10px",
};

export const taskRowStyle: React.CSSProperties = {
  fontFamily: FRICTION_FONTS.body,
  fontSize: "0.8rem",
  color: FRICTION_COLORS.textPrimary,
  backgroundColor: "transparent",
  borderBottom: `1px solid ${FRICTION_COLORS.borderSubtle}`,
  borderRadius: 0,
  padding: "8px 2px",
};

// ── GRADIENTS ───────────────────────────────────────────────
// The identity uses flat grounds. These return "none" so old call sites
// render flat until they are removed.

export const blueRedGradient = (_opacity: number = 0.15) => "none";
export const vignetteGradient = "none";
