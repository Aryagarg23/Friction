/**
 * CHROME APP
 *
 * Full-featured Chrome simulation with tabs, bookmarks bar,
 * realistic page content, working navigation, and dev tools toggle.
 *
 * The open tabs are the team's actual Fig Build 2026 reading: the flow-state
 * neuroscience, the Extended Mind paper, the neuromorphic chip reading, the
 * rubric, the product doc, and the ads Haley called fire.
 */

import { useState } from "react";
import {
  ArrowLeft, ArrowRight, RotateCw, Search, Star, Plus, X,
  Lock, ChevronDown, Bookmark,
} from "lucide-react";

// ── Page data ──────────────────────────────────────
interface Page {
  url: string;
  title: string;
  favicon: string;
  content: React.ReactNode;
}

// ── Google Doc: the product doc, with comments in each person's voice ──
interface DocComment {
  author: string;
  color: string;
  anchor: string;
  text: string;
  replies?: { author: string; color: string; text: string }[];
}

const HALEY = "#e91e63";
const MIAMI = "#7c4dff";
const ARYA = "#00897b";

const DOC_COMMENTS: DocComment[] = [
  {
    author: "Arya Garg", color: ARYA,
    anchor: "it senses: chemicals in the brain related to the flow state",
    text: "This line is doing a lot of work. The wrist rest patches read cortisol and adrenaline in sweat, not chemicals in the brain. The Frontiers paper is about tonic vs phasic norepinephrine and we do not measure that directly. Can we say what we actually sense? More to think here.",
    replies: [
      { author: "Haley Potter", color: HALEY, text: "fair fair!! but they put a strong emphasis on storytelling so thinking super widely relatable/not overly futuristic? maybe \"signals related to\" instead of \"chemicals in\"" },
      { author: "Arya Garg", color: ARYA, text: "\"signals related to\" works. Keeping the paper as the source for why, not as a claim about the sensor." },
    ],
  },
  {
    author: "Haley Potter", color: HALEY,
    anchor: "The Target",
    text: "ok PhD students/postdocs vs solo trial lawyers?? the \"context recovery tax\" thing is SO real for phds (Jupyter, LaTeX) but lawyers are like ~150k in the US and Clio communities are right there. \"focus prosthetic\" goes hard. idk just word vomit",
  },
  {
    author: "Miami Celentana", color: MIAMI,
    anchor: "Charlie GPT, Age 37, COO",
    text: "charlie —> solo lawyer now? matches the demo persona\nCOO doesn't show up anywhere else??",
    replies: [
      { author: "Haley Potter", color: HALEY, text: "YES do it, the deck archetype can stay Life-Balance Royalty" },
    ],
  },
  {
    author: "Arya Garg", color: ARYA,
    anchor: "Data Burn",
    text: "Data Burn has to actually delete, not hide. If everything is local to the physical product there is no cloud copy to forget, which is the whole point. Same question Clay/Gyrus had: does the tool protect the thinking or extract it.",
  },
  {
    author: "Miami Celentana", color: MIAMI,
    anchor: "Review: reads flow levels",
    text: "review screen —> depth of field timeline?\nmorning sharp —> afternoon heavy blur\nink on paper or gradient??",
  },
];

