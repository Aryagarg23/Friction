/**
 * FRICTION KEYBOARD — Haptic/Visual Emulator
 *
 * Renders a compact QWERTY keyboard mapped to real key events.
 * Visualises the three physical effects of the Friction keyboard concept:
 *   1. RGB underglow — color shifts with cognitive state
 *   2. Variable resistance — key press animation "weight" scales with fatigue
 *   3. Binaural beats — sub-perceptual audio hum that shifts with brain state
 *
 * LETHARGY SYSTEM: As fatigue builds, the entire keyboard becomes visually
 * sluggish — keys return slowly, ghost-presses flicker, labels blur, the
 * board sags and the underglow breathes more slowly.  Temperature rises.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useBiometrics } from "../../context/BiometricContext";
import { useFrictionSettings } from "../../context/FrictionSettingsContext";
import { useKeyboard, type KeyboardResistance, type KeyboardRGBMode } from "../../context/KeyboardContext";
import { Volume2, VolumeX, Keyboard, Thermometer } from "lucide-react";

// ──────────────────────────────────────────────
//  KEY LAYOUT
// ──────────────────────────────────────────────
interface KeyDef {
  label: string;
  code: string;
  width?: number;
}

const ROWS: KeyDef[][] = [
  [
    { label: "esc", code: "Escape", width: 1.3 },
    { label: "1", code: "Digit1" }, { label: "2", code: "Digit2" },
    { label: "3", code: "Digit3" }, { label: "4", code: "Digit4" },
    { label: "5", code: "Digit5" }, { label: "6", code: "Digit6" },
    { label: "7", code: "Digit7" }, { label: "8", code: "Digit8" },
    { label: "9", code: "Digit9" }, { label: "0", code: "Digit0" },
    { label: "⌫", code: "Backspace", width: 1.4 },
  ],
  [
    { label: "tab", code: "Tab", width: 1.3 },
    { label: "Q", code: "KeyQ" }, { label: "W", code: "KeyW" },
    { label: "E", code: "KeyE" }, { label: "R", code: "KeyR" },
    { label: "T", code: "KeyT" }, { label: "Y", code: "KeyY" },
    { label: "U", code: "KeyU" }, { label: "I", code: "KeyI" },
    { label: "O", code: "KeyO" }, { label: "P", code: "KeyP" },
    { label: "\\", code: "Backslash", width: 1.4 },
  ],
  [
    { label: "caps", code: "CapsLock", width: 1.6 },
    { label: "A", code: "KeyA" }, { label: "S", code: "KeyS" },
    { label: "D", code: "KeyD" }, { label: "F", code: "KeyF" },
    { label: "G", code: "KeyG" }, { label: "H", code: "KeyH" },
    { label: "J", code: "KeyJ" }, { label: "K", code: "KeyK" },
    { label: "L", code: "KeyL" },
    { label: "↵", code: "Enter", width: 2.1 },
  ],
  [
    { label: "⇧", code: "ShiftLeft", width: 2 },
    { label: "Z", code: "KeyZ" }, { label: "X", code: "KeyX" },
    { label: "C", code: "KeyC" }, { label: "V", code: "KeyV" },
    { label: "B", code: "KeyB" }, { label: "N", code: "KeyN" },
    { label: "M", code: "KeyM" },
    { label: ",", code: "Comma" }, { label: ".", code: "Period" },
    { label: "⇧", code: "ShiftRight", width: 1.7 },
  ],
  [
    { label: "ctrl", code: "ControlLeft", width: 1.4 },
    { label: "⌥", code: "AltLeft", width: 1.2 },
    { label: "⌘", code: "MetaLeft", width: 1.4 },
    { label: "                ", code: "Space", width: 4.7 },
    { label: "⌘", code: "MetaRight", width: 1.2 },
    { label: "⌥", code: "AltRight", width: 1.2 },
    { label: "fn", code: "Fn", width: 1.2 },
  ],
];

// Flat list for ghost-key selection
const ALL_CODES = ROWS.flat().map(k => k.code);

// ──────────────────────────────────────────────
//  BINAURAL BEAT FREQUENCIES
// ──────────────────────────────────────────────
const BINAURAL_PROFILES: Record<string, { base: number; beat: number; label: string }> = {
  gamma:  { base: 200, beat: 40,  label: "40 Hz γ — deep focus" },
  beta:   { base: 200, beat: 18,  label: "18 Hz β — active thinking" },
  alpha:  { base: 200, beat: 10,  label: "10 Hz α — relaxed alert" },
  theta:  { base: 200, beat: 6,   label: "6 Hz θ — recovery" },
  delta:  { base: 200, beat: 2,   label: "2 Hz δ — sleep induction" },
};

// ──────────────────────────────────────────────
//  HELPERS — derive keyboard state from biometrics
// ──────────────────────────────────────────────
function deriveResistance(fatigue: number, lockFatigue: number): KeyboardResistance {
  if (fatigue > lockFatigue) return "locked";
  if (fatigue > 0.75) return "heavy";
  if (fatigue > 0.50) return "spongy";
  return "normal";
}

function deriveRGB(focus: number, fatigue: number, lockFatigue: number): KeyboardRGBMode {
  if (fatigue > lockFatigue) return "red-alert";
  if (fatigue > 0.70) return "pulsing";
  if (focus > 0.80)  return "amber-glow";
  if (focus < 0.30)  return "dim";
  return "neutral";
}

function deriveBinauralProfile(focus: number, fatigue: number, lockFatigue: number): string {
  if (fatigue > lockFatigue) return "delta";
  if (fatigue > 0.70) return "theta";
  if (focus > 0.85)  return "gamma";
  if (focus > 0.55)  return "beta";
  return "alpha";
}

/** Derive temperature from fatigue (0 → +4°C at max) */
function deriveTemperature(fatigue: number): number {
  return Math.round(fatigue * 4 * 10) / 10;
}

