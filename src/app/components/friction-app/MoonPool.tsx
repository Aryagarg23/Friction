/**
 * MOON POOL
 *
 * The orb on the Plan screen. Each task in this session is a particle;
 * the more total weight, the denser, warmer and more restless the pool.
 * It is also a drop target: drag a task from "Later" or text from any app
 * onto it to add it to this session.
 */

import { useState, useRef, useEffect } from "react";
import { useDrop } from "react-dnd";
import { MoonPoolCanvas } from "./MoonPoolCanvas";
import { getPoolStage } from "./moon-pool-stages";
import { ITEM_TYPE, type DragItem } from "./DraggableOverlayTask";

interface PoolTask {
  id: string;
  cognitiveWeight: number;
  category: string;
}

interface Props {
  tasks: PoolTask[];
  /** Session length in minutes; a longer session makes the outer glow stronger. */
  sessionDurationMin: number;
  size: number;
  onMoveToPool?: (id: string) => void;
  onDropText?: (text: string) => void;
}

export function MoonPool({ tasks, sessionDurationMin, size, onMoveToPool, onDropText }: Props) {
  const [nativeOver, setNativeOver] = useState(false);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  const totalWeight = tasks.reduce((sum, t) => sum + t.cognitiveWeight, 0);
  const density = Math.min(1, totalWeight / 3);
  const stage = getPoolStage(density);
  const timeGlow = Math.min(1, Math.max(0, (sessionDurationMin - 15) / (300 - 15)));

  const [{ isOver, canDrop }, dropRef] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: ITEM_TYPE,
    canDrop: (item) => item.list === "general",
    drop: (item) => onMoveToPool?.(item.id),
    collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }), canDrop: monitor.canDrop() }),
  });

  const highlight = nativeOver || (isOver && canDrop);

  const pulse = () => {
    setFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(false), 600);
  };

  return (
    <div className="flex flex-col items-center">
      <div
        ref={dropRef as unknown as React.Ref<HTMLDivElement>}
        className="relative overflow-hidden"
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("text/plain")) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setNativeOver(true);
        }}
        onDragLeave={() => setNativeOver(false)}
        onDrop={(e) => {
          setNativeOver(false);
          const text = e.dataTransfer.getData("text/plain")?.trim();
          if (text && onDropText) {
            e.preventDefault();
            // The section around the pool is also a text drop target; stop here so the task is added once.
            e.stopPropagation();
            onDropText(text);
            pulse();
          }
        }}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${stage.gradient[0]} 0%, ${stage.gradient[1]} 45%, ${stage.gradient[2]} 100%)`,
          border: `${highlight ? 2 : 1}px solid ${highlight ? "var(--pi-blue)" : stage.border}`,
          boxShadow: `${stage.innerGlow}, 0 0 ${Math.round(8 + timeGlow * 40)}px rgba(107, 95, 255, ${(0.05 + timeGlow * 0.35).toFixed(2)})`,
          transition: "border-color 0.3s, box-shadow 0.5s",
        }}
        aria-label="Moon Pool: drop a task here to add it to this session"
      >
        <MoonPoolCanvas size={size} tasks={tasks.slice(0, 12)} density={density} stage={stage} dragOver={highlight} />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            pointerEvents: "none",
            background: "radial-gradient(circle, rgba(107, 95, 255, 0.35) 0%, transparent 70%)",
            opacity: flash ? 0.7 : 0,
            transition: flash ? "opacity 0.06s ease-out" : "opacity 0.55s ease-in",
          }}
        />
      </div>
      <p className="pi-label" style={{ margin: "10px 0 0", color: highlight ? "var(--pi-blue)" : undefined }}>
        {highlight ? "Drop to add" : tasks.length === 0 ? "Drop tasks here" : `Pool · ${stage.name}`}
      </p>
    </div>
  );
}
