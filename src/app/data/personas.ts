/**
 * PERSONA DATA MODULE
 * 
 * Pre-populated data for each user archetype from the product document.
 * Each persona demonstrates specific intelligent behaviors of the Friction system.
 * 
 * Includes simulation scripts — chronological action sequences that drive
 * the fake OS during persona timeline autoplay (open/close/focus apps,
 * trigger strikes, activate moss, etc.).
 */

import type { Task } from "../context/SessionContext";

export interface BiometricPattern {
  timestamp: number;        // Minutes into session
  focus: number;           // 0-1
  fatigue: number;         // 0-1
  engagement: number;      // 0-1
}

/**
 * SIMULATION ACTION
 * 
 * A single scripted event in a persona's work session.
 * The simulation engine processes these chronologically as the timeline advances.
 */
export interface SimulationAction {
  time: number;           // Minutes into session when this fires
  action:
    | "open"              // Open an app (no-op if already open)
    | "close"             // Close an app
    | "focus"             // Focus an already-open app
    | "strike"            // Task completion ripple effect
    | "moss"              // Activate digital moss (context recovery)
    | "clear-moss";       // Clear moss overlay
  appId?: string;         // For open/close/focus
  appTitle?: string;      // Human-readable name for open
  appSize?: { width: number; height: number };
  strikeTask?: string;    // Completed task label (for strike)
  strikeNext?: string;    // Next task label (for strike)
  mossKeywords?: string[];// Context keywords (for moss)
}

/**
 * SIMULATION SNAPSHOT
 * 
 * Defines the desired desktop state at a given time.
 * Used for reconciliation when the user scrubs the timeline
 * (as opposed to sequential forward playback).
 */
export interface SimulationSnapshot {
  time: number;
  openApps: string[];     // appIds that should be open
  focusedApp: string;     // Which app has focus
}

export interface PersonaProfile {
  id: string;
  name: string;
  archetype: string;
  description: string;
  challenge: string;
  intervention: string;
  /** One line for the story picker: which Friction feature this story shows. */
  shows: string;
  
  // Pre-populated session data
  tasks: Task[];
  sessionDurationMinutes: number;
  
  // Simulated biometric timeline
  biometricPattern: BiometricPattern[];
  
  // Story beats for the demo
  storyBeats: {
    phase: string;
    time: number;          // Minutes into session
    /** What is happening to the person, in plain words. */
    narration: string;
    /** What Friction does at this moment. */
    friction: string;
    /** Where on screen to look to see it. */
    lookAt: string;
    subState: "invisible" | "taper" | "recovery" | "return" | "intercept" | "idle";
  }[];
  
  // Simulation: chronological actions for the fake OS
  simulationActions: SimulationAction[];
  
  // Simulation: snapshots for timeline scrubbing reconciliation
  simulationSnapshots: SimulationSnapshot[];
  
  // Visual theming hints
  accentColor: string;
  visualMetaphor: string;
}


// ============================================================
//  CLAUDIA — THE FREELANCER
//  Demonstrates: "The Taper" intervention
//  Session: 4 hours of documentary editing
//  Arc: Deep flow → sustained → fatigue builds → taper → soft landing
// ============================================================

