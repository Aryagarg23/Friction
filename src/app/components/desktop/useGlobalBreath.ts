/**
 * useGlobalBreath — single global RAF clock for breathing animation.
 *
 * Returns a ref whose `.current` is the eased breath value (0→1→0)
 * on an 8-second cycle, synced across every consumer via absolute time.
 * 8s is a real breath (4s in, 4s out), so it stays longer than the
 * 2.5-3.5s idle loops used elsewhere.
 *
 * Uses a raised-cosine + smoothstep for C∞ smooth easing with
 * natural plateau holds at peaks and troughs.
 *
 * The RAF runs only while at least one component is subscribed.
 *
 * PERF: The global tick directly mutates a single shared BreathState
 * object — no intermediate RAF, no per-frame allocations. Consumers
 * read the same object reference so there is zero copy overhead.
 */

import { useEffect, useRef } from "react";

const BREATH_CYCLE = 8; // seconds

// ── Shared breath state — mutated in-place by the global tick ──
export interface BreathState {
  /** Eased breath value 0→1→0 (smoothstep cosine) */
  t: number;
  /** Raw phase 0→1 within the cycle */
  phase: number;
}

const shared: BreathState = { t: 0, phase: 0 };

// ── Math ──
function smoothBreath(phase: number): number {
  const raw = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase);
  return raw * raw * (3 - 2 * raw); // smoothstep flattens peaks
}

// ── Global singleton RAF (module-scoped) ──
let subscriberCount = 0;
let rafId: number | null = null;

function tick() {
  const now = performance.now() / 1000;
  shared.phase = (now % BREATH_CYCLE) / BREATH_CYCLE;
  shared.t = smoothBreath(shared.phase);
  rafId = requestAnimationFrame(tick);
}

function subscribe() {
  subscriberCount++;
  if (subscriberCount === 1 && rafId === null) {
    rafId = requestAnimationFrame(tick);
  }
}

function unsubscribe() {
  subscriberCount = Math.max(0, subscriberCount - 1);
  if (subscriberCount === 0 && rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/**
 * Subscribe to the global breath clock.
 * Returns a ref whose `.current` points directly to the shared BreathState
 * that the global RAF mutates in-place — no per-frame copies, no GC pressure.
 *
 * Read `.current.t` / `.current.phase` in your own RAF or event handler.
 *
 * @param active – pass false to pause subscription (e.g. when not breathing)
 */
export function useGlobalBreath(active: boolean = true) {
  // Every consumer gets the same shared object — ref wrapper just satisfies
  // the React pattern so callers can treat it like useRef().current
  const ref = useRef<BreathState>(shared);

  useEffect(() => {
    if (!active) return;
    // Point ref at the shared object (idempotent but safe after HMR)
    ref.current = shared;
    subscribe();
    return () => unsubscribe();
  }, [active]);

  return ref;
}
