/**
 * CONTROL PANEL
 * 
 * Left sidebar for demo control. Shows persona selector, interactive
 * draggable timeline, biometric overrides, and context-switch simulation.
 * Keyboard state removed — lives only in the physical device concept.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useBiometrics } from "../../context/BiometricContext";
import { usePersona } from "../../context/PersonaContext";
import { useSession } from "../../context/SessionContext";
import { useFrictionSettings } from "../../context/FrictionSettingsContext";
import { useWindowManager } from "../../context/WindowManagerContext";
import { usePersonaSimulation } from "../../hooks/usePersonaSimulation";
import { ALL_PERSONAS, type BiometricPattern } from "../../data/personas";
import { FrictionKeyboard } from "./FrictionKeyboard";
import {
  User, Sliders, ArrowLeft, Clock, Brain, Zap, Play, Pause,
  SkipForward, SkipBack, LogOut, LogIn, Activity, Check,
} from "lucide-react";

/** Interpolate biometrics between two pattern points */
function interpolateBiometrics(
  pattern: BiometricPattern[],
  timeMinutes: number
): { focus: number; fatigue: number; engagement: number } {
  if (pattern.length === 0) return { focus: 0.5, fatigue: 0.2, engagement: 0.5 };
  if (timeMinutes <= pattern[0].timestamp) return pattern[0];
  if (timeMinutes >= pattern[pattern.length - 1].timestamp) return pattern[pattern.length - 1];

  for (let i = 0; i < pattern.length - 1; i++) {
    const a = pattern[i];
    const b = pattern[i + 1];
    if (timeMinutes >= a.timestamp && timeMinutes <= b.timestamp) {
      const t = (timeMinutes - a.timestamp) / (b.timestamp - a.timestamp);
      return {
        focus: a.focus + (b.focus - a.focus) * t,
        fatigue: a.fatigue + (b.fatigue - a.fatigue) * t,
        engagement: a.engagement + (b.engagement - a.engagement) * t,
      };
    }
  }
  return pattern[pattern.length - 1];
}