export const CLAUDIA_PERSONA: PersonaProfile = {
  id: "claudia",
  name: "Claudia",
  archetype: "The Freelancer",
  description: "A video editor on a four-hour editing day.",
  challenge: "She works until she crashes, then feels empty for the rest of the day.",
  intervention: "The taper: Friction eases her out of deep focus before she is worn out.",
  shows: "Getting tired. Friction slows you down gently.",
  
  tasks: [
    { id: "c1", title: "Splice documentary timeline (Act II climax)", cognitiveWeight: 0.92, completed: false, category: "deep", estimatedMinutes: 120 },
    { id: "c2", title: "Color grade interview sequences", cognitiveWeight: 0.85, completed: false, category: "deep", estimatedMinutes: 90 },
    { id: "c3", title: "Sync audio tracks for B-roll", cognitiveWeight: 0.58, completed: false, category: "moderate", estimatedMinutes: 45 },
    { id: "c4", title: "Organize B-roll folders by location", cognitiveWeight: 0.15, completed: false, category: "light", estimatedMinutes: 20 },
    { id: "c5", title: "Export preview for client review", cognitiveWeight: 0.22, completed: false, category: "light", estimatedMinutes: 15 },
  ],
  
  sessionDurationMinutes: 240,
  
  biometricPattern: [
    { timestamp: 0,   focus: 0.92, fatigue: 0.15, engagement: 0.95 },
    { timestamp: 30,  focus: 0.94, fatigue: 0.25, engagement: 0.96 },
    { timestamp: 60,  focus: 0.93, fatigue: 0.35, engagement: 0.92 },
    { timestamp: 90,  focus: 0.90, fatigue: 0.48, engagement: 0.88 },
    { timestamp: 120, focus: 0.88, fatigue: 0.58, engagement: 0.82 },
    { timestamp: 150, focus: 0.82, fatigue: 0.68, engagement: 0.75 },
    { timestamp: 180, focus: 0.72, fatigue: 0.75, engagement: 0.68 },
    { timestamp: 210, focus: 0.58, fatigue: 0.82, engagement: 0.55 },
    { timestamp: 240, focus: 0.42, fatigue: 0.88, engagement: 0.45 },
  ],
  
  storyBeats: [
    {
      phase: "Deep focus",
      time: 0,
      narration: "Claudia starts editing. She is focused and the work feels easy.",
      friction: "Nothing. It stays out of the way. There is no timer and no reminder.",
      lookAt: "The top of the laptop screen: only a thin line shows the current task.",
      subState: "invisible"
    },
    {
      phase: "Still focused",
      time: 90,
      narration: "Two hours in. She is still focused, but she is starting to get tired.",
      friction: "Still nothing on screen. It notices the tiredness and waits.",
      lookAt: "Fatigue in this panel is going up.",
      subState: "invisible"
    },
    {
      phase: "Getting tired",
      time: 180,
      narration: "Hour three. She is tired now, but she does not feel it yet.",
      friction: "The keys get softer, and the next tasks are the easy ones.",
      lookAt: "The keyboard below: the keys now read Soft.",
      subState: "taper"
    },
    {
      phase: "A soft stop",
      time: 240,
      narration: "Four hours done. She ends on easy tasks. She is tired, but not worn out.",
      friction: "It eased her out slowly instead of letting her work until she crashed.",
      lookAt: "The task list: the hard work was done while she was fresh.",
      subState: "taper"
    },
  ],

  simulationActions: [
    // Session start — Claudia puts on music, opens her editor
    { time: 0,   action: "open",  appId: "spotify",  appTitle: "Spotify",  appSize: { width: 950, height: 650 } },
    { time: 2,   action: "open",  appId: "vscode",   appTitle: "VS Code",  appSize: { width: 1000, height: 700 } },
    { time: 2,   action: "focus", appId: "vscode" },
    // Deep flow — referencing notes for Act II structure
    { time: 45,  action: "open",  appId: "notes",    appTitle: "Notes",    appSize: { width: 900, height: 620 } },
    { time: 55,  action: "focus", appId: "vscode" },
    // First milestone — splice complete
    { time: 90,  action: "strike", strikeTask: "Splice documentary timeline (Act II climax)", strikeNext: "Color grade interview sequences" },
    // Color grading phase
    { time: 95,  action: "focus", appId: "vscode" },
    // Second milestone
    { time: 120, action: "strike", strikeTask: "Color grade interview sequences", strikeNext: "Sync audio tracks for B-roll" },
    // Shift to audio + terminal for renders
    { time: 125, action: "open",  appId: "terminal",  appTitle: "Terminal",  appSize: { width: 800, height: 500 } },
    { time: 130, action: "focus", appId: "notes" },
    { time: 140, action: "focus", appId: "vscode" },
    // Taper zone — Friction suggests lighter tasks
    { time: 170, action: "open",  appId: "finder",   appTitle: "Finder",   appSize: { width: 900, height: 600 } },
    { time: 170, action: "focus", appId: "finder" },
    // Audio sync done
    { time: 180, action: "strike", strikeTask: "Sync audio tracks for B-roll", strikeNext: "Organize B-roll folders by location" },
    { time: 182, action: "focus", appId: "finder" },
    // Light tasks — winding down
    { time: 195, action: "open",  appId: "calculator", appTitle: "Calculator", appSize: { width: 480, height: 580 } },
    { time: 200, action: "focus", appId: "finder" },
    { time: 210, action: "close", appId: "calculator" },
    { time: 210, action: "focus", appId: "notes" },
    { time: 220, action: "strike", strikeTask: "Organize B-roll folders by location", strikeNext: "Export preview for client review" },
    { time: 225, action: "close", appId: "terminal" },
    { time: 230, action: "focus", appId: "notes" },
    { time: 238, action: "strike", strikeTask: "Export preview for client review", strikeNext: "Session complete" },
  ],

  simulationSnapshots: [
    { time: 0,   openApps: ["spotify"],                                    focusedApp: "spotify" },
    { time: 2,   openApps: ["spotify", "vscode"],                          focusedApp: "vscode" },
    { time: 45,  openApps: ["spotify", "vscode", "notes"],                 focusedApp: "notes" },
    { time: 55,  openApps: ["spotify", "vscode", "notes"],                 focusedApp: "vscode" },
    { time: 125, openApps: ["spotify", "vscode", "notes", "terminal"],     focusedApp: "terminal" },
    { time: 130, openApps: ["spotify", "vscode", "notes", "terminal"],     focusedApp: "notes" },
    { time: 140, openApps: ["spotify", "vscode", "notes", "terminal"],     focusedApp: "vscode" },
    { time: 170, openApps: ["spotify", "vscode", "notes", "terminal", "finder"], focusedApp: "finder" },
    { time: 195, openApps: ["spotify", "vscode", "notes", "terminal", "finder", "calculator"], focusedApp: "calculator" },
    { time: 200, openApps: ["spotify", "vscode", "notes", "terminal", "finder", "calculator"], focusedApp: "finder" },
    { time: 210, openApps: ["spotify", "vscode", "notes", "terminal", "finder"], focusedApp: "notes" },
    { time: 225, openApps: ["spotify", "vscode", "notes", "finder"],       focusedApp: "notes" },
  ],

  accentColor: "#ff9800",
  visualMetaphor: "Warm amber glow, like a sunset slowly dimming the studio lights."
};


