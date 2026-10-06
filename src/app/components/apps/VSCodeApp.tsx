/**
 * VS CODE APP
 *
 * Full-featured VS Code simulation with syntax-highlighted code,
 * multi-tab editing, file explorer with expand/collapse, line numbers,
 * minimap placeholder, status bar, breadcrumbs, and problems panel.
 */

import React, { useState } from "react";
import {
  FileText, Folder, FolderOpen, ChevronRight, ChevronDown,
  Search, GitBranch, Bug, Package, X, Circle,
} from "lucide-react";

// ── File tree data ──────────────────────────────────────
interface TreeNode {
  name: string;
  type: "file" | "folder";
  lang?: string;
  children?: TreeNode[];
}

const FILE_TREE: TreeNode[] = [
  {
    name: "src", type: "folder", children: [
      {
        name: "app", type: "folder", children: [
          {
            name: "context", type: "folder", children: [
              { name: "BiometricContext.tsx", type: "file", lang: "tsx" },
              { name: "FrictionSettingsContext.tsx", type: "file", lang: "tsx" },
              { name: "KeyboardContext.tsx", type: "file", lang: "tsx" },
              { name: "SessionContext.tsx", type: "file", lang: "tsx" },
            ],
          },
          {
            name: "engine", type: "folder", children: [
              { name: "thresholds.ts", type: "file", lang: "ts" },
              { name: "snn.ts", type: "file", lang: "ts" },
              { name: "calibration.ts", type: "file", lang: "ts" },
            ],
          },
          {
            name: "privacy", type: "folder", children: [
              { name: "dataBurn.ts", type: "file", lang: "ts" },
            ],
          },
          {
            name: "components", type: "folder", children: [
              { name: "FrictionOverlay.tsx", type: "file", lang: "tsx" },
              { name: "FrictionKeyboard.tsx", type: "file", lang: "tsx" },
              { name: "MirrorPage.tsx", type: "file", lang: "tsx" },
            ],
          },
          { name: "App.tsx", type: "file", lang: "tsx" },
        ],
      },
      { name: "main.tsx", type: "file", lang: "tsx" },
    ],
  },
  { name: "package.json", type: "file", lang: "json" },
  { name: "vite.config.ts", type: "file", lang: "ts" },
  { name: "README.md", type: "file", lang: "md" },
];

/** Folder path to a file, for the breadcrumbs. */
function findPath(name: string, nodes: TreeNode[] = FILE_TREE, trail: string[] = []): string[] | null {
  for (const node of nodes) {
    if (node.type === "file" && node.name === name) return trail;
    if (node.children) {
      const found = findPath(name, node.children, [...trail, node.name]);
      if (found) return found;
    }
  }
  return null;
}

// ── File contents with syntax token hints ───────────────
interface CodeLine {
  text: string;
  tokens?: { start: number; end: number; color: string }[];
}

const KEYWORDS = /\b(import|from|export|default|const|let|function|return|if|else|interface|type|for|of|new|as|true|false|null|void)\b/;
const TOKEN_RE = new RegExp(
  [
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/.source, // 1 strings
    /(\/\/.*$)/.source,                              // 2 trailing comments
    KEYWORDS.source,                                 // 3 keywords
    /\b(\d+(?:\.\d+)?)\b/.source,                    // 4 numbers
    /\b([A-Z][A-Za-z0-9]+)\b/.source,                // 5 types / components
  ].join("|"),
  "g",
);

/** Tokenize one line for the fake editor: VS Code Dark+ colors. */
function hl(text: string): CodeLine {
  const trimmed = text.trimStart();
  if (trimmed.startsWith("/**") || trimmed.startsWith("*") || trimmed.startsWith("//")) {
    return { text, tokens: [{ start: 0, end: text.length, color: "#6a9955" }] };
  }
  const tokens: CodeLine["tokens"] = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    const color = m[1] ? "#ce9178" : m[2] ? "#6a9955" : m[3] ? "#569cd6" : m[4] ? "#b5cea8" : "#4ec9b0";
    tokens.push({ start, end, color });
  }
  return { text, tokens };
}

