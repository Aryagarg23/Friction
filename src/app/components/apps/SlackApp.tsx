/**
 * SLACK APP
 *
 * Full Slack simulation with channels, DMs, threads, reactions,
 * user status indicators, typing indicator, and message composer.
 */

import { useState } from "react";
import { Hash, Send, AtSign, Smile, Paperclip, ChevronDown, Circle, MessageSquare, Plus, Bell, Search, Users } from "lucide-react";

interface Message {
  id: number;
  user: string;
  avatar: string;
  time: string;
  text: string;
  reactions?: { emoji: string; count: number; reacted: boolean }[];
  thread?: { count: number; lastReply: string };
}

interface Channel {
  id: string;
  name: string;
  unread: number;
  description?: string;
}

interface DM {
  id: string;
  name: string;
  avatar: string;
  status: "active" | "away" | "offline";
  unread: number;
}

const CHANNELS: Channel[] = [
  { id: "engineering", name: "engineering", unread: 3, description: "Build talk. Bugs, fixes, the SNN side, privacy. Arya + FigMake mostly." },
  { id: "friction-dev", name: "friction-dev", unread: 3, description: "Friction research + product. Flow neuroscience, Extended Mind, pitch lines." },
  { id: "general", name: "general", unread: 1, description: "Fig Build 2026. Deadline Mon March 9 @ 11:00 PM EST." },
  { id: "design", name: "design", unread: 2, description: "storyboard, captions, ink vs gradient, the 37 sec timer" },
  { id: "random", name: "random", unread: 0, description: "HALEY'S FREAKOFF CORNER!!!! (+ Mc brain dumps)" },
  { id: "standup", name: "standup", unread: 0, description: "Async standups for the sprint. Done / today / blockers." },
];

const DMS: DM[] = [
  { id: "arya", name: "Arya Garg", avatar: "AG", status: "active", unread: 1 },
  { id: "miami", name: "Miami Celentana", avatar: "MC", status: "active", unread: 0 },
  { id: "haley", name: "Haley Potter", avatar: "HP", status: "away", unread: 0 },
  { id: "figmake", name: "FigMake Agent", avatar: "🔷", status: "active", unread: 0 },
];

