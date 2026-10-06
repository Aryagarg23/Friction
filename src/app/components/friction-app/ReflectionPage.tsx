/**
 * RECAP SCREEN (drawerScreen "mirror")
 * ============================================================
 * Three tabs:
 *   Last session: the tasks from the session that just ended, plus notes.
 *   History:      totals, recent sessions, and two small charts.
 *   Details:      one total at a time, with plain notes on what it means.
 *
 * Works in the split (45%) and full screen drawer. Charts are plain SVG.
 */

import { useState, useMemo } from "react";
import { NO_AUTOFILL } from "@/app/lib/noAutofill";
import {
  FRICTION_FONTS, FRICTION_COLORS, labelStyle, bodyStyle, dataStyle,
} from "./friction-styles";
import {
  PAST_SESSIONS, INTENSITY_DISTRIBUTION, SESSIONS_THIS_MONTH,
  TOTAL_DEEP_WORK_HOURS, WEEKLY_INTENSITY, HOURLY_INTENSITY,
  DETAIL_INSIGHTS, type ReflectionTask,
} from "./reflection-data";

// ── Types ───────────────────────────────────────────────────

type SubScreen = "recap" | "history" | "detail";
type DetailView = "intensity" | "sessions" | "hours";

interface ReflectionPageProps {
  /** Tasks from the current/latest session via SessionContext */
  sessionTasks: { id: string; title: string; cognitiveWeight: number; completed: boolean; category: string; estimatedMinutes: number }[];
  /** Is the drawer in full-screen (100%) or split (45%) mode? */
  fullScreen?: boolean;
}

// ── Helpers ─────────────────────────────────────────────────

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** One word for how hard something was. Data uses high/moderate/low and High/Moderate/Calm. */
function levelWord(label: string): string {
  const l = label.toLowerCase();
  if (l === "high") return "Hard";
  if (l === "moderate") return "Medium";
  return "Light";
}

const ruleRow: React.CSSProperties = {
  borderBottom: `1px solid ${FRICTION_COLORS.borderDefault}`,
};

const numeric: React.CSSProperties = {
  ...dataStyle,
  fontSize: "0.75rem",
  textAlign: "right",
  whiteSpace: "nowrap",
};

// Bars use ink at a few strengths. Height or length carries the value.
const INK_STRONG = "var(--pi-ink)";
const INK_MID = "var(--pi-ink-60)";
const INK_SOFT = "var(--pi-ink-20)";

/** Text tab: plain word, underlined when selected. */
function TextTab({
  selected, onClick, children,
}: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`cursor-pointer py-1 transition-opacity duration-150 ${selected ? "" : "opacity-60 hover:opacity-100"}`}
      style={{
        fontFamily: FRICTION_FONTS.body,
        fontSize: "0.8rem",
        fontWeight: selected ? 500 : 400,
        color: FRICTION_COLORS.textPrimary,
        background: "none",
        border: "none",
        borderBottom: `1px solid ${selected ? FRICTION_COLORS.textPrimary : "transparent"}`,
        padding: "4px 0",
      }}
    >
      {children}
    </button>
  );
}

// ── Main Component ──────────────────────────────────────────

