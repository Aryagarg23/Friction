/**
 * TERMINAL APP
 * 
 * Interactive terminal emulator with command history and fake filesystem.
 */

import { useState, useRef, useEffect } from "react";

interface HistoryEntry {
  command: string;
  output: string;
}

const FILESYSTEM: Record<string, string[]> = {
  "~": ["Documents/", "Downloads/", "Projects/", ".zshrc"],
  "~/Documents": ["notes.md", "todo.txt", "mc-brain-dump.txt", "haley-brain-dump.txt", "captions.txt"],
  "~/Downloads": ["the-extended-mind.pdf", "fnhum-flow-state-lc-ne.pdf", "figma-make-export-friction.zip"],
  "~/Projects": ["friction/", "gyrus/"],
  "~/Projects/friction": ["src/", "package.json", "README.md", "vite.config.ts"],
  "~/Projects/friction/src": ["app/", "main.tsx"],
  "~/Projects/gyrus": ["src/", "README.md"],
};

const FILE_CONTENTS: Record<string, string> = {
  "notes.md": [
    "# The Extended Mind (Clark & Chalmers)",
    "",
    "Otto's Extended mind hypothesis. I dont necessarily agree with what the paper says here.",
    "I do understand that previous 'extensions of the mind' were cold storage of information.",
    "But I diasgree with them insinuating that this is a boundray which should not be crossed.",
    "More to think here.",
    "",
    "Criteria: constantly accessible, automatically trusted, easily retrievable,",
    "consciously endorsed at some point. GPS, phone contacts, Google search, shared docs all pass.",
    "",
    "I need to read this part. takinng a cognitive pause",
    "I also need to read The Algorithmic Funnel: and beyond",
    "",
    "Same question as Clay/Gyrus: does the tool protect the thinking or extract it.",
  ].join("\n"),
  "todo.txt": [
    "[x] three-phase calibration (SPEM, RF mesh, keystroke topography)",
    "[x] intercept threshold in settings, default 0.95",
    "[x] data burn actually deletes",
    "[x] InsightCard import (FigMake dropped it on regen)",
    "[ ] 0.70-0.90 focus has no state. decide or document",
    "[ ] read The Algorithmic Funnel: and beyond",
    "[ ] submit by 11:00 PM EST",
  ].join("\n"),
  "mc-brain-dump.txt": [
    "Mc brain dump:",
    "- how the inflection in people's voices change determining the level of stress?",
    "- hunger pangs —> for people with eating disorders who struggle to eat consistently or have body response that lie",
    "- breathing state—> for yoga or meditation or anxiety",
    "- salt levels? thirst",
    "- screentime effects —> blue light impact, amount of time spent immobile",
    "- urges to consume —> how the brain lights up and reacts to advertisements",
    "- dream tracking —> dream enhancing —> be productive in your sleep TOO!",
    "- motivation —> encouragement tips, how to trick the brain into starting a task that feels insurmountable",
  ].join("\n"),
  "haley-brain-dump.txt": [
    "HALEY'S FREAKOFF CORNER!!!!",
    "",
    "They put a strong emphasis on storytelling so thinking about an idea super widely relatable/not overly futuristic?",
    "",
    "Literally just saw Garmin x Meta add where the guy said 'hey meta how many calories have I burned?'",
    "which personally just PMO but that's attractive for a lot of people (even though research says",
    "smartwatches can't accurately track calories)",
    "",
    "I keep coming back to the idea of unwarranted health anxiety ... idk just word vomit",
    "",
    "taking a metric fuck ton of supplements (hi arya)",
  ].join("\n"),
  "captions.txt": [
    "Breathe in, breathe out. notice where your attention lies right now.",
    "the elusive, rewarding 'flow state' greets us and departs with ease",
    "the balance between deep work and burn out has kept motivated individuals on their toes for ages",
    "",
    "the product lies dormant until the level of focus has reached unproductive levels. it's time for friction to step in.",
    "but it never feels like a punishment, each activity is built to bring a sense of calm and self care.",
    "perfection is not the goal",
    "the work needs to get done regardless. friction is the guiding hand to get work done faster, with more intention",
    "",
    "friction is paving the way for people to own their focus and turn it into a tool they can bend to their will",
  ].join("\n"),
  ".zshrc": 'export PATH="$HOME/.local/bin:$PATH"\nalias ll="ls -la"\nalias gs="git status"\nalias dev="npm run dev"\nexport FRICTION_STORAGE="local"   # never change this',
  "package.json": '{\n  "name": "@figma/my-make-file",\n  "private": true,\n  "version": "0.0.1",\n  "type": "module",\n  "scripts": {\n    "build": "vite build",\n    "dev": "vite"\n  }\n}',
  "README.md": "# Friction\n\nFig Build 2026. Arya Garg, Haley Potter, Miami Celentana, built with Figma Make.\n\nEnable the flow state through physical and digital means.\n\n## Run\n    npm i\n    npm run dev",
};

