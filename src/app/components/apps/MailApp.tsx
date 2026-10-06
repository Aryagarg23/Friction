/**
 * MAIL APP
 *
 * Full Gmail-style email client with folders, compose modal, reply,
 * starred messages, rich email body, and attachment indicators.
 */

import { useState } from "react";
import { NO_AUTOFILL } from "@/app/lib/noAutofill";
import {
  Mail, Star, Send, Inbox, Archive, Trash2, Tag, Paperclip,
  Reply, Forward, MoreHorizontal, Search, Pencil, ChevronDown,
  Clock, AlertCircle, X,
} from "lucide-react";

interface Email {
  id: number;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  time: string;
  preview: string;
  body: string;
  unread: boolean;
  starred: boolean;
  labels: string[];
  hasAttachment: boolean;
  folder: "inbox" | "starred" | "sent" | "archive" | "trash";
}

const EMAILS: Email[] = [
  {
    id: 1,
    from: "Miami Celentana",
    fromEmail: "miami@frictionlabs.dev",
    to: "friction-team",
    subject: "storyboard + captions v2",
    time: "1:30 PM",
    preview: "storyboard v2 attached —> 8 beats, text reveals, captions. tagline still missing...",
    body: `hi team

storyboard v2 attached

STORYBOARD
1. intro —> just gradient movement
2. gradient to color zoom
3. pop up keyboard, pop up UX/UI over gradient bg
4. login and begin work
5. increase of stress + loss of focus, toggles moving
6. keyboard + UX/UI blur, security lock pops up
7. timer counting down from 37 secs (20 secs on the short cut)
8. Text on page: Friction --> "insert tagline here"

TEXT REVEALS
- "Breathe in, breathe out. notice where your attention lies right now."
- "the elusive, rewarding 'flow state' greets us and departs with ease"
- "the balance between deep work and burn out has kept motivated individuals on their toes for ages"
- final —> "friction is paving the way for people to own their focus and turn it into a tool they can bend to their will"

CAPTIONS
- "the product lies dormant until the level of focus has reached unproductive levels. it's time for friction to step in."
- "but it never feels like a punishment, each activity is built to bring a sense of calm and self care."
- "perfection is not the goal"
- "the work needs to get done regardless. friction is the guiding hand to get work done faster, with more intention"

questions
- tagline??
- ink on paper for review screen, gradient for intro —> ok?
- arya —> can the build blur at beat 6?
- haley —> captions too long for 37 secs?

mc`,
    unread: true,
    starred: false,
    labels: ["Design"],
    hasAttachment: true,
    folder: "inbox",
  },
  {
    id: 2,
    from: "Fig Build 2026",
    fromEmail: "figbuild@figma.com",
    to: "friction-team",
    subject: "Reminder: Fig Build 2026 submissions close tonight at 11:00 PM EST",
    time: "9:00 AM",
    preview: "Submissions close Monday, March 9th @ 11:00 PM EST. Use the self-check rubric before you submit...",
    body: `Hi builders,

A reminder that Fig Build 2026 submissions close:

Monday, March 9th @ 11:00 PM EST

Before you submit, run through the self-check rubric.

Must-haves
1. The Target: who is it for, and in what context?
2. The Sense: a specific, previously unmeasurable sensory experience. (Humans have 22–33 distinct senses.)
3. The Goal: the wellness or behavior change you are after.
4. The Mechanics: 3 concrete use cases or stories.
5. The Interface: data collection, visualization, and sensory perception or enhancement.
6. The Safeguards: privacy, consent, misuse, information overload, and emergency protocols.

Judging criteria
- Problem-Solution Fit
- Innovation & Creativity
- Design Execution & UX ("system hygiene")
- Craft & Intentionality
- Storytelling & Presentation

This year's judges come from Meta, Microsoft, Spotify, and Google.

Good luck, and leave yourself time to upload.

The Fig Build team`,
    unread: true,
    starred: true,
    labels: ["Fig Build"],
    hasAttachment: false,
    folder: "inbox",
  },
  {
    id: 3,
    from: "FigMake Agent",
    fromEmail: "agent@figma.com",
    to: "Arya Garg",
    subject: "Build log: Mon Mar 9, 12:40 to 3:30 AM",
    time: "3:30 AM",
    preview: "Summary: three bugs fixed, no open blockers. 1. Blank screen (dropped InsightCard import)...",
    body: `Build log
Session: Monday, March 9, 12:40 AM to 3:30 AM

Summary
Three bugs fixed. No open blockers.

1. Blank screen
- Cause: MirrorPage.tsx referenced InsightCard after I dropped its import while regenerating a large file.
- Symptom: the error pointed to line 195 in a 153-line file. That mismatch meant a stale cache, not the current source.
- Fix: restored the import and cleared the cache.
- Prevention: after any regeneration, I diff the import block against the previous version.

2. Render loop in FrictionKeyboard
- Cause: the effect that syncs biometrics to keyboard state listed setResistance and setRGBMode as dependencies. Both were recreated on every render in KeyboardContext.
- Fix: wrapped both setters in useCallback with empty dependency arrays and added equality guards.
- Result: the loop no longer reproduces.

3. Window stacking
- Cause: WindowManagerContext tracked z-index with nested setState calls, which cascaded re-renders while dragging.
- Fix (by you): z-index tracking moved to a ref.

Data handling
- Biometric signals are simulated and held in memory in the browser. No network calls carry them.
- The kill switch and Data Burn exist in the concept and the deck. They are not implemented in the prototype.

Every change above is logged in src/app/CHANGELOG.md with backtrack instructions.

FigMake Agent`,
    unread: false,
    starred: true,
    labels: ["Engineering"],
    hasAttachment: false,
    folder: "inbox",
  },
  {
    id: 4,
    from: "Arya Garg",
    fromEmail: "arya@frictionlabs.dev",
    to: "Haley Potter, Miami Celentana",
    subject: "Re: the Extended Mind paper (is friction part of your brain??)",
    time: "Mar 8",
    preview: "I read it properly. Short version: Clark and Chalmers argue a tool used seamlessly becomes part of the cognitive system...",
    body: `Haley,

I read it properly. Short version of the paper: Andy Clark and David Chalmers argue that a tool used seamlessly becomes part of the cognitive system. Their example is Otto, who has Alzheimer's and keeps addresses in a notebook, compared with someone remembering the address from memory. If the notebook plays the same role, they say it is part of Otto's mind.

Their criteria, all four:
1. Constantly accessible
2. Automatically trusted
3. Easily retrievable
4. Consciously endorsed at some point

GPS, phone contacts, Google search and collaborative docs all pass.

Where I land:

- I dont necessarily agree with what the paper says here. I do understand that previous "extensions of the mind" were cold storage of information. But I diasgree with them insinuating that this is a boundray which should not be crossed. More to think here.

- Friction is not cold storage. It observes you while you think. If it meets the four criteria, it is part of your mind by their definition, which makes the safeguards the product and not a slide at the end.

- So: data stays local to the physical product, the physical kill switch returns it to a dumb desk, and the weekly Data Burn dissolves everything. I'd put this line in the deck as written: "friction users opt into protected brain observation with all data stored locally to the physical product".

Still open: "automatically trusted" is the criterion I'm least comfortable with. A tool you trust without checking is exactly the kind that can extract instead of protect. Same question we kept hitting on Clay.

I need to read this part again. also still need to read The Algorithmic Funnel: and beyond. takinng a cognitive pause

Arya

> On Sat, Mar 7, Haley Potter wrote:
> wait so friction would be part of your MIND?? that's either the best or the scariest thing for the safeguards section`,
    unread: true,
    starred: true,
    labels: ["Research"],
    hasAttachment: false,
    folder: "inbox",
  },
  {
    id: 5,
    from: "Haley Potter",
    fromEmail: "haley@frictionlabs.dev",
    to: "friction-team",
    subject: "product doc v4!!! (sources at the bottom this time)",
    time: "Mar 8",
    preview: "hiii team, ok product doc v4 is up. sources are at the bottom this time so arya can stop asking lol...",
    body: `hiii team

ok product doc v4 is up (attached). sources are at the bottom this time so arya can stop asking lol

WHAT CHANGED
- pitch line is in: "We need to... Enable the flow state through... Physical and Digital means"
- the senses / tracks / helps section:
  it senses: chemicals in the brain related to the flow state
  it tracks: focus level you have while completing a goal
  it helps you: stay deeply focused by focusing your attention through task to-do lists and helps you refocus through summaries of your work that decrease the friction of refocusing
- haptics: "uses haptic responses which prevents burn out which decreases working time which improves work life balance" (yes it's a run-on, it's MY run-on)
- archetypes: Claudia (Productivitymaxxer), Perplexous ("Burnout"phobic), Charlie GPT (Life-Balance Royalty, now a solo lawyer in the demo)

AUDIENCES (the four we looked at)
1. PhD students/postdocs in computational fields: ~100k globally, the "context recovery tax", Jupyter + LaTeX people
2. senior IC / staff+ engineers: attention residue
3. freelance writers + creators: ~2M, "muse detector", Substack/Upwork/Gumroad
4. solo trial lawyers: ~150k in the US, Clio communities, "focus prosthetic"

idk which one we lead with. leaning freelancers bc storytelling?? judges are Meta/Microsoft/Spotify/Google and they put a strong emphasis on storytelling

SOURCES
- Frontiers: "The Neuroscience of the Flow State: Involvement of the Locus Coeruleus Norepinephrine System" (tonic vs phasic!!)
- Penn Medicine: "Neuroscientists identify brain mechanism that drives focus" (the "traffic controllers" one)
- Frontiers: "The impacts of mind-wandering on flow"
- ScienceDirect: the task redirection paper
- Clark & Chalmers, The Extended Mind (arya has notes + opinions)

lmk what's missing!!!
haley

p.s. HALEY'S FREAKOFF CORNER: the Bene Gesserit could control their metabolism speed/sleep. we're kind of doing that but for focus. FIRE aesthetic 🔥`,
    unread: false,
    starred: true,
    labels: ["Research"],
    hasAttachment: true,
    folder: "inbox",
  },
  {
    id: 6,
    from: "Figma",
    fromEmail: "no-reply@figma.com",
    to: "me",
    subject: "Miami Celentana and 1 other commented in Friction: Demo Storyboard",
    time: "Mar 8",
    preview: "Miami Celentana: \"ink —> review screen, gradient —> intro?\" Haley Potter: \"BOTH\"...",
    body: `New comments in Friction: Demo Storyboard

Miami Celentana on "Frame 6: blur + security lock"
"ink —> review screen, gradient —> intro? both?"

Haley Potter replied
"BOTH. ink for the Empathy Mirror, the afternoon burnout as heavy gaussian blur on paper texture"

Arya Garg on "Frame 7: timer"
"Matching the 37 second countdown in the build. Confirming the short cut is 20."

Open in Figma`,
    unread: false,
    starred: false,
    labels: ["Design"],
    hasAttachment: false,
    folder: "inbox",
  },
  {
    id: 7,
    from: "Notion",
    fromEmail: "notify@notion.so",
    to: "me",
    subject: "4 updates in Friction Labs",
    time: "Mar 7",
    preview: "Haley Potter edited \"Audience research\", Arya Garg created \"Reading: The Extended Mind\"...",
    body: `4 updates in Friction Labs

Haley Potter edited "Audience research"
  Added: solo trial lawyers, ~150k in the US, Clio communities

Arya Garg created "Reading: The Extended Mind (Clark & Chalmers)"

Miami Celentana edited "Mc brain dump"
  Added: dream tracking —> dream enhancing —> be productive in your sleep TOO!

Arya Garg created "FIGBUILD 2026 SELF-CHECK RUBRIC"

Open Notion`,
    unread: false,
    starred: false,
    labels: [],
    hasAttachment: false,
    folder: "inbox",
  },
];