function DocsPage() {
  const section = (title: string) => (
    <h2 className="text-lg mt-6 mb-2" style={{ color: "#1f2937" }}>{title}</h2>
  );
  const p = (text: string) => (
    <p className="text-sm mb-2" style={{ color: "#374151", lineHeight: 1.6 }}>{text}</p>
  );
  const hl = (text: string, color: string) => (
    <span style={{ backgroundColor: `${color}22`, borderBottom: `2px solid ${color}` }}>{text}</span>
  );

  return (
    <div className="flex" style={{ backgroundColor: "#f8f9fa", minHeight: "100%" }}>
      <div className="flex-1 py-6 px-4">
        <div className="mx-auto p-10 shadow-sm" style={{ maxWidth: "720px", backgroundColor: "#ffffff" }}>
          <div className="mb-6 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <span className="text-xs uppercase px-2 py-1 rounded" style={{ backgroundColor: "#fce4ec", color: "#ad1457" }}>
              Fig Build 2026 · v4
            </span>
            <h1 className="text-2xl mt-3" style={{ color: "#1f2937" }}>Friction: product doc v4</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Last edit was made by Haley Potter · Mar 8</p>
          </div>

          {section("The pitch")}
          {p("We need to... Enable the flow state through... Physical and Digital means.")}
          <ul className="text-sm mb-2 space-y-1 list-disc pl-5" style={{ color: "#374151" }}>
            <li>{hl("it senses: chemicals in the brain related to the flow state", ARYA)}</li>
            <li>it tracks: focus level you have while completing a goal</li>
            <li>it helps you: stay deeply focused by focusing your attention through task to-do lists and helps you refocus through summaries of your work that decrease the friction of refocusing</li>
            <li>uses haptic responses which prevents burn out which decreases working time which improves work life balance</li>
          </ul>
          {p("Two hours into deep work, cognitive walls hit. Eyes drift, breathing shallows, cortisol spikes.")}

          {section("Rubric must-haves")}
          <ul className="text-sm mb-2 space-y-1 list-disc pl-5" style={{ color: "#374151" }}>
            <li>{hl("The Target", HALEY)}: audience + context</li>
            <li>The Sense: a specific, previously unmeasurable sensory experience (humans have 22–33 distinct senses)</li>
            <li>The Goal: a wellness/behavior change</li>
            <li>The Mechanics: 3 concrete use cases/stories</li>
            <li>The Interface: data collection, visualization, sensory perception/enhancement</li>
            <li>The Safeguards: privacy, consent, misuse, information overload, emergency protocols</li>
          </ul>

          {section("Audiences (Haley's research)")}
          <ul className="text-sm mb-2 space-y-1 list-disc pl-5" style={{ color: "#374151" }}>
            <li>PhD students/postdocs in computational fields: ~100k globally, &quot;context recovery tax&quot;, Jupyter, LaTeX</li>
            <li>Senior IC / staff+ engineers: attention residue</li>
            <li>Freelance writers and creators: ~2M, &quot;muse detector&quot;, Substack, Upwork, Gumroad</li>
            <li>Solo trial lawyers: ~150k in the US, Clio communities, &quot;focus prosthetic&quot;</li>
          </ul>

          {section("Archetypes (from the deck)")}
          <table className="text-sm w-full mb-2" style={{ color: "#374151", borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["Productivitymaxxer", "Claudia, Age 43, Freelancer"],
                ["\"Burnout\"phobic", "Perplexous, Age 26, PhD Student"],
                ["Life-Balance Royalty", "Charlie GPT, Age 37, COO"],
              ].map(([type, who]) => (
                <tr key={type} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td className="py-1.5 pr-4">{type}</td>
                  <td className="py-1.5">{who === "Charlie GPT, Age 37, COO" ? hl(who, MIAMI) : who}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {section("User journey")}
          {p("Set-up: agrees to sensor analysis, connects app, picks work type and length, lists tasks, starts timer.")}
          {p("Use: works in focus; distraction notifications; refocusing; keyboard pressure; break prompted by keyboard + app; brief refocus exercise.")}
          <p className="text-sm mb-2" style={{ color: "#374151", lineHeight: 1.6 }}>
            {hl("Review: reads flow levels", MIAMI)}, adds a small note.
          </p>

          {section("Safeguards")}
          <p className="text-sm mb-2" style={{ color: "#374151", lineHeight: 1.6 }}>
            friction users opt into protected brain observation with all data stored locally to the physical product. Physical kill switch returns the setup to a &quot;dumb&quot; desk. Weekly {hl("Data Burn", ARYA)}: a three-second haptic hold dissolves all biometric data.
          </p>

          {section("HALEY'S FREAKOFF CORNER!!!!")}
          {p("Nerd alert: in Dune the Bene Gesserit had such a deep control over their bodies they could control things like their metabolism speed/sleep... it also comes with a FIRE aesthetic")}
          {p("things I wish could be sensed: when people are bullshitting (different than lying), \"it took you half as long to cut those vegetables\", \"your body was tired and you listened and didn't over exert yourself on your run\"")}
        </div>
      </div>

      {/* Comments rail */}
      <div className="shrink-0 py-6 pr-4 space-y-3" style={{ width: "280px" }}>
        {DOC_COMMENTS.map((c, i) => (
          <div key={i} className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white" style={{ backgroundColor: c.color }}>
                {c.author[0]}
              </div>
              <span className="text-xs" style={{ color: "#202124", fontWeight: 500 }}>{c.author}</span>
            </div>
            <div className="text-xs mb-1 truncate" style={{ color: "#80868b" }}>&ldquo;{c.anchor}&rdquo;</div>
            <p className="text-xs whitespace-pre-line" style={{ color: "#3c4043" }}>{c.text}</p>
            {c.replies?.map((r, j) => (
              <div key={j} className="mt-2 pt-2" style={{ borderTop: "1px solid #f1f3f4" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: r.color, fontSize: "10px" }}>
                    {r.author[0]}
                  </div>
                  <span className="text-xs" style={{ color: "#202124", fontWeight: 500 }}>{r.author}</span>
                </div>
                <p className="text-xs whitespace-pre-line" style={{ color: "#3c4043" }}>{r.text}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FigJam: the self-check rubric ──────────────────
function RubricPage() {
  const musts = [
    ["The Target", "audience + context"],
    ["The Sense", "a specific, previously unmeasurable sensory experience. Humans have 22–33 distinct senses."],
    ["The Goal", "a wellness/behavior change"],
    ["The Mechanics", "3 concrete use cases/stories"],
    ["The Interface", "data collection, visualization, sensory perception/enhancement"],
    ["The Safeguards", "privacy, consent, misuse, information overload, emergency protocols"],
  ];
  const criteria = [
    "Problem-Solution Fit",
    "Innovation & Creativity",
    "Design Execution & UX (\"system hygiene\")",
    "Craft & Intentionality",
    "Storytelling & Presentation",
  ];
  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100%", padding: "32px", backgroundImage: "radial-gradient(#d4d4d4 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
      <div className="mx-auto" style={{ maxWidth: "860px" }}>
        <h1 className="text-2xl mb-1" style={{ color: "#1e1e1e", fontWeight: 700, letterSpacing: "0.02em" }}>FIGBUILD 2026 SELF-CHECK RUBRIC</h1>
        <p className="text-sm mb-6" style={{ color: "#6b6b6b" }}>Deadline: Monday, March 9th @ 11:00 PM EST · Judges from Meta, Microsoft, Spotify, and Google</p>

        <div className="text-xs uppercase mb-2" style={{ color: "#6b6b6b", letterSpacing: "0.08em" }}>Must-haves</div>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {musts.map(([name, desc]) => (
            <div key={name} className="p-4 rounded shadow-sm" style={{ backgroundColor: "#fff9c4" }}>
              <div className="text-sm mb-1" style={{ color: "#1e1e1e", fontWeight: 600 }}>{name}</div>
              <div className="text-xs" style={{ color: "#3d3d3d" }}>{desc}</div>
            </div>
          ))}
        </div>

        <div className="text-xs uppercase mb-2" style={{ color: "#6b6b6b", letterSpacing: "0.08em" }}>Judging criteria</div>
        <div className="flex flex-wrap gap-3 mb-8">
          {criteria.map(c => (
            <div key={c} className="px-4 py-3 rounded shadow-sm text-sm" style={{ backgroundColor: "#c8e6c9", color: "#1e1e1e" }}>{c}</div>
          ))}
        </div>

        <div className="inline-block p-4 rounded-lg shadow" style={{ backgroundColor: "#ffffff", minWidth: "260px" }}>
          <div className="text-sm mb-3" style={{ color: "#1e1e1e", fontWeight: 600 }}>Ready to submit?</div>
          {["Yes", "Not yet"].map(opt => (
            <div key={opt} className="flex items-center gap-2 mb-2 px-3 py-2 rounded border text-sm" style={{ borderColor: "#e0e0e0", color: "#3d3d3d" }}>
              <span className="w-3 h-3 rounded-full border" style={{ borderColor: "#9e9e9e" }} /> {opt}
            </div>
          ))}
          <div className="text-xs mt-1" style={{ color: "#9e9e9e" }}>No votes yet</div>
        </div>
      </div>
    </div>
  );
}

// ── Article pages (real sources; only the lines the team pulled) ──
function ArticleShell({ publisher, color, kicker, title, children }: {
  publisher: string; color: string; kicker: string; title: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-8 py-3 flex items-center gap-3" style={{ backgroundColor: color }}>
        <span className="text-white text-lg" style={{ fontWeight: 700 }}>{publisher}</span>
      </div>
      <div className="mx-auto px-6 py-8" style={{ maxWidth: "760px" }}>
        <div className="text-xs uppercase mb-2" style={{ color, letterSpacing: "0.06em" }}>{kicker}</div>
        <h1 className="text-2xl mb-6" style={{ color: "#1f2937", lineHeight: 1.3 }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return <mark style={{ backgroundColor: "#fff59d", padding: "0 2px" }}>{children}</mark>;
}

function FrontiersLCNEPage() {
  return (
    <ArticleShell publisher="frontiers" color="#d6002a" kicker="Article" title="The Neuroscience of the Flow State: Involvement of the Locus Coeruleus Norepinephrine System">
      <h2 className="text-base mb-2" style={{ color: "#1f2937" }}>Abstract</h2>
      <p className="text-sm mb-6" style={{ color: "#374151", lineHeight: 1.7 }}>
        <Highlight>Flow is a state of full task engagement that is accompanied with low-levels</Highlight> …
      </p>
      <h2 className="text-base mb-2" style={{ color: "#1f2937" }}>Tonic and phasic norepinephrine</h2>
      <p className="text-sm" style={{ color: "#6b7280" }}>Section bookmarked · 2 highlights</p>
    </ArticleShell>
  );
}

function PennMedicinePage() {
  return (
    <ArticleShell publisher="Penn Medicine News" color="#011f5b" kicker="News" title="Neuroscientists identify brain mechanism that drives focus">
      <p className="text-sm" style={{ color: "#374151", lineHeight: 1.7 }}>
        … <Highlight>key neurons in the front of the brain act as &lsquo;traffic controllers&rsquo;</Highlight> …
      </p>
    </ArticleShell>
  );
}

function FrontiersMindWanderingPage() {
  return (
    <ArticleShell publisher="frontiers" color="#d6002a" kicker="Article" title="The impacts of mind-wandering on flow">
      <p className="text-sm" style={{ color: "#6b7280" }}>Opened from the research dump · not highlighted yet</p>
    </ArticleShell>
  );
}

// ── PDF viewer: Clark & Chalmers, with Arya's margin annotations ──
function ExtendedMindPage() {
  const notes = [
    "Otto's Extended mind hypothesis. I dont necessarily agree with what the paper says here. I do understand that previous 'extensions of the mind' were cold storage of information. But I diasgree with them insinuating that this is a boundray which should not be crossed. More to think here.",
    "I need to read this part. takinng a cognitive pause",
    "I also need to read The Algorithmic Funnel: and beyond",
  ];
  return (
    <div className="flex justify-center gap-4 py-6" style={{ backgroundColor: "#525659", minHeight: "100%" }}>
      <div className="p-12 shadow-lg" style={{ width: "560px", backgroundColor: "#ffffff", fontFamily: "Times New Roman, serif" }}>
        <h1 className="text-xl text-center mb-1" style={{ color: "#111" }}>The Extended Mind</h1>
        <p className="text-sm text-center mb-8" style={{ color: "#333" }}>Andy Clark and David Chalmers</p>
        <p className="text-sm mb-4" style={{ color: "#222", lineHeight: 1.7 }}>
          <Highlight>Otto suffers from Alzheimer&apos;s disease</Highlight> and carries a notebook. When he wants to go somewhere, he looks the address up in the notebook instead of remembering it from memory.
        </p>
        <p className="text-sm mb-2" style={{ color: "#222", lineHeight: 1.7 }}>For the notebook to count as part of the cognitive system it has to be:</p>
        <ul className="text-sm list-disc pl-6 space-y-1" style={{ color: "#222" }}>
          <li>constantly accessible</li>
          <li>automatically trusted</li>
          <li>easily retrievable</li>
          <li>consciously endorsed at some point</li>
        </ul>
      </div>
      <div className="space-y-3" style={{ width: "220px" }}>
        {notes.map((n, i) => (
          <div key={i} className="p-3 rounded text-xs shadow" style={{ backgroundColor: "#fff9c4", color: "#3e2723" }}>
            <div className="mb-1" style={{ fontWeight: 600 }}>Arya Garg</div>
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Google search: neuromorphic reading ──
function NeuromorphicSearchPage() {
  const results = [
    { site: "intel.com", title: "Intel Loihi: neuromorphic research chip", snippet: "Chips that mimic neurons and synapses. Event-driven, not clock-based." },
    { site: "research.ibm.com", title: "IBM TrueNorth", snippet: "Massively parallel, ultra-low power neuromorphic architecture." },
    { site: "brainchip.com", title: "BrainChip: neuromorphic AI", snippet: "Spiking neural networks with real-time learning at the edge." },
    { site: "Reading notes", title: "Spiking neural networks: the \"third generation\" of neural networks", snippet: "Communicate through discrete spikes. Info is in the timing and frequency of spikes. A neuron only fires with enough input." },
    { site: "Reading notes", title: "ANN vs SNN", snippet: "Continuous values vs binary spikes · static computation vs temporal dynamics · high energy vs ultra-low power. Challenges: limited tooling, hard to train, need new algorithms." },
  ];
  return (
    <div className="px-8 py-5">
      <div className="flex items-center gap-6 mb-6">
        <span className="text-2xl" style={{ fontWeight: 500 }}>
          <span style={{ color: "#4285f4" }}>G</span><span style={{ color: "#ea4335" }}>o</span><span style={{ color: "#fbbc05" }}>o</span><span style={{ color: "#4285f4" }}>g</span><span style={{ color: "#34a853" }}>l</span><span style={{ color: "#ea4335" }}>e</span>
        </span>
        <div className="flex-1 px-4 py-2 rounded-full border text-sm" style={{ borderColor: "#dfe1e5", color: "#202124", maxWidth: "560px" }}>
          spiking neural network neuromorphic chip local inference keyboard
        </div>
      </div>
      <div className="space-y-6" style={{ maxWidth: "640px" }}>
        {results.map(r => (
          <div key={r.title}>
            <div className="text-xs" style={{ color: "#4d5156" }}>{r.site}</div>
            <a className="text-lg cursor-pointer hover:underline" style={{ color: "#1a0dab" }}>{r.title}</a>
            <p className="text-sm" style={{ color: "#4d5156" }}>{r.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── YouTube: the ads Haley called fire ──
function YouTubePage() {
  return (
    <div className="flex gap-6 p-6" style={{ backgroundColor: "#0f0f0f", minHeight: "100%" }}>
      <div className="flex-1">
        <div className="w-full rounded-xl flex items-center justify-center" style={{ aspectRatio: "16 / 9", background: "linear-gradient(135deg, #1d1d1f, #3a3a3c)" }}>
          <span className="text-3xl" style={{ color: "#f5f5f7", fontWeight: 600 }}>Hello, MacBook Neo</span>
        </div>
        <h1 className="text-lg mt-3" style={{ color: "#f1f1f1" }}>Hello, MacBook Neo</h1>
        <p className="text-sm mt-1" style={{ color: "#aaaaaa" }}>Apple</p>
        <div className="mt-4 p-3 rounded-lg text-sm" style={{ backgroundColor: "#272727", color: "#f1f1f1" }}>
          Haley Potter: &quot;Both these ads are both just fire&quot;
        </div>
      </div>
      <div className="shrink-0" style={{ width: "260px" }}>
        <div className="text-sm mb-3" style={{ color: "#f1f1f1" }}>Up next</div>
        <div className="flex gap-2">
          <div className="shrink-0 rounded-lg" style={{ width: "120px", aspectRatio: "16 / 9", background: "linear-gradient(135deg, #000, #444)" }} />
          <div>
            <div className="text-sm" style={{ color: "#f1f1f1" }}>Superstar</div>
            <div className="text-xs" style={{ color: "#aaaaaa" }}>adidas Originals</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pinterest: Miami's moodboard ──
function PinterestPage() {
  const pins = [
    { label: "ink on paper", h: 220, bg: "repeating-linear-gradient(0deg, #f4efe6, #f4efe6 3px, #ece5d8 3px, #ece5d8 4px)" },
    { label: "gradient movement", h: 160, bg: "linear-gradient(160deg, #ff8a65, #7c4dff, #00bcd4)" },
    { label: "gaussian blur —> crisp", h: 200, bg: "radial-gradient(circle, #ffffff 0%, #b0bec5 60%, #78909c 100%)" },
    { label: "wireframe mesh??", h: 180, bg: "repeating-linear-gradient(45deg, #111, #111 10px, #2a2a2a 10px, #2a2a2a 11px)" },
    { label: "dune bene gesserit (haley's)", h: 240, bg: "linear-gradient(180deg, #d7a86e, #8d5524)" },
    { label: "keycaps —> heavy?", h: 150, bg: "linear-gradient(180deg, #e0e0e0, #9e9e9e)" },
    { label: "paper texture annotation", h: 200, bg: "#efe9dd" },
    { label: "depth of field", h: 170, bg: "linear-gradient(90deg, #263238, #90a4ae)" },
  ];
  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl text-center mb-1" style={{ color: "#111111", fontWeight: 600 }}>friction —&gt; ink on paper vs gradient??</h1>
      <p className="text-sm text-center mb-6" style={{ color: "#767676" }}>Miami Celentana · Haley Potter</p>
      <div style={{ columnCount: 4, columnGap: "12px" }}>
        {pins.map(pin => (
          <div key={pin.label} className="mb-3" style={{ breakInside: "avoid" }}>
            <div className="rounded-2xl" style={{ height: `${pin.h}px`, background: pin.bg }} />
            <div className="text-xs mt-1 px-1" style={{ color: "#111111" }}>{pin.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PAGES: Page[] = [
  {
    url: "docs.google.com/document/d/friction-product-doc-v4",
    title: "Friction: product doc v4 - Google Docs",
    favicon: "📄",
    content: <DocsPage />,
  },
  {
    url: "figma.com/board/figbuild-2026-self-check-rubric",
    title: "FIGBUILD 2026 SELF-CHECK RUBRIC – FigJam",
    favicon: "🟣",
    content: <RubricPage />,
  },
  {
    url: "frontiersin.org/articles/neuroscience-of-the-flow-state-lc-ne",
    title: "The Neuroscience of the Flow State: Involvement of the Locus Coeruleus Norepinephrine System",
    favicon: "🔴",
    content: <FrontiersLCNEPage />,
  },
  {
    url: "pennmedicine.org/news/brain-mechanism-that-drives-focus",
    title: "Neuroscientists identify brain mechanism that drives focus | Penn Medicine",
    favicon: "🔵",
    content: <PennMedicinePage />,
  },
  {
    url: "frontiersin.org/articles/impacts-of-mind-wandering-on-flow",
    title: "The impacts of mind-wandering on flow",
    favicon: "🔴",
    content: <FrontiersMindWanderingPage />,
  },
  {
    url: "drive.google.com/file/clark-chalmers-the-extended-mind.pdf",
    title: "Clark & Chalmers - The Extended Mind.pdf",
    favicon: "📕",
    content: <ExtendedMindPage />,
  },
  {
    url: "google.com/search?q=spiking+neural+network+neuromorphic+chip",
    title: "spiking neural network neuromorphic chip - Google Search",
    favicon: "🔍",
    content: <NeuromorphicSearchPage />,
  },
  {
    url: "youtube.com/watch?v=hello-macbook-neo",
    title: "Hello, MacBook Neo - YouTube",
    favicon: "▶️",
    content: <YouTubePage />,
  },
  {
    url: "pinterest.com/miamicelentana/friction-ink-on-paper-vs-gradient",
    title: "friction —> ink on paper vs gradient?? - Pinterest",
    favicon: "📌",
    content: <PinterestPage />,
  },
];

const BOOKMARKS = [
  { name: "Product doc v4", url: "docs.google.com/document/d/friction-product-doc-v4" },
  { name: "Fig Build rubric", url: "figma.com/board/figbuild-2026-self-check-rubric" },
  { name: "Extended Mind", url: "drive.google.com/file/clark-chalmers-the-extended-mind.pdf" },
  { name: "Moodboard", url: "pinterest.com/miamicelentana/friction-ink-on-paper-vs-gradient" },
  { name: "Figma", url: "figma.com" },
  { name: "localhost:5173", url: "localhost:5173" },
];

export function ChromeApp() {
  const [tabs, setTabs] = useState(PAGES.map((p, i) => ({ ...p, id: i })));
  const [activeTabId, setActiveTabId] = useState(0);
  const [url, setUrl] = useState(PAGES[0].url);

  const activePage = tabs.find(t => t.id === activeTabId);

  const switchTab = (id: number) => {
    setActiveTabId(id);
    const tab = tabs.find(t => t.id === id);
    if (tab) setUrl(tab.url);
  };

  const closeTab = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = tabs.filter(t => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id && remaining.length > 0) {
      switchTab(remaining[remaining.length - 1].id);
    }
  };

  const navigateToBookmark = (bookmarkUrl: string) => {
    const page = PAGES.find(p => p.url === bookmarkUrl);
    if (page) {
      setUrl(page.url);
      const existing = tabs.find(t => t.url === page.url);
      if (existing) {
        setActiveTabId(existing.id);
      } else {
        const newTab = { ...page, id: Date.now() };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
      }
    }
  };

  return (
    <div className="size-full flex flex-col" style={{ backgroundColor: "#ffffff" }}>
      {/* Tab Bar */}
      <div className="flex items-end gap-0 px-2 pt-1 shrink-0" style={{ backgroundColor: "#dee1e6", height: "38px" }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg cursor-pointer group max-w-[200px]"
            style={{
              backgroundColor: tab.id === activeTabId ? "#ffffff" : "transparent",
              fontSize: "12px",
              color: "#5f6368",
            }}
          >
            <span className="shrink-0">{tab.favicon}</span>
            <span className="truncate">{tab.title}</span>
            <button
              onClick={(e) => closeTab(tab.id, e)}
              className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button className="p-1.5 rounded hover:bg-[#c8cad0] ml-1 mb-1 cursor-pointer">
          <Plus size={14} style={{ color: "#5f6368" }} />
        </button>
      </div>

      {/* Address Bar */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 shrink-0"
        style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #dadce0" }}
      >
        <ArrowLeft size={18} className="cursor-pointer" style={{ color: "#5f6368" }} />
        <ArrowRight size={18} style={{ color: "#5f6368", opacity: 0.4 }} />
        <RotateCw size={16} className="cursor-pointer" style={{ color: "#5f6368" }} />

        <div className="flex-1 flex items-center gap-2 px-4 py-1.5 rounded-full" style={{ backgroundColor: "#f1f3f4" }}>
          <Lock size={14} style={{ color: "#5f6368" }} />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: "#202124" }}
          />
          <Star size={14} style={{ color: "#5f6368" }} className="cursor-pointer" />
        </div>

        <ChevronDown size={16} style={{ color: "#5f6368" }} />
      </div>

      {/* Bookmarks Bar */}
      <div
        className="flex items-center gap-1 px-4 py-1 shrink-0"
        style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #eeeeee", height: "28px" }}
      >
        {BOOKMARKS.map(bm => (
          <button
            key={bm.name}
            onClick={() => navigateToBookmark(bm.url)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer hover:bg-gray-100"
            style={{ color: "#5f6368" }}
          >
            <Bookmark size={10} />
            {bm.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#ffffff" }}>
        {activePage?.content || (
          <div className="flex items-center justify-center h-full" style={{ color: "#5f6368" }}>
            <div className="text-center">
              <Search size={48} className="mx-auto mb-4" style={{ color: "#dadce0" }} />
              <p className="text-lg" style={{ color: "#202124" }}>Navigate to a page</p>
              <p className="text-sm">Use the bookmarks bar or type a URL</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
