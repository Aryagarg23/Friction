/**
 * NOTES APP
 * 
 * Rich note-taking app with folder structure, markdown-style editing,
 * formatting toolbar, and multiple notes.
 */

import { useState } from "react";
import { FileText, FolderOpen, Plus, Bold, Italic, List, Trash2, Search, Pin, GripVertical } from "lucide-react";

import { NO_AUTOFILL } from "@/app/lib/noAutofill";
interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  pinned: boolean;
  lastEdited: string;
}

const INITIAL_NOTES: Note[] = [
  {
    id: "1",
    title: "FIGBUILD 2026 SELF-CHECK RUBRIC",
    content: `deadline: Mon March 9 @ 11:00 PM EST
judges: Meta, Microsoft, Spotify, Google

## MUST-HAVES
[x] The Target: audience + context
    -> people in long deep-work blocks. four audiences in Haley's note
[x] The Sense: a specific, previously unmeasurable sensory experience
    ("humans have 22–33 distinct senses")
    -> the felt edge of focus. flow vs the slide into burnout
[x] The Goal: wellness / behavior change
    -> protect flow, prevent burn out
[x] The Mechanics: 3 concrete use cases / stories
    -> Claudia, Perplexous, Charlie
[~] The Interface: data collection, visualization, sensory perception/enhancement
    collection -> SPEM bezel sensors, RF posture, Living Bits patches
    visualization -> Empathy Mirror / Depth of Field timeline
    enhancement -> magnetic keys, Peltier keycaps, 40Hz desk haptics
[~] The Safeguards: privacy, consent, misuse, information overload, emergency protocols
    privacy -> local only, SNN chip in the keyboard
    consent -> opt in ("protected brain observation")
    misuse -> physical kill switch, back to a dumb desk
    overload -> lies dormant until focus drops
    emergency protocols -> ??? we don't have one. either design one or say so on the slide (AG)

## JUDGING CRITERIA
1. Problem-Solution Fit
2. Innovation & Creativity
3. Design Execution & UX ("system hygiene")
4. Craft & Intentionality
5. Storytelling & Presentation

## Ready to submit?
poll is up in #general. No votes yet`,
    folder: "Work",
    pinned: true,
    lastEdited: "Mon 6:41 PM",
  },
  {
    id: "2",
    title: "audience research (who is this FOR)",
    content: `audience research!!! (haley)

1. PhD students / postdocs in computational fields
- ~100k globally
- "context recovery tax"
- live in Jupyter, LaTeX
- -> Perplexous

2. senior IC / staff+ engineers
- attention residue

3. freelance writers + creators
- ~2M
- "muse detector" (lowkey my fav framing)
- Substack, Upwork, Gumroad
- -> Claudia

4. solo trial lawyers
- ~150k in the US
- Clio communities
- "focus prosthetic"
- -> Charlie (rip Charlie GPT the COO)

whiteboard leftovers:
freelance creatives + influencers / grad student audience / poten. audience? nerds

idk which one leads the video. storytelling > numbers for these judges imo. They put a strong emphasis on storytelling so thinking about an idea super widely relatable/not overly futuristic?`,
    folder: "Research",
    pinned: true,
    lastEdited: "Mar 8",
  },
  {
    id: "3",
    title: "Reading: The Extended Mind (Clark & Chalmers)",
    content: `Andy Clark & David Chalmers, The Extended Mind

Claim: tools used seamlessly become part of the cognitive system.

Otto: has Alzheimer's, keeps addresses in a notebook. Compared with remembering the address from memory. If the notebook does the same job, they say it is part of his mind.

Criteria (all four):
- constantly accessible
- automatically trusted
- easily retrievable
- consciously endorsed at some point

Modern examples that pass: GPS, smartphone contacts, Google search, collaborative docs.

> Otto's Extended mind hypothesis. I dont necessarily agree with what the paper says here. I do understand that previous "extensions of the mind" were cold storage of information. But I diasgree with them insinuating that this is a boundray which should not be crossed. More to think here.

What this means for Friction:
- not cold storage. it observes you while you think. by their criteria it becomes part of the system once it's seamless
- "automatically trusted" is the dangerous one. a tool you trust without checking is the one that can extract
- so the safeguards are the product: local only, kill switch, Data Burn
- same question as Clay / Gyrus. protect the thinking or extract it

I need to read this part. takinng a cognitive pause
I also need to read The Algorithmic Funnel: and beyond`,
    folder: "Research",
    pinned: false,
    lastEdited: "Mar 8",
  },
  {
    id: "4",
    title: "Reading: neuromorphic chips + SNNs",
    content: `Neuromorphic chips: hardware that mimics neurons and synapses.

SNNs (spiking neural networks), the "third generation" of neural networks:
- communicate through discrete spikes
- information is in the timing and frequency of spikes
- a neuron only fires with enough input

Why it fits a keyboard:
- event-driven, not clock-based
- massively parallel
- ultra-low power
- real-time learning
-> it can run locally. cloud streams = latency + privacy issues

ANN vs SNN
| | ANN | SNN |
| signal | continuous values | binary spikes |
| computation | static | temporal dynamics |
| energy | high | ultra-low power |

Problems (put these on the slide too):
- limited tooling
- hard to train
- needs new algorithms

Players: Intel (Loihi), IBM (TrueNorth), BrainChip

we are not training one this weekend. prototype simulates the signals, the chip is concept. if a judge asks "what does the SNN actually run" we need a straight answer. open.`,
    folder: "Research",
    pinned: false,
    lastEdited: "Mar 8",
  },
  {
    id: "5",
    title: "flow sources (for the science slide)",
    content: `sources!! (haley) arya wants the actual papers not just summaries, noted

- Frontiers: "The Neuroscience of the Flow State: Involvement of the Locus Coeruleus Norepinephrine System"
  "Flow is a state of full task engagement that is accompanied with low-levels..."
  tonic vs phasic norepinephrine!!! two modes
- Penn Medicine: "Neuroscientists identify brain mechanism that drives focus"
  key neurons in the front of the brain act as "traffic controllers" <- PITCH LINE
- Frontiers: "The impacts of mind-wandering on flow"
- ScienceDirect: task redirection paper (refocusing = half our product)

pitch lines:
"We need to... Enable the flow state through... Physical and Digital means"
it senses: chemicals in the brain related to the flow state
it tracks: focus level you have while completing a goal
it helps you: stay deeply focused by focusing your attention through task to-do lists and helps you refocus through summaries of your work that decrease the friction of refocusing
"uses haptic responses which prevents burn out which decreases working time which improves work life balance"`,
    folder: "Research",
    pinned: false,
    lastEdited: "Mar 7",
  },
  {
    id: "6",
    title: "Mc storyboard",
    content: `Mc storyboard:
intro —> just gradient movement
gradient to color zoom
pop up keyboard, pop up UX/UI over gradient bg
login and begin work
increase of stress + loss of focus, toggles moving
keyboard + UX/UI blur, security lock pops up
timer counting down from 37 secs
20 secs?? (short cut)
Text on page: Friction --> "insert tagline here"

text reveals:
"Breathe in, breathe out. notice where your attention lies right now."
"the elusive, rewarding 'flow state' greets us and departs with ease"
"the balance between deep work and burn out has kept motivated individuals on their toes for ages"
final —> "friction is paving the way for people to own their focus and turn it into a tool they can bend to their will"

captions:
"the product lies dormant until the level of focus has reached unproductive levels. it's time for friction to step in."
"but it never feels like a punishment, each activity is built to bring a sense of calm and self care."
"perfection is not the goal"
"the work needs to get done regardless. friction is the guiding hand to get work done faster, with more intention"

look:
ink on paper —> review screen
gradient —> intro
both?
tagline???`,
    folder: "Work",
    pinned: false,
    lastEdited: "Mon 1:38 PM",
  },
  {
    id: "7",
    title: "user journey + microcopy",
    content: `## SET-UP
- agrees to sensor analysis
- connects app
- picks work type + length
- lists tasks
- starts timer

## USE
- works in focus
- distraction notifications
- refocusing
- keyboard pressure
- break prompted by keyboard + app
- brief refocus exercise

## REVIEW
- reads flow levels
- adds a small note

## microcopy drafts
"Right back to the flow- you've got this."
"We've paused here...let pick back up, together."
"This one's tough right now. Try [next task]."
"You're doing great. [Next task] might flow more."

## labels
refocus sprint / motivational guidance / visual recentering / physical reconnection / flow reflection / mental fatigue / immersive soundscape / reframing tasks / confidence in capabilities / more fulfilling work

(AG) "let pick back up" is a typo or on purpose? leaving it until Miami says`,
    folder: "Work",
    pinned: false,
    lastEdited: "Mar 8",
  },
  {
    id: "8",
    title: "calibration + hardware",
    content: `"Two hours into deep work, cognitive walls hit. Eyes drift, breathing shallows, cortisol spikes."

no wearables. the workstation is a contactless monitor.

## three-phase calibration
1. Visual: SPEM (smooth pursuit eye movements) from the bezel sensors. screen starts in a deliberate Gaussian blur, goes crisp as you track.
2. Spatial: RF volumetric mesh, shown as a wireframe. no cameras.
3. Kinetic & Acoustic: stream-of-consciousness typing for keystroke topography, 40Hz, magnetic resistance check.

## sensing
- bezel sensors: SPEM micro-stutters, gaze drift
- RF & Wi-Fi posture: dynamic probabilistic models on signal reflections. engaged vs fatigued posture, volumetric difference mapping
- "Living Bits" microbial patches in the wrist rest: cortisol + adrenaline in sweat
- local SNN chip in the keyboard

## feedback
- magnetic switches raise actuation force: "keys become heavier during high arousal to prevent frantic typing"
- Peltier coolers in keycaps: cooling pulses for grounding, heat as a burnout warning
- acoustic haptics: sub-perceptual binaural beats through desk vibration, 40Hz tuning

## trigger canvas (set theory)
drag "High SPEM micro-stutters" to intersect "Slumped Posture" -> link to "Budget Friction" (haptic pulses or magnetic key lockout)

## review: Empathy Mirror / Aperture / Depth of Field
morning deep work in razor-sharp focus, afternoon burnout as heavy Gaussian blur. analog annotation on paper texture.

## safeguards
- physical kill switch -> "dumb" desk
- weekly Data Burn: three-second haptic hold dissolves all biometric data
- "friction users opt into protected brain observation with all data stored locally to the physical product"
- prototype note: none of this hardware exists in the demo, signals are simulated`,
    folder: "Work",
    pinned: false,
    lastEdited: "Mar 8",
  },
  {
    id: "9",
    title: "archetypes",
    content: `| archetype | name | age | role |
| Productivitymaxxer | Claudia | 43 | Freelancer |
| "Burnout"phobic | Perplexous | 26 | PhD Student |
| Life-Balance Royalty | Charlie GPT | 37 | COO |

demo: Charlie is a solo lawyer now (matches audience #4)
Claudia -> freelance writers/creators
Perplexous -> PhD/postdocs, "context recovery tax"`,
    folder: "Work",
    pinned: false,
    lastEdited: "Mar 8",
  },
  {
    id: "10",
    title: "HALEY'S FREAKOFF CORNER!!!!",
    content: `HALEY'S FREAKOFF CORNER!!!!

- Nerd alert: in Dune the Bene Gesserit had such a deep control over their bodies they could control things like their metabolism speed/sleep. it also comes with a FIRE aesthetic
- metrics i wish existed: when people are bullshitting (different than lying) / "it took you half as long to cut those vegetables" / "your body was tired and you listened and didn't over exert yourself on your run"
- Garmin x Meta ad: "hey meta how many calories have I burned?" personally just PMO (even though research says smartwatches can't accurately track calories)
- I keep coming back to the idea of unwarranted health anxiety ... idk just word vomit
- "Hello, MacBook Neo" + adidas Originals "Superstar": both these ads are both just fire. universal human experience + brand identity`,
    folder: "Drafts",
    pinned: false,
    lastEdited: "Mar 7",
  },
];