const GIT_LOG = [
  ["e41c0a9", "Arya Garg", "Mon Mar 9 22:41", "fix stale vite cache. error said line 195 in a 153 line file, it was the cache not the code"],
  ["b72f3d1", "Miami Celentana", "Mon Mar 9 18:05", "captions —> overlay, timer 37 secs"],
  ["9a0e6c4", "FigMake Agent", "Mon Mar 9 16:12", "Restore InsightCard import in MirrorPage.tsx (dropped when the file was regenerated)"],
  ["5d18b7e", "Haley Potter", "Mon Mar 9 13:30", "microcopy from product doc v4!! \"Right back to the flow- you've got this.\""],
  ["f03a2c8", "FigMake Agent", "Sun Mar 8 23:47", "Wrap KeyboardContext setters in useCallback to stop the render loop"],
  ["c6b9e15", "Arya Garg", "Sun Mar 8 21:20", "data burn deletes instead of hiding. return the count of keys burned"],
  ["8e2d4a0", "FigMake Agent", "Sun Mar 8 16:58", "Add three-phase calibration: Visual (SPEM), Spatial (RF mesh), Kinetic & Acoustic"],
  ["3f7a91b", "Arya Garg", "Sun Mar 8 14:02", "move intercept threshold into settings, default 95 (0.95 fatigue)"],
  ["a19c6f2", "Arya Garg", "Sat Mar 7 23:15", "snn.ts: leaky integrate-and-fire toy. header says it is not a real SNN"],
  ["0b4e8d7", "Arya Garg", "Fri Mar 6 20:44", "initial import from figma make"],
];

const CALIBRATION: Record<string, string> = {
  spem: [
    "friction calibrate · phase 1/3 · Visual",
    "  sensor:   bezel eye tracking (Smooth Pursuit Eye Movements)",
    "  stimulus: deliberate Gaussian blur -> crisp",
    "  watching: micro-stutters, gaze drift",
    "  [████████████████████] done",
    "  baseline -> ~/.friction/local/phase1_spem_baseline.csv (local only)",
  ].join("\n"),
  rf: [
    "friction calibrate · phase 2/3 · Spatial",
    "  sensor:   RF & Wi-Fi reflections, no cameras",
    "  model:    dynamic probabilistic, volumetric difference mapping",
    "  watching: engaged vs fatigued posture",
    "  [████████████████████] done",
    "  mesh -> ~/.friction/local/phase2_rf_mesh_capture.ply (local only)",
  ].join("\n"),
  kinetic: [
    "friction calibrate · phase 3/3 · Kinetic & Acoustic",
    "  task:     stream-of-consciousness typing",
    "  capture:  keystroke topography",
    "  tuning:   40Hz desk vibration, magnetic key resistance",
    "  [████████████████████] done",
    "  topography -> ~/.friction/local/phase3_keystroke_topography.json (local only)",
  ].join("\n"),
};

