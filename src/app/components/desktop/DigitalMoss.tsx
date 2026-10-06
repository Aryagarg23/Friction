/**
 * DIGITAL MOSS — after an interruption
 *
 * Ink texture grows in from the screen edges when the user returns from an
 * interruption. Words from what they were doing sit in the middle. Sweeping
 * the mouse across it clears it; past 45% cleared it fades out and calls
 * onClear. Canvas cannot read CSS variables, so each frame reads the
 * computed --pi-ink / --pi-font so it follows light and dark.
 *
 * SessionContext API unchanged (mossActive / clearMoss / etc.)
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  keywords: string[];
  taskContext?: string;
  onClear: () => void;
}

interface ResidueParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  growth: number;
  maxSize: number;
  edge: "top" | "bottom" | "left" | "right";
  depth: number; // how far from edge (0-1)
  cleared: boolean;
  /** Fixed offset for the tendril curve so lines do not flicker */
  bend: number;
}

interface KeywordFloat {
  text: string;
  x: number;
  y: number;
  opacity: number;
  targetOpacity: number;
  cleared: boolean;
  snapX: number;
  snapY: number;
}

function readTheme() {
  const css = getComputedStyle(document.documentElement);
  return {
    ink: css.getPropertyValue("--pi-ink").trim() || "currentColor",
    font: css.getPropertyValue("--pi-font").trim() || "sans-serif",
  };
}