// ============================================================
//  PERPLEXOUS — THE PHD STUDENT
//  Demonstrates: "Flow State Preservation" via digital moss
//  Session: 3 hours of deep debugging
//  Arc: Peak flow → interruption → moss recovery → sustained work
// ============================================================

export const PERPLEXOUS_PERSONA: PersonaProfile = {
  id: "perplexous",
  name: "Perplexous",
  archetype: "The PhD Student",
  description: "A PhD student fixing a bug in a large data pipeline.",
  challenge: "He holds a lot of code in his head. One interruption and it is gone.",
  intervention: "The moss: after an interruption, Friction shows him where he left off.",
  shows: "Interruptions. Friction helps you pick up where you left off.",
  
  tasks: [
    { id: "p1", title: "Debug normalization weights in pipeline", cognitiveWeight: 0.98, completed: false, category: "deep", estimatedMinutes: 120 },
    { id: "p2", title: "Adjust batch_variance_threshold parameter", cognitiveWeight: 0.95, completed: false, category: "deep", estimatedMinutes: 60 },
    { id: "p3", title: "Run correlation matrix on test dataset", cognitiveWeight: 0.78, completed: false, category: "deep", estimatedMinutes: 45 },
    { id: "p4", title: "Update documentation for pipeline changes", cognitiveWeight: 0.35, completed: false, category: "moderate", estimatedMinutes: 30 },
    { id: "p5", title: "Respond to advisor's email", cognitiveWeight: 0.18, completed: false, category: "light", estimatedMinutes: 10 },
  ],
  
  sessionDurationMinutes: 180,
  
  biometricPattern: [
    { timestamp: 0,   focus: 0.98, fatigue: 0.12, engagement: 0.99 },
    { timestamp: 30,  focus: 0.99, fatigue: 0.18, engagement: 0.98 },
    { timestamp: 60,  focus: 0.98, fatigue: 0.25, engagement: 0.97 },
    { timestamp: 75,  focus: 0.05, fatigue: 0.28, engagement: 0.08 }, // INTERRUPTION
    { timestamp: 78,  focus: 0.35, fatigue: 0.30, engagement: 0.45 }, // Return begins
    { timestamp: 80,  focus: 0.72, fatigue: 0.32, engagement: 0.78 }, // Context restored
    { timestamp: 120, focus: 0.88, fatigue: 0.42, engagement: 0.85 },
    { timestamp: 180, focus: 0.82, fatigue: 0.55, engagement: 0.80 },
  ],
  
  storyBeats: [
    {
      phase: "Deep focus",
      time: 0,
      narration: "Perplexous is fixing a bug. He is keeping six files of code in his head.",
      friction: "Nothing. It stays out of the way.",
      lookAt: "The top of the laptop screen: only a thin line shows the current task.",
      subState: "invisible"
    },
    {
      phase: "Interrupted",
      time: 75,
      narration: "A lab mate stops by with a question. He loses his train of thought.",
      friction: "It sees his focus drop. It offers a short reset and keeps a note of what he was working on.",
      lookAt: "The laptop screen: a short reset prompt. Focus in this panel drops to almost zero.",
      subState: "return"
    },
    {
      phase: "Coming back",
      time: 78,
      narration: "He comes back to his desk and does not remember where he was.",
      friction: "It covers the screen with 'moss'. Labels in the moss show the words he was working with, so he can find his place.",
      lookAt: "The laptop screen: read the labels, then sweep the mouse across the moss to clear it.",
      subState: "return"
    },
    {
      phase: "Back on track",
      time: 80,
      narration: "He clears the moss and is back at work in seconds, not minutes.",
      friction: "It steps back out of the way.",
      lookAt: "The laptop screen: the moss is gone.",
      subState: "invisible"
    },
  ],

  simulationActions: [
    // Session start — terminal running pipeline, then into VSCode
    { time: 0,   action: "open",  appId: "terminal", appTitle: "Terminal",  appSize: { width: 800, height: 500 } },
    { time: 3,   action: "open",  appId: "vscode",   appTitle: "VS Code",  appSize: { width: 1000, height: 700 } },
    { time: 3,   action: "focus", appId: "vscode" },
    // Deep flow — checking docs
    { time: 30,  action: "open",  appId: "notes",    appTitle: "Notes",    appSize: { width: 900, height: 620 } },
    { time: 35,  action: "focus", appId: "vscode" },
    // First milestone
    { time: 60,  action: "strike", strikeTask: "Debug normalization weights in pipeline", strikeNext: "Adjust batch_variance_threshold parameter" },
    { time: 62,  action: "focus", appId: "terminal" },
    { time: 68,  action: "focus", appId: "vscode" },
    // THE INTERRUPTION — Slack pops up (lab mate message)
    { time: 75,  action: "open",  appId: "slack",    appTitle: "Slack",    appSize: { width: 900, height: 650 } },
    { time: 75,  action: "focus", appId: "slack" },
    // Return — moss activates as he refocuses
    { time: 78,  action: "focus", appId: "vscode" },
    { time: 78,  action: "moss",  mossKeywords: ["normalization weights", "batch_variance_threshold", "line 247", "pipeline.py", "correlation matrix", "debugging loop"] },
    // Moss clears — back to work
    { time: 80,  action: "clear-moss" },
    { time: 80,  action: "close", appId: "slack" },
    // Continued work
    { time: 100, action: "strike", strikeTask: "Adjust batch_variance_threshold parameter", strikeNext: "Run correlation matrix on test dataset" },
    { time: 105, action: "focus", appId: "terminal" },
    { time: 115, action: "focus", appId: "vscode" },
    // Lighter work phase
    { time: 130, action: "focus", appId: "notes" },
    { time: 140, action: "open",  appId: "calculator", appTitle: "Calculator", appSize: { width: 480, height: 580 } },
    { time: 145, action: "focus", appId: "terminal" },
    { time: 150, action: "strike", strikeTask: "Run correlation matrix on test dataset", strikeNext: "Update documentation for pipeline changes" },
    { time: 155, action: "close", appId: "calculator" },
    { time: 155, action: "focus", appId: "notes" },
    { time: 170, action: "strike", strikeTask: "Update documentation for pipeline changes", strikeNext: "Respond to advisor's email" },
    { time: 172, action: "open",  appId: "mail",    appTitle: "Mail",    appSize: { width: 900, height: 650 } },
    { time: 172, action: "focus", appId: "mail" },
    { time: 178, action: "strike", strikeTask: "Respond to advisor's email", strikeNext: "Session complete" },
  ],

  simulationSnapshots: [
    { time: 0,   openApps: ["terminal"],                                    focusedApp: "terminal" },
    { time: 3,   openApps: ["terminal", "vscode"],                          focusedApp: "vscode" },
    { time: 30,  openApps: ["terminal", "vscode", "notes"],                 focusedApp: "notes" },
    { time: 35,  openApps: ["terminal", "vscode", "notes"],                 focusedApp: "vscode" },
    { time: 62,  openApps: ["terminal", "vscode", "notes"],                 focusedApp: "terminal" },
    { time: 68,  openApps: ["terminal", "vscode", "notes"],                 focusedApp: "vscode" },
    { time: 75,  openApps: ["terminal", "vscode", "notes", "slack"],        focusedApp: "slack" },
    { time: 78,  openApps: ["terminal", "vscode", "notes", "slack"],        focusedApp: "vscode" },
    { time: 80,  openApps: ["terminal", "vscode", "notes"],                 focusedApp: "vscode" },
    { time: 105, openApps: ["terminal", "vscode", "notes"],                 focusedApp: "terminal" },
    { time: 115, openApps: ["terminal", "vscode", "notes"],                 focusedApp: "vscode" },
    { time: 130, openApps: ["terminal", "vscode", "notes"],                 focusedApp: "notes" },
    { time: 140, openApps: ["terminal", "vscode", "notes", "calculator"],   focusedApp: "calculator" },
    { time: 145, openApps: ["terminal", "vscode", "notes", "calculator"],   focusedApp: "terminal" },
    { time: 155, openApps: ["terminal", "vscode", "notes"],                 focusedApp: "notes" },
    { time: 172, openApps: ["terminal", "vscode", "notes", "mail"],         focusedApp: "mail" },
  ],

  accentColor: "#4caf50",
  visualMetaphor: "Organic moss reclaiming brutalist concrete, nature preserving memory."
};