function runFriction(args: string[]): string {
  const sub = args[0];
  if (sub === "calibrate") {
    const phaseIdx = args.indexOf("--phase");
    const phase = phaseIdx >= 0 ? args[phaseIdx + 1] : undefined;
    if (!phase) return [CALIBRATION.spem, CALIBRATION.rf, CALIBRATION.kinetic].join("\n\n");
    return CALIBRATION[phase] ?? `friction: unknown phase '${phase}' (expected spem, rf or kinetic)`;
  }
  if (sub === "status") {
    return [
      "storage:    local only (no network)",
      "kill switch: off",
      "thresholds: invisible > 0.90 focus · taper 0.50-0.70 · intercept > 0.95 fatigue",
      "snn:        simulated (leaky integrate-and-fire)",
    ].join("\n");
  }
  if (sub === "burn") {
    return [
      "Data Burn: hold for 3 seconds...",
      "  3... 2... 1...",
      "  removed ~/.friction/local/phase1_spem_baseline.csv",
      "  removed ~/.friction/local/phase2_rf_mesh_capture.ply",
      "  removed ~/.friction/local/phase3_keystroke_topography.json",
      "All biometric data dissolved. Nothing was ever uploaded.",
    ].join("\n");
  }
  return [
    "usage: friction <command>",
    "  calibrate [--phase spem|rf|kinetic]   run the three-phase calibration",
    "  status                                 thresholds, storage, kill switch",
    "  burn                                   weekly Data Burn",
  ].join("\n");
}

