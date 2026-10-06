/**
 * CALENDAR APP
 *
 * Full Google Calendar-style app with month grid, day/week view toggle,
 * event creation, multi-day events, and time slots.
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Clock, MapPin } from "lucide-react";

interface CalendarEvent {
  id: number;
  title: string;
  time: string;    // 24h "HH:MM"
  endTime: string; // 24h "HH:MM"
  color: string;
  location?: string;
  notes?: string;  // Event description, written by whoever made the event
  day: number; // Day of month
}

// The real sprint: Fri March 6 to the Fig Build deadline, Mon March 9 2026, 11:00 PM EST.
const EVENTS: CalendarEvent[] = [
  // Mon Mar 9 (today), in time order so "Upcoming" reads top to bottom
  { id: 1, title: "Calibration flow review", time: "09:00", endTime: "10:00", color: "#4285f4", location: "Zoom", day: 9,
    notes: "Walk all three phases end to end: SPEM (blur to crisp), RF volumetric mesh, keystroke topography. Intercept threshold stays at 0.95 unless someone has a reason. Bring the reason." },
  { id: 2, title: "Judges strategy", time: "11:00", endTime: "11:30", color: "#e91e63", day: 9,
    notes: "judges from Meta, Microsoft, Spotify, and Google!!! they put a strong emphasis on storytelling so lead with the story not the sensors (sorry arya)" },
  { id: 3, title: "Record demo video", time: "14:00", endTime: "17:00", color: "#7c4dff", day: 9,
    notes: "intro —> gradient movement only\nkeyboard + UX/UI blur —> security lock pops up\ntimer counting down from 37 secs\ncaption: \"perfection is not the goal\"\ntagline??" },
  { id: 4, title: "Rubric self-check", time: "19:00", endTime: "20:00", color: "#34a853", location: "FigJam", day: 9,
    notes: "Target, Sense, Goal, Mechanics, Interface, Safeguards. Ready to submit? poll is still at No votes yet." },
  { id: 5, title: "Fig Build submission deadline 11:00 PM EST", time: "23:00", endTime: "23:30", color: "#d50000", day: 9,
    notes: "Monday, March 9th @ 11:00 PM EST" },

  // Sun Mar 8
  { id: 6, title: "Storyboard pass (Miami)", time: "10:00", endTime: "12:00", color: "#7c4dff", location: "Figma", day: 8,
    notes: "gradient —> color zoom\npop up keyboard, pop up UX/UI over gradient bg\nlogin + begin work\nstress up, focus down —> toggles moving\n37 secs or 20 secs??" },
  { id: 7, title: "Build: calibration flow", time: "13:00", endTime: "17:00", color: "#00897b", location: "Figma Make", day: 8,
    notes: "Arya + FigMake Agent. Three-phase calibration: Visual, Spatial, Kinetic & Acoustic. Everything stays local. No network calls in the calibration path." },
  { id: 8, title: "Product doc v3 -> v4", time: "20:00", endTime: "21:30", color: "#e91e63", day: 8,
    notes: "fold in arya's comments + the lawyer audience + charlie rename. FREAKOFF CORNER stays at the bottom, non negotiable" },

  // Sat Mar 7
  { id: 9, title: "Research sync", time: "10:00", endTime: "11:30", color: "#34a853", location: "Zoom", day: 7,
    notes: "flow neuroscience (frontiers LC-NE paper, tonic vs phasic norepinephrine!!), penn medicine traffic controllers thing, audiences. bring links!!!!" },
  { id: 10, title: "Extended Mind reading", time: "13:00", endTime: "14:00", color: "#00897b", day: 7,
    notes: "Clark & Chalmers. Otto and the notebook. I want to understand the four criteria before we put the paper in the deck." },
  { id: 11, title: "Moodboard: ink on paper vs gradient", time: "15:00", endTime: "16:30", color: "#7c4dff", location: "Pinterest", day: 7,
    notes: "ink on paper?\ngradient?\nboth —> depth of field timeline??" },
  { id: 12, title: "Product doc v1 -> v2", time: "18:00", endTime: "20:00", color: "#e91e63", day: 7 },

  // Fri Mar 6
  { id: 13, title: "Brain dumps due", time: "17:00", endTime: "18:00", color: "#fbbc04", day: 6,
    notes: "everyone dumps every sense idea. no filtering. humans have 22–33 distinct senses, pick one nobody measures" },
  { id: 14, title: "Concept sync", time: "19:00", endTime: "20:30", color: "#4285f4", location: "Zoom", day: 6,
    notes: "Same question as Clay/Gyrus: how does a tool protect thinking instead of extracting it." },
];

/** "14:00" -> "2:00 PM" */
function fmt(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

// March 2026 starts on a Sunday
const MARCH_2026_START_DAY = 0; // 0 = Sunday
const DAYS_IN_MARCH = 31;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => i + 7); // 7 AM to 11 PM (the deadline lives at 11)

type ViewMode = "month" | "day";

