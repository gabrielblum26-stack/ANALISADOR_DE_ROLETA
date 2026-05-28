"use client";

import { useEffect, useState } from "react";
import TableMap from "../app/components/TableMap";
import { initSel, getNumberColors } from "../app/lib/selection";
import { wheelStepEU } from "../app/lib/roulette";

export default function MapaPage() {
  const [history, setHistory] = useState<number[]>([]);
  const [sel, setSel] = useState(initSel());
  const [selectedX, setSelectedX] = useState<number[]>([]);

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

  const onPick = (n: number) => {
    const bc = new BroadcastChannel("roulette_keyboard");
    bc.postMessage({ type: "ADD_NUMBER", value: n });
    bc.close();
  };

  const X_COLORS = [
    "#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", 
    "#06b6d4", "#f97316", "#8b5cf6", "#14b8a6", "#f43f5e", "#84cc16",
    "#d946ef", "#6366f1", "#0ea5e9", "#facc15", "#fb7185", "#2dd4bf"
  ];

  const getCellStyles = (n: number) => {
    // Lógica simplificada de estilos para o mapa standalone
    const colors = getNumberColors(sel, n);
    
    // Verificar se é um número destacado por X (opcional, para manter paridade com a principal)
    if (history.length > 0 && selectedX.length > 0) {
        const lastNum = history[0];
        for (const x of selectedX) {
            const color = X_COLORS[(x - 1) % X_COLORS.length];
            const steps = x + 1;
            if (n === wheelStepEU(lastNum, steps) || n === wheelStepEU(lastNum, -steps) || n === lastNum) {
                return { 
                    backgroundColor: color, 
                    boxShadow: `0 0 15px ${color}`,
                    color: "#fff",
                    border: "2px solid #fff",
                    zIndex: 10
                };
            }
        }
    }

    if (colors.length === 0) return {};
    if (colors.length === 1) return { backgroundColor: colors[0], boxShadow: `0 0 15px ${colors[0]}88` };
    const step = 100 / colors.length;
    const gradientParts = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`);
    return {
      background: `linear-gradient(135deg, ${gradientParts.join(", ")})`,
      boxShadow: `0 0 15px ${colors[0]}88`
    };
  };

  return (
    <div style={{ padding: "20px", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div className="sectionTitle" style={{ marginBottom: "20px", fontSize: "18px", color: "#ffd000", fontWeight: "bold", textAlign: "center" }}>MAPA DA MESA</div>
      <TableMap 
        sel={sel} 
        onPick={onPick} 
        repHighlights={new Set()} 
        getCellStyles={getCellStyles} 
      />
    </div>
  );
}