export function ReflectionPage({ sessionTasks, fullScreen = false }: ReflectionPageProps) {
  const [screen, setScreen] = useState<SubScreen>("recap");
  const [detailView, setDetailView] = useState<DetailView>("intensity");
  const [reflectionText, setReflectionText] = useState("");

  const goToDetail = (view: DetailView) => {
    setDetailView(view);
    setScreen("detail");
  };

  const isSquished = !fullScreen;

  return (
    <div
      className="flex flex-col h-full"
      style={{ fontFamily: FRICTION_FONTS.body, color: FRICTION_COLORS.textPrimary }}
    >
      <div
        className="flex items-center gap-5 px-5 shrink-0"
        style={{ borderBottom: `1px solid ${FRICTION_COLORS.borderDefault}` }}
      >
        {([
          { key: "recap", label: "Last session" },
          { key: "history", label: "History" },
          { key: "detail", label: "Details" },
        ] as const).map(tab => (
          <TextTab key={tab.key} selected={screen === tab.key} onClick={() => setScreen(tab.key)}>
            {tab.label}
          </TextTab>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {screen === "recap" && (
          <RecapScreen
            sessionTasks={sessionTasks}
            reflectionText={reflectionText}
            onReflectionChange={setReflectionText}
            isSquished={isSquished}
          />
        )}
        {screen === "history" && (
          <HistoryScreen onDrillDown={goToDetail} isSquished={isSquished} />
        )}
        {screen === "detail" && (
          <DetailScreen activeView={detailView} onChangeView={setDetailView} isSquished={isSquished} />
        )}
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
//  LAST SESSION
// ══════════════════════════════════════════════════════════════

function RecapScreen({
  sessionTasks, reflectionText, onReflectionChange, isSquished,
}: {
  sessionTasks: ReflectionPageProps["sessionTasks"];
  reflectionText: string;
  onReflectionChange: (v: string) => void;
  isSquished: boolean;
}) {
  // Use the live session's tasks, or the latest past session as a fallback.
  const tasks: ReflectionTask[] = useMemo(() => {
    if (sessionTasks.length > 0) {
      return sessionTasks.map(t => ({
        id: t.id,
        title: t.title,
        intensity: t.cognitiveWeight > 0.6 ? "high" as const
          : t.cognitiveWeight > 0.35 ? "moderate" as const
          : "low" as const,
        durationMinutes: t.estimatedMinutes,
        completed: t.completed,
      }));
    }
    return PAST_SESSIONS[0].tasks;
  }, [sessionTasks]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalDuration = tasks.reduce((s, t) => s + t.durationMinutes, 0);

  return (
    <div className="px-5 py-5 space-y-6" style={{ maxWidth: 720 }}>
      <p style={{ ...bodyStyle, margin: 0, fontVariantNumeric: "tabular-nums" }}>
        {completedCount} of {tasks.length} tasks done · {formatDuration(totalDuration)}
      </p>

      <div style={{ borderTop: `1px solid ${FRICTION_COLORS.borderDefault}` }}>
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-3 py-2" style={ruleRow}>
            <span
              aria-label={task.completed ? "Done" : "Not done"}
              className="shrink-0"
              style={{
                width: 8, height: 8,
                border: `1px solid ${FRICTION_COLORS.textPrimary}`,
                backgroundColor: task.completed ? FRICTION_COLORS.textPrimary : "transparent",
              }}
            />
            <span
              className="flex-1 truncate"
              style={{
                fontSize: "0.8rem",
                color: task.completed ? FRICTION_COLORS.textPrimary : FRICTION_COLORS.textMuted,
              }}
            >
              {task.title}
            </span>
            <span className="shrink-0" style={{ fontSize: "0.75rem", color: FRICTION_COLORS.textSecondary, minWidth: 48 }}>
              {levelWord(task.intensity)}
            </span>
            <span className="shrink-0" style={{ ...numeric, color: FRICTION_COLORS.textSecondary, minWidth: 64 }}>
              {formatDuration(task.durationMinutes)}
            </span>
          </div>
        ))}
      </div>

      <div>
        <label htmlFor="friction-reflection" style={{ ...labelStyle, display: "block", marginBottom: 6 }}>
          What went well?
        </label>
        <textarea {...NO_AUTOFILL}
          id="friction-reflection"
          value={reflectionText}
          onChange={e => onReflectionChange(e.target.value)}
          placeholder="A few words are enough."
          rows={isSquished ? 3 : 4}
          className="w-full resize-none px-3 py-2 outline-none"
          style={{
            ...bodyStyle,
            fontSize: "0.8rem",
            backgroundColor: FRICTION_COLORS.bgElevated,
            border: `1px solid ${FRICTION_COLORS.borderDefault}`,
            borderRadius: 0,
            transition: "border-color var(--pi-ease-hover)",
          }}
          onFocus={e => { e.target.style.borderColor = FRICTION_COLORS.borderActive; }}
          onBlur={e => { e.target.style.borderColor = FRICTION_COLORS.borderDefault; }}
        />
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
//  HISTORY
// ══════════════════════════════════════════════════════════════

function HistoryScreen({
  onDrillDown, isSquished,
}: {
  onDrillDown: (view: DetailView) => void;
  isSquished: boolean;
}) {
  const totals: { view: DetailView; label: string; value: string; unit: string }[] = [
    { view: "intensity", label: "Effort", value: `${INTENSITY_DISTRIBUTION.high}%`, unit: "hard" },
    { view: "sessions", label: "Sessions", value: `${SESSIONS_THIS_MONTH}`, unit: "this month" },
    { view: "hours", label: "Hours", value: `${TOTAL_DEEP_WORK_HOURS}`, unit: "in total" },
  ];

  return (
    <div className="px-5 py-5 space-y-8">
      {/* Totals. Each one opens its Details view. */}
      <div
        className="grid grid-cols-3"
        style={{ borderTop: `1px solid ${FRICTION_COLORS.borderDefault}`, borderBottom: `1px solid ${FRICTION_COLORS.borderDefault}` }}
      >
        {totals.map((t, i) => (
          <button
            key={t.view}
            type="button"
            onClick={() => onDrillDown(t.view)}
            title="Show details"
            className="text-left cursor-pointer px-3 py-3 bg-transparent hover:bg-[var(--pi-ink-08)]"
            style={{
              border: "none",
              borderLeft: i === 0 ? "none" : `1px solid ${FRICTION_COLORS.borderDefault}`,
              color: FRICTION_COLORS.textPrimary,
              transition: "background-color var(--pi-ease-hover)",
            }}
          >
            <div style={labelStyle}>{t.label}</div>
            <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
              <span style={{ ...dataStyle, fontSize: isSquished ? "1.1rem" : "1.4rem", fontWeight: 500 }}>{t.value}</span>
              <span style={{ fontSize: "0.75rem", color: FRICTION_COLORS.textSecondary }}>{t.unit}</span>
            </div>
          </button>
        ))}
      </div>

      <div>
        <div style={{ ...labelStyle, marginBottom: 6 }}>Recent sessions</div>
        <div style={{ borderTop: `1px solid ${FRICTION_COLORS.borderDefault}` }}>
          {PAST_SESSIONS.map(session => (
            <div key={session.id} className="flex items-center gap-3 py-2" style={ruleRow}>
              <span style={{ fontSize: "0.8rem", minWidth: 52 }}>{session.dateShort}</span>
              <span className="flex-1 truncate" style={{ fontSize: "0.75rem", color: FRICTION_COLORS.textMuted }}>
                {session.dayOfWeek}
              </span>
              <span style={{ ...numeric, minWidth: 72 }}>{formatDuration(session.durationMinutes)}</span>
              <span style={{ ...numeric, color: FRICTION_COLORS.textSecondary, minWidth: 52 }}>{session.taskCount} tasks</span>
              <span style={{ fontSize: "0.75rem", color: FRICTION_COLORS.textSecondary, minWidth: 48 }}>
                {levelWord(session.intensityLabel)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={isSquished ? "space-y-8" : "grid grid-cols-2 gap-8"}>
        <div>
          <div style={{ ...labelStyle, marginBottom: 8 }}>Effort by weekday</div>
          <WeekdayBars height={isSquished ? 72 : 96} />
        </div>
        <div>
          <div style={{ ...labelStyle, marginBottom: 8 }}>Effort by hour</div>
          <HourBars height={isSquished ? 72 : 96} />
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
//  DETAILS
// ══════════════════════════════════════════════════════════════

function DetailScreen({
  activeView, onChangeView, isSquished,
}: {
  activeView: DetailView;
  onChangeView: (v: DetailView) => void;
  isSquished: boolean;
}) {
  const insight = DETAIL_INSIGHTS[activeView];
  const viewLabels: Record<DetailView, string> = { intensity: "Effort", sessions: "Sessions", hours: "Hours" };

  return (
    <div className="px-5 py-5 space-y-6">
      <div className="flex items-center gap-4">
        {(["intensity", "sessions", "hours"] as const).map(v => (
          <TextTab key={v} selected={activeView === v} onClick={() => onChangeView(v)}>
            {viewLabels[v]}
          </TextTab>
        ))}
      </div>

      <div className={isSquished ? "space-y-6" : "flex gap-8"}>
        <div className={isSquished ? "" : "flex-1 min-w-0"}>
          {activeView === "intensity" && <EffortSplit />}
          {activeView === "sessions" && (
            <div className="flex items-baseline gap-2 py-4">
              <span style={{ ...dataStyle, fontSize: "2.5rem", fontWeight: 500, lineHeight: 1 }}>{SESSIONS_THIS_MONTH}</span>
              <span style={{ fontSize: "0.85rem", color: FRICTION_COLORS.textSecondary }}>sessions this month</span>
            </div>
          )}
          {activeView === "hours" && <SessionHourBars height={isSquished ? 110 : 160} />}
        </div>

        <div className={isSquished ? "space-y-6" : "w-[300px] shrink-0 space-y-6"}>
          <dl style={{ margin: 0, borderTop: `1px solid ${FRICTION_COLORS.borderDefault}` }}>
            {insight.miniStats.map(stat => (
              <div key={stat.label} className="flex items-baseline justify-between gap-3 py-2" style={ruleRow}>
                <dt style={{ fontSize: "0.8rem", color: FRICTION_COLORS.textSecondary }}>{stat.label}</dt>
                <dd style={{ ...numeric, fontSize: "0.8rem", margin: 0 }}>{stat.value}</dd>
              </div>
            ))}
          </dl>

          <div className="space-y-3">
            {insight.paragraphs.map((p, i) => (
              <p key={i} style={{ ...bodyStyle, fontSize: "0.8rem", margin: 0 }}>{p}</p>
            ))}
          </div>

          <div>
            <div style={{ ...labelStyle, marginBottom: 6 }}>What to try</div>
            <p style={{ ...bodyStyle, fontSize: "0.8rem", margin: 0 }}>{insight.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
//  CHARTS
// ══════════════════════════════════════════════════════════════

/** Share of hard / medium / light sessions as one stacked bar. */
function EffortSplit() {
  const parts = [
    { pct: INTENSITY_DISTRIBUTION.high, fill: INK_STRONG, label: "Hard" },
    { pct: INTENSITY_DISTRIBUTION.moderate, fill: INK_MID, label: "Medium" },
    { pct: INTENSITY_DISTRIBUTION.calm, fill: INK_SOFT, label: "Light" },
  ];
  return (
    <div className="py-2">
      <div className="flex" style={{ height: 12 }}>
        {parts.map(p => (
          <div key={p.label} style={{ width: `${p.pct}%`, backgroundColor: p.fill }} />
        ))}
      </div>
      <div className="flex mt-2">
        {parts.map(p => (
          <div key={p.label} style={{ width: `${p.pct}%`, fontSize: "0.75rem", fontVariantNumeric: "tabular-nums" }}>
            {p.pct}% <span style={{ color: FRICTION_COLORS.textSecondary }}>{p.label.toLowerCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function axisText(x: number, y: number, text: string, key?: string | number) {
  return (
    <text
      key={key}
      x={x} y={y}
      textAnchor="middle"
      style={{ fill: FRICTION_COLORS.textMuted, fontFamily: FRICTION_FONTS.body, fontSize: 9, fontVariantNumeric: "tabular-nums" }}
    >
      {text}
    </text>
  );
}

/** Average effort per weekday. */
function WeekdayBars({ height }: { height: number }) {
  const n = WEEKLY_INTENSITY.length;
  const slot = 32;
  const bar = 20;
  const width = n * slot;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height + 14}`} style={{ maxWidth: 320, display: "block" }}>
      <line x1={0} x2={width} y1={height + 0.5} y2={height + 0.5} style={{ stroke: FRICTION_COLORS.borderDefault }} />
      {WEEKLY_INTENSITY.map((item, i) => {
        const h = item.value * (height - 4);
        const x = i * slot + (slot - bar) / 2;
        return (
          <g key={item.day}>
            <rect x={x} y={height - h} width={bar} height={h} style={{ fill: INK_MID }} />
            {axisText(x + bar / 2, height + 12, item.day)}
          </g>
        );
      })}
    </svg>
  );
}

/** Average effort for each hour of the day, midnight to midnight. */
function HourBars({ height }: { height: number }) {
  const slot = 12;
  const bar = 8;
  const width = 24 * slot;
  const ticks = [0, 6, 12, 18];
  const tickLabel = (h: number) => (h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`);
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height + 14}`} style={{ maxWidth: 320, display: "block" }}>
      <line x1={0} x2={width} y1={height + 0.5} y2={height + 0.5} style={{ stroke: FRICTION_COLORS.borderDefault }} />
      {HOURLY_INTENSITY.map((v, hour) => {
        const h = v * (height - 4);
        return (
          <rect key={hour} x={hour * slot + (slot - bar) / 2} y={height - h} width={bar} height={h} style={{ fill: INK_MID }} />
        );
      })}
      {ticks.map(h => axisText(h * slot + slot / 2, height + 12, tickLabel(h), h))}
    </svg>
  );
}

/** Hours per session for the last 7 sessions, oldest first. */
function SessionHourBars({ height }: { height: number }) {
  const data = PAST_SESSIONS.slice(0, 7).reverse().map(s => ({
    label: s.dateShort,
    hours: +(s.durationMinutes / 60).toFixed(1),
  }));
  const maxHours = Math.max(...data.map(d => d.hours));
  const slot = 44;
  const bar = 28;
  const top = 14;
  const width = data.length * slot;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height + 16}`} style={{ maxWidth: 420, display: "block" }}>
      <line x1={0} x2={width} y1={height + 0.5} y2={height + 0.5} style={{ stroke: FRICTION_COLORS.borderDefault }} />
      {data.map((item, i) => {
        const h = (item.hours / maxHours) * (height - top);
        const x = i * slot + (slot - bar) / 2;
        return (
          <g key={item.label}>
            <rect x={x} y={height - h} width={bar} height={h} style={{ fill: INK_MID }} />
            <text
              x={x + bar / 2} y={height - h - 4}
              textAnchor="middle"
              style={{ fill: FRICTION_COLORS.textSecondary, fontFamily: FRICTION_FONTS.body, fontSize: 9, fontVariantNumeric: "tabular-nums" }}
            >
              {item.hours} h
            </text>
            {axisText(x + bar / 2, height + 12, item.label)}
          </g>
        );
      })}
    </svg>
  );
}
