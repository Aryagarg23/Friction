/**
 * DIGITAL MOSS — after an interruption
 *
 * When the user comes back, moss creeps in from the screen edges and leaves
 * the middle clear for one card: what they were working on, in which app,
 * what comes next, and the words they were using. Two ways out: the
 * "Back to work" button (or Enter / Esc), or sweeping the mouse across the
 * moss, which wipes it where the cursor passes.
 *
 * The moss is a fixed halftone grid, not random particles: each cell's reach
 * comes from its distance to the nearest edge plus smooth noise, so the band
 * has one ragged inner edge and grows inward in order. Nothing jitters once
 * it has grown. Canvas cannot read CSS variables, so colors and font are read
 * from the computed --pi-* values each frame to follow light and dark.
 *
 * SessionContext API unchanged (mossActive / mossKeywords / clearMoss).
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "../../context/SessionContext";
import { useWindowManager } from "../../context/WindowManagerContext";

interface Props {
  /** Extra words the user was using (e.g. variable names). Shown as chips. */
  keywords: string[];
  onClear: () => void;
}

const CELL = 12;          // grid pitch in px
const REACH = 0.34;       // how far in the band reaches, as a share of half the short side
const RAGGED = 0.14;      // how much noise moves the inner edge
const GROW_MS = 1400;     // time for the moss to reach its full extent
const DONE_AT = 0.55;     // share of moss wiped before it lets go

interface Cell {
  x: number;
  y: number;
  /** 0 at the edge, 1 at the center */
  depth: number;
  /** 0..1 how thick the moss is here */
  density: number;
  cleared: boolean;
}

function readTheme() {
  const css = getComputedStyle(document.documentElement);
  return {
    ink: css.getPropertyValue("--pi-ink").trim() || "#282215",
    font: css.getPropertyValue("--pi-font").trim() || "sans-serif",
  };
}

/** Deterministic value noise in [-1, 1], two octaves, so the edge is the same every time. */
function hash(ix: number, iy: number) {
  const s = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}
function smooth(t: number) {
  return t * t * (3 - 2 * t);
}
function valueNoise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smooth(x - ix), fy = smooth(y - iy);
  const a = hash(ix, iy), b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}
function noise(x: number, y: number) {
  return valueNoise(x / 140, y / 140) * 0.7 + valueNoise(x / 45, y / 45) * 0.3;
}

function buildCells(w: number, h: number): Cell[] {
  const half = Math.min(w, h) / 2;
  const cells: Cell[] = [];
  for (let y = CELL / 2; y < h; y += CELL) {
    for (let x = CELL / 2; x < w; x += CELL) {
      const edgeDist = Math.min(x, y, w - x, h - y);
      const depth = edgeDist / half;
      const reach = REACH + RAGGED * noise(x, y);
      const density = Math.max(0, Math.min(1, (reach - depth) / 0.16));
      if (density > 0.05) cells.push({ x, y, depth, density, cleared: false });
    }
  }
  return cells;
}

