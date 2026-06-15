"use client";

import { useEffect, useState } from "react";
import MovementPanel from "../app/components/MovementPanel";

export default function DeslocamentoPage() {
  const [history, setHistory] = useState<number[]>([]);
  const [selectedX, setSelectedX] = useState<number[]>([]);
  const [selectedY, setSelectedY] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("theme-dark");
    document.body.classList.add("theme-dark");
    document.body.style.background = "#121212";
    document.body.style.color = "#fff";

    // Sincronizar histórico
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

  // Sincronizar selectedX e selectedY com a janela principal
  useEffect(() => {
    const bcSelections = new BroadcastChannel("roulette_selections");
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "UPDATE_SELECTIONS") {
        // Receber valores da janela principal
        setSelectedX(event.data.selectedX || []);
        setSelectedY(event.data.selectedY || null);
      }
    };
    
    bcSelections.onmessage = handleMessage;
    
    // Pedir sincronização inicial
    bcSelections.postMessage({ type: "REQUEST_SELECTIONS" });
    
    return () => bcSelections.close();
  }, []);

  const handleXChange = (newX: number[]) => {
    setSelectedX(newX);
    // Sincronizar com a janela principal
    const bcSelections = new BroadcastChannel("roulette_selections");
    bcSelections.postMessage({ type: "UPDATE_X_Y", selectedX: newX, selectedY });
    bcSelections.close();
  };

  const handleYChange = (newY: string | null) => {
    setSelectedY(newY);
    // Sincronizar com a janela principal
    const bcSelections = new BroadcastChannel("roulette_selections");
    bcSelections.postMessage({ type: "UPDATE_X_Y", selectedX, selectedY: newY });
    bcSelections.close();
  };

  return (
    <div style={{ padding: "20px", width: "100%", display: "flex", flexDirection: "column" }}>
      <div className="sectionTitle" style={{ marginBottom: "20px", fontSize: "18px", color: "#ffd000", fontWeight: "bold", textAlign: "center" }}>MOVIMENTO PADRÃO</div>
      <MovementPanel 
        history={history} 
        selectedX={selectedX} 
        onXChange={handleXChange}
        selectedY={selectedY}
        onYChange={handleYChange}
      />
    </div>
  );
}
