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
import { ALL_PERSONAS, type BiometricPattern } from "../../data/personas";
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

const SCREENS: { num: 1 | 2 | 3; label: string; explain: string }[] = [
  { num: 1, label: "Plan", explain: "Pick tasks." },
  { num: 2, label: "Session", explain: "The user is working." },
  { num: 3, label: "Recap", explain: "After the session." },
];

const KEYBOARD_CAPTION =
  "The keyboard Friction ships with. Its keys get softer, then heavier, then lock as fatigue rises.";

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
/** The strongest button on the panel: filled ink, never blue or hot. */
const primaryBtn: CSSProperties = {
  padding: "0.5rem 0.75rem",
  fontSize: "0.75rem",
  backgroundColor: "var(--pi-ink)",
  color: "var(--pi-ground)",
};
/** A quiet text-only button for secondary actions. */
const textBtn: CSSProperties = {
  padding: 0,
  border: "none",
  background: "transparent",
  fontFamily: "var(--pi-font)",
  fontSize: "0.75rem",
  color: "var(--pi-ink-60)",
  textDecoration: "underline",
  textUnderlineOffset: "0.2em",
  cursor: "pointer",
};

export function ControlPanel() {
  const { current: biometrics, setCurrent, simulateGradualChange, setBiometrics } = useBiometrics();
  const { currentPersona, setPersona } = usePersona();
  const { startSession, sessionState, triggerStrike, activateMoss, activeScreenNumber, forceScreen, tasks: sessionTasks, completeTask } = useSession();
  const { interceptFatigue } = useFrictionSettings();
  const { closeAllWindows, windows, focusedWindowId } = useWindowManager();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSliders, setShowSliders] = useState(false);
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

  // Friction only reacts during a session. Moving a slider by hand means
  // "show me what happens", so start one if none is running.
  const ensureSession = () => {
    if (sessionState !== "active") startSession();
  };
  const handleFocusChange = (value: number) => {
    ensureSession();
    setCurrent({ ...biometrics, focus_percent: value / 100 });
  };
  const handleFatigueChange = (value: number) => {
    ensureSession();
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
    ensureSession();
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

  /**
   * Return from stepping away: always show the moss, with words from what
   * the user was actually doing (their current and next task, the app in
   * front, and any words the story scripted for its own interruption).
   */
  const handlePickBackUp = () => {
    setSteppedAway(false);
    const scripted = currentPersona?.simulationActions.find(a => a.action === "moss")?.mossKeywords ?? [];
    const focusedTitle = windows.find(w => w.id === focusedWindowId)?.title;
    const contextKeywords = [
      currentTasks.active,
      currentTasks.upcoming,
      focusedTitle ? `In ${focusedTitle}` : "",
      ...scripted,
    ].filter(k => k && k !== "—" && !k.startsWith("Nothing"));
    activateMoss(Array.from(new Set(contextKeywords)).slice(0, 8));
    // Focus comes back partway: a short break has a small switching cost.
    if (preAwayBiometrics) {
      simulateGradualChange({
        focus_percent: Math.max(preAwayBiometrics.focus * 0.80, 0.40),
        fatigue_percent: Math.min(preAwayBiometrics.fatigue + 0.05, 1),
      }, 2500);
    }
    setPreAwayBiometrics(null);
  };

  /** Finish the task the user is on: mark it done and show the next one. */
  const handleFinishTask = () => {
    const current = sessionTasks.find(t => !t.completed);
    if (!current) return;
    ensureSession();
    triggerStrike(currentTasks.active, currentTasks.upcoming);
    completeTask(current.id);
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
    const open = sessionTasks.filter(t => !t.completed);
    return {
      active: open[0]?.title ?? "—",
      upcoming: open[1]?.title ?? "Nothing. Last task.",
    };
  };

  const currentTasks = getCurrentTasks();

  // Step away / Come back and Finish task: used in a story and in Try it yourself.
  const awayControls = (
    <>
      {steppedAway ? (
        <p style={{ ...bodyText, margin: 0 }}>Away from the desk.</p>
      ) : (
        <>
          <p style={{ ...bodyText, margin: 0 }} className="truncate">
            <span style={{ color: "var(--pi-ink-60)" }}>Current task: </span>
            {currentTasks.active}
          </p>
          <p style={{ ...mutedText, margin: "0.125rem 0 0" }} className="truncate">
            Next: {currentTasks.upcoming}
          </p>
        </>
      )}
      <div className="flex flex-col" style={{ gap: "0.75rem", marginTop: "0.875rem" }}>
        <div>
          {steppedAway ? (
            <button className="pi-btn w-full" style={smallBtn} onClick={handlePickBackUp}>
              Come back
            </button>
          ) : (
            <button className="pi-btn w-full" style={smallBtn} onClick={handleStepAway}>
              Step away
            </button>
          )}
          <p style={{ ...mutedText, margin: "0.375rem 0 0" }}>
            Simulates walking away from the desk. Shows the moss when you come back.
          </p>
        </div>
        {!steppedAway && (
          <div>
            <button
              className="pi-btn w-full"
              style={smallBtn}
              onClick={handleFinishTask}
            >
              Finish task
            </button>
            <p style={{ ...mutedText, margin: "0.375rem 0 0" }}>Marks the current task done.</p>
          </div>
        )}
      </div>
    </>
  );

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

  const stepCount = currentPersona?.storyBeats.length ?? 0;

  return (
    <div
      className="h-screen flex flex-col shrink-0"
      style={{
        width: "380px",
        // Recessed and dashed-edged: backstage, not part of the product.
        backgroundColor: "var(--pi-sunken)",
        color: "var(--pi-ink)",
        fontFamily: "var(--pi-font)",
        borderRight: "2px dashed var(--pi-hairline)",
        transition: "width var(--pi-ease-focus)",
      }}
    >
      {/* Header + what this demo is. Always visible. */}
      <header
        className="shrink-0"
        style={{ padding: "1.25rem", borderBottom: "1px dashed var(--pi-hairline)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 500, letterSpacing: "0.01em" }}>
              Demo controls
            </h2>
            <p style={{ ...mutedText, margin: "0.25rem 0 0" }}>
              For the presenter. Not part of Friction.
            </p>
          </div>
          <button className="pi-btn shrink-0" style={smallBtn} onClick={() => setIsExpanded(false)}>
            Hide
          </button>
        </div>
        <div style={{ marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid var(--pi-hairline)" }}>
          <h3 className="pi-label" style={{ margin: 0 }}>About this demo</h3>
          <p style={{ ...bodyText, margin: "0.375rem 0 0" }}>
            Friction is a focus app and keyboard. It stays out of sight while you focus. When you get
            tired, the keys get heavier so you stop before you burn out.
          </p>
          <p style={{ ...mutedText, margin: "0.375rem 0 0" }}>
            Left: these controls. Middle: the user's laptop. Right edge: the Friction app.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0">
        {showTimeline && currentPersona && activeBeat ? (
          <>
            {/* Current step */}
            <section style={{ padding: "1.25rem" }}>
              <div className="flex items-center justify-between" style={{ gap: "0.75rem" }}>
                <button className="pi-btn shrink-0" style={smallBtn} onClick={handleBackToControls}>
                  Back
                </button>
                <span className="pi-label" style={{ ...tabular }}>
                  Step {activeBeatIdx + 1} of {stepCount}
                </span>
                <span className="truncate" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                  {currentPersona.name}
                </span>
              </div>

              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  border: "1px solid var(--pi-ink)",
                  backgroundColor: "var(--pi-surface)",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 500, lineHeight: 1.3 }}>
                  {activeBeat.phase}
                </h3>
                <p style={{ ...bodyText, margin: "0.5rem 0 0" }}>{activeBeat.narration}</p>
                <p style={{ ...bodyText, margin: "0.75rem 0 0" }}>
                  <span style={{ fontWeight: 500 }}>Friction: </span>
                  {activeBeat.friction}
                </p>
                <p style={{ ...bodyText, margin: "0.5rem 0 0" }}>
                  <span style={{ fontWeight: 500, color: "var(--pi-blue)" }}>Look at: </span>
                  {activeBeat.lookAt}
                </p>
              </div>

              {/* Transport */}
              <div className="flex" style={{ gap: "0.375rem", marginTop: "0.75rem" }}>
                <button
                  className="pi-btn"
                  style={{ ...smallBtn, opacity: activeBeatIdx <= 0 ? 0.4 : 1 }}
                  disabled={activeBeatIdx <= 0}
                  onClick={() => jumpToBeat(Math.max(activeBeatIdx - 1, 0))}
                >
                  Previous
                </button>
                <button
                  className="pi-btn flex-1"
                  style={{ ...primaryBtn, opacity: activeBeatIdx >= stepCount - 1 ? 0.4 : 1 }}
                  disabled={activeBeatIdx >= stepCount - 1}
                  onClick={() => jumpToBeat(Math.min(activeBeatIdx + 1, stepCount - 1))}
                >
                  Next step
                </button>
                <button
                  className="pi-btn"
                  style={smallBtn}
                  aria-pressed={isAutoPlaying}
                  onClick={toggleAutoPlay}
                >
                  {isAutoPlaying ? "Pause" : "Play all"}
                </button>
              </div>
              <div className="flex items-center justify-between" style={{ marginTop: "0.5rem" }}>
                <button
                  onClick={() => { setTimelineMinutes(0); driveFromTimeline(0); }}
                  style={textBtn}
                >
                  Restart
                </button>
                <span style={{ ...tabular, fontSize: "0.75rem", color: "var(--pi-ink-45)" }}>
                  Minute {Math.round(timelineMinutes)} of {currentPersona.sessionDurationMinutes}
                </span>
              </div>
            </section>

            {/* Keyboard: the core of the idea */}
            <Section title="The keyboard">
              <p style={{ ...mutedText, margin: "0 0 0.875rem" }}>{KEYBOARD_CAPTION}</p>
              <FrictionKeyboard />
            </Section>

            {/* Sensors (read-only while the story drives them) */}
            <Section title="Focus and fatigue">
              <div className="flex flex-col" style={{ gap: "0.625rem" }}>
                <ReadoutBar label="Focus" value={biometrics.focus_percent} />
                <ReadoutBar label="Fatigue" value={biometrics.fatigue_percent} warn={overThreshold} />
              </div>
            </Section>

            {/* Interruptions the presenter can add */}
            <Section title="Try during the story">
              {awayControls}
            </Section>

            {/* All steps */}
            <Section title="All steps">
              <div className="flex" style={{ gap: "0.75rem" }}>
                {/* Track: drag to scrub */}
                <div className="flex justify-center shrink-0" style={{ width: "16px" }}>
                  <div
                    ref={trackRef}
                    className="relative cursor-pointer"
                    style={{ width: "16px", alignSelf: "stretch" }}
                    onMouseDown={handleTrackMouseDown}
                    aria-hidden="true"
                  >
                    <div
                      className="absolute top-0 bottom-0 pointer-events-none"
                      style={{ left: "50%", width: "1px", backgroundColor: "var(--pi-hairline)" }}
                    />
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

                <ol className="flex-1 min-w-0" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {currentPersona.storyBeats.map((beat, index) => {
                    const isActive = index === activeBeatIdx;
                    const isPast = index < activeBeatIdx;
                    return (
                      <li key={index}>
                        <button
                          onClick={() => jumpToBeat(index)}
                          aria-current={isActive ? "step" : undefined}
                          className="w-full text-left cursor-pointer flex items-baseline"
                          style={{
                            gap: "0.5rem",
                            padding: "0.4rem 0.625rem",
                            border: "none",
                            borderLeft: `1px solid ${isActive ? "var(--pi-ink)" : "transparent"}`,
                            background: isActive ? "var(--pi-ink-08)" : "transparent",
                            color: isPast ? "var(--pi-ink-45)" : "var(--pi-ink)",
                            fontFamily: "var(--pi-font)",
                            fontSize: "0.8125rem",
                            fontWeight: isActive ? 500 : 400,
                            transition: "background-color var(--pi-ease-hover), border-color var(--pi-ease-focus)",
                          }}
                        >
                          <span style={{ ...tabular, width: "1rem", opacity: 0.7 }}>{index + 1}</span>
                          <span className="flex-1 min-w-0 truncate">{beat.phase}</span>
                          <span style={{ ...tabular, fontSize: "0.7rem", opacity: 0.6 }}>{beat.time} min</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </Section>
          </>
        ) : (
          <>
            {/* Primary path: stories */}
            <section style={{ padding: "1.25rem" }}>
              <h3 className="pi-label" style={{ margin: 0 }}>Watch a story</h3>
              <p style={{ ...mutedText, margin: "0.375rem 0 0.875rem" }}>
                Pick one. Then use Next to step through it.
              </p>
              <div className="flex flex-col" style={{ gap: "0.5rem" }}>
                {ALL_PERSONAS.map(persona => (
                  <button
                    key={persona.id}
                    className="pi-btn"
                    aria-pressed={currentPersona?.id === persona.id}
                    onClick={() => handlePersonaClick(persona.id)}
                    style={{ textAlign: "left", padding: "0.75rem 0.9rem" }}
                  >
                    {persona.name}
                    <span style={{ fontWeight: 400, opacity: 0.7, marginLeft: "0.5rem" }}>
                      {persona.archetype}
                    </span>
                    <span
                      style={{
                        display: "block",
                        textTransform: "none",
                        letterSpacing: 0,
                        fontWeight: 400,
                        fontSize: "0.8125rem",
                        lineHeight: 1.45,
                        marginTop: "0.25rem",
                      }}
                    >
                      {persona.shows}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Secondary path: manual controls */}
            <Section
              title="Try it yourself"
              action={
                <button
                  className="pi-btn"
                  style={smallBtn}
                  aria-expanded={showSliders}
                  onClick={() => setShowSliders(v => !v)}
                >
                  {showSliders ? "Hide sliders" : "Show sliders"}
                </button>
              }
            >
              {!showSliders ? (
                <p style={{ ...mutedText, margin: 0 }}>
                  Move focus and fatigue by hand, or jump to a screen.
                </p>
              ) : (
                <>
                  <div className="flex flex-col" style={{ gap: "1.125rem" }}>
                    <SliderRow
                      label="Focus"
                      explain="How locked-in the user is."
                      value={biometrics.focus_percent}
                      onChange={handleFocusChange}
                    />
                    <SliderRow
                      label="Fatigue"
                      explain="How tired the user is."
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
                        onClick={() => { ensureSession(); setBiometrics({ focus_percent: p.focus, fatigue_percent: p.fatigue }); }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <h4 style={{ ...bodyText, fontWeight: 500, margin: "1.5rem 0 0.625rem" }}>
                    Jump to a screen
                  </h4>
                  <div className="flex flex-col" style={{ gap: "0.375rem" }}>
                    {SCREENS.map(s => (
                      <div key={s.num} className="flex items-center" style={{ gap: "0.75rem" }}>
                        <button
                          className="pi-btn shrink-0"
                          aria-pressed={activeScreenNumber === s.num}
                          onClick={() => forceScreen(s.num)}
                          style={{ width: "6.5rem", padding: "0.45rem 0.6rem", textAlign: "left" }}
                        >
                          {s.label}
                        </button>
                        <span style={mutedText}>{s.explain}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ ...mutedText, margin: "0.75rem 0 0" }}>{screenNote}</p>

                  <p className="pi-label" style={{ margin: "1.25rem 0 0.5rem" }}>Interruptions</p>
                  {awayControls}
                </>
              )}
            </Section>

            {/* Keyboard */}
            <Section title="The keyboard">
              <p style={{ ...mutedText, margin: "0 0 0.875rem" }}>{KEYBOARD_CAPTION}</p>
              <FrictionKeyboard />
            </Section>
          </>
        )}
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
  explain,
  value,
  onChange,
  warn,
}: {
  label: string;
  explain: string;
  value: number;
  onChange: (v: number) => void;
  warn?: boolean;
}) {
  return (
    <label className="block">
      <div className="flex justify-between items-baseline" style={{ marginBottom: "0.375rem" }}>
        <span style={{ fontSize: "0.8125rem" }}>
          {label}
          <span style={{ color: "var(--pi-ink-60)", fontSize: "0.75rem", marginLeft: "0.5rem" }}>{explain}</span>
        </span>
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
