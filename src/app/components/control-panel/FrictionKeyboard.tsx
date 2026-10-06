/**
 * FRICTION KEYBOARD — simulated hardware
 *
 * A compact QWERTY board that mirrors real key events and shows what the
 * physical Friction keyboard would do with the current sensor readings:
 *   1. Key resistance — presses sink less and return more slowly as fatigue rises
 *   2. Light mode — derived from focus and fatigue, published to KeyboardContext
 *   3. Binaural tone — optional stereo audio that shifts with the readings
 *   4. Temperature — the board warms up to +4 °C with fatigue
 *
 * At high fatigue a random key briefly lights up, as a stand-in for misfires.
 */

import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { useBiometrics } from "../../context/BiometricContext";
import { useFrictionSettings } from "../../context/FrictionSettingsContext";
import { useKeyboard, type KeyboardResistance, type KeyboardRGBMode } from "../../context/KeyboardContext";

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
    { label: "", code: "Space", width: 4.7 },
    { label: "⌘", code: "MetaRight", width: 1.2 },
    { label: "⌥", code: "AltRight", width: 1.2 },
    { label: "fn", code: "Fn", width: 1.2 },
  ],
];

// Flat list for misfire-key selection
const ALL_CODES = ROWS.flat().map(k => k.code);

// ──────────────────────────────────────────────
//  BINAURAL TONE PROFILES
// ──────────────────────────────────────────────
const BINAURAL_PROFILES: Record<string, { base: number; beat: number; label: string }> = {
  gamma: { base: 200, beat: 40, label: "deep focus" },
  beta:  { base: 200, beat: 18, label: "active thinking" },
  alpha: { base: 200, beat: 10, label: "relaxed" },
  theta: { base: 200, beat: 6,  label: "recovery" },
  delta: { base: 200, beat: 2,  label: "rest" },
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

const RESISTANCE_WORDS: Record<KeyboardResistance, string> = {
  normal: "Normal",
  spongy: "Soft",
  heavy: "Heavy",
  locked: "Locked",
};

const LIGHT_WORDS: Record<KeyboardRGBMode, string> = {
  "amber-glow": "Deep focus",
  pulsing: "Getting tired",
  dim: "Low focus",
  neutral: "Normal",
  "red-alert": "Warning",
};

/** Maps fatigue 0-1 to a key-return transition duration in seconds */
function keyReturnDuration(fatigue: number): number {
  // normal: 0.08s, spongy: 0.3s, heavy: 0.7s, locked: 1.2s
  return 0.08 + fatigue * fatigue * 1.12;
}

const tabular: CSSProperties = { fontVariantNumeric: "tabular-nums" };

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

  // Clear recent key highlight — delay grows with fatigue (slow return)
  useEffect(() => {
    if (!recentKey) return;
    const delay = 200 + fatigue * 800; // 200ms → 1000ms
    const t = setTimeout(() => setRecentKey(null), delay);
    return () => clearTimeout(t);
  }, [recentKey, fatigue]);

  // ── Misfire keys at high fatigue ──────────────────────
  useEffect(() => {
    if (fatigue < 0.6) {
      setGhostKeys(new Set());
      return;
    }
    // Misfires come slower as fatigue rises: 3s at 0.6 → 5s at 1.0
    const interval = 3000 + (fatigue - 0.6) * 5000;
    const count = fatigue > 0.9 ? 2 : 1;

    const tick = setInterval(() => {
      const ghosts = new Set<string>();
      for (let i = 0; i < count; i++) {
        ghosts.add(ALL_CODES[Math.floor(Math.random() * ALL_CODES.length)]);
      }
      setGhostKeys(ghosts);
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

  // Adjust volume — lower when fatigued
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
  const binInfo = BINAURAL_PROFILES[deriveBinauralProfile(focus, fatigue, interceptFatigue)];
  const temperature = deriveTemperature(fatigue);
  const locked = resistance === "locked";
  const returnDur = keyReturnDuration(fatigue);
  // Labels fade as fatigue rises, so the board looks tired without extra effects
  const labelMix = Math.round(Math.max(30, 60 - fatigue * 30));

  return (
    <div className="flex flex-col" style={{ gap: "1rem", fontFamily: "var(--pi-font)" }}>
      {/* ── State ── */}
      <dl className="grid" style={{ gridTemplateColumns: "auto 1fr", columnGap: "1rem", rowGap: "0.375rem", margin: 0, fontSize: "0.8125rem" }}>
        <dt style={{ color: "var(--pi-ink-60)" }}>Keys</dt>
        <dd style={{ margin: 0, color: locked ? "var(--pi-hot)" : "var(--pi-ink)", transition: "color var(--pi-ease-focus)" }}>
          {RESISTANCE_WORDS[resistance]}
        </dd>

        <dt style={{ color: "var(--pi-ink-60)" }}>Light</dt>
        <dd style={{ margin: 0 }}>{LIGHT_WORDS[rgb]}</dd>

        <dt style={{ color: "var(--pi-ink-60)" }}>Heat</dt>
        <dd style={{ margin: 0, ...tabular }}>+{temperature.toFixed(1)} °C</dd>

        <dt style={{ color: "var(--pi-ink-60)" }}>Tone</dt>
        <dd style={{ margin: 0 }} className="flex items-center justify-between gap-2">
          <span style={{ color: audioOn ? "var(--pi-ink)" : "var(--pi-ink-60)" }}>
            <span style={{ ...tabular, color: audioOn ? "var(--pi-blue)" : undefined }}>{binInfo.beat} Hz</span>
            , {binInfo.label}
          </span>
          <button
            className="pi-btn"
            aria-pressed={audioOn}
            onClick={toggleAudio}
            title="Binaural tone. Use headphones."
            style={{ padding: "0.3rem 0.6rem", fontSize: "0.65rem" }}
          >
            {audioOn ? "Sound on" : "Sound off"}
          </button>
        </dd>
      </dl>

      {/* ── Board ── */}
      <div
        className="relative"
        style={{
          padding: "0.5rem",
          border: "1px solid var(--pi-hairline)",
          backgroundColor: "var(--pi-surface)",
        }}
      >
        <div className="flex flex-col" style={{ gap: "3px" }}>
          {ROWS.map((row, ri) => (
            <div key={ri} className="flex" style={{ gap: "3px" }}>
              {row.map(key => {
                const isPressed = pressedKeys.has(key.code);
                const isRecent = recentKey === key.code;
                const isGhost = ghostKeys.has(key.code) && !isPressed;
                const w = key.width || 1;

                // Resistance sets how far a press sinks
                const pressDepth = isPressed
                  ? resistance === "locked" ? 0
                    : resistance === "heavy" ? 1
                    : resistance === "spongy" ? 2
                    : 3
                  : 0;

                // Presses get slower with resistance; returns get slower with fatigue
                const pressDur = isPressed
                  ? resistance === "heavy" ? "0.35s"
                    : resistance === "spongy" ? "0.18s"
                    : resistance === "locked" ? "0s"
                    : "0.05s"
                  : `${returnDur.toFixed(2)}s`;

                const active = isPressed && !locked;

                return (
                  <div
                    key={key.code}
                    className="flex items-center justify-center select-none"
                    style={{
                      flex: `${w} ${w} 0`,
                      minWidth: 0,
                      height: "22px",
                      fontSize: "0.55rem",
                      border: `1px solid ${isRecent || isPressed ? "var(--pi-ink)" : "var(--pi-hairline)"}`,
                      backgroundColor: active
                        ? "var(--pi-ink)"
                        : isGhost
                        ? "var(--pi-ink-08)"
                        : "var(--pi-ground)",
                      color: active
                        ? "var(--pi-ground)"
                        : `color-mix(in srgb, var(--pi-ink) ${isRecent || isGhost ? 100 : labelMix}%, transparent)`,
                      transform: isPressed
                        ? `translateY(${pressDepth}px)`
                        : isRecent
                        ? `translateY(${Math.min(1, fatigue * 1.5)}px)` // slow return: not fully back yet
                        : "translateY(0px)",
                      transition: `transform ${pressDur} cubic-bezier(0.32, 0.72, 0, 1), background-color var(--pi-ease-hover), color var(--pi-ease-hover), border-color var(--pi-ease-hover)`,
                    }}
                  >
                    {key.label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {locked && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backgroundColor: "color-mix(in srgb, var(--pi-ground) 88%, transparent)",
              border: "1px solid var(--pi-hot)",
            }}
          >
            <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--pi-hot)" }}>
              Locked: too tired to continue
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