const file = (src: string): CodeLine[] => src.replace(/^\n/, "").split("\n").map(hl);

/** Markdown: headings blue, everything else plain. */
const md = (src: string): CodeLine[] =>
  src.replace(/^\n/, "").split("\n").map((text) =>
    text.startsWith("#") ? { text, tokens: [{ start: 0, end: text.length, color: "#569cd6" }] } : { text });

const FILE_CONTENTS: Record<string, CodeLine[]> = {
  "thresholds.ts": file(`
/**
 * Focus and fatigue thresholds for the session sub-states.
 *
 * These are demo tuning values, not science. Nothing in the Frontiers LC-NE
 * paper gives a cutoff for flow, so do not cite it as if it does.
 * The paper is why we care about arousal at all, not where the line is.
 */

export const FOCUS_INVISIBLE = 0.9;    // above this, Friction stays out of the way
export const FOCUS_TAPER_LOW = 0.5;
export const FOCUS_TAPER_HIGH = 0.7;   // product doc says taper is 0.50-0.70
export const INTERCEPT_FATIGUE = 0.95; // same as interceptThreshold: 95 in settings

export type SubState = "invisible" | "taper" | "recovery" | "return" | "intercept";

export function deriveSubState(focus: number, fatigue: number, justReturned: boolean): SubState {
  // Intercept wins over everything. Past 0.95 fatigue the focus number
  // stops meaning much, and the keyboard should get heavy regardless.
  if (fatigue > INTERCEPT_FATIGUE) return "intercept";
  if (justReturned) return "return";
  if (focus > FOCUS_INVISIBLE) return "invisible";

  // The doc never says what 0.70-0.90 is. It falls into taper here.
  // Flagging it instead of pretending it was designed. More to think here.
  if (focus >= FOCUS_TAPER_LOW) return "taper";
  return "recovery";
}
`),

  "snn.ts": file(`
/**
 * Spike simulation for the keyboard chip.
 *
 * This is not a real SNN. It is a leaky integrate-and-fire toy so the demo
 * can show what a local neuromorphic chip in the keyboard would do:
 *  - a neuron only fires with enough input
 *  - the information is in the timing and frequency of spikes
 *  - event-driven, not clock-based (we are clock-based, because setInterval)
 *
 * The real thing would sit on hardware like Intel Loihi, IBM TrueNorth or
 * BrainChip. Cloud streaming was ruled out: latency, and privacy.
 */

export interface Neuron {
  v: number;
  spikes: number[]; // timestamps in ms
}

const LEAK = 0.9;        // demo value
const V_THRESHOLD = 1.0; // demo value

export function step(n: Neuron, input: number, t: number): boolean {
  n.v = n.v * LEAK + input;
  if (n.v < V_THRESHOLD) return false; // not enough input, no spike
  n.v = 0;
  n.spikes.push(t);
  return true;
}

// Downstream reads the spike rate, never the membrane value.
export function spikeRate(n: Neuron, windowMs: number, now: number): number {
  const recent = n.spikes.filter((s) => now - s <= windowMs);
  return recent.length / (windowMs / 1000);
}
`),

  "calibration.ts": file(`
/**
 * Three-phase calibration.
 *
 * FigMake Agent, change log:
 * 1. Split the single calibration screen into three phases, in this order.
 * 2. Each phase writes its baseline through \`privacy/dataBurn.ts\` so it
 *    is stored locally and removed by Data Burn.
 * 3. No phase makes a network request.
 */

export const CALIBRATION_PHASES = [
  {
    id: "spem",
    name: "Visual",
    measures: "Smooth Pursuit Eye Movements: micro-stutters, gaze drift",
    ui: "deliberate Gaussian blur to crisp",
  },
  {
    id: "rf",
    name: "Spatial",
    measures: "RF volumetric mesh: engaged vs fatigued posture, no cameras",
    ui: "wireframe",
  },
  {
    id: "kinetic",
    name: "Kinetic & Acoustic",
    measures: "keystroke topography from stream-of-consciousness typing",
    ui: "40Hz tuning, magnetic resistance",
  },
] as const;

export type PhaseId = (typeof CALIBRATION_PHASES)[number]["id"];
`),

  "dataBurn.ts": file(`
/**
 * Data Burn
 *
 * FigMake Agent, change log:
 * 1. All biometric samples are written to localStorage under one key prefix.
 * 2. \`burnAll()\` removes every key with that prefix. It does not hide them.
 * 3. The hold must last 3000 ms. Releasing early cancels the burn.
 *
 * There is no network code in this file. If a later change adds any,
 * this file should be reviewed before anything else.
 */

const PREFIX = "friction:bio:";
export const BURN_HOLD_MS = 3000; // the three-second haptic hold

export function saveSample(key: string, sample: unknown): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(sample));
}

export function burnAll(): number {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
  keys.forEach((k) => localStorage.removeItem(k));
  // Return the count so the UI can say what it burned, not just "done". (Arya)
  return keys.length;
}

export function startBurnHold(onBurn: (count: number) => void): () => void {
  const timer = setTimeout(() => onBurn(burnAll()), BURN_HOLD_MS);
  return () => clearTimeout(timer); // released early: nothing is deleted
}
`),

  "FrictionSettingsContext.tsx": file(`
/**
 * FRICTION SETTINGS CONTEXT
 *
 * FigMake Agent, change log:
 * 1. Moved the Settings > Friction toggles here. They used to live in the
 *    Settings window's own state, which is destroyed when the window closes.
 * 2. \`interceptThreshold\` is a percent (80-100) to match the slider.
 * 3. \`interceptFatigue\` exposes it as a 0-1 fraction for \`engine/thresholds.ts\`.
 */

export interface FrictionSettings {
  frictionEnabled: boolean;
  progressiveVignette: boolean;
  breathingVisualizer: boolean;
  /** Fatigue percent (80-100) above which the hard intercept starts. */
  interceptThreshold: number;
}

export const DEFAULT_FRICTION_SETTINGS: FrictionSettings = {
  frictionEnabled: true,
  progressiveVignette: true,
  breathingVisualizer: true,
  interceptThreshold: 95,
};
`),

  "README.md": md(`
# Friction

Fig Build 2026. Arya Garg, Haley Potter, Miami Celentana, built with Figma Make.

Enable the flow state through physical and digital means.

## Run

    npm i
    npm run dev

## What is real and what is mocked

- The biometric signals are scripted personas. There are no sensors in this repo.
- The SNN is a leaky integrate-and-fire toy, not neuromorphic hardware.
- Everything is stored locally. Data Burn deletes it, it does not hide it.

## Still open

- Focus between 0.70 and 0.90 has no state of its own (see engine/thresholds.ts).
- "it senses: chemicals in the brain" overstates what the wrist rest reads.
- Extended Mind: I dont agree that it is a boundary. More to think here.
`),

  "package.json": file(`
{
  "name": "@figma/my-make-file",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "vite"
  },
  "dependencies": {
    "lucide-react": "0.487.0",
    "motion": "12.23.24",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  }
}
`),
};