// ============================================================
//  CHARLIE — THE SOLO LAWYER
//  Demonstrates: "The Hard Intercept" forced shutdown
//  Session: 5 hours (late night), grinding through case prep
//  Arc: Already tired → grinding → critical zone → hard intercept
// ============================================================

export const CHARLIE_PERSONA: PersonaProfile = {
  id: "charlie",
  name: "Charlie",
  archetype: "The Solo Lawyer",
  description: "A lawyer working late on a big case.",
  challenge: "He ignores how tired he is and starts making mistakes.",
  intervention: "The lock: when he is too tired, Friction makes him stop.",
  shows: "Working too late. Friction locks the screen when you are too tired.",
  
  tasks: [
    { id: "ch1", title: "Cross-reference antitrust discovery docs (§201-450)", cognitiveWeight: 0.88, completed: false, category: "deep", estimatedMinutes: 180 },
    { id: "ch2", title: "Draft motion for summary judgment", cognitiveWeight: 0.92, completed: false, category: "deep", estimatedMinutes: 120 },
    { id: "ch3", title: "Review deposition transcripts for inconsistencies", cognitiveWeight: 0.82, completed: false, category: "deep", estimatedMinutes: 90 },
    { id: "ch4", title: "Flag key exhibits for trial prep", cognitiveWeight: 0.45, completed: false, category: "moderate", estimatedMinutes: 45 },
  ],
  
  sessionDurationMinutes: 300,
  
  biometricPattern: [
    { timestamp: 0,   focus: 0.78, fatigue: 0.45, engagement: 0.72 },
    { timestamp: 60,  focus: 0.72, fatigue: 0.58, engagement: 0.68 },
    { timestamp: 120, focus: 0.65, fatigue: 0.70, engagement: 0.60 },
    { timestamp: 180, focus: 0.55, fatigue: 0.82, engagement: 0.52 },
    { timestamp: 240, focus: 0.42, fatigue: 0.92, engagement: 0.38 },
    { timestamp: 270, focus: 0.28, fatigue: 0.96, engagement: 0.25 },
    { timestamp: 275, focus: 0.00, fatigue: 0.96, engagement: 0.00 },
  ],
  
  storyBeats: [
    {
      phase: "Starting late",
      time: 0,
      narration: "It is 10:45 PM. Charlie is already tired, but a deadline is close. He tells himself two more hours.",
      friction: "It lets him work, and keeps an eye on how tired he is.",
      lookAt: "Fatigue in this panel: it starts high.",
      subState: "invisible"
    },
    {
      phase: "Pushing through",
      time: 120,
      narration: "Two hours in. He feels no more tired than before, but his work is getting worse.",
      friction: "The keys get softer and the edges of the screen start to darken.",
      lookAt: "The keyboard below reads Soft. The edges of the laptop screen are darker.",
      subState: "taper"
    },
    {
      phase: "Making mistakes",
      time: 240,
      narration: "Four hours in. He ignores the warnings and keeps going. He is making mistakes and does not notice.",
      friction: "It keeps adding resistance. The keys are now heavy.",
      lookAt: "The keyboard below: the keys now read Heavy.",
      subState: "taper"
    },
    {
      phase: "Locked",
      time: 270,
      narration: "He is too tired to work well, but he would keep going.",
      friction: "It stops asking. The keys lock, the screen goes dark at the edges, and a message tells him to take a break.",
      lookAt: "The laptop screen: the break message. The keyboard below reads Locked.",
      subState: "intercept"
    },
  ],

  simulationActions: [
    // Late night start — legal research + drafting
    { time: 0,   action: "open",  appId: "chrome",   appTitle: "Chrome",   appSize: { width: 1000, height: 700 } },
    { time: 5,   action: "open",  appId: "notes",    appTitle: "Notes",    appSize: { width: 900, height: 620 } },
    { time: 5,   action: "focus", appId: "notes" },
    // Cross-referencing documents
    { time: 20,  action: "focus", appId: "chrome" },
    { time: 40,  action: "focus", appId: "notes" },
    // Discovery docs in Finder
    { time: 60,  action: "open",  appId: "finder",   appTitle: "Finder",   appSize: { width: 900, height: 600 } },
    { time: 65,  action: "focus", appId: "finder" },
    { time: 75,  action: "focus", appId: "chrome" },
    // Quick billing check
    { time: 90,  action: "open",  appId: "calculator", appTitle: "Calculator", appSize: { width: 480, height: 580 } },
    { time: 95,  action: "focus", appId: "notes" },
    // Milestone
    { time: 120, action: "strike", strikeTask: "Cross-reference antitrust discovery docs (§201-450)", strikeNext: "Draft motion for summary judgment" },
    { time: 122, action: "close", appId: "calculator" },
    { time: 125, action: "focus", appId: "chrome" },
    { time: 140, action: "focus", appId: "finder" },
    // Taper building
    { time: 155, action: "close", appId: "finder" },
    { time: 155, action: "focus", appId: "notes" },
    // Trying to stay alert — puts on music
    { time: 180, action: "open",  appId: "spotify",  appTitle: "Spotify",  appSize: { width: 950, height: 650 } },
    { time: 182, action: "focus", appId: "notes" },
    // Fatigue climbing
    { time: 200, action: "focus", appId: "chrome" },
    // Another milestone (barely)
    { time: 210, action: "strike", strikeTask: "Draft motion for summary judgment", strikeNext: "Review deposition transcripts for inconsistencies" },
    { time: 215, action: "focus", appId: "notes" },
    // Opening terminal for case searches, grasping
    { time: 230, action: "open",  appId: "terminal", appTitle: "Terminal", appSize: { width: 800, height: 500 } },
    { time: 235, action: "focus", appId: "terminal" },
    // Critical zone
    { time: 245, action: "focus", appId: "notes" },
    { time: 255, action: "focus", appId: "chrome" },
    // At this point biometrics drive the intercept — everything dims
    { time: 265, action: "focus", appId: "notes" },
  ],

  simulationSnapshots: [
    { time: 0,   openApps: ["chrome"],                                      focusedApp: "chrome" },
    { time: 5,   openApps: ["chrome", "notes"],                             focusedApp: "notes" },
    { time: 20,  openApps: ["chrome", "notes"],                             focusedApp: "chrome" },
    { time: 40,  openApps: ["chrome", "notes"],                             focusedApp: "notes" },
    { time: 60,  openApps: ["chrome", "notes", "finder"],                   focusedApp: "finder" },
    { time: 75,  openApps: ["chrome", "notes", "finder"],                   focusedApp: "chrome" },
    { time: 90,  openApps: ["chrome", "notes", "finder", "calculator"],     focusedApp: "calculator" },
    { time: 95,  openApps: ["chrome", "notes", "finder", "calculator"],     focusedApp: "notes" },
    { time: 122, openApps: ["chrome", "notes", "finder"],                   focusedApp: "chrome" },
    { time: 140, openApps: ["chrome", "notes", "finder"],                   focusedApp: "finder" },
    { time: 155, openApps: ["chrome", "notes"],                             focusedApp: "notes" },
    { time: 180, openApps: ["chrome", "notes", "spotify"],                  focusedApp: "spotify" },
    { time: 182, openApps: ["chrome", "notes", "spotify"],                  focusedApp: "notes" },
    { time: 200, openApps: ["chrome", "notes", "spotify"],                  focusedApp: "chrome" },
    { time: 215, openApps: ["chrome", "notes", "spotify"],                  focusedApp: "notes" },
    { time: 230, openApps: ["chrome", "notes", "spotify", "terminal"],      focusedApp: "terminal" },
    { time: 245, openApps: ["chrome", "notes", "spotify", "terminal"],      focusedApp: "notes" },
    { time: 255, openApps: ["chrome", "notes", "spotify", "terminal"],      focusedApp: "chrome" },
    { time: 265, openApps: ["chrome", "notes", "spotify", "terminal"],      focusedApp: "notes" },
  ],

  accentColor: "#d84315",
  visualMetaphor: "Red warning glow, mechanical resistance, system override for survival."
};


/**
 * PERSONA REGISTRY
 * Central lookup for all available personas
 */
export const ALL_PERSONAS = [CLAUDIA_PERSONA, PERPLEXOUS_PERSONA, CHARLIE_PERSONA];

export function getPersonaById(id: string): PersonaProfile | undefined {
  return ALL_PERSONAS.find(p => p.id === id);
}