const LABEL_COLORS: Record<string, string> = {
  Engineering: "#4285f4",
  Design: "#ea4335",
  Research: "#34a853",
  "Fig Build": "#a142f4",
  GitHub: "#24292f",
};

const FOLDERS = [
  { id: "inbox" as const, name: "Inbox", icon: Inbox, count: 2 },
  { id: "starred" as const, name: "Starred", icon: Star, count: 0 },
  { id: "sent" as const, name: "Sent", icon: Send, count: 0 },
  { id: "archive" as const, name: "Archive", icon: Archive, count: 0 },
  { id: "trash" as const, name: "Trash", icon: Trash2, count: 0 },
];

export function MailApp() {
  const [emails, setEmails] = useState(EMAILS);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(EMAILS[0]);
  const [activeFolder, setActiveFolder] = useState<string>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeTo, setComposeTo] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const filteredEmails = emails
    .filter(e => activeFolder === "starred" ? e.starred : e.folder === activeFolder)
    .filter(e =>
      searchQuery === "" ||
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.from.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const toggleStar = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails(prev => prev.map(em => em.id === id ? { ...em, starred: !em.starred } : em));
  };

  const selectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (email.unread) {
      setEmails(prev => prev.map(em => em.id === email.id ? { ...em, unread: false } : em));
    }
  };

  return (
    <div className="size-full flex" style={{ backgroundColor: "#ffffff" }}>
      {/* Sidebar */}
      <div className="w-52 flex flex-col border-r shrink-0" style={{ borderColor: "#e5e7eb" }}>
        <div className="p-3">
          <button
            onClick={() => setShowCompose(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm cursor-pointer shadow-md"
            style={{ backgroundColor: "#c2e7ff", color: "#001d35" }}
          >
            <Pencil size={16} />
            Compose
          </button>
        </div>
        <div className="flex-1 px-2">
          {FOLDERS.map(folder => {
            const Icon = folder.icon;
            const count = folder.id === "inbox"
              ? emails.filter(e => e.folder === "inbox" && e.unread).length
              : folder.id === "starred"
              ? emails.filter(e => e.starred).length
              : 0;
            return (
              <button
                key={folder.id}
                onClick={() => { setActiveFolder(folder.id); setSelectedEmail(null); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm cursor-pointer mb-0.5"
                style={{
                  backgroundColor: activeFolder === folder.id ? "#d3e3fd" : "transparent",
                  color: activeFolder === folder.id ? "#001d35" : "#444746",
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{folder.name}</span>
                </div>
                {count > 0 && (
                  <span className="text-xs" style={{ color: activeFolder === folder.id ? "#001d35" : "#444746" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Email List */}
      <div
        className="flex flex-col border-r shrink-0"
        style={{ width: "320px", borderColor: "#e5e7eb" }}
      >
        {/* Search */}
        <div className="p-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ backgroundColor: "#edf2fc" }}
          >
            <Search size={16} style={{ color: "#444746" }} />
            <input {...NO_AUTOFILL}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mail"
              className="flex-1 bg-transparent border-none outline-none text-sm"
              style={{ color: "#1f1f1f" }}
            />
          </div>
        </div>

        {/* Email items */}
        <div className="flex-1 overflow-y-auto">
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: "#5f6368" }}>
              <Inbox size={32} className="mb-2" style={{ color: "#dadce0" }} />
              <p className="text-sm">No messages</p>
            </div>
          ) : (
            filteredEmails.map(email => (
              <div
                key={email.id}
                onClick={() => selectEmail(email)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", email.subject);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="px-4 py-3 cursor-pointer border-b"
                style={{
                  borderColor: "#f1f3f4",
                  backgroundColor: selectedEmail?.id === email.id
                    ? "#d3e3fd"
                    : email.unread
                    ? "#edf2fc"
                    : "transparent",
                }}
              >
                <div className="flex items-start gap-2">
                  <button onClick={(e) => toggleStar(email.id, e)} className="mt-0.5 shrink-0 cursor-pointer">
                    <Star
                      size={16}
                      fill={email.starred ? "#f9ab00" : "none"}
                      style={{ color: email.starred ? "#f9ab00" : "#c4c7c5" }}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className="text-sm truncate" style={{ color: "#1f1f1f", fontWeight: email.unread ? 600 : 400 }}>
                        {email.from}
                      </span>
                      <span className="text-xs shrink-0 ml-2" style={{ color: "#5f6368" }}>{email.time}</span>
                    </div>
                    <div className="text-sm mb-0.5 truncate" style={{ color: "#1f1f1f", fontWeight: email.unread ? 600 : 400 }}>
                      {email.subject}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs truncate" style={{ color: "#5f6368" }}>
                        {email.preview}
                      </span>
                      {email.hasAttachment && <Paperclip size={10} className="shrink-0" style={{ color: "#5f6368" }} />}
                    </div>
                    {email.labels.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {email.labels.map(label => (
                          <span
                            key={label}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs"
                            style={{ backgroundColor: `${LABEL_COLORS[label] || "#666"}15`, color: LABEL_COLORS[label] || "#666" }}
                          >
                            <Tag size={8} />
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Detail */}
      <div className="flex-1 flex flex-col">
        {selectedEmail ? (
          <>
            {/* Email Header */}
            <div className="p-6 border-b" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-xl" style={{ color: "#1f1f1f" }}>{selectedEmail.subject}</h1>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="p-2 rounded-full hover:bg-gray-100 cursor-pointer">
                    <Archive size={18} style={{ color: "#5f6368" }} />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100 cursor-pointer">
                    <Trash2 size={18} style={{ color: "#5f6368" }} />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100 cursor-pointer">
                    <MoreHorizontal size={18} style={{ color: "#5f6368" }} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: "#1a73e8" }}
                >
                  {selectedEmail.from[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm" style={{ color: "#1f1f1f" }}>{selectedEmail.from}</span>
                    <span className="text-xs" style={{ color: "#5f6368" }}>&lt;{selectedEmail.fromEmail}&gt;</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "#5f6368" }}>
                    to {selectedEmail.to}
                    <ChevronDown size={12} />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs shrink-0" style={{ color: "#5f6368" }}>
                  <Clock size={12} />
                  {selectedEmail.time}
                </div>
              </div>

              {selectedEmail.hasAttachment && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg" style={{ backgroundColor: "#f1f3f4" }}>
                  <Paperclip size={14} style={{ color: "#5f6368" }} />
                  <span className="text-xs" style={{ color: "#5f6368" }}>1 attachment</span>
                </div>
              )}
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <pre
                className="whitespace-pre-wrap text-sm"
                style={{ color: "#1f1f1f", fontFamily: "inherit", lineHeight: "1.6" }}
              >
                {selectedEmail.body}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 p-4 border-t" style={{ borderColor: "#e5e7eb" }}>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm cursor-pointer hover:bg-gray-50" style={{ borderColor: "#dadce0", color: "#1f1f1f" }}>
                <Reply size={16} /> Reply
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm cursor-pointer hover:bg-gray-50" style={{ borderColor: "#dadce0", color: "#1f1f1f" }}>
                <Forward size={16} /> Forward
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ color: "#5f6368" }}>
            <Mail size={48} className="mb-3" style={{ color: "#dadce0" }} />
            <p className="text-sm">Select a message to read</p>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div
          className="absolute bottom-4 right-4 flex flex-col rounded-t-xl shadow-2xl overflow-hidden"
          style={{
            width: "480px",
            height: "400px",
            backgroundColor: "#ffffff",
            border: "1px solid #dadce0",
            zIndex: 100,
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-2 text-sm"
            style={{ backgroundColor: "#404040", color: "#ffffff" }}
          >
            <span>New Message</span>
            <button onClick={() => setShowCompose(false)} className="cursor-pointer">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 flex flex-col p-3 gap-2">
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "#e5e7eb" }}>
              <span className="text-sm" style={{ color: "#5f6368" }}>To</span>
              <input {...NO_AUTOFILL}
                type="text"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: "#1f1f1f" }}
              />
            </div>
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "#e5e7eb" }}>
              <span className="text-sm" style={{ color: "#5f6368" }}>Subject</span>
              <input {...NO_AUTOFILL}
                type="text"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: "#1f1f1f" }}
              />
            </div>
            <textarea {...NO_AUTOFILL}
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm resize-none"
              style={{ color: "#1f1f1f" }}
              placeholder="Write your message..."
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: "#e5e7eb" }}>
            <button
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm text-white cursor-pointer"
              style={{ backgroundColor: "#0b57d0" }}
              onClick={() => setShowCompose(false)}
            >
              <Send size={14} /> Send
            </button>
            <button
              onClick={() => setShowCompose(false)}
              className="p-2 rounded cursor-pointer hover:bg-gray-100"
            >
              <Trash2 size={16} style={{ color: "#5f6368" }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}