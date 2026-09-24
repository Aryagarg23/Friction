"""
Explanatory diagrams for the two mechanisms in the Friction deck: the
sensing -> SNN -> friction intervention loop, and the cognitive-load
framing (ICL/ECL/GCL) carried over from the Clay/Gyrus research.

These are concept sketches, not measurements. Nothing here is a plotted
result: no accuracies, no counts, no distributions, no invented metrics.
Boxes and arrows describe mechanism and intent, matching the deck.

Run with: python -m pip install matplotlib && python prototype/friction_prototype.py
"""

import os

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, Rectangle

FIG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "figures")
os.makedirs(FIG_DIR, exist_ok=True)

INK = "#282215"
BOX_EDGE = "#c6b99f"
BLUE = "#3b42db"
ORANGE = "#e85b30"
RUST = "#c2491d"
PURPLE = "#6f2f96"


def box(ax, xy, w, h, text, edgecolor=INK, fontsize=9, textcolor=INK):
    x, y = xy
    ax.add_patch(
        Rectangle(
            (x, y), w, h,
            linewidth=1.2,
            edgecolor=edgecolor,
            facecolor="none",
        )
    )
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center",
            fontsize=fontsize, color=textcolor, wrap=True)


def arrow(ax, start, end, color=INK, label=None, label_offset=(0, 0.15)):
    ax.add_patch(
        FancyArrowPatch(
            start, end,
            arrowstyle="->", mutation_scale=14,
            linewidth=1.4, color=color,
        )
    )
    if label:
        mx, my = (start[0] + end[0]) / 2, (start[1] + end[1]) / 2
        ax.text(mx + label_offset[0], my + label_offset[1], label,
                ha="center", va="center", fontsize=8, color=color)


def diagram_intervention_loop():
    """Sensing -> SNN chip -> increase/decrease friction, all local to the
    keyboard, grounded by a mechanical kill switch."""
    fig, ax = plt.subplots(figsize=(9, 7.2))
    ax.axis("off")
    ax.set_autoscale_on(False)
    ax.set_xlim(0, 10)
    ax.set_ylim(-1.6, 8.3)

    ax.set_title("Speculative sensing-to-friction loop: how the deck describes fatigue and drift being handled")
    ax.text(5.0, 7.85, "data never leaves the keyboard: no cloud, no app-side biometrics",
            ha="center", fontsize=8, color=BLUE, style="italic")

    # Sensing boxes (top row)
    box(ax, (0.3, 6.3), 2.6, 1.1, "SPEM eye tracking\n(bezel sensors)", fontsize=8.5)
    box(ax, (3.7, 6.3), 2.6, 1.1, "RF/WiFi posture mesh\n(no cameras)", fontsize=8.5)
    box(ax, (7.1, 6.3), 2.6, 1.1, "Keystroke force\n(per-key sensing)", fontsize=8.5)

    # Converge into SNN chip
    box(ax, (3.7, 4.5), 2.6, 1.1, "SNN chip, in the keyboard\nlocal only", edgecolor=BLUE, textcolor=BLUE, fontsize=9)
    arrow(ax, (1.6, 6.3), (4.4, 5.6))
    arrow(ax, (5.0, 6.3), (5.0, 5.6))
    arrow(ax, (8.4, 6.3), (6.0, 5.6))

    # Two branches
    box(ax, (0.3, 2.6), 2.9, 1.1, "fatigue detected", edgecolor=ORANGE, textcolor=ORANGE, fontsize=9)
    box(ax, (6.8, 2.6), 2.9, 1.1, "focus drift detected", edgecolor=PURPLE, textcolor=PURPLE, fontsize=9)
    arrow(ax, (4.3, 4.5), (1.75, 3.7), color=ORANGE, label="fatigue", label_offset=(-0.35, 0.15))
    arrow(ax, (5.7, 4.5), (8.25, 3.7), color=PURPLE, label="drift", label_offset=(0.35, 0.15))

    ax.text(1.75, 3.85, "INCREASE friction", ha="center", fontsize=8, color=ORANGE, style="italic")
    ax.text(8.25, 3.85, "DECREASE friction", ha="center", fontsize=8, color=PURPLE, style="italic")

    # Fatigue leaf actions, side by side under the fatigue box
    box(ax, (0.0, 0.9), 1.05, 1.2, "heavier keys\n(magnetic\nactuation)", fontsize=7, edgecolor=ORANGE, textcolor=ORANGE)
    box(ax, (1.15, 0.9), 1.05, 1.2, "warm wrist\nrest", fontsize=7, edgecolor=ORANGE, textcolor=ORANGE)
    box(ax, (2.3, 0.9), 1.05, 1.2, "prompt:\nstep away", fontsize=7, edgecolor=ORANGE, textcolor=ORANGE)
    arrow(ax, (1.0, 2.6), (0.55, 2.1), color=ORANGE)
    arrow(ax, (1.7, 2.6), (1.7, 2.1), color=ORANGE)
    arrow(ax, (2.4, 2.6), (2.85, 2.1), color=ORANGE)

    # Drift leaf actions, side by side under the drift box
    box(ax, (6.5, 0.9), 1.65, 1.2, "refocus exercise\n(breathing, yoga)", fontsize=7.5, edgecolor=PURPLE, textcolor=PURPLE)
    box(ax, (8.35, 0.9), 1.65, 1.2, "task-switch\nprompt", fontsize=7.5, edgecolor=PURPLE, textcolor=PURPLE)
    arrow(ax, (7.9, 2.6), (7.3, 2.1), color=PURPLE)
    arrow(ax, (8.5, 2.6), (9.2, 2.1), color=PURPLE)

    # Mechanical kill switch grounding the whole loop
    box(ax, (3.2, -1.3), 3.6, 1.0, "mechanical kill switch -> dumb desk", edgecolor=INK, fontsize=8.5)
    ax.annotate("", xy=(5.0, -0.3), xytext=(5.0, 0.85),
                arrowprops=dict(arrowstyle="-", color=INK, linewidth=1.0, linestyle=":"))
    ax.text(5.0, -1.5, "everything above sits on top of this ground state", ha="center", fontsize=7.5, color=INK, style="italic")
    ax.text(9.9, -1.55, "speculative design -- what it would have looked like", ha="right", fontsize=7.5, color=INK, style="italic")

    fig.subplots_adjust(top=0.94, bottom=0.04, left=0.02, right=0.98)
    out_path = os.path.join(FIG_DIR, "intervention_loop.png")
    fig.savefig(out_path, dpi=200)
    plt.close(fig)
    return out_path


