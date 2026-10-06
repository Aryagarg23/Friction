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
// The identity uses flat grounds. This returns "none" so the remaining
// call site (desktop/RefocusPopup) renders flat until it is removed.

export const blueRedGradient = (_opacity: number = 0.15) => "none";
