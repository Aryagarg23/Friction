/**
 * TACTILE STRIKE
 *
 * When a task is struck, a small card shows what was done and what is next.
 * SessionContext clears it after 2s; DesktopOS fades it out.
 * It never takes the pointer.
 */

import { motion } from "motion/react";

interface Props {
  completedTask: string;
  nextTask: string;
}

export function TactileStrike({ completedTask, nextTask }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 8000, fontFamily: "var(--pi-font)" }}
    >
      <div
        className="flex flex-col gap-3"
        style={{
          minWidth: 240,
          maxWidth: 360,
          padding: "16px 20px",
          backgroundColor: "var(--pi-surface)",
          border: "1px solid var(--pi-hairline)",
        }}
      >
        <div>
          <div className="pi-label mb-1">Done</div>
          <div
            className="line-through"
            style={{ fontSize: "0.8rem", color: "var(--pi-ink-45)" }}
          >
            {completedTask}
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--pi-hairline)", paddingTop: 12 }}>
          <div className="pi-label mb-1">Next</div>
          <div style={{ fontSize: "0.8rem", color: "var(--pi-ink)" }}>{nextTask}</div>
        </div>
      </div>
    </motion.div>
  );
}
