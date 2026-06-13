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

  const handleXChange = (newX: number[]) => {
    setSelectedX(newX);
  };

  const handleYChange = (newY: string | null) => {
    setSelectedY(newY);
  };

  return (
    <div style={{ padding: "20px", width: "100%", display: "flex", flexDirection: "column" }}>
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
