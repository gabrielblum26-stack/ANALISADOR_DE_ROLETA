"use client";

import { useEffect, useState } from "react";
import HEAnalysis from "../app/components/HEAnalysis";

export default function FifaCopaPage() {
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    document.documentElement.classList.add("theme-dark");
    document.body.classList.add("theme-dark");
    document.body.style.background = "#121212";
    document.body.style.color = "#fff";

    // Carregar histórico inicial
    const savedHistory = localStorage.getItem("roulette_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    // Sincronizar histórico em tempo real
    const bc = new BroadcastChannel("roulette_history_sync");
    bc.onmessage = (event) => {
      if (event.data.type === "UPDATE_HISTORY") {
        setHistory(event.data.value);
      }
    };

    return () => bc.close();
  }, []);

  const handleToggleHighlight = (isActive: boolean, numbers: number[]) => {
    const bc = new BroadcastChannel("roulette_keyboard");
    // Aqui poderíamos enviar para o canal, mas a página principal já gerencia o estado global
    // No entanto, para garantir sincronia em janelas separadas:
    const bcSelections = new BroadcastChannel("roulette_selections");
    bcSelections.postMessage({ type: 'UPDATE_HIGHLIGHTS', isActive, numbers });
    bcSelections.close();
    bc.close();
  };

  return (
    <div style={{ padding: "20px", width: "100%", display: "flex", flexDirection: "column" }}>
      <HEAnalysis 
        history={history} 
        onPick={() => {}} 
        onToggleHighlight={handleToggleHighlight}
      />
    </div>
  );
}
