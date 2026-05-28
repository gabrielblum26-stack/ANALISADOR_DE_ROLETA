"use client";

import { useEffect, useState, useMemo } from "react";
import { colorOf } from "../app/lib/roulette";
import { initSel, getNumberColors } from "../app/lib/selection";

export default function HistoricoPage() {
  const [history, setHistory] = useState<number[]>([]);
  const [sel, setSel] = useState(initSel());

  useEffect(() => {
    document.documentElement.classList.add("theme-dark");
    document.body.classList.add("theme-dark");
    document.body.style.background = "#121212";
    document.body.style.color = "#fff";

    const savedHistory = localStorage.getItem("roulette_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const bc = new BroadcastChannel("roulette_history_sync");
    bc.onmessage = (event) => {
      if (event.data.type === "UPDATE_HISTORY") {
        setHistory(event.data.value);
      }
    };
    return () => bc.close();
  }, []);

  const longGridItems = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < 80; i++) arr.push(history[i] ?? null);
    return arr;
  }, [history]);

  const disguisedPairIdx = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i < history.length - 1; i++) {
      const a = history[i];
      const b = history[i + 1];
      if (a !== undefined && b !== undefined) {
        const aRoot = a === 28 ? 0 : 1 + ((a - 1) % 9);
        const bRoot = b === 28 ? 0 : 1 + ((b - 1) % 9);
        if (aRoot === bRoot && a !== b) {
          set.add(i);
          set.add(i + 1);
        }
      }
    }
    return set;
  }, [history]);

  const getCellStyles = (n: number) => {
    const colors = getNumberColors(sel, n);
    if (colors.length === 0) return {};
    if (colors.length === 1) return { backgroundColor: colors[0], boxShadow: `0 0 15px ${colors[0]}88` };
    const step = 100 / colors.length;
    const gradientParts = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`);
    return {
      background: `linear-gradient(135deg, ${gradientParts.join(", ")})`,
      boxShadow: `0 0 15px ${colors[0]}88`
    };
  };

  const getTextColor = (n: number, styles: React.CSSProperties) => {
    const bg = styles.backgroundColor as string;
    if (!bg) return "#fff";
    const lightColors = ["#ffffff", "white", "#ffd000", "#facc15", "#ffcc00", "var(--selC2)", "var(--selC9)", "var(--selC11)"];
    if (lightColors.includes(bg.toLowerCase())) return "#000";
    return "#fff";
  };

  const onSelect = (n: number) => {
    const bc = new BroadcastChannel("roulette_keyboard");
    bc.postMessage({ type: "ADD_NUMBER", value: n });
    bc.close();
  };

  return (
    <div className="panel" style={{ padding: "20px", width: "100%", display: "flex", flexDirection: "column" }}>
      <div className="sectionTitle" style={{ marginBottom: "15px", fontSize: "18px", color: "#ffd000", fontWeight: "bold" }}>HISTÓRICO (80)</div>
      <div className="longGrid" style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "5px" }}>
        {longGridItems.map((n, idx) => {
          if (n === null) return <div key={idx} className="longCell empty" style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} />;
          const styles = getCellStyles(n);
          return (
            <div
              key={idx}
              className={`longCell ${colorOf(n)} ${disguisedPairIdx.has(idx) ? "historyPair" : ""}`}
              style={{
                ...styles,
                color: getTextColor(n, styles),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                fontSize: "20px",
                fontWeight: "900",
                cursor: "pointer",
                border: disguisedPairIdx.has(idx) ? "3px solid #39ff14" : "2px solid rgba(255,255,255,0.1)",
                aspectRatio: "1/1"
              }}
              onClick={() => onSelect(n)}
            >
              {n}
            </div>
          );
        })}
      </div>
    </div>
  );
}