function rgbColor(mode: KeyboardRGBMode, intensity: number): string {
  switch (mode) {
    case "amber-glow": return `rgba(255, 167, 38, ${0.15 + intensity * 0.45})`;
    case "red-alert":  return `rgba(239, 68, 68, ${0.25 + intensity * 0.5})`;
    case "pulsing":    return `rgba(255, 120, 30, ${0.12 + intensity * 0.35})`;
    case "dim":        return `rgba(100, 116, 139, ${0.06 + intensity * 0.12})`;
    default:           return `rgba(96, 165, 250, ${0.08 + intensity * 0.2})`;
  }
}

function rgbGlow(mode: KeyboardRGBMode): string {
  switch (mode) {
    case "amber-glow": return "rgba(255, 167, 38, 0.6)";
    case "red-alert":  return "rgba(239, 68, 68, 0.7)";
    case "pulsing":    return "rgba(255, 120, 30, 0.5)";
    case "dim":        return "rgba(100, 116, 139, 0.15)";
    default:           return "rgba(96, 165, 250, 0.3)";
  }
}

function resistanceLabel(r: KeyboardResistance): { text: string; color: string; pct: number } {
  switch (r) {
    case "locked": return { text: "LOCKED", color: "#ef4444", pct: 100 };
    case "heavy":  return { text: "HEAVY",  color: "#f97316", pct: 75 };
    case "spongy": return { text: "SPONGY", color: "#fbbf24", pct: 45 };
    default:       return { text: "NORMAL", color: "#60a5fa", pct: 15 };
  }
}

// ──────────────────────────────────────────────
//  LETHARGY HELPERS
// ──────────────────────────────────────────────

/** Maps fatigue 0-1 to a key-return transition duration in seconds */
function keyReturnDuration(fatigue: number): number {
  // normal: 0.08s, spongy: 0.3s, heavy: 0.7s, locked: 1.2s
  return 0.08 + fatigue * fatigue * 1.12;
}

