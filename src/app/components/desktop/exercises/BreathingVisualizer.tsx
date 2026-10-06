import { motion } from "motion/react";
import { X } from "lucide-react";

export const BREATHING_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Animated Gradient Circles</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(ellipse at center, #3a5f6f 0%, #1a2f4f 50%, #0f1a2f 100%);
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
    }

    .card {
      position: relative;
      width: 650px;
      height: 220px;
      border-radius: 32px;
      background: linear-gradient(135deg, rgba(100,150,160,0.25) 0%, rgba(80,110,150,0.25) 100%);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.18);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
      overflow: hidden;
    }

    .header {
      position: absolute;
      top: 24px;
      left: 24px;
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      font-weight: 500;
    }

    .circle-container {
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 160px;
      transform: translateY(-50%);
    }

    .wave-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: visible;
      z-index: 0;
    }

    .wave-path {
      filter: drop-shadow(0 0 10px rgba(139,127,255,0.6));
    }

    .circle-wrapper {
      position: absolute;
      z-index: 10;
      width: 60px;
      height: 60px;
      transform: translate(-50%, -50%);
    }

    .circle-glow {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      filter: blur(20px);
    }

    .circle-body {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .circle-ring {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      position: relative;
      background: transparent;
      border: 2px solid;
      will-change: transform;
    }

    .circle-inner-glow {
      position: absolute;
      inset: 0;
      border-radius: 50%;
    }

    .circle-fill {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      overflow: hidden;
    }

    .footer {
      position: absolute;
      bottom: 24px;
      left: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .breath-text {
      color: rgba(255,255,255,0.9);
      font-size: 18px;
      font-style: italic;
      opacity: 0;
      transition: opacity 1.2s cubic-bezier(0.76, 0, 0.24, 1);
    }

    .breath-text.visible {
      opacity: 1;
    }

    .breath-count {
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">Breathing Exercise</div>
    <div class="circle-container" id="circleContainer">
      <svg class="wave-svg" viewBox="0 0 650 160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6B5FFF" stop-opacity="0.7"/>
            <stop offset="50%" stop-color="#A78FFF" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#6B5FFF" stop-opacity="0.7"/>
          </linearGradient>
        </defs>
        <path id="wavePath" d="" stroke="url(#waveGrad)" stroke-width="3" fill="none" stroke-linecap="round" class="wave-path"/>
      </svg>
    </div>
    <div class="footer">
      <p class="breath-text" id="breathText">Breathe out...</p>
      <div class="breath-count" id="breathCount">0 Breaths</div>
    </div>
  </div>

  <script>
    // â”€â”€ Configuration â”€â”€
    const CIRCLE_COUNT = 7;
    const CARD_WIDTH = 650;
    const CONTAINER_H = 160;
    const PAD = 60;
    const SPACING = (CARD_WIDTH - PAD * 2) / (CIRCLE_COUNT - 1);
    const CY = CONTAINER_H / 2;
    const SEMI_R = SPACING / 2;  // wave amplitude = half spacing
    const TOTAL_ARCS = (CIRCLE_COUNT - 1) * 2 + 2; // 6 forward + turn + 6 return + turn = 14

    const XS = Array.from({ length: CIRCLE_COUNT }, (_, i) => PAD + i * SPACING);

    const COLORS = [
      { main: '#FF5F8F', glow: '#FF5F8F', type: 'out' },
      { main: '#6B5FFF', glow: '#6B5FFF', type: 'in' },
      { main: '#FF5F8F', glow: '#FF5F8F', type: 'out' },
      { main: '#6B5FFF', glow: '#6B5FFF', type: 'in' },
      { main: '#FF5F8F', glow: '#FF5F8F', type: 'out' },
      { main: '#6B5FFF', glow: '#6B5FFF', type: 'in' },
      { main: '#FF5F8F', glow: '#FF5F8F', type: 'out' },
    ];

    // Breathing cadence: exhale (down arcs) = 6s, inhale (up arcs) = 4s

    // â”€â”€ Build circles in DOM â”€â”€
    const container = document.getElementById('circleContainer');
    const circleParts = [];

    XS.forEach((x, i) => {
      const c = COLORS[i];

      const wrapper = document.createElement('div');
      wrapper.className = 'circle-wrapper';
      wrapper.style.left = x + 'px';
      wrapper.style.top = CY + 'px';

      const glow = document.createElement('div');
      glow.className = 'circle-glow';
      glow.style.background = \`radial-gradient(circle, \${c.glow}60 0%, transparent 70%)\`;

      const body = document.createElement('div');
      body.className = 'circle-body';

      const ring = document.createElement('div');
      ring.className = 'circle-ring';
      ring.style.borderColor = c.main;
      ring.style.boxShadow = \`0 0 20px \${c.glow}60\`;

      const innerGlow = document.createElement('div');
      innerGlow.className = 'circle-inner-glow';
      innerGlow.style.background = \`radial-gradient(circle, \${c.glow}80 0%, transparent 60%)\`;

      const fill = document.createElement('div');
      fill.className = 'circle-fill';
      fill.style.background = c.type === 'out'
        ? \`radial-gradient(circle at center, transparent 20%, \${c.main}CC 60%, \${c.main} 100%)\`
        : \`radial-gradient(circle at center, \${c.main} 0%, \${c.main}CC 40%, transparent 70%)\`;

      ring.appendChild(innerGlow);
      ring.appendChild(fill);
      body.appendChild(ring);
      wrapper.appendChild(glow);
      wrapper.appendChild(body);
      container.appendChild(wrapper);

      circleParts.push({ glow, ring, innerGlow, fill });
    });

    // â”€â”€ Build SVG path: bezier S-curves between circle peaks/valleys â”€â”€
    // Each curve connects one circle's peak (top) to the next circle's valley (bottom),
    // or vice versa. Phases stop at vertical extremes (top/bottom of each circle).

    function buildPath() {
      const cp = SPACING * 0.55; // bezier control offset for smooth sine shape
      // Start directly above circle 0
      let d = \`M \${XS[0]} \${CY - SEMI_R}\`;

      // Forward: 6 bezier curves, Lâ†’R, alternating topâ†’botâ†’top
      for (let i = 0; i < CIRCLE_COUNT - 1; i++) {
        const fromY = i % 2 === 0 ? CY - SEMI_R : CY + SEMI_R;
        const toY = i % 2 === 0 ? CY + SEMI_R : CY - SEMI_R;
        d += \` C \${XS[i] + cp} \${fromY}, \${XS[i + 1] - cp} \${toY}, \${XS[i + 1]} \${toY}\`;
      }

      // Right turnaround: semicircle around last circle, top â†’ bottom (clockwise)
      const last = CIRCLE_COUNT - 1;
      const lastY = last % 2 === 0 ? CY - SEMI_R : CY + SEMI_R;
      const lastYopp = last % 2 === 0 ? CY + SEMI_R : CY - SEMI_R;
      d += \` A \${SEMI_R} \${SEMI_R} 0 0 1 \${XS[last]} \${lastYopp}\`;

      // Return: 6 bezier curves, Râ†’L (Y positions flipped from forward)
      for (let i = CIRCLE_COUNT - 1; i > 0; i--) {
        const fromY = i % 2 === 0 ? CY + SEMI_R : CY - SEMI_R;
        const toY = (i - 1) % 2 === 0 ? CY + SEMI_R : CY - SEMI_R;
        d += \` C \${XS[i] - cp} \${fromY}, \${XS[i - 1] + cp} \${toY}, \${XS[i - 1]} \${toY}\`;
      }

      // Left turnaround: semicircle around first circle, bottom â†’ top (clockwise)
      d += \` A \${SEMI_R} \${SEMI_R} 0 0 1 \${XS[0]} \${CY - SEMI_R}\`;

      return d;
    }

    const pathEl = document.getElementById('wavePath');
    pathEl.setAttribute('d', buildPath());
    const totalLen = pathEl.getTotalLength();

    // Hide original path (keep for getPointAtLength calculations)
    pathEl.style.stroke = 'none';

    // â”€â”€ Layered trail for fading effect â”€â”€
    const TRAIL_LAYERS = 8;
    const MAX_TRAIL = totalLen * 0.15;
    const trailPaths = [];
    const svgNS = 'http://www.w3.org/2000/svg';
    const svgEl = pathEl.parentElement;
    const pathD = pathEl.getAttribute('d');

    for (let l = 0; l < TRAIL_LAYERS; l++) {
      const trail = document.createElementNS(svgNS, 'path');
      trail.setAttribute('d', pathD);
      trail.setAttribute('stroke', 'url(#waveGrad)');
      trail.setAttribute('stroke-width', '3');
      trail.setAttribute('fill', 'none');
      trail.setAttribute('stroke-linecap', 'round');
      if (l === 0) trail.classList.add('wave-path'); // glow on tip layer

      const trailLen = MAX_TRAIL * ((l + 1) / TRAIL_LAYERS);
      trail.style.strokeDasharray = \`\${trailLen} \${totalLen}\`;
      trail.style.strokeDashoffset = trailLen; // hidden initially
      trail.style.opacity = 1 / TRAIL_LAYERS;

      svgEl.appendChild(trail);
      trailPaths.push({ el: trail, trailLen });
    }

    // â”€â”€ Phase list: 14 phases (6 bez + turn + 6 bez + turn) â”€â”€
    // Progress boundaries based on actual segment lengths.
    const TURN_LEN = Math.PI * SEMI_R; // semicircle arc length
    const BEZ_LEN = (totalLen - 2 * TURN_LEN) / 12; // each bezier has equal length

    const phases = [];
    let cumLen = 0;
    for (let k = 0; k < TOTAL_ARCS; k++) {
      const isTurn = (k === 6 || k === 13);
      cumLen += isTurn ? TURN_LEN : BEZ_LEN;
      const type = k % 2 === 0 ? 'out' : 'in';
      phases.push({
        progress: cumLen / totalLen,
        type,
        duration: isTurn ? 5000 : (type === 'in' ? 4000 : 6000),
      });
    }

    // â”€â”€ Animation state â”€â”€
    const breathTextEl = document.getElementById('breathText');
    const breathCountEl = document.getElementById('breathCount');

    let currentPhaseIdx = 0;
    let phaseStartTime = 0;
    let breathCount = 0;
    let lastBreathText = '';
    let phaseActivated = false;

    function setBreathText(type) {
      let txt;
      if (type === 'out') txt = 'Breathe out...';
      else if (type === 'in') txt = 'Breathe in...';
      else return;

      if (lastBreathText === txt) return;
      lastBreathText = txt;

      breathTextEl.classList.remove('visible');
      setTimeout(() => {
        breathTextEl.textContent = txt;
        breathTextEl.classList.add('visible');
      }, 200);

      breathCount++;
      breathCountEl.textContent = breathCount + (breathCount === 1 ? ' Breath' : ' Breaths');
    }

    function easeInOutSine(t) {
      return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    // â”€â”€ Unified breathing: circles expand on inhale, contract on exhale â”€â”€
    // Intensity modulated by proximity to the line tip.
    function updateCircleBreathing(breathLevel, tipX) {

      for (let i = 0; i < CIRCLE_COUNT; i++) {
        const dist = Math.abs(tipX - XS[i]);
        const proximity = Math.max(0, 1 - dist / (SPACING * 2.5));
        const proxEased = proximity * proximity; // quadratic falloff

        // Scale: all circles oscillate, amplitude depends on proximity
        const amplitude = 0.08 + proxEased * 0.45;
        const scale = 1 + amplitude * breathLevel;

        // Glow
        const glowOpacity = 0.25 + proxEased * 0.75;
        const glowScale = 1.0 + proxEased * 0.5;

        // Inner glow
        const innerGlowOpacity = 0.2 + proxEased * 0.6;

        // Fill
        const fillOpacity = proxEased * 0.85;

        const p = circleParts[i];
        p.ring.style.transform = \`scale(\${scale})\`;
        p.glow.style.opacity = glowOpacity;
        p.glow.style.transform = \`scale(\${glowScale})\`;
        p.innerGlow.style.opacity = innerGlowOpacity;
        p.fill.style.opacity = fillOpacity;
      }
    }

    // â”€â”€ Main animation loop â”€â”€
    function animate(timestamp) {
      if (!phaseStartTime) phaseStartTime = timestamp;

      const phase = phases[currentPhaseIdx];
      const elapsed = timestamp - phaseStartTime;
      const t = Math.min(1, elapsed / phase.duration);
      const easedT = easeInOutSine(t);

      // Interpolate path progress
      const fromProgress = currentPhaseIdx === 0 ? 0 : phases[currentPhaseIdx - 1].progress;
      const toProgress = phase.progress;
      const currentProgress = fromProgress + (toProgress - fromProgress) * easedT;

      // Update fading trail
      const pos = currentProgress * totalLen;
      for (const tp of trailPaths) {
        tp.el.style.strokeDashoffset = tp.trailLen - pos;
      }

      // Get line tip position for proximity-based breathing
      const tipPt = pathEl.getPointAtLength(currentProgress * totalLen);
      // Inhale (up arc): breathLevel rises 0â†’1; Exhale (down arc): falls 1â†’0
      const breathLevel = phase.type === 'in' ? easedT : (1 - easedT);
      updateCircleBreathing(breathLevel, tipPt.x);

      // Update breath text at the start of each phase
      if (!phaseActivated) {
        phaseActivated = true;
        setBreathText(phase.type);
      }

      // Phase complete?
      if (t >= 1) {
        currentPhaseIdx++;
        phaseActivated = false;

        if (currentPhaseIdx >= phases.length) {
          currentPhaseIdx = 0;
          // Reset trail for new loop
          for (const tp of trailPaths) {
            tp.el.style.strokeDashoffset = tp.trailLen;
          }
        }

        phaseStartTime = timestamp;
      }

      requestAnimationFrame(animate);
    }

    // â”€â”€ Kick off â”€â”€
    setTimeout(() => {
      requestAnimationFrame(animate);
    }, 600);
  </script>
</body>
</html>
`;

export function BreathingVisualizer({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "color-mix(in srgb, var(--pi-ground) 92%, transparent)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(90vw, 720px)",
          height: "min(70vh, 340px)",
          overflow: "hidden",
          position: "relative",
          border: "1px solid var(--pi-hairline)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          title="Close"
          className="pi-btn"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 10,
            width: 28,
            height: 28,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--pi-surface)",
          }}
        >
          <X size={14} />
        </button>
        <iframe
          srcDoc={BREATHING_HTML}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="Breathing"
          sandbox="allow-scripts"
        />
      </div>
    </motion.div>
  );
}
