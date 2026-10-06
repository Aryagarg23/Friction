/**
 * REFOCUS POPUP — focus <= 0.30
 *
 * A small panel with three short exercises. Picking one opens it full
 * screen. Closing an exercise counts as doing it and lifts focus to 0.55.
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MusicCreator } from "./exercises/MusicCreator";
import { BreathingVisualizer } from "./exercises/BreathingVisualizer";
import { ConstellationYoga } from "./exercises/ConstellationYoga";
import { useBiometrics } from "../../context/BiometricContext";

type Exercise = "music" | "breathing" | "constellation" | null;

const OPTIONS = [
  { key: "music" as const, label: "Make a beat", description: "Tap out a short rhythm." },
  { key: "breathing" as const, label: "Breathing", description: "Breathe slowly for a minute." },
  { key: "constellation" as const, label: "Stretch", description: "Stand up and move a little." },
];

const EASE_FOCUS = [0.32, 0.72, 0, 1] as const;

export function RefocusPopup() {
  const [activeExercise, setActiveExercise] = useState<Exercise>(null);
  const { simulateGradualChange } = useBiometrics();

  /** Closing an exercise = completing it → boost focus above 0.30 threshold */
  const handleExerciseClose = useCallback(() => {
    setActiveExercise(null);
    // Boost focus to 0.55 over 2s — enough to clear the RefocusPopup threshold
    simulateGradualChange({ focus_percent: 0.55 }, 2000);
  }, [simulateGradualChange]);

  return (
    <>
      <AnimatePresence>
        {activeExercise === "music" && <MusicCreator onClose={handleExerciseClose} />}
        {activeExercise === "breathing" && <BreathingVisualizer onClose={handleExerciseClose} />}
        {activeExercise === "constellation" && <ConstellationYoga onClose={handleExerciseClose} />}
      </AnimatePresence>

      <AnimatePresence>
        {!activeExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.34, ease: EASE_FOCUS }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              zIndex: 8500,
              backgroundColor: "color-mix(in srgb, var(--pi-ground) 80%, transparent)",
              fontFamily: "var(--pi-font)",
            }}
          >
            <div
              style={{
                width: 360,
                backgroundColor: "var(--pi-surface)",
                border: "1px solid var(--pi-hairline)",
                padding: 20,
              }}
            >
              <p style={{ fontSize: "0.85rem", color: "var(--pi-ink)", lineHeight: 1.5, marginBottom: 16 }}>
                Your focus is low. Pick something short to reset.
              </p>

              <div className="flex flex-col">
                {OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setActiveExercise(opt.key)}
                    className="flex items-baseline justify-between gap-4 text-left cursor-pointer text-[color:var(--pi-ink)] hover:bg-[var(--pi-ink)] hover:text-[color:var(--pi-ground)]"
                    style={{
                      padding: "10px 12px",
                      border: "1px solid var(--pi-ink)",
                      marginTop: -1,
                      transition: "background-color var(--pi-ease-hover), color var(--pi-ease-hover)",
                    }}
                  >
                    <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>{opt.label}</span>
                    <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