export function CalendarApp() {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDay, setSelectedDay] = useState(9); // Today
  const [showNewEvent, setShowNewEvent] = useState(false);

  const todayEvents = EVENTS.filter(e => e.day === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Build month grid
  const monthGrid: (number | null)[][] = [];
  let week: (number | null)[] = Array(MARCH_2026_START_DAY).fill(null);
  for (let d = 1; d <= DAYS_IN_MARCH; d++) {
    week.push(d);
    if (week.length === 7) {
      monthGrid.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    monthGrid.push(week);
  }

  return (
    <div className="size-full flex flex-col" style={{ backgroundColor: "#ffffff" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b shrink-0"
        style={{ borderColor: "#e0e0e0" }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-xl" style={{ color: "#3c4043" }}>
            March 2026
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedDay(d => Math.max(1, d - 1))}
              className="p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <ChevronLeft size={20} style={{ color: "#5f6368" }} />
            </button>
            <button
              onClick={() => setSelectedDay(d => Math.min(DAYS_IN_MARCH, d + 1))}
              className="p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <ChevronRight size={20} style={{ color: "#5f6368" }} />
            </button>
          </div>
          <button
            onClick={() => setSelectedDay(9)}
            className="px-4 py-1.5 rounded-md border text-sm cursor-pointer hover:bg-gray-50"
            style={{ borderColor: "#dadce0", color: "#3c4043" }}
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border overflow-hidden" style={{ borderColor: "#dadce0" }}>
            <button
              onClick={() => setViewMode("day")}
              className="px-3 py-1.5 text-xs cursor-pointer"
              style={{
                backgroundColor: viewMode === "day" ? "#e8f0fe" : "#ffffff",
                color: viewMode === "day" ? "#1967d2" : "#5f6368",
              }}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode("month")}
              className="px-3 py-1.5 text-xs cursor-pointer"
              style={{
                backgroundColor: viewMode === "month" ? "#e8f0fe" : "#ffffff",
                color: viewMode === "month" ? "#1967d2" : "#5f6368",
              }}
            >
              Month
            </button>
          </div>
          <button
            onClick={() => setShowNewEvent(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm text-white cursor-pointer shadow"
            style={{ backgroundColor: "#1a73e8" }}
          >
            <Plus size={16} />
            Create
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mini Month + Upcoming (sidebar) */}
        <div
          className="w-56 shrink-0 border-r overflow-y-auto p-4"
          style={{ borderColor: "#e0e0e0" }}
        >
          {/* Mini Calendar Grid */}
          <div className="mb-4">
            <div className="grid grid-cols-7 gap-0 mb-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-xs py-1" style={{ color: "#70757a" }}>
                  {d[0]}
                </div>
              ))}
            </div>
            {monthGrid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-0">
                {week.map((day, di) => {
                  if (day === null) return <div key={di} />;
                  const hasEvents = EVENTS.some(e => e.day === day);
                  const isSelected = day === selectedDay;
                  const isToday = day === 9;
                  return (
                    <button
                      key={di}
                      onClick={() => { setSelectedDay(day); setViewMode("day"); }}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-xs cursor-pointer relative"
                      style={{
                        backgroundColor: isSelected ? "#1a73e8" : "transparent",
                        color: isSelected ? "#ffffff" : isToday ? "#1a73e8" : "#3c4043",
                      }}
                    >
                      {day}
                      {hasEvents && !isSelected && (
                        <div
                          className="absolute bottom-0.5 w-1 h-1 rounded-full"
                          style={{ backgroundColor: "#1a73e8" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Upcoming */}
          <div>
            <div className="text-xs uppercase mb-2" style={{ color: "#70757a", letterSpacing: "0.05em" }}>
              Upcoming
            </div>
            <div className="space-y-2">
              {EVENTS.filter(e => e.day >= 9).slice(0, 5).map(event => (
                <div
                  key={event.id}
                  className="flex items-start gap-2 cursor-pointer"
                  onClick={() => { setSelectedDay(event.day); setViewMode("day"); }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: event.color }}
                  />
                  <div>
                    <div className="text-xs" style={{ color: "#3c4043" }}>{event.title}</div>
                    <div className="text-xs" style={{ color: "#70757a" }}>
                      Mar {event.day} · {fmt(event.time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Calendar View */}
        <div className="flex-1 overflow-y-auto">
          {viewMode === "month" ? (
            /* ── Month Grid ─────────────────────── */
            <div className="p-4">
              <div className="grid grid-cols-7 gap-0 border-l border-t" style={{ borderColor: "#e0e0e0" }}>
                {/* Header */}
                {WEEKDAYS.map(d => (
                  <div
                    key={d}
                    className="text-center text-xs py-2 border-r border-b"
                    style={{ color: "#70757a", borderColor: "#e0e0e0" }}
                  >
                    {d}
                  </div>
                ))}
                {/* Days */}
                {monthGrid.flat().map((day, i) => {
                  const dayEvents = day ? EVENTS.filter(e => e.day === day) : [];
                  return (
                    <div
                      key={i}
                      className="border-r border-b p-1 cursor-pointer hover:bg-gray-50"
                      style={{ borderColor: "#e0e0e0", minHeight: "80px" }}
                      onClick={() => { if (day) { setSelectedDay(day); setViewMode("day"); } }}
                    >
                      {day && (
                        <>
                          <div
                            className="text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full"
                            style={{
                              color: day === 9 ? "#ffffff" : "#3c4043",
                              backgroundColor: day === 9 ? "#1a73e8" : "transparent",
                            }}
                          >
                            {day}
                          </div>
                          {dayEvents.slice(0, 3).map(ev => (
                            <div
                              key={ev.id}
                              className="text-xs px-1 py-0.5 rounded mb-0.5 truncate"
                              style={{ backgroundColor: `${ev.color}20`, color: ev.color }}
                            >
                              {fmt(ev.time)} {ev.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs px-1" style={{ color: "#5f6368" }}>
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Day View (time slots) ──────────── */
            <div className="relative">
              {/* Day Header */}
              <div
                className="sticky top-0 z-10 px-4 py-3 border-b"
                style={{ backgroundColor: "#ffffff", borderColor: "#e0e0e0" }}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl" style={{ color: selectedDay === 9 ? "#1a73e8" : "#3c4043" }}>
                    {selectedDay}
                  </span>
                  <span className="text-sm" style={{ color: "#70757a" }}>
                    {WEEKDAYS[(MARCH_2026_START_DAY + selectedDay - 1) % 7]}
                    {selectedDay === 9 && <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#e8f0fe", color: "#1967d2" }}>Today</span>}
                  </span>
                </div>
              </div>

              {/* Time Grid */}
              <div className="relative ml-16">
                {TIME_SLOTS.map(hour => (
                  <div key={hour} className="relative" style={{ height: "60px" }}>
                    <div
                      className="absolute -left-16 text-xs"
                      style={{ color: "#70757a", top: "-6px" }}
                    >
                      {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                    </div>
                    <div className="border-t h-full" style={{ borderColor: "#e8eaed" }} />
                  </div>
                ))}

                {/* Events overlay */}
                {todayEvents.map(event => {
                  const [startH, startM] = event.time.split(":").map(Number);
                  const [endH, endM] = event.endTime.split(":").map(Number);
                  const topPx = (startH - 7) * 60 + (startM || 0);
                  const heightPx = Math.max(30, (endH - startH) * 60 + ((endM || 0) - (startM || 0)));

                  return (
                    <div
                      key={event.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", event.title);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      className="absolute left-1 right-4 rounded-lg px-3 py-1.5 cursor-pointer overflow-hidden"
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        backgroundColor: `${event.color}18`,
                        borderLeft: `3px solid ${event.color}`,
                        color: event.color,
                      }}
                    >
                      <div className="text-sm" style={{ fontWeight: 500 }}>{event.title}</div>
                      <div className="flex items-center gap-2 text-xs mt-0.5" style={{ opacity: 0.8 }}>
                        <span>{fmt(event.time)} – {fmt(event.endTime)}</span>
                        {event.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin size={10} /> {event.location}
                          </span>
                        )}
                      </div>
                      {event.notes && (
                        <div className="text-xs mt-1 whitespace-pre-line" style={{ color: "#3c4043", opacity: 0.85 }}>
                          {event.notes}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Current time indicator */}
                {selectedDay === 9 && (
                  <div
                    className="absolute left-0 right-0 flex items-center"
                    style={{ top: `${(10 - 7) * 60 + 30}px` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#ea4335" }} />
                    <div className="flex-1 h-px" style={{ backgroundColor: "#ea4335" }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Event Modal */}
      {showNewEvent && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.3)", zIndex: 100 }}>
          <div className="rounded-xl shadow-2xl p-5" style={{ width: "380px", backgroundColor: "#ffffff" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg" style={{ color: "#3c4043" }}>New Event</h2>
              <button onClick={() => setShowNewEvent(false)} className="p-1 rounded hover:bg-gray-100 cursor-pointer">
                <X size={18} style={{ color: "#5f6368" }} />
              </button>
            </div>
            <input
              className="w-full text-lg border-b pb-2 mb-3 outline-none"
              style={{ borderColor: "#4285f4", color: "#3c4043" }}
              placeholder="Add title"
              autoFocus
            />
            <div className="flex items-center gap-2 mb-3 text-sm" style={{ color: "#5f6368" }}>
              <Clock size={16} />
              <span>March {selectedDay}, 2026 · 9:00 AM – 10:00 AM</span>
            </div>
            <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: "#5f6368" }}>
              <MapPin size={16} />
              <input
                className="flex-1 bg-transparent border-none outline-none"
                style={{ color: "#3c4043" }}
                placeholder="Add location"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewEvent(false)}
                className="px-4 py-2 rounded text-sm cursor-pointer"
                style={{ color: "#1a73e8" }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNewEvent(false)}
                className="px-4 py-2 rounded text-sm text-white cursor-pointer"
                style={{ backgroundColor: "#1a73e8" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}