export function DigitalMoss({ keywords, onClear }: Props) {
  const { tasks } = useSession();
  const { windows, focusedWindowId } = useWindowManager();

  // Tasks are snapshotted when the user comes back. The app is read live:
  // when a story jumps here, the right window is focused a moment after the
  // moss mounts, and a snapshot would name the wrong app.
  const [taskContext] = useState(() => {
    const open = tasks.filter(t => !t.completed);
    return { current: open[0]?.title ?? null, next: open[1]?.title ?? null };
  });
  const context = {
    ...taskContext,
    app: windows.find(w => w.id === focusedWindowId)?.title ?? null,
  };
  const words = keywords.filter(k => k && k !== context.current && k !== context.next).slice(0, 6);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellsRef = useRef<Cell[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, speed: 0 });
  const startRef = useRef(0);
  const frameRef = useRef(0);
  const [leaving, setLeaving] = useState(false);
  const [wiped, setWiped] = useState(0);

  const finish = useCallback(() => setLeaving(true), []);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      cellsRef.current = buildCells(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);
    startRef.current = performance.now();

    let lastPct = -1;
    const render = (now: number) => {
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      const theme = readTheme();
      ctx.fillStyle = theme.ink;

      // Growth front moves inward with an ease-out, so the creep reads as deliberate.
      const t = Math.min(1, (now - startRef.current) / GROW_MS);
      const front = (1 - Math.pow(1 - t, 3)) * (REACH + RAGGED);

      const mouse = mouseRef.current;
      const brush = 60 + Math.min(mouse.speed, 40) * 1.5;
      const cells = cellsRef.current;
      let cleared = 0;

      for (const c of cells) {
        if (!c.cleared && mouse.speed > 2) {
          const dx = c.x - mouse.x, dy = c.y - mouse.y;
          if (dx * dx + dy * dy < brush * brush) c.cleared = true;
        }
        if (c.cleared) { cleared++; continue; }
        if (c.depth > front) continue;
        // Cells just behind the front fade in rather than pop.
        const appear = Math.min(1, (front - c.depth) / 0.04);
        const r = (CELL / 2) * (0.25 + 0.65 * c.density) * appear;
        ctx.globalAlpha = 0.18 + 0.5 * c.density;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      mouse.speed *= 0.85; // a resting cursor stops wiping

      const share = cells.length ? cleared / cells.length : 1;
      const pct = Math.round(share * 100);
      if (pct !== lastPct) {
        lastPct = pct;
        setWiped(share);
      }
      if (share >= DONE_AT) finish();

      frameRef.current = requestAnimationFrame(render);
    };
    frameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, [finish]);

  // Enter or Esc: back to work
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  // Let the fade finish, then hand control back
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(onClear, 360);
    return () => clearTimeout(timer);
  }, [leaving, onClear]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      speed: Math.hypot(e.movementX, e.movementY),
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
        className="absolute inset-0"
        style={{ zIndex: 8500, cursor: "crosshair", fontFamily: "var(--pi-font)" }}
        onMouseMove={handleMouseMove}
      >
        {/* A light wash so the card reads against any window underneath */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: "color-mix(in srgb, var(--pi-ground) 55%, transparent)" }}
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* The card: where you left off */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: GROW_MS / 1000 * 0.6, duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
            className="pointer-events-auto"
            style={{
              width: "min(380px, 80%)",
              backgroundColor: "var(--pi-surface)",
              border: "1px solid var(--pi-ink)",
              color: "var(--pi-ink)",
              padding: "20px 22px",
              cursor: "default",
            }}
          >
            <div className="pi-label" style={{ marginBottom: 14 }}>Where you left off</div>

            {context.current ? (
              <>
                <div style={{ fontSize: "0.7rem", color: "var(--pi-ink-60)" }}>You were working on</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 500, lineHeight: 1.3, margin: "2px 0 0" }}>
                  {context.current}
                </div>
                {context.app && (
                  <div style={{ fontSize: "0.8rem", color: "var(--pi-ink-60)", marginTop: 4 }}>in {context.app}</div>
                )}
              </>
            ) : (
              <div style={{ fontSize: "0.95rem" }}>You were away from your desk.</div>
            )}

            {words.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: "0.7rem", color: "var(--pi-ink-60)", marginBottom: 6 }}>Words you were using</div>
                <div className="flex flex-wrap" style={{ gap: 6 }}>
                  {words.map(word => (
                    <span
                      key={word}
                      style={{
                        fontSize: "0.75rem",
                        padding: "3px 8px",
                        border: "1px solid var(--pi-hairline)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {context.next && (
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--pi-hairline)", fontSize: "0.8rem" }}>
                <span style={{ color: "var(--pi-ink-60)" }}>Next: </span>{context.next}
              </div>
            )}

            <button type="button" className="pi-btn w-full" style={{ marginTop: 18 }} onClick={finish} autoFocus>
              Back to work
            </button>
            <div style={{ fontSize: "0.7rem", color: "var(--pi-ink-60)", marginTop: 8, textAlign: "center" }}>
              Or sweep the mouse across the moss.{" "}
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {Math.min(100, Math.round((wiped / DONE_AT) * 100))}%
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