export function DigitalMoss({ keywords, taskContext, onClear }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ResidueParticle[]>([]);
  const keywordsRef = useRef<KeywordFloat[]>([]);
  const mouseRef = useRef({ x: -100, y: -100, velocity: 0, totalCleared: 0 });
  const animFrameRef = useRef<number>(0);
  const [isClearing, setIsClearing] = useState(false);
  const [clearProgress, setClearProgress] = useState(0);
  const growthRef = useRef(0);
  const timeRef = useRef(0);
  const lastProgressRef = useRef(0);

  // Initialize particles
  const initParticles = useCallback((w: number, h: number) => {
    const particles: ResidueParticle[] = [];
    const count = 600;

    for (let i = 0; i < count; i++) {
      const edge = (["top", "bottom", "left", "right"] as const)[Math.floor(Math.random() * 4)];
      let x = 0, y = 0;
      const depth = Math.random();

      switch (edge) {
        case "top":
          x = Math.random() * w;
          y = depth * h * 0.4;
          break;
        case "bottom":
          x = Math.random() * w;
          y = h - depth * h * 0.4;
          break;
        case "left":
          x = depth * w * 0.35;
          y = Math.random() * h;
          break;
        case "right":
          x = w - depth * w * 0.35;
          y = Math.random() * h;
          break;
      }

      // Add organic jitter
      x += (Math.random() - 0.5) * 40;
      y += (Math.random() - 0.5) * 40;

      particles.push({
        x, y,
        size: 0,
        opacity: 0,
        growth: 0.3 + Math.random() * 0.7,
        maxSize: 8 + Math.random() * 24 + (1 - depth) * 20,
        edge,
        depth,
        cleared: false,
        bend: (Math.random() - 0.5) * 20,
      });
    }

    particlesRef.current = particles;

    // Position keywords
    const kws: KeywordFloat[] = keywords.slice(0, 8).map((text, i) => {
      const angle = (i / keywords.length) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 0.15 + Math.random() * 0.2;
      return {
        text,
        x: w * 0.5 + Math.cos(angle) * w * radius,
        y: h * 0.5 + Math.sin(angle) * h * radius,
        opacity: 0,
        targetOpacity: 0.85,
        cleared: false,
        snapX: w * 0.5 + (Math.random() - 0.5) * 100,
        snapY: h * 0.5 + (Math.random() - 0.5) * 60,
      };
    });
    keywordsRef.current = kws;
  }, [keywords]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      initParticles(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      timeRef.current += 0.016; // ~60fps
      const time = timeRef.current;

      // Grow residue over time
      growthRef.current = Math.min(growthRef.current + 0.008, 1);
      const growth = growthRef.current;

      const mouse = mouseRef.current;

      const theme = readTheme();
      ctx.fillStyle = theme.ink;
      ctx.strokeStyle = theme.ink;

      // Draw moss particles: flat ink blobs at low alpha
      for (const p of particlesRef.current) {
        if (p.cleared) continue;

        // Grow based on depth and global growth
        const depthDelay = p.depth * 0.6;
        const localGrowth = Math.max(0, (growth - depthDelay) / (1 - depthDelay));
        p.size = p.maxSize * localGrowth * p.growth;
        p.opacity = Math.min(localGrowth * 0.8, 0.7);

        // Check mouse proximity for clearing
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clearRadius = 80 + mouse.velocity * 2;

        if (dist < clearRadius && mouse.velocity > 5) {
          p.cleared = true;
          mouse.totalCleared++;
          continue;
        }

        if (p.size < 0.5) continue;

        // Very slow size drift so it reads as alive, not animated
        const breathe = 1 + Math.sin(time * 0.8 + p.x * 0.005 + p.y * 0.003) * 0.03;

        ctx.beginPath();
        // Edges denser than the middle
        ctx.globalAlpha = p.opacity * (0.1 + (1 - p.depth) * 0.12);

        const segments = 6;
        for (let s = 0; s <= segments; s++) {
          const angle = (s / segments) * Math.PI * 2;
          const noise = 0.7 + Math.sin(angle * 3 + p.x * 0.01 + time * 0.3) * 0.3;
          const r = p.size * noise * breathe;
          const px = p.x + Math.cos(angle) * r;
          const py = p.y + Math.sin(angle) * r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }

      // Thin ink lines between nearby particles
      ctx.lineWidth = 1;
      const activeParticles = particlesRef.current.filter(p => !p.cleared && p.size > 3);
      for (let i = 0; i < activeParticles.length; i += 3) {
        const a = activeParticles[i];
        for (let j = i + 1; j < Math.min(i + 8, activeParticles.length); j += 2) {
          const b = activeParticles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 60) {
            ctx.globalAlpha = 0.12 * (1 - d / 60);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            const cx = (a.x + b.x) / 2 + a.bend;
            const cy = (a.y + b.y) / 2 + b.bend;
            ctx.quadraticCurveTo(cx, cy, b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Context words, plain ink
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `500 13px ${theme.font}`;

      for (const kw of keywordsRef.current) {
        if (kw.cleared) continue;

        kw.opacity += (kw.targetOpacity - kw.opacity) * 0.02;

        const dxk = kw.x - mouse.x;
        const dyk = kw.y - mouse.y;
        const distk = Math.sqrt(dxk * dxk + dyk * dyk);
        if (distk < 100 && mouse.velocity > 8) {
          kw.cleared = true;
          mouse.totalCleared += 10;
        }

        if (kw.opacity < 0.01) continue;

        ctx.globalAlpha = kw.opacity * growth;
        ctx.fillText(kw.text, kw.x, kw.y);
      }

      ctx.globalAlpha = 1;

      // Calculate clear progress — only setState when the whole percent changes
      const total = particlesRef.current.length;
      const cleared = particlesRef.current.filter(p => p.cleared).length;
      const progress = cleared / total;
      const pct = Math.round(progress * 100);
      if (pct !== Math.round(lastProgressRef.current * 100)) {
        lastProgressRef.current = progress;
        setClearProgress(progress);
      }

      if (progress > 0.45 && !isClearing) {
        setIsClearing(true);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [initParticles]);

  // Handle clearing completion
  useEffect(() => {
    if (isClearing) {
      const timer = setTimeout(onClear, 1200);
      return () => clearTimeout(timer);
    }
  }, [isClearing, onClear]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const newX = e.clientX - rect.left;
    const newY = e.clientY - rect.top;
    const velocity = Math.abs(e.movementX) + Math.abs(e.movementY);
    mouseRef.current = {
      ...mouseRef.current,
      x: newX,
      y: newY,
      velocity: velocity,
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isClearing ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: isClearing ? 1.2 : 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="absolute inset-0 cursor-crosshair"
        style={{ zIndex: 8500 }}
        onMouseMove={handleMouseMove}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isClearing ? 0 : 1 }}
          transition={{ delay: isClearing ? 0 : 1, duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
          className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none"
          style={{ zIndex: 8501, fontFamily: "var(--pi-font)" }}
        >
          <div className="pi-label mb-2">Where you left off</div>
          {taskContext && (
            <div style={{ color: "var(--pi-ink)", fontSize: "0.8rem" }}>
              {taskContext}
            </div>
          )}
        </motion.div>

        {/* Prompt + progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isClearing ? 0 : 1 }}
          transition={{ delay: isClearing ? 0 : 1.5, duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center pointer-events-none"
          style={{ zIndex: 8501, fontFamily: "var(--pi-font)" }}
        >
          <div style={{ color: "var(--pi-ink)", fontSize: "0.8rem" }}>
            Sweep the mouse across the screen to clear this.
          </div>
          <div
            className="mt-1"
            style={{ color: "var(--pi-ink-60)", fontSize: "0.7rem", fontVariantNumeric: "tabular-nums" }}
          >
            {Math.round(clearProgress * 100)}% cleared
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}