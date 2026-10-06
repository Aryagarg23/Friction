/**
 * DRAGGABLE OVERLAY TASK
 *
 * One row in a ruled task list on the Plan screen. Rows can be reordered
 * within a list and dragged between "This session" and "Later" (react-dnd).
 */

import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { ArrowLeft, ArrowRight, X, GripVertical } from "lucide-react";
import { FRICTION_FONTS, FRICTION_COLORS } from "./friction-styles";

export const ITEM_TYPE = "OVERLAY_TASK";

export interface DragItem {
  id: string;
  index: number;
  list: "pool" | "general";
}

interface Props {
  task: {
    id: string;
    title: string;
    cognitiveWeight: number;
    completed: boolean;
    category: string;
    estimatedMinutes?: number;
  };
  index: number;
  list: "pool" | "general";
  onMoveToOther?: (id: string) => void;
  onRemove?: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

const iconButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 2,
  lineHeight: 0,
  color: FRICTION_COLORS.textSecondary,
  cursor: "pointer",
};

export function DraggableOverlayTask({
  task,
  index,
  list,
  onMoveToOther,
  onRemove,
  onReorder,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: (): DragItem => ({ id: task.id, index, list }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: ITEM_TYPE,
    canDrop: (item) => item.list === list, // only same-list reorders
    // Cross-list drops return undefined so they bubble to OverlayDropZone.
    // Same-list reorder already happened in hover().
    drop: () => undefined,
    hover(item) {
      if (!ref.current) return;
      if (item.list !== list) return;
      if (item.index === index) return;
      onReorder?.(item.index, index);
      item.index = index;
    },
    collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }) }),
  });

  drag(drop(ref));

  const isPool = list === "pool";

  return (
    <div
      ref={ref as any}
      className="flex items-center gap-2 py-2 group"
      style={{
        fontFamily: FRICTION_FONTS.body,
        fontSize: "0.8rem",
        color: FRICTION_COLORS.textPrimary,
        borderBottom: `1px solid ${FRICTION_COLORS.borderDefault}`,
        backgroundColor: isOver ? "var(--pi-ink-08)" : "transparent",
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
        transition: "background-color var(--pi-ease-hover)",
      }}
    >
      <GripVertical
        size={12}
        aria-hidden
        className="shrink-0"
        style={{ color: "var(--pi-ink-20)" }}
      />

      <span className="truncate flex-1 min-w-0">{task.title}</span>

      {task.estimatedMinutes != null && (
        <span
          className="shrink-0"
          style={{
            fontFamily: FRICTION_FONTS.mono,
            fontSize: "0.75rem",
            fontVariantNumeric: "tabular-nums",
            color: FRICTION_COLORS.textMuted,
          }}
        >
          {task.estimatedMinutes} min
        </span>
      )}

      {onMoveToOther && (
        <button
          type="button"
          onClick={() => onMoveToOther(task.id)}
          className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          style={{ ...iconButtonStyle, transition: "opacity var(--pi-ease-hover)" }}
          title={isPool ? "Move to Later" : "Move to this session"}
          aria-label={isPool ? "Move to Later" : "Move to this session"}
        >
          {isPool ? <ArrowRight size={12} /> : <ArrowLeft size={12} />}
        </button>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(task.id)}
          className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          style={{ ...iconButtonStyle, transition: "opacity var(--pi-ease-hover)" }}
          title="Remove"
          aria-label="Remove"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

/**
 * Drop target for a whole list. Accepts rows from the other list.
 * forceHighlight lets the parent show the same outline for native text drops.
 */
export function OverlayDropZone({
  list,
  onDropFromOther,
  forceHighlight = false,
  children,
}: {
  list: "pool" | "general";
  onDropFromOther: (id: string) => void;
  forceHighlight?: boolean;
  children: React.ReactNode;
}) {
  const [{ isOver, canDrop }, drop] = useDrop<
    DragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: ITEM_TYPE,
    canDrop: (item) => item.list !== list,
    drop: (item) => {
      if (item.list !== list) onDropFromOther(item.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const highlight = forceHighlight || (isOver && canDrop);

  return (
    <div
      ref={drop as any}
      className="min-h-[44px]"
      style={{
        borderTop: `1px solid ${FRICTION_COLORS.borderDefault}`,
        outline: highlight ? `1px solid ${FRICTION_COLORS.textPrimary}` : "1px solid transparent",
        outlineOffset: 2,
        transition: "outline-color var(--pi-ease-hover)",
      }}
    >
      {children}
    </div>
  );
}