/** Maps fatigue 0-1 to a "sag" transform on the keyboard container (px) */
function containerSag(fatigue: number): number {
  return fatigue > 0.4 ? (fatigue - 0.4) * 6 : 0;
}

/** Maps fatigue 0-1 to label blur (px) */
function labelBlur(fatigue: number): number {
  if (fatigue < 0.5) return 0;
  return (fatigue - 0.5) * 2.4; // up to 1.2px blur at max
}

/** Maps fatigue 0-1 to label opacity */
function labelOpacity(fatigue: number): number {
  return Math.max(0.3, 1 - fatigue * 0.55);
}

/** Breathing interval for pulsing mode slows with fatigue */
function breatheSpeed(fatigue: number): number {
  // 0.08 rad/tick at low fatigue, 0.02 at high
  return Math.max(0.02, 0.08 - fatigue * 0.06);
}

// ──────────────────────────────────────────────
//  COMPONENT
// ──────────────────────────────────────────────
export function FrictionKeyboard() {
  const { current: bio } = useBiometrics();
  const { interceptFatigue } = useFrictionSettings();
  const { state: kbState, setResistance, setRGBMode, setBinaural, setTemperature } = useKeyboard();

  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [audioOn, setAudioOn] = useState(false);
  const [recentKey, setRecentKey] = useState<string | null>(null);
  const [ghostKeys, setGhostKeys] = useState<Set<string>>(new Set());

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscLRef = useRef<OscillatorNode | null>(null);
  const oscRRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const fatigue = bio.fatigue_percent;
  const focus = bio.focus_percent;

  // ── Always derive keyboard state from biometrics ──────
  useEffect(() => {
    const resistance = deriveResistance(fatigue, interceptFatigue);
    const rgb = deriveRGB(focus, fatigue, interceptFatigue);
    const binProfile = deriveBinauralProfile(focus, fatigue, interceptFatigue);
    const temp = deriveTemperature(fatigue);
    setResistance(resistance);
    setRGBMode(rgb);
    setBinaural(BINAURAL_PROFILES[binProfile].beat);
    setTemperature(temp);
  }, [focus, fatigue, interceptFatigue, setResistance, setRGBMode, setBinaural, setTemperature]);

  // ── Real keyboard event listeners ─────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      setPressedKeys(prev => new Set(prev).add(e.code));
      setRecentKey(e.code);
    };
    const onUp = (e: KeyboardEvent) => {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(e.code);
        return next;
      });
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // Clear recent key highlight — delay grows with fatigue (sluggish return)
  useEffect(() => {
    if (!recentKey) return;
    const delay = 200 + fatigue * 800; // 200ms → 1000ms
    const t = setTimeout(() => setRecentKey(null), delay);
    return () => clearTimeout(t);
  }, [recentKey, fatigue]);

  // ── Ghost key flickers at high fatigue ────────────────
  useEffect(() => {
    if (fatigue < 0.6) {
      setGhostKeys(new Set());
      return;
    }
    // LETHARGY-SYNCED: ghosts appear SLOWER at high fatigue (sluggish misfires)
    // 3s at 0.6 fatigue → 5s at 1.0 fatigue
    const interval = 3000 + (fatigue - 0.6) * 5000;
    // Fewer ghost keys: just 1, occasionally 2 at extreme fatigue
    const count = fatigue > 0.9 ? 2 : 1;

    const tick = setInterval(() => {
      const ghosts = new Set<string>();
      for (let i = 0; i < count; i++) {
        ghosts.add(ALL_CODES[Math.floor(Math.random() * ALL_CODES.length)]);
      }
      setGhostKeys(ghosts);
      // Linger longer with fatigue — slow fade like a stuck key
      setTimeout(() => setGhostKeys(new Set()), 400 + fatigue * 1200);
    }, interval);

    return () => clearInterval(tick);
  }, [fatigue]);

  // ── Binaural audio engine ─────────────────────────────
  const startAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const merger = ctx.createChannelMerger(2);
    merger.connect(gain);

    const oscL = ctx.createOscillator();
    oscL.type = "sine";
    oscL.frequency.value = 200;
    oscL.connect(merger, 0, 0);
    oscL.start();
    oscLRef.current = oscL;

    const oscR = ctx.createOscillator();
    oscR.type = "sine";
    oscR.frequency.value = 200 + kbState.binaural_hz;
    oscR.connect(merger, 0, 1);
    oscR.start();
    oscRRef.current = oscR;
  }, [kbState.binaural_hz]);

  const stopAudio = useCallback(() => {
    oscLRef.current?.stop();
    oscRRef.current?.stop();
    audioCtxRef.current?.close();
    oscLRef.current = null;
    oscRRef.current = null;
    audioCtxRef.current = null;
    gainRef.current = null;
  }, []);

  // Update binaural frequency when state changes
  useEffect(() => {
    if (!audioCtxRef.current || !oscRRef.current) return;
    const profile = BINAURAL_PROFILES[deriveBinauralProfile(focus, fatigue, interceptFatigue)];
    oscLRef.current!.frequency.setTargetAtTime(profile.base, audioCtxRef.current.currentTime, 0.5);
    oscRRef.current.frequency.setTargetAtTime(profile.base + profile.beat, audioCtxRef.current.currentTime, 0.5);
  }, [focus, fatigue, interceptFatigue]);

  // Adjust volume — lower when fatigued (mimics sluggishness)
  useEffect(() => {
    if (!gainRef.current || !audioCtxRef.current) return;
    const vol = Math.max(0.08, 0.25 - fatigue * 0.12);
    gainRef.current.gain.setTargetAtTime(vol, audioCtxRef.current.currentTime, 0.3);
  }, [fatigue]);

  const toggleAudio = () => {
    if (audioOn) { stopAudio(); setAudioOn(false); }
    else { startAudio(); setAudioOn(true); }
  };

  useEffect(() => stopAudio, [stopAudio]);

  // ── Derived display values ────────────────────────────
  const resistance = deriveResistance(fatigue, interceptFatigue);
  const rgb = deriveRGB(focus, fatigue, interceptFatigue);
  const binProfile = deriveBinauralProfile(focus, fatigue, interceptFatigue);
  const binInfo = BINAURAL_PROFILES[binProfile];
  const rInfo = resistanceLabel(resistance);
  const temperature = deriveTemperature(fatigue);

  // Pulsing intensity — breathing SLOWS with fatigue
  const [pulsePhase, setPulsePhase] = useState(0);
  useEffect(() => {
    if (rgb !== "pulsing" && rgb !== "red-alert") return;
    const speed = breatheSpeed(fatigue);
    const anim = setInterval(() => setPulsePhase(p => (p + speed) % (Math.PI * 2)), 50);
    return () => clearInterval(anim);
  }, [rgb, fatigue]);
  const pulseIntensity = (rgb === "pulsing" || rgb === "red-alert") ? 0.5 + Math.sin(pulsePhase) * 0.5 : 1;

  // Lethargy-derived values
  const returnDur = keyReturnDuration(fatigue);
  const sag = containerSag(fatigue);
  const blur = labelBlur(fatigue);
  const opacity = labelOpacity(fatigue);

  // Memoize the temperature edge glow
  const tempGlow = useMemo(() => {
    if (fatigue < 0.3) return "transparent";
    const a = Math.min(0.35, (fatigue - 0.3) * 0.5);
    return `rgba(239, 68, 68, ${a})`;
  }, [fatigue]);

  return (
    <div
      className="flex flex-col gap-2"
      style={{ fontFamily: "var(--friction-font-primary)" }}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Keyboard size={12} style={{ color: rInfo.color }} />
          <span
            className="uppercase tracking-[0.2em]"
            style={{ fontSize: "0.6rem", color: rInfo.color, fontWeight: 700 }}
          >
            Friction Keyboard
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Temperature readout */}
          {temperature > 0 && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `rgba(239,68,68,${Math.min(0.15, temperature * 0.04)})`,
                transition: "background-color 0.8s ease",
              }}
            >
              <Thermometer size={9} style={{ color: temperature > 2 ? "#ef4444" : "#f97316" }} />
              <span
                style={{
                  fontSize: "0.5rem",
                  color: temperature > 2 ? "#ef4444" : "#f97316",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                +{temperature.toFixed(1)}°C
              </span>
            </div>
          )}
          <button
            onClick={toggleAudio}
            className="p-1 rounded transition-colors"
            style={{
              backgroundColor: audioOn ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.05)",
              color: audioOn ? "#60a5fa" : "#64748b",
            }}
            title={audioOn ? "Mute binaural beats" : "Enable binaural beats (use headphones)"}
          >
            {audioOn ? <Volume2 size={11} /> : <VolumeX size={11} />}
          </button>
        </div>
      </div>

      {/* Explainer */}
      <p className="text-slate-500" style={{ fontSize: "0.55rem", lineHeight: 1.4 }}>
        Synced to biometric panel. Drag fatigue slider to see lethargy build —
        keys slow, ghost-presses flicker, labels blur, board sags.
      </p>

      {/* ── Status Bars ────────────────────────── */}
      <div className="grid grid-cols-3 gap-1.5">
        {/* Resistance */}
        <div
          className="p-1.5 rounded border text-center"
          style={{ borderColor: "#2a3f5f", backgroundColor: "#0a0e14" }}
        >
          <div className="text-slate-500 uppercase tracking-[0.15em]" style={{ fontSize: "0.45rem" }}>
            Resistance
          </div>
          <div className="mt-0.5" style={{ fontSize: "0.6rem", color: rInfo.color, fontWeight: 700 }}>
            {rInfo.text}
          </div>
          <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: "#1e293b" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${rInfo.pct}%`,
                backgroundColor: rInfo.color,
                transition: "width 0.6s ease, background-color 0.6s ease",
              }}
            />
          </div>
        </div>

        {/* RGB Mode */}
        <div
          className="p-1.5 rounded border text-center"
          style={{ borderColor: "#2a3f5f", backgroundColor: "#0a0e14" }}
        >
          <div className="text-slate-500 uppercase tracking-[0.15em]" style={{ fontSize: "0.45rem" }}>
            RGB Mode
          </div>
          <div className="mt-0.5" style={{ fontSize: "0.6rem", color: rgbGlow(rgb).replace(/[\d.]+\)$/, "1)"), fontWeight: 700 }}>
            {rgb.replace("-", " ").toUpperCase()}
          </div>
          <div
            className="h-1 rounded-full mt-1"
            style={{
              backgroundColor: rgbColor(rgb, 0.8),
              boxShadow: `0 0 6px ${rgbGlow(rgb)}`,
              transition: "all 0.6s ease",
            }}
          />
        </div>

        {/* Binaural */}
        <div
          className="p-1.5 rounded border text-center"
          style={{ borderColor: "#2a3f5f", backgroundColor: "#0a0e14" }}
        >
          <div className="text-slate-500 uppercase tracking-[0.15em]" style={{ fontSize: "0.45rem" }}>
            Binaural
          </div>
          <div className="mt-0.5" style={{ fontSize: "0.6rem", color: audioOn ? "#a78bfa" : "#64748b", fontWeight: 700 }}>
            {binInfo.beat} Hz
          </div>
          <div className="text-slate-500 mt-0.5" style={{ fontSize: "0.42rem" }}>
            {binInfo.label.split("—")[1]?.trim() || binInfo.label}
          </div>
        </div>
      </div>

      {/* ── Keyboard Visual ────────────────────── */}
      <div
        className="rounded-lg p-2 relative overflow-hidden"
        style={{
          backgroundColor: "#0a0e14",
          border: `1px solid ${rgbColor(rgb, 0.3)}`,
          boxShadow: `
            inset 0 0 20px ${rgbColor(rgb, 0.15 * pulseIntensity)},
            0 0 12px ${rgbColor(rgb, 0.08 * pulseIntensity)},
            inset 0 0 30px ${tempGlow}
          `,
          // LETHARGY: container sags and tilts slightly
          transform: `translateY(${sag}px) perspective(400px) rotateX(${sag * 0.4}deg)`,
          transition: "border-color 1s ease, box-shadow 1s ease, transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Underglow effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, ${rgbColor(rgb, 0.25 * pulseIntensity)}, transparent 70%)`,
            transition: "all 1s ease",
          }}
        />

        {/* Temperature heat haze at edges (high fatigue) */}
        {fatigue > 0.4 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, transparent 60%, ${tempGlow} 100%)`,
              opacity: pulseIntensity,
              transition: "opacity 1.5s ease",
            }}
          />
        )}

        {/* Key rows */}
        <div className="relative flex flex-col gap-[3px]">
          {ROWS.map((row, ri) => (
            <div key={ri} className="flex gap-[3px] justify-center">
              {row.map(key => {
                const isPressed = pressedKeys.has(key.code);
                const isRecent = recentKey === key.code;
                const isGhost = ghostKeys.has(key.code);
                const w = key.width || 1;

                // Resistance affects press animation depth
                const pressDepth = isPressed
                  ? resistance === "locked" ? 0
                    : resistance === "heavy" ? 1
                    : resistance === "spongy" ? 2
                    : 3
                  : 0;

                // LETHARGY: press transition gets slower
                const pressDur = isPressed
                  ? resistance === "heavy" ? "0.35s"
                    : resistance === "spongy" ? "0.18s"
                    : resistance === "locked" ? "0s"
                    : "0.05s"
                  : `${returnDur.toFixed(2)}s`;

                // Ghost keys get a dim glow
                const ghostGlow = isGhost && !isPressed;

                // LETHARGY: glow/color transitions slow down with fatigue
                const glowDur = (0.15 + fatigue * 1.35).toFixed(2); // 0.15s → 1.5s

                return (
                  <div
                    key={key.code}
                    className="relative flex items-center justify-center rounded select-none"
                    style={{
                      width: `${w * 24}px`,
                      height: "22px",
                      fontSize: "0.5rem",
                      fontFamily: "var(--friction-font-primary)",
                      // LETHARGY: labels dim and blur
                      color: isPressed
                        ? "#fff"
                        : isRecent
                        ? rgbGlow(rgb).replace(/[\d.]+\)$/, "1)")
                        : ghostGlow
                        ? rgbColor(rgb, 0.6).replace(/[\d.]+\)$/, "0.7)")
                        : `rgba(100, 116, 139, ${opacity})`,
                      filter: blur > 0 && !isPressed && !isRecent ? `blur(${blur}px)` : "none",
                      backgroundColor: isPressed
                        ? rgbColor(rgb, 0.6 * pulseIntensity)
                        : ghostGlow
                        ? rgbColor(rgb, 0.15 * pulseIntensity)
                        : "rgba(30, 41, 59, 0.5)",
                      border: `1px solid ${
                        isPressed
                          ? rgbGlow(rgb)
                          : isRecent
                          ? rgbColor(rgb, 0.4)
                          : ghostGlow
                          ? rgbColor(rgb, 0.25)
                          : "rgba(51, 65, 85, 0.4)"
                      }`,
                      boxShadow: isPressed
                        ? `0 0 8px ${rgbGlow(rgb)}, inset 0 ${pressDepth}px 0 rgba(0,0,0,0.3)`
                        : isRecent
                        ? `0 0 4px ${rgbColor(rgb, 0.3)}`
                        : ghostGlow
                        ? `0 0 6px ${rgbColor(rgb, 0.2)}, inset 0 0 4px ${rgbColor(rgb, 0.1)}`
                        : "none",
                      // LETHARGY: key physically sinks and returns slowly
                      transform: isPressed
                        ? `translateY(${3 - pressDepth}px)`
                        : isRecent
                        ? `translateY(${Math.min(1, fatigue * 1.5)}px)` // sluggish return — doesn't fully come back immediately
                        : "translateY(0px)",
                      transition: `transform ${pressDur} cubic-bezier(0.4, 0, 0.2, 1), color ${glowDur}s ease, background-color ${glowDur}s ease, border-color ${glowDur}s ease, box-shadow ${glowDur}s ease, filter 0.5s ease`,
                      opacity: resistance === "locked" && isPressed ? 0.4 : 1,
                    }}
                  >
                    {key.label.trim() === "" ? "␣" : key.label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Locked overlay */}
        {resistance === "locked" && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-lg"
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(2px)",
            }}
          >
            <span
              className="uppercase tracking-[0.3em] animate-pulse"
              style={{ fontSize: "0.65rem", color: "#ef4444", fontWeight: 700 }}
            >
              Keys Locked — Cognitive Limit
            </span>
          </div>
        )}
      </div>

      {/* ── Fatigue Lethargy Meter ────────────── */}
      <div
        className="flex items-center gap-2 px-1"
        style={{ opacity: fatigue > 0.1 ? 1 : 0.4, transition: "opacity 0.5s ease" }}
      >
        <div className="flex-1">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-slate-500 uppercase tracking-[0.15em]" style={{ fontSize: "0.45rem" }}>
              Lethargy Index
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: "0.5rem",
                color: fatigue > 0.75 ? "#ef4444" : fatigue > 0.5 ? "#f97316" : "#64748b",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {Math.round(fatigue * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#1e293b" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${fatigue * 100}%`,
                background: fatigue > 0.75
                  ? "linear-gradient(90deg, #f97316, #ef4444)"
                  : fatigue > 0.5
                  ? "linear-gradient(90deg, #fbbf24, #f97316)"
                  : "linear-gradient(90deg, #60a5fa, #818cf8)",
                transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background 0.8s ease",
                boxShadow: fatigue > 0.7 ? `0 0 6px rgba(239, 68, 68, ${fatigue * 0.5})` : "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Legend ────── */}
      <div className="grid grid-cols-1 gap-1">
        <LegendRow
          color={rInfo.color}
          label="Magnetic Resistance"
          value={`Keys feel ${rInfo.text.toLowerCase()} — return: ${returnDur.toFixed(1)}s`}
        />
        <LegendRow
          color={rgbGlow(rgb).replace(/[\d.]+\)$/, "0.9)")}
          label="RGB Underglow"
          value={rgb === "amber-glow" ? "Warm amber — deep flow detected" :
                 rgb === "red-alert" ? "Red alert — cognitive limit reached" :
                 rgb === "pulsing" ? "Pulsing — fatigue building" :
                 rgb === "dim" ? "Dimmed — low focus / recovery" :
                 "Neutral blue — baseline"}
        />
        <LegendRow
          color={audioOn ? "#a78bfa" : "#475569"}
          label="Binaural Audio"
          value={audioOn ? `${binInfo.label} (headphones recommended)` : "Muted — click speaker to enable"}
        />
        {fatigue > 0.6 && (
          <LegendRow
            color="#ef4444"
            label="Ghost Keys"
            value={`Phantom misfires — sluggish noise at ${Math.round(fatigue * 100)}% fatigue`}
          />
        )}
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div
        className="w-1.5 h-1.5 rounded-full mt-[3px] shrink-0"
        style={{ backgroundColor: color }}
      />
      <div>
        <span className="text-slate-400 uppercase tracking-[0.1em]" style={{ fontSize: "0.48rem" }}>
          {label}
        </span>
        <span className="text-slate-500 ml-1" style={{ fontSize: "0.48rem" }}>
          — {value}
        </span>
      </div>
    </div>
  );
}