const MESSAGES: Record<string, Message[]> = {
  "engineering": [
    {
      id: 1, user: "Arya Garg", avatar: "AG", time: "Sun 9:30 PM",
      text: "Ground rule for the build: everything runs locally. No cloud stream for biometric data, for the same reason the concept puts the SNN chip in the keyboard. Cloud streams mean latency and a privacy problem we can't explain away in a pitch.",
      reactions: [{ emoji: "🔒", count: 3, reacted: true }],
    },
    {
      id: 2, user: "FigMake Agent", avatar: "🔷", time: "Sun 9:34 PM",
      text: "Understood. Proposed structure:\n1. `BiometricContext` holds the simulated signals (focus, fatigue, stress).\n2. `KeyboardContext` derives key resistance and temperature from those signals.\n3. `SessionContext` keeps session data in memory only. Nothing is sent over the network.\nI will log every change in `src/app/CHANGELOG.md` with backtrack instructions.",
      reactions: [{ emoji: "👍", count: 2, reacted: false }],
    },
    {
      id: 3, user: "Arya Garg", avatar: "AG", time: "Sun 10:05 PM",
      text: "For whoever writes the tech slide: spiking neural nets are the \"third generation\" of neural networks. They communicate through discrete spikes, the information is in the timing and frequency of those spikes, and a neuron only fires with enough input. Event-driven instead of clock-based, so ultra-low power, which is the whole reason it can live in a keyboard. The honest downside: limited tooling, hard to train, needs new algorithms. Names to cite are Intel (Loihi), IBM (TrueNorth), BrainChip. We are not training one this weekend. The prototype simulates the signals.",
      reactions: [{ emoji: "🧠", count: 3, reacted: true }],
      thread: { count: 3, lastReply: "Last reply Sun at 10:31 PM" },
    },
    {
      id: 4, user: "Haley Potter", avatar: "HP", time: "Sun 10:08 PM",
      text: "saving this for the deck 🙏 nerd alert received loud and clear",
    },
    {
      id: 5, user: "Arya Garg", avatar: "AG", time: "Mon 2:47 AM",
      text: "blank screen. `MirrorPage.tsx` uses `InsightCard` but the import is gone. error says line 195. the file is 153 lines. so we were looking at a stale cache, not the real file",
      reactions: [{ emoji: "😵", count: 2, reacted: false }],
      thread: { count: 4, lastReply: "Last reply Mon at 3:01 AM" },
    },
    {
      id: 6, user: "FigMake Agent", avatar: "🔷", time: "Mon 2:52 AM",
      text: "That one is mine.\nWhat happened: I regenerated a large file while rewriting the fake apps and dropped the `InsightCard` import.\nWhy it was confusing: the error pointed to line 195 in a 153-line file, so the overlay was reporting a stale cached build.\nFix: import restored, cache cleared, app renders.\nNext time: after regenerating any file, I will diff its import block against the previous version before saving.",
      reactions: [{ emoji: "🙏", count: 2, reacted: true }],
    },
    {
      id: 7, user: "Arya Garg", avatar: "AG", time: "Mon 3:15 AM",
      text: "next one. `FrictionKeyboard` rerenders forever. the effect that syncs biometrics -> keyboard has `setResistance` and `setRGBMode` in its deps and theyre new functions every render. wrapping them in useCallback",
    },
    {
      id: 8, user: "FigMake Agent", avatar: "🔷", time: "Mon 3:21 AM",
      text: "Confirmed and applied in `src/app/context/KeyboardContext.tsx`:\n1. Wrapped `setResistance` and `setRGBMode` in `useCallback` with empty dependency arrays.\n2. Added equality guards so an identical value does not trigger a state update.\nThe render loop no longer reproduces. Logged in the changelog.",
      reactions: [{ emoji: "🐛", count: 3, reacted: false }, { emoji: "✅", count: 2, reacted: true }],
    },
    {
      id: 9, user: "you", avatar: "YO", time: "Mon 9:02 AM",
      text: "Also moved z-index tracking in `WindowManagerContext` to a ref. Nested setState calls while dragging were cascading re-renders. Desktop feels solid now.",
      reactions: [{ emoji: "👍", count: 2, reacted: false }],
    },
    {
      id: 10, user: "Arya Garg", avatar: "AG", time: "Mon 11:30 AM",
      text: "On the kill switch and Data Burn: both are in the concept and the deck, not the prototype. The physical switch returns the setup to a \"dumb\" desk, and Data Burn is the weekly three-second haptic hold that dissolves all biometric data. We don't have the hardware, so I'd rather the slide say \"designed\" than imply we shipped deletion.",
      reactions: [{ emoji: "💯", count: 2, reacted: false }],
    },
    {
      id: 11, user: "Miami Celentana", avatar: "MC", time: "Mon 11:34 AM",
      text: "three-second hold —> can the video show a hand on the wrist rest?\nlike a held breath?",
    },
  ],
  "friction-dev": [
    {
      id: 20, user: "Haley Potter", avatar: "HP", time: "Sat 1:05 PM",
      text: "RESEARCH DUMP (flow neuroscience edition) 🧠\nFrontiers: \"The Neuroscience of the Flow State: Involvement of the Locus Coeruleus Norepinephrine System\". flow is \"a state of full task engagement that is accompanied with low-levels...\" and the LC-NE system runs in two modes, tonic vs phasic norepinephrine. idk this feels like the backbone of the whole thing??",
      reactions: [{ emoji: "🧠", count: 3, reacted: true }],
      thread: { count: 7, lastReply: "Last reply Sat at 2:40 PM" },
    },
    {
      id: 21, user: "Haley Potter", avatar: "HP", time: "Sat 1:09 PM",
      text: "ALSO Penn Medicine: \"Neuroscientists identify brain mechanism that drives focus\". key neurons in the front of the brain act as \"traffic controllers\" which is literally such a good line for the pitch",
      reactions: [{ emoji: "🚦", count: 2, reacted: false }],
    },
    {
      id: 22, user: "Arya Garg", avatar: "AG", time: "Sat 1:20 PM",
      text: "The tonic/phasic split is useful as a model, but we can't sense norepinephrine from a desk. What we can measure are proxies: eye movement, posture, sweat chemistry. Can you link the paper itself and not just the press summary? I want to read the methods before it goes on a slide.",
    },
    {
      id: 23, user: "Haley Potter", avatar: "HP", time: "Sat 1:22 PM",
      text: "fair fair. linked in the product doc. also adding Frontiers \"The impacts of mind-wandering on flow\" + a ScienceDirect paper on task redirection bc refocusing is like half our product",
    },
    {
      id: 24, user: "Miami Celentana", avatar: "MC", time: "Sat 1:30 PM",
      text: "mind-wandering —> the moment friction steps in?\nflow —> leave them alone?",
      reactions: [{ emoji: "👆", count: 2, reacted: false }],
    },
    {
      id: 25, user: "Arya Garg", avatar: "AG", time: "Sat 4:45 PM",
      text: "Reading Clark & Chalmers, \"The Extended Mind\". Otto has Alzheimer's and keeps addresses in a notebook instead of remembering them. Their claim is the notebook counts as part of his cognitive system if it's constantly accessible, automatically trusted, easily retrievable, and consciously endorsed at some point. GPS and phone contacts pass that test today. I dont necessarily agree with where they draw the boundary though. More to think here.",
      thread: { count: 5, lastReply: "Last reply Sat at 6:02 PM" },
    },
    {
      id: 26, user: "Haley Potter", avatar: "HP", time: "Sat 4:52 PM",
      text: "wait so friction would be part of your MIND?? that's either the best or the scariest thing for the safeguards section",
      reactions: [{ emoji: "😳", count: 2, reacted: false }],
    },
    {
      id: 27, user: "Arya Garg", avatar: "AG", time: "Sat 4:58 PM",
      text: "Both. Which is why the data stays on the device. It's the same question we had with Clay: does the tool protect the thinking or extract it.",
      reactions: [{ emoji: "🎯", count: 3, reacted: true }],
    },
    {
      id: 28, user: "Haley Potter", avatar: "HP", time: "Sun 11:10 AM",
      text: "pitch line draft: \"We need to... Enable the flow state through... Physical and Digital means\" too much?? be honest",
    },
    {
      id: 29, user: "Miami Celentana", avatar: "MC", time: "Sun 11:14 AM",
      text: "not too much\nneeds a visual though —> keyboard + screen side by side?",
    },
  ],
  "general": [
    {
      id: 40, user: "Haley Potter", avatar: "HP", time: "Sat 10:12 AM",
      text: "ok OFFICIAL KICKOFF!!! Fig Build 2026 deadline is Monday March 9th @ 11:00 PM EST. judges are from Meta, Microsoft, Spotify and Google. They put a strong emphasis on storytelling so thinking about an idea super widely relatable/not overly futuristic?",
      reactions: [{ emoji: "🚀", count: 3, reacted: true }],
      thread: { count: 6, lastReply: "Last reply Sat at 11:02 AM" },
    },
    {
      id: 41, user: "Arya Garg", avatar: "AG", time: "Sat 10:20 AM",
      text: "Put the self-check rubric in Notes. Six must-haves: The Target, The Sense, The Goal, The Mechanics, The Interface, The Safeguards. Then five judging criteria. I'd like every feature to map to one of them, and if it doesn't, we cut it.",
      reactions: [{ emoji: "📌", count: 2, reacted: false }],
    },
    {
      id: 42, user: "Haley Potter", avatar: "HP", time: "Sat 10:26 AM",
      text: "also the rubric says \"humans have 22–33 distinct senses\" and we have to pick one that was previously unmeasurable. no pressure lol",
    },
    {
      id: 43, user: "Miami Celentana", avatar: "MC", time: "Sat 10:31 AM",
      text: "safeguards = the scary one?\nprivacy, consent, misuse, information overload, emergency protocols —> need all five",
    },
    {
      id: 44, user: "Haley Potter", avatar: "HP", time: "Mon 6:40 PM",
      text: "📊 POLL: Ready to submit?\n✅ yes\n⏳ need 20 more min\n🎬 video still exporting\n\nNo votes yet",
    },
    {
      id: 45, user: "Arya Garg", avatar: "AG", time: "Mon 11:04 PM",
      text: "We finished at 11:04. Submission closed at 11:00, so it didn't go in. The prototype works and everything is saved. I'll write up where we landed tomorrow.",
      reactions: [{ emoji: "❤️", count: 2, reacted: false }],
    },
  ],
  "design": [
    {
      id: 50, user: "Miami Celentana", avatar: "MC", time: "Sat 7:02 PM",
      text: "storyboard v1:\nintro —> just gradient movement\ngradient to color zoom\npop up keyboard, pop up UX/UI over gradient bg\nlogin and begin work\nincrease of stress + loss of focus, toggles moving\nkeyboard + UX/UI blur, security lock pops up\ntimer counting down from 37 secs\nText on page: Friction --> \"insert tagline here\"",
      reactions: [{ emoji: "🎬", count: 3, reacted: true }],
      thread: { count: 4, lastReply: "Last reply Sat at 7:40 PM" },
    },
    {
      id: 51, user: "Haley Potter", avatar: "HP", time: "Sat 7:10 PM",
      text: "the 37 second timer is SO good. also \"insert tagline here\" is not it chief 😭",
    },
    {
      id: 52, user: "Miami Celentana", avatar: "MC", time: "Sat 7:12 PM",
      text: "placeholder!! tagline later?",
    },
    {
      id: 53, user: "Arya Garg", avatar: "AG", time: "Sat 7:20 PM",
      text: "Why 37 seconds specifically? Not against it, I just want to match it exactly in the build.",
    },
    {
      id: 54, user: "Miami Celentana", avatar: "MC", time: "Sat 7:24 PM",
      text: "37 —> urgent but not panic?\n20 secs on the short cut",
    },
    {
      id: 55, user: "Miami Celentana", avatar: "MC", time: "Sun 2:15 PM",
      text: "ink on paper vs gradient??\nink —> review screen, analog annotation, paper texture\ngradient —> video intro\nboth?",
    },
    {
      id: 56, user: "Haley Potter", avatar: "HP", time: "Sun 2:20 PM",
      text: "BOTH. ink for the Empathy Mirror!! morning deep work razor sharp, afternoon burnout as heavy gaussian blur on paper texture... it's giving",
      reactions: [{ emoji: "🖋️", count: 2, reacted: true }],
    },
    {
      id: 57, user: "Miami Celentana", avatar: "MC", time: "Mon 1:40 PM",
      text: "captions draft:\n\"the product lies dormant until the level of focus has reached unproductive levels. it's time for friction to step in.\"\n\"but it never feels like a punishment, each activity is built to bring a sense of calm and self care.\"\n\"perfection is not the goal\"\nthoughts?",
    },
    {
      id: 58, user: "Haley Potter", avatar: "HP", time: "Mon 1:46 PM",
      text: "\"perfection is not the goal\" gave me actual chills ngl",
      reactions: [{ emoji: "🥹", count: 2, reacted: false }],
    },
  ],
  "random": [
    {
      id: 60, user: "Haley Potter", avatar: "HP", time: "Sat 12:02 PM",
      text: "HALEY'S FREAKOFF CORNER!!!!\nNerd alert: in Dune the Bene Gesserit had such a deep control over their bodies they could control things like their metabolism speed/sleep. using it as inspo for things that seem impossible. it also comes with a FIRE aesthetic 🔥",
      reactions: [{ emoji: "🪱", count: 3, reacted: true }, { emoji: "🔥", count: 2, reacted: false }],
    },
    {
      id: 61, user: "Haley Potter", avatar: "HP", time: "Sat 12:06 PM",
      text: "Literally just saw Garmin x Meta add where the guy said \"hey meta how many calories have I burned?\" which personally just PMO but that's attractive for a lot of people (even though research says smartwatches can't accurately track calories)",
    },
    {
      id: 62, user: "Haley Potter", avatar: "HP", time: "Sat 12:09 PM",
      text: "metrics i wish we could sense:\n- when people are bullshitting (different than lying)\n- skill improvement like \"it took you half as long to cut those vegetables\"\n- \"your body was tired and you listened and didn't over exert yourself on your run\"\n(also taking a metric fuck ton of supplements (hi arya))",
      reactions: [{ emoji: "😂", count: 3, reacted: true }],
    },
    {
      id: 63, user: "Haley Potter", avatar: "HP", time: "Sat 12:11 PM",
      text: "I keep coming back to the idea of unwarranted health anxiety ... idk just word vomit",
    },
    {
      id: 64, user: "Arya Garg", avatar: "AG", time: "Sat 12:20 PM",
      text: "The bullshitting one is a real question. What would the signal be? Not saying no, asking what we'd actually measure.",
    },
    {
      id: 65, user: "Miami Celentana", avatar: "MC", time: "Sat 12:30 PM",
      text: "Mc brain dump:\nhow the inflection in people's voices change determining the level of stress?\nhunger pangs —> for people with eating disorders who struggle to eat consistently or have body response that lie\nbreathing state—> for yoga or meditation or anxiety\nsalt levels? thirst\nscreentime effects —> blue light impact, amount of time spent immobile\nurges to consume —> how the brain lights up and reacts to advertisements, dangerous data in the hands of corporations, could be used by psychologists to support people going through addiction\ndream tracking —> dream enhancing —> be productive in your sleep TOO!\nmotivation —> encouragement tips, how to trick the brain into starting a task that feels insurmountable",
      reactions: [{ emoji: "🤯", count: 3, reacted: true }],
    },
    {
      id: 66, user: "Haley Potter", avatar: "HP", time: "Sat 12:34 PM",
      text: "\"be productive in your sleep TOO!\" is so unhinged i love it",
    },
    {
      id: 67, user: "Haley Potter", avatar: "HP", time: "Sun 4:30 PM",
      text: "ok these ads are both just fire: \"Hello, MacBook Neo\" and adidas Originals \"Superstar\". universal human experience + brand identity. THAT's the vibe for our video",
      reactions: [{ emoji: "🔥", count: 2, reacted: false }],
    },
    {
      id: 68, user: "Miami Celentana", avatar: "MC", time: "Sun 4:33 PM",
      text: "universal moment first —> product second?",
    },
    {
      id: 69, user: "Haley Potter", avatar: "HP", time: "Sun 8:02 PM",
      text: "rip Charlie GPT, Age 37, COO 🕊️ he's a solo lawyer in the demo now",
      reactions: [{ emoji: "⚖️", count: 2, reacted: false }],
    },
  ],
  "standup": [
    {
      id: 70, user: "StandupBot", avatar: "🤖", time: "Mon 8:00 AM",
      text: "Final day of Fig Build 2026. What's done, what's left, any blockers?",
    },
    {
      id: 71, user: "Haley Potter", avatar: "HP", time: "Mon 8:09 AM",
      text: "done: product doc v4 WITH sources (finally), audience research, judges strategy\ntoday: demo script + storytelling pass, the four-audiences slide\nblockers: sleep?? idk we'll see 😅",
    },
    {
      id: 72, user: "Miami Celentana", avatar: "MC", time: "Mon 8:15 AM",
      text: "done —> storyboard, text reveals\ntoday —> captions, record + cut video\nblockers —> need the final build to screen record?",
    },
    {
      id: 73, user: "Arya Garg", avatar: "AG", time: "Mon 8:31 AM",
      text: "Done: fixed the blank screen (InsightCard import) and the KeyboardContext render loop.\nToday: a final build Miami can record, then the tech slide (SNN, local-only data, kill switch, Data Burn).\nBlockers: none. I'm short on sleep, so please review anything I push carefully.",
    },
    {
      id: 74, user: "FigMake Agent", avatar: "🔷", time: "Mon 8:33 AM",
      text: "Done: render loop fix in `KeyboardContext.tsx`; import audit of every file I regenerated.\nToday: changelog upkeep and any fixes Arya requests.\nBlockers: none.",
    },
  ],
  // DMs
  "arya": [
    { id: 100, user: "Arya Garg", avatar: "AG", time: "Mon 3:20 AM", text: "The `temperature` field in KeyboardContext was never read. I wired it to fatigue so the keys warm up as fatigue climbs. That's the Peltier keycap idea from the concept, heat as a burnout warning." },
    { id: 101, user: "you", avatar: "YO", time: "Mon 3:22 AM", text: "Nice. Is it in the changelog?" },
    { id: 102, user: "Arya Garg", avatar: "AG", time: "Mon 3:24 AM", text: "yes with backtrack notes. I also need to read The Algorithmic Funnel: and beyond. not tonight. takinng a cognitive pause" },
  ],
  "miami": [
    { id: 110, user: "Miami Celentana", avatar: "MC", time: "Sun 6:10 PM", text: "calibration screens for the deck —> order ok?\nvisual —> gaussian blur to crisp\nspatial —> wireframe mesh\nkinetic + acoustic —> typing + 40Hz" },
    { id: 111, user: "you", avatar: "YO", time: "Sun 6:18 PM", text: "Order looks right. Blur to crisp is a good opener." },
    { id: 112, user: "Miami Celentana", avatar: "MC", time: "Sun 6:19 PM", text: "ty —> recording tmrw" },
  ],
  "haley": [
    { id: 120, user: "Haley Potter", avatar: "HP", time: "Sun 3:02 PM", text: "PRODUCT DOC V4 IS UP!!! sources at the bottom this time so arya can't come for me lol" },
    { id: 121, user: "Haley Potter", avatar: "HP", time: "Sun 3:05 PM", text: "audiences section has all four: PhD/postdocs (~100k globally), staff+ engineers, freelance writers/creators (~2M), solo trial lawyers (~150k in the US). which one do we lead with in the video??" },
    { id: 122, user: "you", avatar: "YO", time: "Sun 3:20 PM", text: "Whichever tells the clearest story. Claudia is a freelancer, so that one is easy to show." },
  ],
  "figmake": [
    { id: 130, user: "FigMake Agent", avatar: "🔷", time: "Mon 3:00 AM", text: "Session log, Mon 3:00 AM\nContext providers: Biometric, Keyboard, Persona, Session, WindowManager, FrictionSettings.\nPersonas: Claudia (freelancer), Perplexous (PhD student), Charlie (solo lawyer).\nOpen blockers: none.\nLesson recorded: never regenerate a large file without checking its imports." },
    { id: 131, user: "you", avatar: "YO", time: "Mon 3:05 AM", text: "The InsightCard incident. Line 195 in a 153-line file." },
    { id: 132, user: "FigMake Agent", avatar: "🔷", time: "Mon 3:06 AM", text: "Correct: a stale cache on top of a dropped import. I have added two checks to my routine after any regeneration:\n1. Diff the import block against the previous version.\n2. Check that context setters used in consumer effects are stable references (`useCallback`)." },
  ],
};