// ── Default files to open ──────────────────────
const DEFAULT_FILES = ["thresholds.ts", "snn.ts", "dataBurn.ts"];

function findFileContent(name: string): CodeLine[] {
  return FILE_CONTENTS[name] || [{ text: `// ${name}` }, { text: "// File contents not loaded" }];
}

// ── Syntax-highlighted line ─────────────────────────────
function HighlightedLine({ line }: { line: CodeLine }) {
  if (!line.tokens || line.tokens.length === 0) {
    return <span style={{ color: "#d4d4d4" }}>{line.text || "\u00A0"}</span>;
  }

  const parts: Array<React.ReactElement> = [];
  let cursor = 0;
  const sorted = [...line.tokens].sort((a, b) => a.start - b.start);

  for (const tok of sorted) {
    if (cursor < tok.start) {
      parts.push(
        <span key={`pre-${cursor}`} style={{ color: "#d4d4d4" }}>
          {line.text.slice(cursor, tok.start)}
        </span>
      );
    }
    parts.push(
      <span key={`tok-${tok.start}`} style={{ color: tok.color }}>
        {line.text.slice(tok.start, tok.end)}
      </span>
    );
    cursor = tok.end;
  }
  if (cursor < line.text.length) {
    parts.push(
      <span key={`end-${cursor}`} style={{ color: "#d4d4d4" }}>
        {line.text.slice(cursor)}
      </span>
    );
  }
  return <>{parts}</>;
}

