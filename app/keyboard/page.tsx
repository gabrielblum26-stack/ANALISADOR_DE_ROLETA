"use client";

import { useEffect, useState } from "react";
import RaceTrack from "../components/RaceTrack";
import TableMap from "../components/TableMap";
import { initSel } from "../lib/selection";
import { api } from "../lib/api";

export default function KeyboardPage() {
  const sel = initSel();
  const [strategies, setStrategies] = useState<any[]>([]);

  const loadStrategies = async () => {
    try {
      const data = await api.listStrategies();
      setStrategies(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    document.documentElement.classList.add("theme-dark");
    document.body.classList.add("theme-dark");
    document.body.style.background = "#121212";
    document.body.style.color = "#fff";
    document.body.style.overflowY = "auto";
    loadStrategies();
  }, []);

  const onPick = (n: number) => {
    const bc = new BroadcastChannel("roulette_keyboard");
    bc.postMessage({ type: "ADD_NUMBER", value: n });
    bc.close();
  };

  const onMarkStrategy = (nums: number[], colorIndex?: number) => {
    const bc = new BroadcastChannel("roulette_keyboard");
    bc.postMessage({ type: "MARK_STRATEGY", value: nums, colorIndex });
    bc.close();
  };

  const onResetColors = () => {
    const bc = new BroadcastChannel("roulette_keyboard");
    bc.postMessage({ type: "RESET_COLORS" });
    bc.close();
  };

  // Terminais de 0 a 9
  const terminals = Array.from({ length: 10 }, (_, i) => ({
    name: `T${i}`,
    nums: Array.from({ length: 37 }, (_, n) => n).filter(n => n % 10 === i)
  }));

  // Função dummy para satisfazer o tipoProps, já que o teclado não mostra seleções coloridas
  const getCellStyles = () => ({});

  return (
    <div className="keyboard-container" style={{ padding: "15px", display: "flex", flexDirection: "column", gap: "15px" }}>
      <div className="section">
        <h2 style={{ fontSize: "14px", marginBottom: "10px", color: "#aaa" }}>RACETRACK</h2>
        <RaceTrack sel={sel} onPick={onPick} getCellStyles={getCellStyles} />
      </div>

      <div className="section">
        <h2 style={{ fontSize: "14px", marginBottom: "10px", color: "#aaa" }}>MAPA</h2>
        <TableMap sel={sel} repHighlights={new Set()} onPick={onPick} getCellStyles={getCellStyles} />
      </div>

      <div className="section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h2 style={{ fontSize: "14px", margin: 0, color: "#aaa" }}>ATALHOS DE ESTRATÉGIAS</h2>
          <button 
            onClick={onResetColors}
            style={{ background: "#ef4444", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
          >
            RESET CORES
          </button>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
          {/* Terminais */}
          {terminals.map((t, i) => (
            <button 
              key={i} 
              onClick={() => onMarkStrategy(t.nums)}
              className="strat-btn"
              style={{ background: "#262626", color: "#3b82f6" }}
            >
              {t.name}
            </button>
          ))}
          
          {/* Estratégias Principais */}
          {strategies.map((strat, i) => {
            const colorIdx = i === 3 ? 6 : i % 10;
            return (
              <button 
                key={strat.id} 
                onClick={() => onMarkStrategy(strat.nums, colorIdx)}
                className="strat-btn"
                style={{ background: "#262626", color: strat.color || "#fff" }}
              >
                {strat.name}
              </button>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .keyboard-container .raceBox {
          min-height: 120px !important;
          padding: 5px !important;
        }
        .keyboard-container .mapBox {
          padding: 5px !important;
        }
        .keyboard-container .cell {
          font-size: 12px !important;
          height: 25px !important;
        }
        .strat-btn {
          border: 1px solid #444;
          padding: 8px 4px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          cursor: pointer;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .strat-btn:hover {
          background: #333 !important;
          border-color: #666;
        }
        .strat-btn:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}
