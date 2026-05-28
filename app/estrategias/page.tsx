"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function EstrategiasPage() {
  const [history, setHistory] = useState<number[]>([]);
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
    // Forçar tema escuro
    document.documentElement.classList.add("theme-dark");
    document.body.classList.add("theme-dark");
    document.body.style.background = "#121212";
    document.body.style.color = "#fff";

    loadStrategies();

    // Carregar histórico inicial
    const saved = localStorage.getItem("roulette_history");
    if (saved) setHistory(JSON.parse(saved));

    // Escutar atualizações do histórico
    const bc = new BroadcastChannel("roulette_history_sync");
    bc.onmessage = (event) => {
      if (event.data.type === "UPDATE_HISTORY") {
        setHistory(event.data.value);
      }
    };
    
    // Escutar mudanças nas estratégias (opcional, se quiser sync em tempo real sem refresh)
    const stratBc = new BroadcastChannel("strategies_sync");
    stratBc.onmessage = () => loadStrategies();

    return () => {
      bc.close();
      stratBc.close();
    };
  }, []);

  const onMarkStrategy = (nums: number[], idx: number) => {
    const bc = new BroadcastChannel("roulette_keyboard");
    // Se for o Padrão de Saída Órfã (índice 3), usamos a cor 6 (ciano) para evitar o vermelho (índice 3)
    const colorIndex = idx === 3 ? 6 : idx % 10;
    bc.postMessage({ type: "MARK_STRATEGY", value: nums, colorIndex });
    bc.close();
  };

  return (
    <div className="strategies-container" style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <div className="header" style={{ marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
        <h1 style={{ fontSize: "20px", margin: 0 }}>Histórico Estratégias</h1>
        <p style={{ fontSize: "12px", color: "#aaa", marginTop: "5px" }}>
          Cada linha é uma estratégia. Verde = bateu, Preto = não bateu.
        </p>
        <div style={{ display: "flex", gap: "15px", marginTop: "10px", fontSize: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "12px", height: "12px", background: "#22c55e", borderRadius: "2px" }}></div> Bateu
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "12px", height: "12px", background: "#262626", borderRadius: "2px", border: "1px solid #444" }}></div> Não bateu
          </div>
        </div>
      </div>

      <div className="strategy-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {strategies.map((strat, sIdx) => (
          <div key={strat.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "120px", fontSize: "11px", fontWeight: "bold", color: strat.color || "#3b82f6", textTransform: "uppercase" }}>
              {strat.name}
            </div>
            
            <button 
              onClick={() => onMarkStrategy(strat.nums, sIdx)}
              style={{ 
                background: "none", 
                border: "1px solid #444", 
                color: "#f59e0b", 
                cursor: "pointer", 
                padding: "2px 6px", 
                borderRadius: "4px",
                fontSize: "12px"
              }}
              title="Marcar na roleta"
            >
              ⚡
            </button>

            <div style={{ display: "flex", gap: "4px" }}>
              {Array.from({ length: 15 }).map((_, hIdx) => {
                const num = history[hIdx];
                const hit = num !== undefined && strat.nums.includes(num);
                return (
                  <div 
                    key={hIdx} 
                    style={{ 
                      width: "20px", 
                      height: "20px", 
                      background: hit ? "#22c55e" : "#262626", 
                      borderRadius: "3px",
                      border: "1px solid #333",
                      transition: "background 0.3s"
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
