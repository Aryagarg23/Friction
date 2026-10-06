/**
 * MUSIC CREATOR — Refocus Exercise A
 *
 * Renders the Build-a-Song HTML experience inside a sandboxed iframe.
 * The outer shell is a flat ground backdrop and a square close button.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { BUILD_A_SONG_HTML } from "./build-a-song-html";

interface Props {
  onClose: () => void;
}

export function MusicCreator({ onClose }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Clean up any audio contexts when the component unmounts
  useEffect(() => {
    return () => {
      try {
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
          // Try to close the AudioContext if it exists
          const win = iframe.contentWindow as any;
          if (win.audioCtx) {
            win.audioCtx.close();
          }
        }
      } catch {
        // iframe may already be gone, ignore
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
      className="absolute inset-0 flex items-center justify-center"
      style={{
        zIndex: 9200,
        backgroundColor: "var(--pi-ground)",
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        title="Close"
        className="pi-btn absolute top-4 right-4 flex items-center justify-center"
        style={{ zIndex: 9300, width: 32, height: 32, padding: 0, backgroundColor: "var(--pi-surface)" }}
      >
        <X size={16} />
      </button>

      {/* ── Full-bleed iframe for the Build-a-Song experience ── */}
      <iframe
        ref={iframeRef}
        srcDoc={BUILD_A_SONG_HTML}
        title="Make a beat"
        className="absolute inset-0 w-full h-full"
        style={{
          border: "none",
          background: "transparent",
          opacity: loaded ? 1 : 0,
          transition: "opacity var(--pi-ease-focus)",
        }}
        sandbox="allow-scripts allow-same-origin"
        onLoad={() => setLoaded(true)}
      />
    </motion.div>
  );
}