def diagram_load_framework():
    """Qualitative ICL/ECL/GCL framework: no numeric axes, just the
    direction of the argument carried over from the Clay/Gyrus research."""
    fig, ax = plt.subplots(figsize=(8.5, 5.5))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7.5)
    ax.axis("off")

    ax.set_title("Cognitive-load framework from the research notes: where the design wants effort to go")

    box(ax, (0.4, 5.2), 2.7, 1.2, "Intrinsic (ICL)\ntask's inherent difficulty", edgecolor=BLUE, textcolor=BLUE, fontsize=8.5)
    box(ax, (3.65, 5.2), 2.7, 1.2, "Extraneous (ECL)\nwasted effort, UI friction", edgecolor=RUST, textcolor=RUST, fontsize=8.5)
    box(ax, (6.9, 5.2), 2.7, 1.2, "Germane (GCL)\neffort building lasting schema", edgecolor=PURPLE, textcolor=PURPLE, fontsize=8.5)

    ax.text(1.75, 4.55, "hold steady", ha="center", fontsize=8.5, color=BLUE, style="italic")
    arrow(ax, (5.0, 4.9), (5.0, 4.3), color=RUST)
    ax.text(5.0, 3.95, "cut", ha="center", fontsize=9, color=RUST, style="italic")
    arrow(ax, (8.25, 4.3), (8.25, 4.9), color=PURPLE)
    ax.text(8.25, 3.95, "grow", ha="center", fontsize=9, color=PURPLE, style="italic")

    box(ax, (0.4, 1.6), 4.3, 1.5,
        "\"LLM does everything\"\nall three loads collapse toward zero\n(nothing left to hold attention)",
        edgecolor=INK, fontsize=8.5)
    box(ax, (5.3, 1.6), 4.3, 1.5,
        "Friction / Clay target\nICL steady, ECL cut, GCL grown\n(effort redirected, not removed)",
        edgecolor=BLUE, textcolor=BLUE, fontsize=8.5)

    ax.text(5.0, 0.7, "purely qualitative -- no numeric axes, no measured loads", ha="center", fontsize=8, color=INK, style="italic")
    ax.text(9.9, 0.05, "framework from the research notes", ha="right", fontsize=7.5, color=INK, style="italic")

    fig.subplots_adjust(top=0.92, bottom=0.05)
    out_path = os.path.join(FIG_DIR, "load_framework.png")
    fig.savefig(out_path, dpi=200)
    plt.close(fig)
    return out_path


if __name__ == "__main__":
    p1 = diagram_intervention_loop()
    p2 = diagram_load_framework()
    print(f"wrote {p1}")
    print(f"wrote {p2}")