const STATUS_COLORS: Record<string, string> = {
  active: "#44b553",
  away: "#e8912d",
  offline: "#8b8b8b",
};

export function SlackApp() {
  const [currentChannel, setCurrentChannel] = useState("engineering");
  const [message, setMessage] = useState("");
  const [channelType, setChannelType] = useState<"channel" | "dm">("channel");
  const [showChannelInfo, setShowChannelInfo] = useState(false);

  const messages = MESSAGES[currentChannel] || [];
  const currentChannelData = CHANNELS.find(c => c.id === currentChannel);
  const currentDMData = DMS.find(d => d.id === currentChannel);
  const displayName = channelType === "channel"
    ? `# ${currentChannelData?.name || currentChannel}`
    : currentDMData?.name || currentChannel;

  return (
    <div className="size-full flex" style={{ backgroundColor: "#ffffff" }}>
      {/* Sidebar */}
      <div className="w-60 flex flex-col shrink-0" style={{ backgroundColor: "#3f0e40" }}>
        {/* Workspace header */}
        <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-base">Friction Labs</h2>
            <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.7)" }} />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Circle size={8} fill="#44b553" stroke="none" />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>Active</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Quick Actions */}
          <div className="px-3 mb-3 space-y-0.5">
            <button className="w-full flex items-center gap-2 px-2 py-1 rounded text-sm text-left cursor-pointer hover:bg-[rgba(255,255,255,0.1)]" style={{ color: "rgba(255,255,255,0.8)" }}>
              <MessageSquare size={16} /> Threads
            </button>
            <button className="w-full flex items-center gap-2 px-2 py-1 rounded text-sm text-left cursor-pointer hover:bg-[rgba(255,255,255,0.1)]" style={{ color: "rgba(255,255,255,0.8)" }}>
              <Bell size={16} /> Activity
            </button>
            <button className="w-full flex items-center gap-2 px-2 py-1 rounded text-sm text-left cursor-pointer hover:bg-[rgba(255,255,255,0.1)]" style={{ color: "rgba(255,255,255,0.8)" }}>
              <Search size={16} /> Search
            </button>
          </div>

          {/* Channels */}
          <div className="px-3 mb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>
                Channels
              </span>
              <Plus size={14} style={{ color: "rgba(255,255,255,0.5)" }} className="cursor-pointer" />
            </div>
          </div>
          {CHANNELS.map(channel => (
            <button
              key={channel.id}
              onClick={() => { setCurrentChannel(channel.id); setChannelType("channel"); }}
              className="w-full flex items-center justify-between px-4 py-1 cursor-pointer mb-0.5"
              style={{
                backgroundColor: currentChannel === channel.id && channelType === "channel" ? "#1164a3" : "transparent",
                color: currentChannel === channel.id && channelType === "channel"
                  ? "#ffffff"
                  : channel.unread > 0
                  ? "#ffffff"
                  : "rgba(255,255,255,0.7)",
              }}
            >
              <div className="flex items-center gap-1.5">
                <Hash size={14} />
                <span className="text-sm" style={{ fontWeight: channel.unread > 0 ? 700 : 400 }}>
                  {channel.name}
                </span>
              </div>
              {channel.unread > 0 && (
                <span
                  className="w-5 h-5 rounded flex items-center justify-center text-xs"
                  style={{ backgroundColor: "#e01e5a", color: "#ffffff" }}
                >
                  {channel.unread}
                </span>
              )}
            </button>
          ))}

          {/* DMs */}
          <div className="px-3 mt-4 mb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>
                Direct Messages
              </span>
              <Plus size={14} style={{ color: "rgba(255,255,255,0.5)" }} className="cursor-pointer" />
            </div>
          </div>
          {DMS.map(dm => (
            <button
              key={dm.id}
              onClick={() => { setCurrentChannel(dm.id); setChannelType("dm"); }}
              className="w-full flex items-center justify-between px-4 py-1 cursor-pointer mb-0.5"
              style={{
                backgroundColor: currentChannel === dm.id && channelType === "dm" ? "#1164a3" : "transparent",
                color: currentChannel === dm.id && channelType === "dm"
                  ? "#ffffff"
                  : dm.unread > 0
                  ? "#ffffff"
                  : "rgba(255,255,255,0.7)",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-xs"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#ffffff" }}
                  >
                    {dm.avatar[0]}
                  </div>
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border"
                    style={{
                      backgroundColor: STATUS_COLORS[dm.status],
                      borderColor: "#3f0e40",
                    }}
                  />
                </div>
                <span className="text-sm" style={{ fontWeight: dm.unread > 0 ? 700 : 400 }}>
                  {dm.name}
                </span>
              </div>
              {dm.unread > 0 && (
                <span
                  className="w-5 h-5 rounded flex items-center justify-center text-xs"
                  style={{ backgroundColor: "#e01e5a", color: "#ffffff" }}
                >
                  {dm.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b shrink-0"
          style={{ borderColor: "#e5e5e5" }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg" style={{ color: "#1d1c1d" }}>
                {displayName}
              </span>
              {channelType === "dm" && currentDMData && (
                <Circle
                  size={8}
                  fill={STATUS_COLORS[currentDMData.status]}
                  stroke="none"
                />
              )}
            </div>
            {channelType === "channel" && currentChannelData?.description && (
              <p className="text-xs mt-0.5" style={{ color: "#616061" }}>
                {currentChannelData.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChannelInfo(!showChannelInfo)}
              className="p-1.5 rounded hover:bg-gray-100 cursor-pointer"
            >
              <Users size={18} style={{ color: "#616061" }} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: "#616061" }}>
              <MessageSquare size={32} className="mb-2" style={{ color: "#e0e0e0" }} />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Be the first to say something!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", msg.text.slice(0, 80));
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="mb-4 group hover:bg-[#f8f8f8] -mx-3 px-3 py-1 rounded cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{
                      backgroundColor: msg.user === "you" ? "#007a5a" : msg.avatar === "🔷" ? "#e8eaed" : "#4a154b",
                      color: msg.avatar === "🔷" ? "#1d1c1d" : "#ffffff",
                    }}
                  >
                    {msg.avatar === "🔷" ? "🔷" : msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-bold text-sm" style={{ color: "#1d1c1d" }}>
                        {msg.user === "you" ? "You" : msg.user}
                      </span>
                      <span className="text-xs" style={{ color: "#616061" }}>
                        {msg.time}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap" style={{ color: "#1d1c1d", lineHeight: "1.5" }}>
                      {msg.text.split(/(```[\s\S]*?```|`[^`]+`|@\w+)/g).map((part, pi) => {
                        if (part.startsWith("```")) {
                          return (
                            <pre
                              key={pi}
                              className="my-2 px-3 py-2 rounded text-xs overflow-x-auto"
                              style={{ backgroundColor: "#f8f8f8", border: "1px solid #e5e5e5", fontFamily: "JetBrains Mono, monospace" }}
                            >
                              {part.replace(/```\n?/g, "")}
                            </pre>
                          );
                        }
                        if (part.startsWith("`")) {
                          return (
                            <code
                              key={pi}
                              className="px-1 py-0.5 rounded text-xs"
                              style={{ backgroundColor: "#f0e0e0", color: "#e01e5a" }}
                            >
                              {part.replace(/`/g, "")}
                            </code>
                          );
                        }
                        if (part.startsWith("@")) {
                          return (
                            <span
                              key={pi}
                              className="px-1 rounded cursor-pointer"
                              style={{ backgroundColor: "#e8f5fa", color: "#1264a3" }}
                            >
                              {part}
                            </span>
                          );
                        }
                        if (part.startsWith("**") && part.endsWith("**")) {
                          return <strong key={pi}>{part.replace(/\*\*/g, "")}</strong>;
                        }
                        return <span key={pi}>{part}</span>;
                      })}
                    </div>

                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {msg.reactions.map((r, ri) => (
                          <button
                            key={ri}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer border"
                            style={{
                              backgroundColor: r.reacted ? "#e8f5fa" : "#f8f8f8",
                              borderColor: r.reacted ? "#1264a3" : "#e5e5e5",
                              color: "#1d1c1d",
                            }}
                          >
                            {r.emoji} {r.count}
                          </button>
                        ))}
                        <button
                          className="flex items-center px-1.5 py-0.5 rounded-full text-xs cursor-pointer border opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ borderColor: "#e5e5e5", backgroundColor: "#f8f8f8" }}
                        >
                          <Smile size={12} style={{ color: "#616061" }} />
                        </button>
                      </div>
                    )}

                    {/* Thread indicator */}
                    {msg.thread && (
                      <button
                        className="flex items-center gap-2 mt-1.5 px-2 py-1 rounded cursor-pointer hover:bg-white border"
                        style={{ borderColor: "transparent" }}
                      >
                        <MessageSquare size={12} style={{ color: "#1264a3" }} />
                        <span className="text-xs" style={{ color: "#1264a3" }}>
                          {msg.thread.count} replies
                        </span>
                        <span className="text-xs" style={{ color: "#616061" }}>
                          {msg.thread.lastReply}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="px-5 pb-4 shrink-0">
          <div
            className="flex items-start gap-2 px-4 py-3 rounded-lg border"
            style={{ borderColor: "#868686" }}
          >
            <div className="flex items-center gap-1 pt-0.5 shrink-0">
              <button className="p-1 rounded hover:bg-gray-100 cursor-pointer">
                <Plus size={18} style={{ color: "#616061" }} />
              </button>
            </div>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message ${displayName}`}
              className="flex-1 bg-transparent border-none outline-none text-sm"
              style={{ color: "#1d1c1d" }}
            />
            <div className="flex items-center gap-1 pt-0.5 shrink-0">
              <button className="p-1 rounded hover:bg-gray-100 cursor-pointer">
                <AtSign size={18} style={{ color: "#616061" }} />
              </button>
              <button className="p-1 rounded hover:bg-gray-100 cursor-pointer">
                <Paperclip size={18} style={{ color: "#616061" }} />
              </button>
              <button className="p-1 rounded hover:bg-gray-100 cursor-pointer">
                <Smile size={18} style={{ color: "#616061" }} />
              </button>
              <button
                className="p-1.5 rounded cursor-pointer"
                style={{
                  backgroundColor: message.trim() ? "#007a5a" : "transparent",
                  color: message.trim() ? "#ffffff" : "#616061",
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}