"use client";

import { useEffect, useState } from "react";
import RaceTrack from "../app/components/RaceTrack";
import { initSel, getNumberColors } from "../app/lib/selection";
import { wheelStepEU, neighborsEU } from "../app/lib/roulette";

export default function RacetrackPage() {
  const [sel, setSel] = useState(initSel());
  const [selectedX, setSelectedX] = useState<number[]>([]);
  const [selectedY, setSelectedY] = useState<string | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [highlightedNumbers, setHighlightedNumbers] = useState<number[]>([]);

  useEffect(() => {
    document.documentElement.classList.add("theme-dark");
    document.body.classList.add("theme-dark");
    document.body.style.background = "#121212";
    document.body.style.color = "#fff";

    // Sincronizar histórico
    const savedHistory = localStorage.getItem("roulette_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const bcHistory = new BroadcastChannel("roulette_history_sync");
    bcHistory.onmessage = (event) => {
      if (event.data.type === "UPDATE_HISTORY") {
        setHistory(event.data.value);
      }
    };

    // Sincronizar seleções com melhor timing
    const bcSelections = new BroadcastChannel("roulette_selections");
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "UPDATE_SELECTIONS") {
        setSel(event.data.sel);
        setSelectedX(event.data.selectedX || []);
        setSelectedY(event.data.selectedY || null);
      } else if (event.data.type === "UPDATE_X_Y") {
        if (event.data.selectedX !== undefined) {
          setSelectedX(event.data.selectedX);
        }
        if (event.data.selectedY !== undefined) {
          setSelectedY(event.data.selectedY);
        }
      } else if (event.data.type === 'UPDATE_HIGHLIGHTS') {
        setHighlightedNumbers(event.data.isActive ? event.data.numbers : []);
      }
    };
    
    bcSelections.onmessage = handleMessage;
    
    // Pedir sincronização inicial após configurar o listener
    bcSelections.postMessage({ type: 'REQUEST_SELECTIONS' });

    return () => {
      bcSelections.close();
      bcHistory.close();
    };
  }, []);

  const X_COLORS = [
    "#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", 
    "#06b6d4", "#f97316", "#8b5cf6", "#14b8a6", "#f43f5e", "#84cc16",
    "#d946ef", "#6366f1", "#0ea5e9", "#facc15", "#fb7185", "#2dd4bf"
  ];

  const getCellStyles = (n: number) => {
    // Destaque da Marcação FIFA COPA (DESTACAR NA RACE)
    if (highlightedNumbers.includes(n)) {
      return {
        border: "3px solid #fff",
        boxShadow: "0 0 15px #fff, inset 0 0 10px rgba(255,255,255,0.5)",
        zIndex: 20,
        transform: "scale(1.05)",
        transition: "all 0.2s ease"
      };
    }

    const colors = getNumberColors(sel, n);
    
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

    // Lógica para VALORES Y SELECIONADOS
    if (selectedY && history.length > 0) {
      const lastNum = history[0];
      
      if (selectedY === 'atual-vizinhos') {
        const { prev, next } = neighborsEU(lastNum);
        if (n === lastNum || n === prev || n === next) {
          return {
            backgroundColor: "#3b82f6",
            boxShadow: `0 0 15px #3b82f6`,
            color: "#fff",
            border: "2px solid #fff",
            zIndex: 10
          };
        }
      } else {
        const [start, end] = selectedY.split('-').map(Number);
        let yColor = "#ffd000"; // Default amarelo
        if (selectedY === '6-12') yColor = "#ef4444";
        if (selectedY === '13-18') yColor = "#22c55e";

        for (let y = start; y <= end; y++) {
          const steps = y + 1;
          if (n === wheelStepEU(lastNum, steps) || n === wheelStepEU(lastNum, -steps) || (y === 0 && n === lastNum)) {
            return {
              backgroundColor: yColor,
              boxShadow: `0 0 15px ${yColor}`,
              color: yColor === "#ffd000" ? "#000" : "#fff",
              border: "2px solid #fff",
              zIndex: 10
            };
          }
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
    <div style={{ padding: "20px", width: "100%", display: "flex", flexDirection: "column" }}>
      <div className="sectionTitle" style={{ marginBottom: "20px", fontSize: "18px", color: "#ffd000", fontWeight: "bold", textAlign: "center" }}>RACETRACK</div>
      <RaceTrack 
        sel={sel} 
        onPick={() => {}} 
        getCellStyles={getCellStyles} 
        highlightedNumbers={highlightedNumbers}
      />
    </div>
  );
}
