/**
 * CONTROL PANEL
 *
 * Left column the presenter uses to drive the demo: simulated sensor
 * readings, presets, persona stories with a scrubbable timeline, the
 * screen switcher and the simulated keyboard. The end user never sees it.
 */

import { useState, useRef, useCallback, useEffect, type ReactNode, type CSSProperties } from "react";
import { useBiometrics } from "../../context/BiometricContext";
import { usePersona } from "../../context/PersonaContext";
import { useSession } from "../../context/SessionContext";
import { useFrictionSettings } from "../../context/FrictionSettingsContext";
import { useWindowManager } from "../../context/WindowManagerContext";
import { usePersonaSimulation } from "../../hooks/usePersonaSimulation";
import { ALL_PERSONAS, type BiometricPattern, type PersonaProfile } from "../../data/personas";
import { FrictionKeyboard } from "./FrictionKeyboard";

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

type StorySubState = PersonaProfile["storyBeats"][number]["subState"];

/** Plain words for the story beat states stored in the persona data. */
const SUB_STATE_WORDS: Record<StorySubState, string> = {
  invisible: "Hidden",
  taper: "Winding down",
  recovery: "Recovering",
  return: "Coming back",
  intercept: "Break",
  idle: "Idle",
};

const SCREENS: { num: 1 | 2 | 3; label: string }[] = [
  { num: 1, label: "Plan" },
  { num: 2, label: "Session" },
  { num: 3, label: "Recap" },
];

const PRESETS: { label: string; focus: number; fatigue: number }[] = [
  { label: "Focused", focus: 0.95, fatigue: 0.2 },
  { label: "Distracted", focus: 0.25, fatigue: 0.15 },
  { label: "Tiring", focus: 0.6, fatigue: 0.65 },
  { label: "Burned out", focus: 0.15, fatigue: 0.98 },
];

const smallBtn: CSSProperties = { padding: "0.35rem 0.65rem", fontSize: "0.65rem" };
const bodyText: CSSProperties = { fontSize: "0.8125rem", lineHeight: 1.5, color: "var(--pi-ink)" };
const mutedText: CSSProperties = { fontSize: "0.75rem", lineHeight: 1.5, color: "var(--pi-ink-60)" };
const tabular: CSSProperties = { fontVariantNumeric: "tabular-nums" };