// ── Tree Node ────────────────────────────────────────
function TreeItem({
  node,
  depth,
  selectedFile,
  onSelect,
  expanded,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  selectedFile: string;
  onSelect: (name: string) => void;
  expanded: Set<string>;
  onToggle: (path: string) => void;
}) {
  const path = node.name;
  const isOpen = expanded.has(path);

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => onToggle(path)}
          className="w-full flex items-center gap-1 px-2 py-[3px] text-xs hover:bg-[#2a2d2e] cursor-pointer"
          style={{ paddingLeft: `${8 + depth * 12}px`, color: "#cccccc" }}
        >
          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {isOpen ? (
            <FolderOpen size={14} style={{ color: "#dcb67a" }} />
          ) : (
            <Folder size={14} style={{ color: "#dcb67a" }} />
          )}
          <span>{node.name}</span>
        </button>
        {isOpen &&
          node.children?.map((child) => (
            <TreeItem
              key={child.name}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelect={onSelect}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
      </div>
    );
  }

  const langColor: Record<string, string> = {
    tsx: "#519aba",
    ts: "#519aba",
    json: "#cbcb41",
    md: "#ffffff",
  };

  return (
    <button
      onClick={() => onSelect(node.name)}
      className="w-full flex items-center gap-1.5 px-2 py-[3px] text-xs cursor-pointer"
      style={{
        paddingLeft: `${20 + depth * 12}px`,
        backgroundColor: selectedFile === node.name ? "#37373d" : "transparent",
        color: selectedFile === node.name ? "#ffffff" : "#cccccc",
      }}
      onMouseEnter={(e) => {
        if (selectedFile !== node.name) e.currentTarget.style.backgroundColor = "#2a2d2e";
      }}
      onMouseLeave={(e) => {
        if (selectedFile !== node.name) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <FileText size={14} style={{ color: langColor[node.lang || ""] || "#8b8b8b" }} />
      <span>{node.name}</span>
    </button>
  );
}

// ── Problems data ───────────────────────────────────
const PROBLEMS: { file: string; line: number; type: "error" | "warning" | "info"; msg: string }[] = [
  { file: "FrictionOverlay.tsx", line: 195, type: "error", msg: "',' expected. ts(1005)" },
  { file: "KeyboardContext.tsx", line: 50, type: "warning", msg: "React Hook useCallback has a missing dependency: 'state'. Either include it or remove the dependency array. eslint(react-hooks/exhaustive-deps)" },
  { file: "thresholds.ts", line: 11, type: "warning", msg: "'FOCUS_TAPER_HIGH' is declared but its value is never read. ts(6133)" },
  { file: "MirrorPage.tsx", line: 4, type: "info", msg: "Import 'InsightCard' restored from './InsightCard'." },
]

export function VSCodeApp() {
  const [openTabs, setOpenTabs] = useState<string[]>(DEFAULT_FILES);
  const [activeTab, setActiveTab] = useState(DEFAULT_FILES[0]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["src", "app", "engine", "privacy"]));
  const [showProblems, setShowProblems] = useState(false);

  const toggleExpanded = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const selectFile = (name: string) => {
    if (!openTabs.includes(name)) setOpenTabs((prev) => [...prev, name]);
    setActiveTab(name);
  };

  const closeTab = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openTabs.filter((t) => t !== name);
    setOpenTabs(remaining);
    if (activeTab === name) setActiveTab(remaining[remaining.length - 1] || "");
  };

  const lines = findFileContent(activeTab);

  return (
    <div className="size-full flex flex-col" style={{ backgroundColor: "#1e1e1e" }}>
      {/* Activity Bar + Sidebar + Editor */}
      <div className="flex-1 flex min-h-0">
        {/* Activity Bar */}
        <div
          className="flex flex-col items-center py-2 gap-4 shrink-0"
          style={{ width: "42px", backgroundColor: "#252526" }}
        >
          <button className="p-2 rounded" style={{ backgroundColor: "#37373d" }}>
            <FileText size={18} style={{ color: "#ffffff" }} />
          </button>
          <button className="p-2 rounded hover:bg-[#37373d]">
            <Search size={18} style={{ color: "#858585" }} />
          </button>
          <button className="p-2 rounded hover:bg-[#37373d]">
            <GitBranch size={18} style={{ color: "#858585" }} />
          </button>
          <button
            className="p-2 rounded hover:bg-[#37373d] relative"
            onClick={() => setShowProblems(!showProblems)}
          >
            <Bug size={18} style={{ color: "#858585" }} />
            {PROBLEMS.length > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 text-white rounded-full flex items-center justify-center"
                style={{
                  width: "14px", height: "14px", fontSize: "9px",
                  backgroundColor: "#f14c4c",
                }}
              >
                {PROBLEMS.length}
              </span>
            )}
          </button>
          <button className="p-2 rounded hover:bg-[#37373d]">
            <Package size={18} style={{ color: "#858585" }} />
          </button>
        </div>

        {/* File Explorer */}
        <div
          className="flex flex-col shrink-0 overflow-y-auto"
          style={{ width: "210px", backgroundColor: "#252526", borderRight: "1px solid #191919" }}
        >
          <div
            className="px-4 py-2 text-xs uppercase"
            style={{ color: "#bbbbbb", letterSpacing: "0.1em" }}
          >
            Explorer
          </div>
          <div className="text-xs uppercase px-3 py-1" style={{ color: "#cccccc", fontSize: "11px" }}>
            friction
          </div>
          {FILE_TREE.map((node) => (
            <TreeItem
              key={node.name}
              node={node}
              depth={0}
              selectedFile={activeTab}
              onSelect={selectFile}
              expanded={expanded}
              onToggle={toggleExpanded}
            />
          ))}
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          <div
            className="flex items-center overflow-x-auto shrink-0"
            style={{ backgroundColor: "#252526", height: "36px" }}
          >
            {openTabs.map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex items-center gap-2 px-3 h-full cursor-pointer shrink-0 group"
                style={{
                  backgroundColor: activeTab === tab ? "#1e1e1e" : "#2d2d2d",
                  borderTop: activeTab === tab ? "1px solid #007acc" : "1px solid transparent",
                  borderRight: "1px solid #191919",
                  color: activeTab === tab ? "#ffffff" : "#969696",
                  fontSize: "12px",
                }}
              >
                <Circle size={6} fill={tab.endsWith(".tsx") ? "#519aba" : tab.endsWith(".json") ? "#cbcb41" : "#519aba"} stroke="none" />
                <span>{tab}</span>
                <button
                  onClick={(e) => closeTab(tab, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#37373d] transition-opacity cursor-pointer"
                >
                  <X size={12} style={{ color: "#969696" }} />
                </button>
              </div>
            ))}
          </div>

          {/* Breadcrumbs */}
          <div
            className="flex items-center gap-1 px-4 text-xs shrink-0"
            style={{ height: "22px", backgroundColor: "#1e1e1e", color: "#969696" }}
          >
            {(findPath(activeTab) ?? []).map((seg) => (
              <React.Fragment key={seg}>
                <span>{seg}</span>
                <ChevronRight size={10} />
              </React.Fragment>
            ))}
            <span style={{ color: "#cccccc" }}>{activeTab}</span>
          </div>

          {/* Code Editor */}
          <div className="flex-1 flex overflow-hidden">
            {/* Line Numbers + Code */}
            <div className="flex-1 overflow-auto font-mono" style={{ fontSize: "13px", lineHeight: "20px" }}>
              {lines.map((line, i) => (
                <div key={i} className="flex hover:bg-[#2a2d2e]" style={{ minHeight: "20px" }}>
                  <span
                    className="text-right pr-4 pl-4 select-none shrink-0"
                    style={{ width: "52px", color: "#858585", fontSize: "13px" }}
                  >
                    {i + 1}
                  </span>
                  <pre className="flex-1 pr-4" style={{ fontFamily: "JetBrains Mono, Menlo, monospace" }}>
                    <HighlightedLine line={line} />
                  </pre>
                </div>
              ))}
              {/* Padding at bottom */}
              <div style={{ height: "200px" }} />
            </div>

            {/* Minimap */}
            <div
              className="shrink-0 overflow-hidden"
              style={{ width: "50px", backgroundColor: "#1e1e1e", borderLeft: "1px solid #191919" }}
            >
              {lines.map((_, i) => (
                <div
                  key={i}
                  className="mx-2"
                  style={{
                    height: "3px",
                    marginTop: "1px",
                    backgroundColor: "rgba(212,212,212,0.12)",
                    borderRadius: "1px",
                    width: `${Math.min(40, 10 + Math.random() * 30)}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Problems Panel */}
      {showProblems && (
        <div
          className="shrink-0 border-t overflow-y-auto"
          style={{
            height: "120px",
            backgroundColor: "#1e1e1e",
            borderColor: "#191919",
          }}
        >
          <div
            className="flex items-center gap-4 px-3 text-xs border-b"
            style={{ height: "28px", backgroundColor: "#252526", borderColor: "#191919", color: "#cccccc" }}
          >
            <span style={{ borderBottom: "1px solid #007acc", paddingBottom: "2px" }}>
              Problems ({PROBLEMS.length})
            </span>
          </div>
          {PROBLEMS.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-1.5 text-xs hover:bg-[#2a2d2e] cursor-pointer"
            >
              <span style={{ color: p.type === "error" ? "#f14c4c" : p.type === "warning" ? "#cca700" : "#3794ff" }}>
                {p.type === "error" ? "⊗" : p.type === "warning" ? "⚠" : "ℹ"}
              </span>
              <span style={{ color: "#cccccc" }}>{p.msg}</span>
              <span className="ml-auto" style={{ color: "#858585" }}>
                {p.file}:{p.line}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Status Bar */}
      <div
        className="flex items-center justify-between px-3 text-xs shrink-0"
        style={{
          height: "24px",
          backgroundColor: "#007acc",
          color: "#ffffff",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <GitBranch size={12} /> main
          </span>
          <span className="flex items-center gap-1">
            <span style={{ color: "#f14c4c" }}>⊗</span> {PROBLEMS.filter(p => p.type === "error").length}
            <span className="ml-1" style={{ color: "#ffcc00" }}>⚠</span> {PROBLEMS.filter(p => p.type === "warning").length}
            <span className="ml-1" style={{ color: "#75beff" }}>ℹ</span> {PROBLEMS.filter(p => p.type === "info").length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>Ln {lines.length}, Col 1</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span>TypeScript React</span>
        </div>
      </div>
    </div>
  );
}