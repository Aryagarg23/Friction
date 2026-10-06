/**
 * CALCULATOR APP
 * 
 * Fully functional macOS-style calculator with standard operations,
 * memory functions, and expression history.
 */

import { useState } from "react";

type Operation = "+" | "-" | "×" | "÷" | null;

export function CalculatorApp() {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [resetNext, setResetNext] = useState(false);
  // Left over from the sprint: the storyboard timer (37 secs vs 20 secs),
  // the rubric's 22–33 senses, and the Data Burn hold in ms.
  const [history, setHistory] = useState<string[]>([
    "37 - 20 = 17",
    "33 - 22 = 11",
    "3 × 1000 = 3000",
  ]);
  const [memory, setMemory] = useState(0);

  const inputDigit = (digit: string) => {
    if (resetNext) {
      setDisplay(digit);
      setResetNext(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (resetNext) {
      setDisplay("0.");
      setResetNext(false);
      return;
    }
    if (!display.includes(".")) setDisplay(display + ".");
  };

  const handleOperation = (op: Operation) => {
    const current = parseFloat(display);
    if (previousValue !== null && operation && !resetNext) {
      const result = calculate(previousValue, current, operation);
      setDisplay(formatNumber(result));
      setPreviousValue(result);
    } else {
      setPreviousValue(current);
    }
    setOperation(op);
    setResetNext(true);
  };

  const calculate = (a: number, b: number, op: Operation): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : NaN;
      default: return b;
    }
  };

  const formatNumber = (n: number): string => {
    if (isNaN(n)) return "Error";
    if (!isFinite(n)) return "Error";
    const str = n.toString();
    if (str.length > 12) return n.toExponential(6);
    return str;
  };

  const handleEquals = () => {
    if (previousValue === null || operation === null) return;
    const current = parseFloat(display);
    const result = calculate(previousValue, current, operation);
    const expr = `${formatNumber(previousValue)} ${operation} ${formatNumber(current)} = ${formatNumber(result)}`;
    setHistory(prev => [expr, ...prev].slice(0, 10));
    setDisplay(formatNumber(result));
    setPreviousValue(null);
    setOperation(null);
    setResetNext(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setResetNext(false);
  };

  const handlePercent = () => {
    const current = parseFloat(display);
    setDisplay(formatNumber(current / 100));
    setResetNext(true);
  };

  const handleNegate = () => {
    setDisplay(formatNumber(parseFloat(display) * -1));
  };

  const btnStyle = (type: "num" | "op" | "func"): React.CSSProperties => ({
    backgroundColor: type === "op" ? "#ff9f0a" : type === "func" ? "#a5a5a5" : "#333333",
    color: type === "func" ? "#000" : "#fff",
    border: "none",
    borderRadius: "50%",
    width: "56px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: type === "op" ? "24px" : "20px",
    transition: "filter 0.1s ease",
  });

  return (
    <div className="size-full flex" style={{ backgroundColor: "#1c1c1c" }}>
      {/* History Panel */}
      <div className="w-44 border-r overflow-y-auto p-3" style={{ borderColor: "#333" }}>
        <div className="text-xs uppercase mb-2" style={{ color: "#666", letterSpacing: "0.05em" }}>History</div>
        {history.length === 0 ? (
          <div className="text-xs" style={{ color: "#555" }}>No calculations yet</div>
        ) : (
          history.map((entry, i) => (
            <div
              key={i}
              className="text-xs py-1.5 border-b cursor-pointer"
              style={{ color: "#999", borderColor: "#2a2a2a" }}
              onClick={() => {
                const result = entry.split("= ")[1];
                if (result) { setDisplay(result); setResetNext(true); }
              }}
            >
              {entry}
            </div>
          ))
        )}
        <div className="mt-4">
          <div className="text-xs uppercase mb-2" style={{ color: "#666" }}>Memory</div>
          <div className="text-sm" style={{ color: "#ff9f0a" }}>{memory}</div>
          <div className="flex gap-1 mt-2">
            <button onClick={() => setMemory(memory + parseFloat(display))} className="text-xs px-2 py-1 rounded cursor-pointer" style={{ backgroundColor: "#333", color: "#ccc" }}>M+</button>
            <button onClick={() => setMemory(memory - parseFloat(display))} className="text-xs px-2 py-1 rounded cursor-pointer" style={{ backgroundColor: "#333", color: "#ccc" }}>M-</button>
            <button onClick={() => { setDisplay(formatNumber(memory)); setResetNext(true); }} className="text-xs px-2 py-1 rounded cursor-pointer" style={{ backgroundColor: "#333", color: "#ccc" }}>MR</button>
            <button onClick={() => setMemory(0)} className="text-xs px-2 py-1 rounded cursor-pointer" style={{ backgroundColor: "#333", color: "#ccc" }}>MC</button>
          </div>
        </div>
      </div>

      {/* Calculator */}
      <div className="flex-1 flex flex-col items-center justify-end pb-4 px-4">
        {/* Display */}
        <div className="w-full text-right px-4 mb-4">
          {previousValue !== null && operation && (
            <div className="text-sm mb-1" style={{ color: "#888" }}>
              {formatNumber(previousValue)} {operation}
            </div>
          )}
          <div
            className="font-light"
            style={{
              color: "#ffffff",
              fontSize: display.length > 9 ? "32px" : display.length > 6 ? "40px" : "52px",
              fontVariantNumeric: "tabular-nums",
              transition: "font-size 0.15s ease",
            }}
          >
            {display}
          </div>
        </div>

        {/* Button Grid */}
        <div className="grid grid-cols-4 gap-3">
          <button onClick={handleClear} style={btnStyle("func")} onMouseDown={e => (e.currentTarget.style.filter = "brightness(0.8)")} onMouseUp={e => (e.currentTarget.style.filter = "none")}>
            {previousValue !== null ? "C" : "AC"}
          </button>
          <button onClick={handleNegate} style={btnStyle("func")} onMouseDown={e => (e.currentTarget.style.filter = "brightness(0.8)")} onMouseUp={e => (e.currentTarget.style.filter = "none")}>
            +/−
          </button>
          <button onClick={handlePercent} style={btnStyle("func")} onMouseDown={e => (e.currentTarget.style.filter = "brightness(0.8)")} onMouseUp={e => (e.currentTarget.style.filter = "none")}>
            %
          </button>
          <button onClick={() => handleOperation("÷")} style={{ ...btnStyle("op"), ...(operation === "÷" ? { backgroundColor: "#fff", color: "#ff9f0a" } : {}) }} onMouseDown={e => (e.currentTarget.style.filter = "brightness(0.8)")} onMouseUp={e => (e.currentTarget.style.filter = "none")}>
            ÷
          </button>

          {["7", "8", "9"].map(d => (
            <button key={d} onClick={() => inputDigit(d)} style={btnStyle("num")} onMouseDown={e => (e.currentTarget.style.filter = "brightness(1.3)")} onMouseUp={e => (e.currentTarget.style.filter = "none")}>
              {d}
            </button>
          ))}
          <button onClick={() => handleOperation("×")} style={{ ...btnStyle("op"), ...(operation === "×" ? { backgroundColor: "#fff", color: "#ff9f0a" } : {}) }} onMouseDown={e => (e.currentTarget.style.filter = "brightness(0.8)")} onMouseUp={e => (e.currentTarget.style.filter = "none")}>
            ×
          </button>

          {["4", "5", "6"].map(d => (
            <button key={d} onClick={() => inputDigit(d)} style={btnStyle("num")} onMouseDown={e => (e.currentTarget.style.filter = "brightness(1.3)")} onMouseUp={e => (e.currentTarget.style.filter = "none")}>
              {d}
            </button>
          ))}
          <button onClick={() => handleOperation("-")} style={{ ...btnStyle("op"), ...(operation === "-" ? { backgroundColor: "#fff", color: "#ff9f0a" } : {}) }} onMouseDown={e => (e.currentTarget.style.filter = "brightness(0.8)")} onMouseUp={e => (e.currentTarget.style.filter = "none")}>
            −
          </button>

          {["1", "2", "3"].map(d => (
            <button key={d} onClick={() => inputDigit(d)} style={btnStyle("num")} onMouseDown={e => (e.currentTarget.style.filter = "brightness(1.3)")} onMouseUp={e => (e.currentTarget.style.filter = "none")}>
              {d}
            </button>
          ))}
          <button onClick={() => handleOperation("+")} style={{ ...btnStyle("op"), ...(operation === "+" ? { backgroundColor: "#fff", color: "#ff9f0a" } : {}) }} onMouseDown={e => (e.currentTarget.style.filter = "brightness(0.8)")} onMouseUp={e => (e.currentTarget.style.filter = "none")}>
            +
          </button>

          <button onClick={() => inputDigit("0")} style={{ ...btnStyle("num"), width: "122px", borderRadius: "28px", justifyContent: "flex-start", paddingLeft: "22px" }} onMouseDown={e => (e.currentTarget.style.filter = "brightness(1.3)")} onMouseUp={e => (e.currentTarget.style.filter = "none")}>
            0
          </button>
          <button onClick={inputDecimal} style={btnStyle("num")} onMouseDown={e => (e.currentTarget.style.filter = "brightness(1.3)")} onMouseUp={e => (e.currentTarget.style.filter = "none")}>
            .
          </button>
          <button onClick={handleEquals} style={btnStyle("op")} onMouseDown={e => (e.currentTarget.style.filter = "brightness(0.8)")} onMouseUp={e => (e.currentTarget.style.filter = "none")}>
            =
          </button>
        </div>
      </div>
    </div>
  );
}