export function ControlPanel() {
  const { current: biometrics, setCurrent, simulateGradualChange, setBiometrics } = useBiometrics();
  const { currentPersona, setPersona, currentStoryBeatIndex } = usePersona();
  const { startSession, sessionState, triggerStrike, activateMoss, activeScreenNumber, forceScreen } = useSession();
  const { interceptFatigue } = useFrictionSettings();
  const { closeAllWindows } = useWindowManager();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineMinutes, setTimelineMinutes] = useState(0);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [steppedAway, setSteppedAway] = useState(false);
  const [preAwayBiometrics, setPreAwayBiometrics] = useState<{ focus: number; fatigue: number } | null>(null);
  const steppedAwayAtRef = useRef<number>(0); // timestamp when user stepped away
  const trackRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drive the fake OS desktop based on persona timeline
  usePersonaSimulation({
    persona: currentPersona,
    timelineMinutes,
    isActive: showTimeline && !!currentPersona,
    isAutoPlaying,
  });

  const handleFocusChange = (value: number) => {
    setCurrent({ ...biometrics, focus_percent: value / 100 });
  };
  const handleFatigueChange = (value: number) => {
    setCurrent({ ...biometrics, fatigue_percent: value / 100 });
  };

  const handlePersonaClick = (personaId: string) => {
    setPersona(personaId);
    setShowTimeline(true);
    setTimelineMinutes(0);
    setSteppedAway(false);
    setPreAwayBiometrics(null);
    if (sessionState !== "active") startSession();
    // Drive biometrics to start
    const persona = ALL_PERSONAS.find(p => p.id === personaId);
    if (persona) {
      const bio = interpolateBiometrics(persona.biometricPattern, 0);
      setBiometrics({ focus_percent: bio.focus, fatigue_percent: bio.fatigue });
    }
  };

  const handleBackToControls = () => {
    setShowTimeline(false);
    setIsAutoPlaying(false);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    closeAllWindows();
  };

  /** Drive biometrics from timeline position */
  const driveFromTimeline = useCallback((minutes: number) => {
    if (!currentPersona) return;
    const bio = interpolateBiometrics(currentPersona.biometricPattern, minutes);
    setBiometrics({ focus_percent: bio.focus, fatigue_percent: bio.fatigue });
  }, [currentPersona, setBiometrics]);

  /** Handle drag on the timeline track */
  const handleTrackInteraction = useCallback((clientY: number) => {
    if (!trackRef.current || !currentPersona) return;
    const rect = trackRef.current.getBoundingClientRect();
    const relY = Math.max(0, Math.min(clientY - rect.top, rect.height));
    const pct = relY / rect.height;
    const minutes = pct * currentPersona.sessionDurationMinutes;
    setTimelineMinutes(minutes);
    driveFromTimeline(minutes);
  }, [currentPersona, driveFromTimeline]);

  const handleTrackMouseDown = (e: React.MouseEvent) => {
    setIsDraggingTimeline(true);
    handleTrackInteraction(e.clientY);
  };

  useEffect(() => {
    if (!isDraggingTimeline) return;
    const onMove = (e: MouseEvent) => handleTrackInteraction(e.clientY);
    const onUp = () => setIsDraggingTimeline(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDraggingTimeline, handleTrackInteraction]);

  /** Auto-play: advance timeline */
  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    } else {
      setIsAutoPlaying(true);
    }
  };

  useEffect(() => {
    if (!isAutoPlaying || !currentPersona) return;
    const dur = currentPersona.sessionDurationMinutes;
    // Advance 1 minute every 300ms (fast demo)
    const interval = setInterval(() => {
      setTimelineMinutes(prev => {
        const next = prev + 1;
        if (next >= dur) {
          setIsAutoPlaying(false);
          return dur;
        }
        return next;
      });
    }, 300);
    autoPlayRef.current = interval;
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentPersona]);

  // Drive biometrics when timeline changes (from auto-play)
  useEffect(() => {
    if (isAutoPlaying && currentPersona && !steppedAway) {
      driveFromTimeline(timelineMinutes);
    }
  }, [timelineMinutes, isAutoPlaying, currentPersona, driveFromTimeline, steppedAway]);

  /** Jump to a specific story beat */
  const jumpToBeat = (beatIndex: number) => {
    if (!currentPersona) return;
    const beat = currentPersona.storyBeats[beatIndex];
    if (!beat) return;
    setTimelineMinutes(beat.time);
    driveFromTimeline(beat.time);
  };

  /** Context switch: "Stepped Away" */
  const handleStepAway = () => {
    setSteppedAway(true);
    steppedAwayAtRef.current = Date.now();
    setIsAutoPlaying(false);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setPreAwayBiometrics({
      focus: biometrics.focus_percent,
      fatigue: biometrics.fatigue_percent,
    });
    // Crash focus
    setBiometrics({ focus_percent: 0.03, fatigue_percent: biometrics.fatigue_percent + 0.05 });
  };

  /** Return from context switch — branches on absence duration */
  const LONG_ABSENCE_THRESHOLD_MS = 90_000; // 90 seconds

  const handlePickBackUp = () => {
    setSteppedAway(false);
    const absenceDuration = Date.now() - steppedAwayAtRef.current;
    const isLongAbsence = absenceDuration >= LONG_ABSENCE_THRESHOLD_MS;

    if (!isLongAbsence) {
      // ── SHORT ABSENCE: Neural Residue (swipe-to-clear) pathway ──
      // Activate residue overlay — suppresses RefocusPopup
      if (currentPersona) {
        const contextKeywords = [
          "normalization weights",
          "batch_variance_threshold",
          "line 247",
          "debugging loop",
          "variable scope",
          currentPersona.tasks[0]?.title || "",
        ].filter(Boolean);
        activateMoss(contextKeywords);
      }
      // Restore focus aggressively — short break, small switching cost
      if (preAwayBiometrics) {
        simulateGradualChange({
          focus_percent: Math.max(preAwayBiometrics.focus * 0.80, 0.40),
          fatigue_percent: Math.min(preAwayBiometrics.fatigue + 0.05, 1),
        }, 2500);
      }
    } else {
      // ── LONG ABSENCE: Refocus Exercise pathway ──
      // Do NOT activate residue → focus stays < 0.30 → RefocusPopup shows naturally
      // Gentle partial restore that keeps focus below the 0.30 threshold
      if (preAwayBiometrics) {
        simulateGradualChange({
          focus_percent: 0.18, // stays below 0.30 so RefocusPopup remains
          fatigue_percent: Math.min(preAwayBiometrics.fatigue + 0.12, 1),
        }, 4000);
      }
    }
    setPreAwayBiometrics(null);
  };

  /** Figure out which beat we're closest to */
  const getActiveBeatIndex = (): number => {
    if (!currentPersona) return -1;
    let closest = 0;
    for (let i = 0; i < currentPersona.storyBeats.length; i++) {
      if (timelineMinutes >= currentPersona.storyBeats[i].time) closest = i;
    }
    return closest;
  };

  const activeBeatIdx = getActiveBeatIndex();
  const activeBeat = currentPersona?.storyBeats[activeBeatIdx];

  /** Get current task based on timeline */
  const getCurrentTasks = (): { active: string; upcoming: string } => {
    if (!currentPersona) return { active: "—", upcoming: "—" };
    const elapsed = timelineMinutes;
    let accum = 0;
    let activeTask = currentPersona.tasks[0]?.title || "—";
    let upcomingTask = "—";
    for (let i = 0; i < currentPersona.tasks.length; i++) {
      accum += currentPersona.tasks[i].estimatedMinutes;
      if (elapsed < accum) {
        activeTask = currentPersona.tasks[i].title;
        upcomingTask = currentPersona.tasks[i + 1]?.title || "Session complete";
        break;
      }
    }
    return { active: activeTask, upcoming: upcomingTask };
  };

  const currentTasks = getCurrentTasks();

  // Derive current Screen 2 sub-state from biometrics
  const getScreen2SubState = (): { label: string; code: string; color: string } => {
    const focus = biometrics.focus_percent;
    const fatigue = biometrics.fatigue_percent;
    if (fatigue > interceptFatigue) return { label: "Hard Intercept", code: "2.6", color: "#ef4444" };
    if (focus > 0.80) return { label: "Flow Pill", code: "2.1", color: "#4ade80" };
    if (focus > 0.50) return { label: "Peek Card", code: "2.3", color: "#60a5fa" };
    if (focus > 0.30) return { label: "Peek + Breathing", code: "2.4", color: "#f59e0b" };
    return { label: "Refocus Popup", code: "2.5", color: "#a78bfa" };
  };

  const screen2Sub = getScreen2SubState();

  const SCREEN_DEFS: { num: 1 | 2 | 3; label: string; subtitle: string; color: string }[] = [
    { num: 1, label: "Terminal", subtitle: "Moon Pool / Task Setup", color: "#ffa726" },
    { num: 2, label: "Scaffolding", subtitle: "Active Session", color: "#60a5fa" },
    { num: 3, label: "Mirror", subtitle: "Reflection", color: "#a78bfa" },
  ];

  return (
    <div
      className="h-screen flex flex-col"
      style={{
        width: isExpanded ? "380px" : "64px",
        backgroundColor: "#0c0e14",
        fontFamily: "var(--friction-font-primary)",
        transition: "width 0.3s ease",
        borderRight: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {/* Header */}
      {isExpanded && (
        <div className="shrink-0 px-5 pt-5 pb-3" style={{ backgroundColor: "#0c0e14" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#475569" }}
            />
            <span className="text-slate-500 uppercase tracking-[0.25em]" style={{ fontSize: "0.55rem" }}>
              Simulation Controls
            </span>
          </div>
          <h2 className="text-slate-200 uppercase tracking-[0.1em]" style={{ fontSize: "0.8rem" }}>
            Neural Interface
          </h2>
          <p className="text-slate-600 mt-1" style={{ fontSize: "0.52rem" }}>
            Configure biometric state &middot; Not visible to end user
          </p>
        </div>
      )}

      {/* ══════ SCREEN STATE HUD ══════ */}
      {isExpanded && (
        <div
          className="shrink-0 px-4 py-3"
          style={{
            backgroundColor: "#080a10",
            borderTop: "1px solid rgba(255, 167, 38, 0.08)",
            borderBottom: "1px solid rgba(255, 167, 38, 0.08)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-2.5">
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
              <path d="M6 0.5L11 6L6 11.5L1 6L6 0.5Z" fill="#ff8c00" />
            </svg>
            <span
              className="uppercase tracking-[0.2em]"
              style={{ fontSize: "0.5rem", color: "rgba(255, 167, 38, 0.5)" }}
            >
              Active Screen
            </span>
          </div>

          {/* Screen selector buttons */}
          <div className="flex gap-1.5 mb-2">
            {SCREEN_DEFS.map(s => {
              const isActive = activeScreenNumber === s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => forceScreen(s.num)}
                  className="flex-1 py-2 px-1.5 rounded cursor-pointer transition-all"
                  style={{
                    backgroundColor: isActive ? `${s.color}15` : "rgba(255,255,255,0.02)",
                    border: `1.5px solid ${isActive ? s.color : "rgba(255,255,255,0.06)"}`,
                    boxShadow: isActive ? `0 0 12px ${s.color}20` : "none",
                  }}
                >
                  <div
                    className="text-center tabular-nums"
                    style={{
                      fontSize: "0.85rem",
                      color: isActive ? s.color : "#475569",
                      transition: "color 0.2s",
                    }}
                  >
                    {s.num}
                  </div>
                  <div
                    className="text-center uppercase tracking-[0.1em]"
                    style={{
                      fontSize: "0.45rem",
                      color: isActive ? s.color : "#374151",
                      marginTop: "2px",
                      transition: "color 0.2s",
                    }}
                  >
                    {s.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current sub-state detail (only meaningful for Screen 2) */}
          {activeScreenNumber === 2 && (
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded"
              style={{
                backgroundColor: `${screen2Sub.color}08`,
                border: `1px solid ${screen2Sub.color}20`,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: screen2Sub.color,
                  boxShadow: `0 0 6px ${screen2Sub.color}60`,
                }}
              />
              <span
                className="font-mono"
                style={{ fontSize: "0.55rem", color: screen2Sub.color }}
              >
                {screen2Sub.code}
              </span>
              <span
                className="uppercase tracking-[0.1em]"
                style={{ fontSize: "0.5rem", color: `${screen2Sub.color}cc` }}
              >
                {screen2Sub.label}
              </span>
            </div>
          )}
          {activeScreenNumber === 1 && (
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded"
              style={{
                backgroundColor: "rgba(255, 167, 38, 0.04)",
                border: "1px solid rgba(255, 167, 38, 0.1)",
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: "#ffa726", boxShadow: "0 0 6px rgba(255,167,38,0.4)" }}
              />
              <span className="uppercase tracking-[0.1em]" style={{ fontSize: "0.5rem", color: "#ffa726" }}>
                Idle &mdash; Hover right edge of OS to see drawer
              </span>
            </div>
          )}
          {activeScreenNumber === 3 && (
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded"
              style={{
                backgroundColor: "rgba(167, 139, 250, 0.04)",
                border: "1px solid rgba(167, 139, 250, 0.1)",
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: "#a78bfa", boxShadow: "0 0 6px rgba(167,139,250,0.4)" }}
              />
              <span className="uppercase tracking-[0.1em]" style={{ fontSize: "0.5rem", color: "#a78bfa" }}>
                Post-Session &mdash; Hover right edge for reflection
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mode label */}
      <div
        className="flex items-center justify-between px-5 py-2.5 shrink-0"
        style={{ backgroundColor: "#0a0c12", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        {isExpanded && (
          <div>
            <h3 className="text-slate-400 uppercase tracking-[0.2em]" style={{ fontSize: "0.6rem" }}>
              {showTimeline ? "Persona Timeline" : "Biometric Override"}
            </h3>
            <p className="text-slate-600" style={{ fontSize: "0.5rem", marginTop: "2px" }}>
              {showTimeline ? currentPersona?.name : "Drag sliders to simulate state"}
            </p>
          </div>
        )}
        {showTimeline && isExpanded ? (
          <button
            onClick={handleBackToControls}
            className="p-2 text-slate-500 hover:text-slate-300 transition-colors rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
          >
            <ArrowLeft size={16} />
          </button>
        ) : (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-500 hover:text-slate-300 transition-colors rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
          >
            <Sliders size={16} />
          </button>
        )}
      </div>

      {/* ====== TIMELINE VIEW ====== */}
      {isExpanded && showTimeline && currentPersona && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Persona Info Bar */}
          <div
            className="px-5 py-3 border-b shrink-0"
            style={{ borderColor: "#2a3f5f", backgroundColor: "#0f1419" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <User size={14} style={{ color: currentPersona.accentColor }} />
              <span className="font-bold uppercase tracking-[0.1em]" style={{ color: currentPersona.accentColor, fontSize: "0.75rem" }}>
                {currentPersona.name}
              </span>
              <span className="text-slate-500" style={{ fontSize: "0.6rem" }}>
                {currentPersona.archetype}
              </span>
            </div>
            <p className="text-slate-400" style={{ fontSize: "0.6rem", lineHeight: "1.4" }}>
              {currentPersona.description}
            </p>
          </div>

          {/* Transport Controls */}
          <div
            className="flex items-center justify-between px-5 py-2.5 border-b shrink-0"
            style={{ borderColor: "#2a3f5f", backgroundColor: "#111827" }}
          >
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setTimelineMinutes(0); driveFromTimeline(0); }}
                className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors rounded"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              >
                <SkipBack size={12} />
              </button>
              <button
                onClick={toggleAutoPlay}
                className="p-1.5 rounded transition-colors"
                style={{
                  backgroundColor: isAutoPlaying ? "rgba(96,165,250,0.2)" : "rgba(255,255,255,0.05)",
                  color: isAutoPlaying ? "#60a5fa" : "#94a3b8",
                }}
              >
                {isAutoPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button
                onClick={() => { jumpToBeat(Math.min(activeBeatIdx + 1, currentPersona.storyBeats.length - 1)); }}
                className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors rounded"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              >
                <SkipForward size={12} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Clock size={11} className="text-slate-500" />
              <span className="font-mono text-slate-300" style={{ fontSize: "0.7rem" }}>
                {Math.round(timelineMinutes)}m / {currentPersona.sessionDurationMinutes}m
              </span>
            </div>
          </div>

          {/* Current Activity Status */}
          <div
            className="px-5 py-2.5 border-b shrink-0"
            style={{ borderColor: "#2a3f5f", backgroundColor: steppedAway ? "rgba(239, 68, 68, 0.08)" : "#0d1117" }}
          >
            {steppedAway ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 uppercase tracking-[0.15em] font-bold" style={{ fontSize: "0.6rem" }}>
                  Context Lost — Stepped Away
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Activity size={10} style={{ color: currentPersona.accentColor }} />
                  <span className="uppercase tracking-[0.15em] font-bold" style={{ fontSize: "0.6rem", color: currentPersona.accentColor }}>
                    {activeBeat?.subState || "idle"}
                  </span>
                </div>
                <p className="text-slate-300 truncate" style={{ fontSize: "0.65rem" }}>
                  🎯 {currentTasks.active}
                </p>
                <p className="text-slate-500 truncate" style={{ fontSize: "0.6rem" }}>
                  Next: {currentTasks.upcoming}
                </p>
              </>
            )}
          </div>

          {/* Context Switch Button (Stepped Away / Pick Back Up) */}
          <div
            className="px-5 py-2 border-b shrink-0"
            style={{ borderColor: "#2a3f5f" }}
          >
            {!steppedAway ? (
              <div className="flex gap-2">
                <button
                  onClick={handleStepAway}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 transition-all hover:border-red-400/50"
                  style={{
                    fontSize: "0.65rem",
                    borderColor: "#2a3f5f",
                    backgroundColor: "#0f1419",
                    color: "#94a3b8",
                  }}
                >
                  <LogOut size={12} />
                  <span className="uppercase tracking-[0.15em] font-bold">Stepped Away</span>
                </button>
                {/* Tactile Strike Demo Button */}
                <button
                  onClick={() => triggerStrike(currentTasks.active, currentTasks.upcoming)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all hover:border-amber-400/50"
                  title="Simulate Tactile Strike (task completion)"
                  style={{
                    fontSize: "0.6rem",
                    borderColor: "#2a3f5f",
                    backgroundColor: "#0f1419",
                    color: "#f59e0b",
                  }}
                >
                  <Check size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={handlePickBackUp}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 transition-all animate-pulse"
                style={{
                  fontSize: "0.65rem",
                  borderColor: currentPersona.accentColor,
                  backgroundColor: `${currentPersona.accentColor}15`,
                  color: currentPersona.accentColor,
                }}
              >
                <LogIn size={12} />
                <span className="uppercase tracking-[0.15em] font-bold">Pick It Back Up</span>
              </button>
            )}
          </div>

          {/* DRAGGABLE TIMELINE + BEAT DETAILS */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Timeline Track (draggable scrubber) */}
            <div
              className="flex flex-col items-center py-4 shrink-0"
              style={{ width: "52px", backgroundColor: "#0d1117", borderRight: "1px solid #2a3f5f" }}
            >
              <div
                ref={trackRef}
                className="relative flex-1 cursor-pointer"
                style={{ width: "4px", backgroundColor: "#1e293b", borderRadius: "2px" }}
                onMouseDown={handleTrackMouseDown}
              >
                {/* Beat markers */}
                {currentPersona.storyBeats.map((beat, i) => {
                  const pct = (beat.time / currentPersona.sessionDurationMinutes) * 100;
                  const isActive = i === activeBeatIdx;
                  return (
                    <button
                      key={i}
                      className="absolute -left-[7px] w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center cursor-pointer transition-all z-10"
                      style={{
                        top: `${pct}%`,
                        transform: "translateY(-50%)",
                        backgroundColor: isActive ? currentPersona.accentColor : "#0f1419",
                        borderColor: isActive ? currentPersona.accentColor : "#2a3f5f",
                      }}
                      onClick={(e) => { e.stopPropagation(); jumpToBeat(i); }}
                    >
                      <span style={{ fontSize: "0.5rem", color: isActive ? "#000" : "#64748b" }}>
                        {i + 1}
                      </span>
                    </button>
                  );
                })}

                {/* Scrubber position indicator */}
                <div
                  className="absolute -left-[5px] w-[14px] h-[14px] rounded-sm z-20 pointer-events-none"
                  style={{
                    top: `${(timelineMinutes / currentPersona.sessionDurationMinutes) * 100}%`,
                    transform: "translateY(-50%) rotate(45deg)",
                    backgroundColor: steppedAway ? "#ef4444" : "#60a5fa",
                    boxShadow: `0 0 8px ${steppedAway ? "rgba(239,68,68,0.6)" : "rgba(96,165,250,0.6)"}`,
                    transition: isDraggingTimeline ? "none" : "top 0.3s ease",
                  }}
                />

                {/* Filled track */}
                <div
                  className="absolute top-0 left-0 right-0 rounded"
                  style={{
                    height: `${(timelineMinutes / currentPersona.sessionDurationMinutes) * 100}%`,
                    backgroundColor: steppedAway ? "rgba(239,68,68,0.3)" : "rgba(96,165,250,0.3)",
                    transition: isDraggingTimeline ? "none" : "height 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Beat Details (scrollable) */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {currentPersona.storyBeats.map((beat, index) => {
                const isActive = index === activeBeatIdx;
                const isPast = beat.time < timelineMinutes && index < activeBeatIdx;
                return (
                  <button
                    key={index}
                    onClick={() => jumpToBeat(index)}
                    className="w-full text-left p-3 rounded-lg border transition-all cursor-pointer"
                    style={{
                      backgroundColor: isActive ? `${currentPersona.accentColor}10` : "#0f1419",
                      borderColor: isActive ? currentPersona.accentColor : isPast ? "#1e293b" : "#2a3f5f",
                      opacity: isPast ? 0.5 : 1,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-slate-400" style={{ fontSize: "0.6rem" }}>
                        {beat.time}m
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded uppercase font-bold"
                        style={{
                          fontSize: "0.55rem",
                          backgroundColor: isActive ? `${currentPersona.accentColor}20` : "rgba(255,255,255,0.05)",
                          color: isActive ? currentPersona.accentColor : "#64748b",
                        }}
                      >
                        {beat.subState}
                      </span>
                    </div>
                    <h5
                      className="font-bold mb-1"
                      style={{
                        fontSize: "0.7rem",
                        color: isActive ? currentPersona.accentColor : "#60a5fa",
                      }}
                    >
                      {beat.phase}
                    </h5>
                    {isActive && (
                      <p className="text-slate-300" style={{ fontSize: "0.62rem", lineHeight: "1.5" }}>
                        {beat.narration}
                      </p>
                    )}
                  </button>
                );
              })}

              {/* Biometric readout at bottom */}
              <div
                className="p-3 rounded-lg border mt-4"
                style={{ backgroundColor: "#0f1419", borderColor: "#2a3f5f" }}
              >
                <div className="text-slate-500 uppercase tracking-[0.2em] font-bold mb-2" style={{ fontSize: "0.55rem" }}>
                  Live Biometrics
                </div>
                <div className="space-y-1.5">
                  <BiometricBar label="Focus" value={biometrics.focus_percent} color="#60a5fa" icon={<Brain size={10} />} />
                  <BiometricBar label="Fatigue" value={biometrics.fatigue_percent} color="#f97316" icon={<Zap size={10} />} warn={biometrics.fatigue_percent > 0.7} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Friction Keyboard (bottom third) ── */}
          <div
            className="shrink-0 px-4 py-3 border-t overflow-y-auto"
            style={{
              borderColor: "#2a3f5f",
              backgroundColor: "#111827",
              maxHeight: "38%",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-slate-500 uppercase tracking-[0.2em]" style={{ fontSize: "0.5rem" }}>
                Hardware Emulation
              </span>
            </div>
            <FrictionKeyboard />
          </div>
        </div>
      )}

      {/* ====== DEFAULT CONTROLS VIEW ====== */}
      {isExpanded && !showTimeline && (
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Biometric Controls */}
          <div className="space-y-4">
            <div className="text-blue-300 uppercase tracking-[0.2em] font-bold" style={{ fontSize: "0.65rem" }}>
              Biometric Override
            </div>

            {/* Focus */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-300 font-medium" style={{ fontSize: "0.7rem" }}>Focus</label>
                <span className="text-blue-400 font-mono font-bold" style={{ fontSize: "0.7rem" }}>
                  {Math.round(biometrics.focus_percent * 100)}%
                </span>
              </div>
              <input
                type="range" min="0" max="100"
                value={biometrics.focus_percent * 100}
                onChange={(e) => handleFocusChange(Number(e.target.value))}
                className="w-full h-2 bg-[#0f1419] rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: "#60a5fa" }}
              />
            </div>

            {/* Fatigue */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-300 font-medium" style={{ fontSize: "0.7rem" }}>Fatigue</label>
                <span className="text-blue-400 font-mono font-bold" style={{ fontSize: "0.7rem" }}>
                  {Math.round(biometrics.fatigue_percent * 100)}%
                </span>
              </div>
              <input
                type="range" min="0" max="100"
                value={biometrics.fatigue_percent * 100}
                onChange={(e) => handleFatigueChange(Number(e.target.value))}
                className="w-full h-2 bg-[#0f1419] rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: "#60a5fa" }}
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="text-blue-300 uppercase tracking-[0.2em] font-bold mb-3" style={{ fontSize: "0.65rem" }}>
              Quick Presets
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBiometrics({ focus_percent: 0.95, fatigue_percent: 0.2 })}
                className="px-3 py-2.5 border-2 rounded-lg text-slate-300 hover:text-blue-400 hover:border-blue-400 transition-all font-medium"
                style={{ fontSize: "0.65rem", borderColor: "#2a3f5f", backgroundColor: "#0f1419" }}
              >
                FLOW STATE
              </button>
              <button
                onClick={() => setBiometrics({ focus_percent: 0.25, fatigue_percent: 0.15 })}
                className="px-3 py-2.5 border-2 rounded-lg text-slate-300 hover:text-blue-400 hover:border-blue-400 transition-all font-medium"
                style={{ fontSize: "0.65rem", borderColor: "#2a3f5f", backgroundColor: "#0f1419" }}
              >
                DISTRACTED
              </button>
              <button
                onClick={() => setBiometrics({ focus_percent: 0.6, fatigue_percent: 0.65 })}
                className="px-3 py-2.5 border-2 rounded-lg text-slate-300 hover:text-blue-400 hover:border-blue-400 transition-all font-medium"
                style={{ fontSize: "0.65rem", borderColor: "#2a3f5f", backgroundColor: "#0f1419" }}
              >
                THE TAPER
              </button>
              <button
                onClick={() => setBiometrics({ focus_percent: 0.15, fatigue_percent: 0.98 })}
                className="px-3 py-2.5 border-2 rounded-lg text-slate-300 hover:text-blue-400 hover:border-blue-400 transition-all font-medium"
                style={{ fontSize: "0.65rem", borderColor: "#2a3f5f", backgroundColor: "#0f1419" }}
              >
                BURNOUT
              </button>
            </div>
          </div>

          {/* Persona Selector */}
          <div>
            <div className="text-blue-300 uppercase tracking-[0.2em] font-bold mb-3" style={{ fontSize: "0.65rem" }}>
              Active Persona
            </div>
            <div className="space-y-2">
              {ALL_PERSONAS.map(persona => (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaClick(persona.id)}
                  className="w-full p-3 border-2 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor: currentPersona?.id === persona.id ? "rgba(96, 165, 250, 0.15)" : "#0f1419",
                    borderColor: currentPersona?.id === persona.id ? "#60a5fa" : "#2a3f5f",
                    color: currentPersona?.id === persona.id ? "#60a5fa" : "#94a3b8",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User size={12} />
                    <span className="uppercase tracking-[0.1em] font-medium" style={{ fontSize: "0.7rem" }}>
                      {persona.name}
                    </span>
                  </div>
                  <p className="text-slate-400" style={{ fontSize: "0.6rem" }}>
                    {persona.archetype}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Friction Keyboard (bottom of controls) ── */}
          <div
            className="p-4 rounded-lg border"
            style={{ borderColor: "#2a3f5f", backgroundColor: "#111827" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-slate-500 uppercase tracking-[0.2em]" style={{ fontSize: "0.5rem" }}>
                Hardware Emulation
              </span>
            </div>
            <FrictionKeyboard />
          </div>
        </div>
      )}

      {/* Collapsed state icon */}
      {!isExpanded && (
        <div className="flex-1 flex flex-col items-center pt-6 space-y-6">
          <Activity size={20} className="text-slate-400" />
          <Sliders size={20} className="text-slate-400" />
          <User size={20} className="text-slate-400" />
        </div>
      )}
    </div>
  );
}

/** Small inline biometric bar for the timeline view */
function BiometricBar({
  label,
  value,
  color,
  icon,
  warn,
}: {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span style={{ color: warn ? "#ef4444" : color }}>{icon}</span>}
      <span className="text-slate-400 w-12" style={{ fontSize: "0.6rem" }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#1e293b" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value * 100}%`,
            backgroundColor: warn ? "#ef4444" : color,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span
        className="font-mono w-8 text-right"
        style={{ fontSize: "0.6rem", color: warn ? "#ef4444" : color }}
      >
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}