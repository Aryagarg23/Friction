/**
 * MOON POOL CANVAS — Molecule-Physics Particle System
 *
 * Particles behave like gas molecules whose temperature is driven
 * by pool density (cognitive load):
 *
 *   Cold (low load)  → slow, smooth drift, gentle sine perturbations
 *   Hot  (high load) → fast, erratic bouncing, random velocity kicks
 *
 * All particles are confined within a circular boundary and bounce
 * off the walls. Uses canvas + RAF for 60fps rendering with zero
 * React re-renders per frame.
 */

import { useRef, useEffect, useCallback } from "react";
import type { PoolStage } from "./moon-pool-stages";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  weight: number; // cognitiveWeight 0-1
  category: string;
  /** Random phase offset for idle wobble */
  phase: number;
}

interface Props {
  size: number;
  tasks: { id: string; cognitiveWeight: number; category: string }[];
  density: number; // 0-1
  stage: PoolStage;
  dragOver?: boolean;
}

// ── Color helpers ──

function categoryColor(cat: string, density: number): string {
  if (density > 0.6) {
    // Hot: shift everything toward red/crimson
    const redMix = Math.min(1, (density - 0.6) / 0.4);
    if (cat === "deep") return `rgba(255, 95, 143, ${0.6 + redMix * 0.3})`;
    if (cat === "moderate") return `rgba(${155 + redMix * 43}, ${109 - redMix * 24}, ${189 - redMix * 93}, ${0.5 + redMix * 0.3})`;
    return `rgba(${90 + redMix * 108}, ${143 - redMix * 58}, ${196 - redMix * 100}, ${0.5 + redMix * 0.3})`;
  }
  if (cat === "deep") return "rgba(255, 95, 143, 0.55)";
  if (cat === "moderate") return "rgba(155, 109, 189, 0.5)";
  return "rgba(107, 95, 255, 0.5)";
}

function glowColor(cat: string, density: number): string {
  if (density > 0.6) return `rgba(255, 95, 143, ${0.15 + density * 0.2})`;
  if (cat === "deep") return "rgba(255, 95, 143, 0.12)";
  if (cat === "moderate") return "rgba(124, 77, 160, 0.1)";
  return "rgba(107, 95, 255, 0.1)";
}