const FOLDERS = ["All Notes", "Work", "Research", "Drafts"];

export function NotesApp() {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [selectedNote, setSelectedNote] = useState<Note>(INITIAL_NOTES[0]);
  const [selectedFolder, setSelectedFolder] = useState("All Notes");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = notes
    .filter(n => selectedFolder === "All Notes" || n.folder === selectedFolder)
    .filter(n => searchQuery === "" || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      folder: selectedFolder === "All Notes" ? "Work" : selectedFolder,
      pinned: false,
      lastEdited: "Just now",
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNote(newNote);
  };

  const updateNote = (field: "title" | "content", value: string) => {
    const updated = { ...selectedNote, [field]: value, lastEdited: "Just now" };
    setSelectedNote(updated);
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
  };

  const togglePin = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
    if (selectedNote.id === id) setSelectedNote(prev => ({ ...prev, pinned: !prev.pinned }));
  };

  const deleteNote = (id: string) => {
    const remaining = notes.filter(n => n.id !== id);
    setNotes(remaining);
    if (selectedNote.id === id && remaining.length > 0) setSelectedNote(remaining[0]);
  };

  const insertFormatting = (prefix: string, suffix?: string) => {
    updateNote("content", selectedNote.content + prefix + (suffix || ""));
  };

  return (
    <div className="size-full flex" style={{ backgroundColor: "#fefefe" }}>
      {/* Folder Sidebar */}
      <div className="w-44 flex flex-col border-r" style={{ borderColor: "#e5e5e5", backgroundColor: "#f5f5f5" }}>
        <div className="p-3">
          <div className="text-xs uppercase mb-2" style={{ color: "#999", letterSpacing: "0.05em" }}>Folders</div>
          {FOLDERS.map(folder => (
            <button
              key={folder}
              onClick={() => setSelectedFolder(folder)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left cursor-pointer mb-0.5"
              style={{
                backgroundColor: selectedFolder === folder ? "#e8e8e8" : "transparent",
                color: selectedFolder === folder ? "#000" : "#666",
              }}
            >
              <FolderOpen size={14} />
              {folder}
            </button>
          ))}
        </div>
        <div className="mt-auto p-3 border-t" style={{ borderColor: "#e5e5e5" }}>
          <div className="text-xs" style={{ color: "#999" }}>{notes.length} notes</div>
        </div>
      </div>

      {/* Note List */}
      <div className="w-64 flex flex-col border-r" style={{ borderColor: "#e5e5e5" }}>
        <div className="p-3 flex items-center gap-2 border-b" style={{ borderColor: "#e5e5e5" }}>
          <div className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded" style={{ backgroundColor: "#f0f0f0" }}>
            <Search size={14} style={{ color: "#999" }} />
            <input {...NO_AUTOFILL}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="flex-1 bg-transparent border-none outline-none text-xs"
              style={{ color: "#333" }}
            />
          </div>
          <button onClick={addNote} className="p-1.5 rounded cursor-pointer hover:bg-gray-100">
            <Plus size={16} style={{ color: "#666" }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", note.title);
                e.dataTransfer.effectAllowed = "copy";
              }}
              className="p-3 border-b cursor-pointer group"
              style={{
                borderColor: "#eee",
                backgroundColor: selectedNote.id === note.id ? "#fff8e1" : "transparent",
              }}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-1">
                  <GripVertical size={10} className="opacity-0 group-hover:opacity-40 shrink-0 transition-opacity" style={{ color: "#999", cursor: "grab" }} />
                  {note.pinned && <Pin size={10} style={{ color: "#ffa726" }} />}
                  <span className="text-sm" style={{ color: "#202124" }}>{note.title}</span>
                </div>
              </div>
              <div className="text-xs line-clamp-2 mb-1" style={{ color: "#888" }}>
                {note.content.replace(/[#*\[\]]/g, "").slice(0, 80)}
              </div>
              <div className="text-xs" style={{ color: "#bbb" }}>{note.lastEdited}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-4 py-2 border-b" style={{ borderColor: "#e5e5e5" }}>
          <button onClick={() => insertFormatting("**", "**")} className="p-1.5 rounded cursor-pointer hover:bg-gray-100">
            <Bold size={14} style={{ color: "#666" }} />
          </button>
          <button onClick={() => insertFormatting("_", "_")} className="p-1.5 rounded cursor-pointer hover:bg-gray-100">
            <Italic size={14} style={{ color: "#666" }} />
          </button>
          <button onClick={() => insertFormatting("\n- ")} className="p-1.5 rounded cursor-pointer hover:bg-gray-100">
            <List size={14} style={{ color: "#666" }} />
          </button>
          <div className="flex-1" />
          <button onClick={() => togglePin(selectedNote.id)} className="p-1.5 rounded cursor-pointer hover:bg-gray-100">
            <Pin size={14} style={{ color: selectedNote.pinned ? "#ffa726" : "#999" }} />
          </button>
          <button onClick={() => deleteNote(selectedNote.id)} className="p-1.5 rounded cursor-pointer hover:bg-gray-100">
            <Trash2 size={14} style={{ color: "#cc4444" }} />
          </button>
        </div>

        {/* Title */}
        <div className="px-6 pt-4">
          <input {...NO_AUTOFILL}
            type="text"
            value={selectedNote.title}
            onChange={(e) => updateNote("title", e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xl"
            style={{ color: "#202124" }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-3">
          <textarea {...NO_AUTOFILL}
            value={selectedNote.content}
            onChange={(e) => updateNote("content", e.target.value)}
            className="w-full h-full resize-none bg-transparent border-none outline-none text-sm"
            style={{ color: "#333", lineHeight: "1.7" }}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}