export function TerminalApp() {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { command: "", output: "Last login: Mon Mar  9 21:58:12 on ttys002\nType 'help' for available commands.\n" },
  ]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState("~");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [history]);

  const processCommand = (cmd: string) => {
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case "help":
        return [
          "Available commands:",
          "  ls          - list directory contents",
          "  cd <dir>    - change directory",
          "  cat <file>  - display file contents (try notes.md, mc-brain-dump.txt, captions.txt)",
          "  pwd         - print working directory",
          "  echo        - print text",
          "  date        - show current date",
          "  whoami      - display current user",
          "  git log     - recent commits",
          "  git status  - working tree status",
          "  npm run dev - start the Vite dev server",
          "  friction    - calibrate, status, burn",
          "  clear       - clear terminal",
          "  neofetch    - system info",
          "  history     - command history",
        ].join("\n");
      case "git":
        if (args[0] === "log") {
          return GIT_LOG.map(([hash, author, date, msg]) => `${hash}  ${date} 2026  ${author.padEnd(16)} ${msg}`).join("\n");
        }
        if (args[0] === "status") {
          return "On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean";
        }
        return args[0] ? `git: '${args[0]}' is not a git command. See 'git --help'.` : "usage: git <command> (try git log or git status)";
      case "npm":
        if (args[0] === "run" && args[1] === "dev") {
          return "\n> @figma/my-make-file@0.0.1 dev\n> vite\n\n  VITE v6.3.5  ready in 412 ms\n\n  ➜  Local:   http://localhost:5173/\n  ➜  Network: use --host to expose";
        }
        if (args[0] === "run" && args[1] === "build") {
          return "\n> @figma/my-make-file@0.0.1 build\n> vite build\n\nvite v6.3.5 building for production...\n✓ built in 4.81s";
        }
        return "Usage: npm run <dev|build>";
      case "friction":
        return runFriction(args);
      case "ls": {
        const dir = FILESYSTEM[cwd];
        return dir ? dir.join("  ") : "ls: cannot access: No such file or directory";
      }
      case "cd": {
        const target = args[0];
        if (!target || target === "~") { setCwd("~"); return ""; }
        if (target === "..") {
          const parent = cwd.split("/").slice(0, -1).join("/") || "~";
          setCwd(parent);
          return "";
        }
        const newPath = `${cwd}/${target.replace(/\/$/, "")}`;
        if (FILESYSTEM[newPath]) { setCwd(newPath); return ""; }
        return `cd: no such file or directory: ${target}`;
      }
      case "cat": {
        const file = args[0];
        if (!file) return "cat: missing file operand";
        const content = FILE_CONTENTS[file];
        return content || `cat: ${file}: No such file or directory`;
      }
      case "pwd":
        return cwd.replace("~", "/Users/operator");
      case "echo":
        return args.join(" ");
      case "date":
        return new Date().toString();
      case "whoami":
        return "operator";
      case "neofetch":
        return `  ╭──────────────────────╮
  │   FRICTION OS 2.1    │
  ╰──────────────────────╯
  OS:      Friction/macOS 15.2
  Host:    Friction workstation (contactless)
  Sensors: SPEM bezel · RF posture · Living Bits wrist rest
  Storage: local only
  Kernel:  friction-kernel 2.1.0
  Shell:   zsh 5.9
  CPU:     Focus Engine @ ${(Math.random() * 0.4 + 0.6).toFixed(2)} GHz
  Memory:  ${Math.floor(Math.random() * 4 + 12)}GB / 32GB
  Uptime:  ${Math.floor(Math.random() * 8)}h ${Math.floor(Math.random() * 60)}m`;
      case "history":
        return cmdHistory.map((c, i) => `  ${i + 1}  ${c}`).join("\n") || "No commands in history";
      case "clear":
        setHistory([]);
        return "__CLEAR__";
      default:
        return command ? `zsh: command not found: ${command}` : "";
    }
  };

  const handleSubmit = () => {
    if (!input.trim() && input === "") {
      setHistory(prev => [...prev, { command: "", output: "" }]);
      return;
    }
    const output = processCommand(input);
    if (output !== "__CLEAR__") {
      setHistory(prev => [...prev, { command: input, output }]);
    }
    if (input.trim()) {
      setCmdHistory(prev => [...prev, input]);
    }
    setInput("");
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIdx = historyIndex < cmdHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIdx);
        setInput(cmdHistory[cmdHistory.length - 1 - newIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIdx = historyIndex - 1;
        setHistoryIndex(newIdx);
        setInput(cmdHistory[cmdHistory.length - 1 - newIdx]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Simple tab completion for files in current directory
      const dir = FILESYSTEM[cwd];
      if (dir && input.startsWith("cat ") || input.startsWith("cd ")) {
        const partial = input.split(" ")[1] || "";
        const match = dir?.find(f => f.startsWith(partial));
        if (match) {
          setInput(`${input.split(" ")[0]} ${match}`);
        }
      }
    }
  };

  return (
    <div
      className="size-full flex flex-col font-mono"
      style={{ backgroundColor: "#1a1b26", color: "#a9b1d6" }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 text-sm" style={{ fontSize: "13px" }}>
        {history.map((entry, i) => (
          <div key={i} className="mb-1">
            {entry.command !== undefined && entry.command !== "" && (
              <div className="flex items-center gap-2">
                <span style={{ color: "#7aa2f7" }}>operator</span>
                <span style={{ color: "#565f89" }}>@</span>
                <span style={{ color: "#9ece6a" }}>friction</span>
                <span style={{ color: "#565f89" }}>{cwd.replace("~", "~")}</span>
                <span style={{ color: "#bb9af7" }}>❯</span>
                <span>{entry.command}</span>
              </div>
            )}
            {entry.output && (
              <pre className="whitespace-pre-wrap mt-0.5 ml-0" style={{ color: "#c0caf5", fontFamily: "inherit" }}>
                {entry.output}
              </pre>
            )}
          </div>
        ))}
        {/* Active Input Line */}
        <div className="flex items-center gap-2">
          <span style={{ color: "#7aa2f7" }}>operator</span>
          <span style={{ color: "#565f89" }}>@</span>
          <span style={{ color: "#9ece6a" }}>friction</span>
          <span style={{ color: "#565f89" }}>{cwd.replace("~", "~")}</span>
          <span style={{ color: "#bb9af7" }}>❯</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none"
            style={{ color: "#c0caf5", fontFamily: "inherit", fontSize: "inherit", caretColor: "#7aa2f7" }}
            autoFocus
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