export function ControlPanel() {
  const { current: biometrics, setCurrent, simulateGradualChange, setBiometrics } = useBiometrics();
  const { currentPersona, setPersona } = usePersona();
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
      // ── SHORT ABSENCE: residue (swipe-to-clear) pathway ──
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
        upcomingTask = currentPersona.tasks[i + 1]?.title || "Nothing. Last task.";
        break;
      }
    }
    return { active: activeTask, upcoming: upcomingTask };
  };

  const currentTasks = getCurrentTasks();

  // What the Session screen is showing, derived from the sensor readings
  const getSessionView = (): string => {
    const focus = biometrics.focus_percent;
    const fatigue = biometrics.fatigue_percent;
    if (fatigue > interceptFatigue) return "Break screen";
    if (focus > 0.80) return "Focus pill";
    if (focus > 0.50) return "Peek card";
    if (focus > 0.30) return "Peek card with breathing guide";
    return "Refocus prompt";
  };

  const screenNote =
    activeScreenNumber === 1
      ? "Hover the right edge of the desktop to open the drawer."
      : activeScreenNumber === 2
      ? `The user sees: ${getSessionView()}.`
      : "Hover the right edge of the desktop to see the recap.";

  const overThreshold = biometrics.fatigue_percent > interceptFatigue;

  // ── Collapsed ──
  if (!isExpanded) {
    return (
      <div
        className="h-screen flex flex-col items-center shrink-0"
        style={{
          width: "64px",
          backgroundColor: "var(--pi-ground)",
          color: "var(--pi-ink)",
          fontFamily: "var(--pi-font)",
          borderRight: "1px solid var(--pi-hairline)",
          paddingTop: "1.25rem",
          transition: "width var(--pi-ease-focus)",
        }}
      >
        <button className="pi-btn" style={smallBtn} onClick={() => setIsExpanded(true)}>
          Show
        </button>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col shrink-0"
      style={{
        width: "380px",
        backgroundColor: "var(--pi-ground)",
        color: "var(--pi-ink)",
        fontFamily: "var(--pi-font)",
        borderRight: "1px solid var(--pi-hairline)",
        transition: "width var(--pi-ease-focus)",
      }}
    >
      {/* Header */}
      <header className="shrink-0 flex items-start justify-between gap-4" style={{ padding: "1.5rem 1.25rem 1.25rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 500, letterSpacing: "0.01em" }}>
            Demo controls
          </h2>
          <p style={{ ...mutedText, margin: "0.375rem 0 0" }}>
            Simulated sensor readings. The user never sees this panel.
          </p>
        </div>
        <button className="pi-btn shrink-0" style={smallBtn} onClick={() => setIsExpanded(false)}>
          Hide
        </button>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Screen */}
        <Section title="Screen">
          <div className="grid grid-cols-3" style={{ gap: "0.5rem" }}>
            {SCREENS.map(s => (
              <button
                key={s.num}
                className="pi-btn"
                aria-pressed={activeScreenNumber === s.num}
                onClick={() => forceScreen(s.num)}
                style={{ padding: "0.6rem 0.5rem", textAlign: "left" }}
              >
                <span style={{ ...tabular, opacity: 0.6, marginRight: "0.4rem" }}>{s.num}</span>
                {s.label}
              </button>
            ))}
          </div>
          <p style={{ ...mutedText, margin: "0.75rem 0 0" }}>{screenNote}</p>
        </Section>

        {showTimeline && currentPersona ? (
          <>
            {/* Story */}
            <Section
              title="Story"
              action={
                <button className="pi-btn" style={smallBtn} onClick={handleBackToControls}>
                  Back
                </button>
              }
            >
              <div style={{ ...bodyText, fontWeight: 500 }}>
                {currentPersona.name}
                <span style={{ fontWeight: 400, color: "var(--pi-ink-60)", marginLeft: "0.5rem" }}>
                  {currentPersona.archetype}
                </span>
              </div>
              <p style={{ ...mutedText, margin: "0.375rem 0 0" }}>{currentPersona.description}</p>

              {/* Transport */}
              <div className="flex items-center justify-between" style={{ marginTop: "1rem" }}>
                <div className="flex" style={{ gap: "0.375rem" }}>
                  <button
                    className="pi-btn"
                    style={smallBtn}
                    onClick={() => { setTimelineMinutes(0); driveFromTimeline(0); }}
                  >
                    Restart
                  </button>
                  <button
                    className="pi-btn"
                    style={smallBtn}
                    aria-pressed={isAutoPlaying}
                    onClick={toggleAutoPlay}
                  >
                    {isAutoPlaying ? "Pause" : "Play"}
                  </button>
                  <button
                    className="pi-btn"
                    style={smallBtn}
                    onClick={() => jumpToBeat(Math.min(activeBeatIdx + 1, currentPersona.storyBeats.length - 1))}
                  >
                    Next
                  </button>
                </div>
                <span style={{ ...tabular, fontSize: "0.8125rem" }}>
                  <span style={{ color: "var(--pi-blue)" }}>{Math.round(timelineMinutes)}</span>
                  <span style={{ color: "var(--pi-ink-60)" }}> / {currentPersona.sessionDurationMinutes} min</span>
                </span>
              </div>

              {/* Now */}
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--pi-hairline)" }}>
                {steppedAway ? (
                  <p style={{ ...bodyText, margin: 0 }}>Away from the desk.</p>
                ) : (
                  <>
                    <p style={{ ...bodyText, margin: 0 }} className="truncate">
                      <span style={{ color: "var(--pi-ink-60)" }}>Now: </span>
                      {currentTasks.active}
                    </p>
                    <p style={{ ...mutedText, margin: "0.125rem 0 0" }} className="truncate">
                      Next: {currentTasks.upcoming}
                    </p>
                  </>
                )}
                <div className="flex" style={{ gap: "0.375rem", marginTop: "0.75rem" }}>
                  {steppedAway ? (
                    <button className="pi-btn flex-1" style={smallBtn} onClick={handlePickBackUp}>
                      Come back
                    </button>
                  ) : (
                    <>
                      <button className="pi-btn flex-1" style={smallBtn} onClick={handleStepAway}>
                        Step away
                      </button>
                      <button
                        className="pi-btn flex-1"
                        style={smallBtn}
                        onClick={() => triggerStrike(currentTasks.active, currentTasks.upcoming)}
                      >
                        Finish task
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Section>

            {/* Timeline */}
            <Section title="Timeline">
              <div className="flex" style={{ gap: "1rem" }}>
                {/* Track */}
                <div className="flex justify-center shrink-0" style={{ width: "20px" }}>
                  <div
                    ref={trackRef}
                    className="relative cursor-pointer"
                    style={{ width: "20px", alignSelf: "stretch" }}
                    onMouseDown={handleTrackMouseDown}
                  >
                    {/* Line */}
                    <div
                      className="absolute top-0 bottom-0 pointer-events-none"
                      style={{ left: "50%", width: "1px", backgroundColor: "var(--pi-hairline)" }}
                    />
                    {/* Elapsed */}
                    <div
                      className="absolute top-0 pointer-events-none"
                      style={{
                        left: "50%",
                        width: "1px",
                        height: `${(timelineMinutes / currentPersona.sessionDurationMinutes) * 100}%`,
                        backgroundColor: "var(--pi-ink)",
                        transition: isDraggingTimeline ? "none" : "height var(--pi-ease-focus)",
                      }}
                    />
                    {/* Beat markers */}
                    {currentPersona.storyBeats.map((beat, i) => {
                      const pct = (beat.time / currentPersona.sessionDurationMinutes) * 100;
                      const isActive = i === activeBeatIdx;
                      return (
                        <button
                          key={i}
                          aria-label={`Jump to part ${i + 1}`}
                          className="absolute flex items-center justify-center cursor-pointer"
                          style={{
                            left: "50%",
                            top: `${pct}%`,
                            width: "16px",
                            height: "16px",
                            transform: "translate(-50%, -50%)",
                            fontSize: "0.55rem",
                            ...tabular,
                            border: "1px solid var(--pi-ink)",
                            backgroundColor: isActive ? "var(--pi-ink)" : "var(--pi-ground)",
                            color: isActive ? "var(--pi-ground)" : "var(--pi-ink)",
                            transition: "background-color var(--pi-ease-hover), color var(--pi-ease-hover)",
                          }}
                          onClick={(e) => { e.stopPropagation(); jumpToBeat(i); }}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                    {/* Playhead */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: 0,
                        right: 0,
                        height: "2px",
                        top: `${(timelineMinutes / currentPersona.sessionDurationMinutes) * 100}%`,
                        transform: "translateY(-50%)",
                        backgroundColor: "var(--pi-blue)",
                        transition: isDraggingTimeline ? "none" : "top var(--pi-ease-focus)",
                      }}
                    />
                  </div>
                </div>

                {/* Beats */}
                <ol className="flex-1 min-w-0" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {currentPersona.storyBeats.map((beat, index) => {
                    const isActive = index === activeBeatIdx;
                    const isPast = index < activeBeatIdx;
                    return (
                      <li key={index}>
                        <button
                          onClick={() => jumpToBeat(index)}
                          className="w-full text-left cursor-pointer"
                          style={{
                            display: "block",
                            padding: "0.625rem 0.75rem",
                            border: "none",
                            borderLeft: `1px solid ${isActive ? "var(--pi-ink)" : "transparent"}`,
                            background: isActive ? "var(--pi-ink-08)" : "transparent",
                            color: isPast ? "var(--pi-ink-45)" : "var(--pi-ink)",
                            fontFamily: "var(--pi-font)",
                            transition: "background-color var(--pi-ease-hover), border-color var(--pi-ease-focus)",
                          }}
                        >
                          <div className="flex items-baseline" style={{ gap: "0.5rem", fontSize: "0.7rem" }}>
                            <span style={{ ...tabular, opacity: 0.7 }}>{beat.time} min</span>
                            <span style={{ opacity: 0.7 }}>{SUB_STATE_WORDS[beat.subState] ?? beat.subState}</span>
                          </div>
                          <div style={{ fontSize: "0.8125rem", fontWeight: 500, marginTop: "0.125rem" }}>
                            {beat.phase}
                          </div>
                          {isActive && (
                            <p style={{ ...mutedText, margin: "0.375rem 0 0", color: "var(--pi-ink-60)" }}>
                              {beat.narration}
                            </p>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </Section>

            {/* Sensors (read-only while the story drives them) */}
            <Section title="Sensors">
              <div className="flex flex-col" style={{ gap: "0.625rem" }}>
                <ReadoutBar label="Focus" value={biometrics.focus_percent} />
                <ReadoutBar label="Fatigue" value={biometrics.fatigue_percent} warn={overThreshold} />
              </div>
            </Section>
          </>
        ) : (
          <>
            {/* Sensors */}
            <Section title="Sensors">
              <div className="flex flex-col" style={{ gap: "1.125rem" }}>
                <SliderRow
                  label="Focus"
                  value={biometrics.focus_percent}
                  onChange={handleFocusChange}
                />
                <SliderRow
                  label="Fatigue"
                  value={biometrics.fatigue_percent}
                  onChange={handleFatigueChange}
                  warn={overThreshold}
                />
              </div>
              <div className="grid grid-cols-2" style={{ gap: "0.5rem", marginTop: "1.25rem" }}>
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    className="pi-btn"
                    onClick={() => setBiometrics({ focus_percent: p.focus, fatigue_percent: p.fatigue })}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Section>

            {/* Stories */}
            <Section title="Stories">
              <div className="flex flex-col" style={{ gap: "0.5rem" }}>
                {ALL_PERSONAS.map(persona => (
                  <button
                    key={persona.id}
                    className="pi-btn"
                    aria-pressed={currentPersona?.id === persona.id}
                    onClick={() => handlePersonaClick(persona.id)}
                    style={{ textAlign: "left", padding: "0.7rem 0.9rem" }}
                  >
                    {persona.name}
                    <span
                      style={{
                        display: "block",
                        textTransform: "none",
                        letterSpacing: 0,
                        fontWeight: 400,
                        fontSize: "0.75rem",
                        opacity: 0.7,
                        marginTop: "0.125rem",
                      }}
                    >
                      {persona.archetype}
                    </span>
                  </button>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* Keyboard */}
        <Section title="Keyboard">
          <FrictionKeyboard />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ padding: "1.25rem", borderTop: "1px solid var(--pi-hairline)" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: "0.875rem", minHeight: "1.5rem" }}>
        <h3 className="pi-label" style={{ margin: 0 }}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function SliderRow({
  label,
  value,
  onChange,
  warn,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  warn?: boolean;
}) {
  return (
    <label className="block">
      <div className="flex justify-between items-baseline" style={{ marginBottom: "0.375rem" }}>
        <span style={{ fontSize: "0.8125rem" }}>{label}</span>
        <span
          style={{
            ...tabular,
            fontSize: "0.8125rem",
            color: warn ? "var(--pi-hot)" : "var(--pi-blue)",
            transition: "color var(--pi-ease-focus)",
          }}
        >
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        className="pi-range cursor-pointer"
        value={value * 100}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

/** Read-only bar for when the story timeline drives the sensors */
function ReadoutBar({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="flex items-center" style={{ gap: "0.75rem" }}>
      <span style={{ fontSize: "0.8125rem", width: "3.5rem" }}>{label}</span>
      <div className="flex-1" style={{ height: "2px", backgroundColor: "var(--pi-ink-20)" }}>
        <div
          style={{
            height: "100%",
            width: `${value * 100}%`,
            backgroundColor: warn ? "var(--pi-hot)" : "var(--pi-ink)",
            transition: "width var(--pi-ease-focus), background-color var(--pi-ease-focus)",
          }}
        />
      </div>
      <span
        style={{
          ...tabular,
          fontSize: "0.8125rem",
          width: "2.5rem",
          textAlign: "right",
          color: warn ? "var(--pi-hot)" : "var(--pi-blue)",
        }}
      >
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
