# Friction OS Daemon — Implementation TODO

Based on `/src/imports/friction-os-daemon-spec.md` and outstanding bugs.

---

## Phase 0: Fixes & Polish (Pre-Spec)
- [x] **T0.1** Windows Vista wallpaper — replace gradient background in DesktopOS with Unsplash rolling-hills image
- [x] **T0.2** Window.tsx — replace macOS traffic-light buttons with Windows-style minimize/maximize/close
- [x] **T0.3** ProgressiveVignette prop mismatch — DesktopOS passes `intensity` but component expects `biometrics: BiometricState`
- [x] **T0.4** Settings Friction toggles — FrictionSettingsContext now drives the effects. Sensitivity and Recovery Duration are still not wired.

## Phase 1: Core Layout — Right-Side Drawer (Spec Part 1)
- [x] **T1.1** Build `FrictionDrawer` — retractable right-edge drawer (25-30% width), integrated into FrictionOverlay
- [x] **T1.2** Idle state: shows thin glowing edge, expands on hover/click
- [x] **T1.3** Drawer houses Screen 1 (Terminal/Moon Pool) or Screen 3 (Mirror) when idle, toggle between them

## Phase 2: Screen 1 — The Terminal / Moon Pool (Spec Part 2)
- [x] **T2.1** Moon Pool canvas — fluid radial gradient visualization with floating task nodes
- [x] **T2.2** Task list display in pool — tasks shown as glowing nodes with cognitive weight
- [x] **T2.3** Session duration boundary — slider for time setting (15-120 min)
- [x] **T2.4** "Immerse" button — starts session, retracts drawer, transitions to Screen 2

## Phase 3: Screen 2 — The Scaffolding / Active Session (Spec Part 3)
- [x] **T3.1** State 2.1: Pure Invisibility — Focus > 80%, Fatigue < 40% = fully transparent OS
- [x] **T3.2** State 2.2: Edge-Bump — mouse to far right edge peeks minimalist drawer with active task nodes
- [x] **T3.3** State 2.3: Passive Task Bar — Focus 50-80% = floating pill widget at top-center with current task name
- [x] **T3.4** State 2.4: Low Focus Pivot — Focus < 50% + Fatigue rising = full-screen blur + 3 intervention bubbles (Breathe/Posture/Audio Shift)
- [x] **T3.5** State 2.5: Digital Moss — already built (DigitalMoss.tsx), fixed prop mismatch (onComplete→onClear)
- [x] **T3.6** State 2.6: Hard Intercept — Fatigue > 85% = vignette + lockout modal (ProgressiveVignette.tsx, now uses useBiometrics internally)

## Phase 4: Session Termination & Handoff (Spec Part 4)
- [x] **T4.1** End Session button in overlay footer
- [ ] **T4.2** Condition A: Time out + high energy + tasks remaining = soft notification
- [ ] **T4.3** Condition B: Time out + tasks done = celebratory notification
- [x] **T4.4** On session end: drawer auto-slides out with Screen 3 (Mirror)

## Phase 5: Screen 3 — The Mirror / Reflection (Spec Part 5)
- [x] **T5.1** Vertical "Depth of Field" timeline — bar chart with blur based on focus, sharp for high focus
- [x] **T5.2** Completed/remaining task lists
- [x] **T5.3** Session insight text based on completion rate

## Phase 6: Reflection Component — Full Rewrite of Mirror (Spec v2)

Replaces the existing MirrorPage/MirrorScreen with a 3-sub-screen Reflection flow.
All screens use Calm Authority palette (FRICTION_COLORS, Space Grotesk, glassmorphism, grain).

### 6A — Data Layer & Shared Scaffolding
- [x] **T6.1** Create `reflection-data.ts` — hardcoded fake session data (8 sessions, Feb 28–Mar 8 2026), per-session tasks with intensity/duration, bar chart Mon–Sun data, donut split 42/34/24
- [x] **T6.2** Create `ReflectionPage.tsx` — top-level component with 3 internal sub-tabs (Recap / History / Detail), replaces current MirrorScreen content in FrictionOverlay
- [x] **T6.3** Wire into FrictionOverlay — swap MirrorScreen for ReflectionPage when `drawerScreen === "mirror"`

### 6B — Screen 1: Latest Session Recap
- [x] **T6.4** Task list — completed session tasks with intensity badge (High/Moderate/Low) + duration per task
- [x] **T6.5** Free-text reflection textarea — "What went well?" with local state persistence across tab switches
- [x] **T6.6** Navigation buttons to Session History (Screen 2)
- [x] **T6.7** Pull latest session tasks from SessionContext.tasks if available, fall back to hardcoded data

### 6C — Screen 2: Session History
- [x] **T6.8** Three summary stat cards — intensity donut, session count, deep work hours — clickable to drill into Screen 3
- [x] **T6.9** Bespoke SVG donut chart for intensity distribution
- [x] **T6.10** Recent sessions list (8 entries) — date, duration, task count, intensity level
- [x] **T6.11** Radial clock — hour-of-day intensity heatmap (SVG, 9 AM–noon peaks)
- [x] **T6.12** 7-day bar chart — per-day session intensity (Mon–Sun)

### 6D — Screen 3: Session Detail (Drill-Down)
- [x] **T6.13** Left panel — time-range selector (Today / Last Month / This Year / Custom) + chart area that swaps based on which stat card was tapped
- [x] **T6.14** Chart views: intensity donut / pulsing orb with session count / bar chart with total hours
- [x] **T6.15** Right panel — 4 mini-stat tiles (WoW intensity, daily avg hours, sessions completed, peak day)
- [x] **T6.16** Right panel — 2 paragraphs of pattern insight text + recommendation box — contextual per stat card
- [x] **T6.17** Back button returns to Screen 2 + view switcher pills

### 6E — Polish & Integration
- [x] **T6.18** Responsive layout — works at both 45% drawer width (squished) and full-screen (expanded)
- [x] **T6.19** Motion entrance animations (staggered fade-in on cards, charts, animated SVG arcs)
- [x] **T6.20** Calm Authority palette consistency — all charts, cards, labels use FRICTION_COLORS/FONTS
- [ ] **T6.21** Remove old MirrorPage.tsx if no longer referenced anywhere
- [ ] **T6.22** Visual QA — verify all 3 sub-screens at both drawer widths

---

### ⚠️ RESOLVED — Cross-question answers applied:
- Q1: Replaces MirrorScreen entirely ✓
- Q3: Support both squished (45%) and expanded (100%) with adaptive layouts ✓
- Q5: Bespoke SVG charts (no recharts) ✓
- Q7: Pull tasks from SessionContext, fallback to hardcoded ✓
- Q10: Right panel is contextual — changes based on stat card selection ✓