export function MoonPoolCanvas({ size, tasks, density, stage, dragOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const prevTaskIdsRef = useRef<string>("");
  const densityRef = useRef(density);
  densityRef.current = density;

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const center = size / 2;
  const boundaryR = size / 2 - 4; // Inset from edge

  // ── Sync particles with tasks ──
  const syncParticles = useCallback(() => {
    const taskKey = tasks.map(t => t.id).join(",");
    if (taskKey === prevTaskIdsRef.current) return;
    prevTaskIdsRef.current = taskKey;

    const existing = new Map(particlesRef.current.map(p => [p.weight + "_" + p.category, p]));
    const newParticles: Particle[] = tasks.slice(0, 12).map((task, i) => {
      // Try to reuse existing particle position for continuity
      const key = task.cognitiveWeight + "_" + task.category;
      const old = existing.get(key);
      existing.delete(key);

      const angle = (i / Math.max(tasks.length, 1)) * Math.PI * 2 + Math.random() * 0.3;
      const dist = boundaryR * 0.3 + Math.random() * boundaryR * 0.4;
      const baseSpeed = 0.2 + density * 1.5;

      return {
        x: old?.x ?? center + Math.cos(angle) * dist,
        y: old?.y ?? center + Math.sin(angle) * dist,
        vx: old?.vx ?? (Math.random() - 0.5) * baseSpeed,
        vy: old?.vy ?? (Math.random() - 0.5) * baseSpeed,
        radius: 3 + task.cognitiveWeight * 7,
        weight: task.cognitiveWeight,
        category: task.category,
        phase: old?.phase ?? Math.random() * Math.PI * 2,
      };
    });

    particlesRef.current = newParticles;
  }, [tasks, density, center, boundaryR]);

  useEffect(() => { syncParticles(); }, [syncParticles]);

  // ── Main animation loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let raf: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 3); // Normalize to ~60fps, cap at 3x
      lastTime = now;

      const d = densityRef.current;

      // ── Temperature-based physics ──
      // "Temperature" controls: speed, random kicks, damping
      const temperature = d; // 0 = cold, 1 = hot
      const maxSpeed = 0.3 + temperature * 3.5; // Cold: 0.3, Hot: 3.8
      const kickStrength = temperature * 0.12; // Random velocity kicks per frame
      const kickProbability = 0.02 + temperature * 0.15; // Chance of kick per frame
      const damping = 1 - (0.003 + (1 - temperature) * 0.008); // Cold: more damping (smoother)
      const wobbleAmp = (1 - temperature) * 0.15; // Cold: gentle sine wobble

      const particles = particlesRef.current;

      // Clear
      ctx.clearRect(0, 0, size, size);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // ── Random thermal kicks (hot = frequent, cold = rare) ──
        if (Math.random() < kickProbability * dt) {
          const kickAngle = Math.random() * Math.PI * 2;
          const kickMag = kickStrength * (0.5 + Math.random() * 0.5);
          p.vx += Math.cos(kickAngle) * kickMag;
          p.vy += Math.sin(kickAngle) * kickMag;
        }

        // ── Cold wobble (smooth sine perturbation) ──
        if (wobbleAmp > 0.01) {
          p.phase += 0.015 * dt;
          p.vx += Math.sin(p.phase) * wobbleAmp * 0.02 * dt;
          p.vy += Math.cos(p.phase * 1.3 + 0.7) * wobbleAmp * 0.02 * dt;
        }

        // ── Damping ──
        p.vx *= Math.pow(damping, dt);
        p.vy *= Math.pow(damping, dt);

        // ── Speed cap ──
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }

        // ── Integrate ──
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // ── Circular boundary bounce ──
        const dx = p.x - center;
        const dy = p.y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const effectiveR = boundaryR - p.radius;

        if (dist > effectiveR && effectiveR > 0) {
          // Push back inside
          const nx = dx / dist;
          const ny = dy / dist;
          p.x = center + nx * effectiveR;
          p.y = center + ny * effectiveR;

          // Reflect velocity off the normal
          const dot = p.vx * nx + p.vy * ny;
          p.vx -= 2 * dot * nx;
          p.vy -= 2 * dot * ny;

          // Energy retention on bounce — hot bounces are more elastic
          const elasticity = 0.7 + temperature * 0.25;
          p.vx *= elasticity;
          p.vy *= elasticity;
        }

        // ── Particle-particle soft repulsion ──
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const ddx = q.x - p.x;
          const ddy = q.y - p.y;
          const minDist = p.radius + q.radius + 2;
          const dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < minDist && dd > 0.1) {
            const overlap = minDist - dd;
            const repulse = overlap * 0.05 * (0.5 + temperature * 0.5);
            const nnx = ddx / dd;
            const nny = ddy / dd;
            p.vx -= nnx * repulse;
            p.vy -= nny * repulse;
            q.vx += nnx * repulse;
            q.vy += nny * repulse;
          }
        }

        // ── Draw particle ──
        const col = categoryColor(p.category, d);
        const glow = glowColor(p.category, d);
        const glowSize = p.radius + 4 + d * 8;

        // Outer glow
        const grad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.3, p.x, p.y, glowSize);
        grad.addColorStop(0, glow);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.fillStyle = `rgba(255,255,255,${0.1 + (1 - d) * 0.15})`;
        ctx.beginPath();
        ctx.arc(p.x - p.radius * 0.2, p.y - p.radius * 0.2, p.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size, dpr, center, boundaryR]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
      }}
    />
  );
}