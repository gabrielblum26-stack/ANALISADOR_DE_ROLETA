"use client";

import { useState } from "react";
import { wheelDistance, WHEEL_EU, wheelStepEU } from "../lib/roulette";

export type MovementRecord = {
  from: number;
  to: number;
  h: number;
  ah: number;
};

type DistanceMode = "shortest" | "longest";

// Cores para os botões X selecionados
const X_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", 
  "#06b6d4", "#f97316", "#8b5cf6", "#14b8a6", "#f43f5e", "#84cc16",
  "#d946ef", "#6366f1", "#0ea5e9", "#facc15", "#fb7185", "#2dd4bf"
];

// Cores para marcação manual no painel de deslocamento
const MARK_COLORS = ["#3b82f6", "#a855f7", "#ec4899", "#eab308"]; // Azul, Roxo, Rosa, Amarelo

function getMovementColor(distance: number): string {
  if (distance <= 5) return "#ffd000"; // Amarelo (curto)
  if (distance <= 12) return "#ff6b6b"; // Vermelho (médio)
  return "#26d07c"; // Verde (longo)
}

export default function MovementPanel({
  history,
  selectedX,
  onXChange,
  selectedY,
  onYChange,
}: {
  history: number[];
  selectedX: number[];
  onXChange: (val: number[]) => void;
  selectedY: string | null;
  onYChange: (val: string | null) => void;
}) {
  const [mode, setMode] = useState<DistanceMode>("shortest");
  const [activeMarkColor, setActiveMarkColor] = useState<number>(0);
  const [marks, setMarks] = useState<Record<string, string>>({});

  const movements: MovementRecord[] = [];
  for (let i = 0; i < Math.min(history.length - 1, 100); i++) {
    const from = history[i + 1];
    const to = history[i];
    const { h, ah } = wheelDistance(from, to);
    movements.push({ from, to, h, ah });
  }

  const lastMovement = movements.length > 0 ? movements[0] : null;

  let lastDistance = 0;
  let lastDirection = "";
  let lastIsH = false;
  let targetHorario = -1;
  let targetAntiHorario = -1;

  if (lastMovement) {
    lastIsH = lastMovement.h <= lastMovement.ah;
    lastDistance = lastIsH ? lastMovement.h : lastMovement.ah;
    lastDirection = lastIsH ? "H" : "A";

    const steps = lastDistance + 1;
    targetHorario = wheelStepEU(lastMovement.to, steps);
    targetAntiHorario = wheelStepEU(lastMovement.to, -steps);
  }

  // Lógica da calculadora de MÚLTIPLOS VALORES X
  const allCalcResults = (() => {
    if (selectedX.length === 0 || !lastMovement) return [];
    
    return selectedX.sort((a, b) => a - b).map(x => {
      const steps = x + 1;
      const h = wheelStepEU(lastMovement.to, steps);
      const a = wheelStepEU(lastMovement.to, -steps);
      return { x, h, a, color: X_COLORS[(x - 1) % X_COLORS.length] };
    });
  })();

  const handleCellClick = (direction: string, distance: number) => {
    const key = `${direction}/${distance}`;
    const color = MARK_COLORS[activeMarkColor];
    setMarks(prev => {
      const next = { ...prev };
      if (next[key] === color) delete next[key];
      else next[key] = color;
      return next;
    });
  };

  const handleXClick = (val: number) => {
    if (selectedX.includes(val)) {
      onXChange(selectedX.filter(x => x !== val));
    } else {
      onXChange([...selectedX, val]);
    }
  };

  const handleYClick = (val: string) => {
    onYChange(selectedY === val ? null : val);
  };

  return (
    <div className="movementPanel compact">
      <div className="movementHeader">
        <div className="movementTitle">MOVIMENTO PADRÃO</div>
      </div>
      <div className="movementControls">
        <button className="btn-reset-marks" onClick={() => { setMarks({}); onXChange([]); }}>RESET</button>
        <div className="movementModeSelector">
          <button className={`modeBtn ${mode === "shortest" ? "active" : ""}`} onClick={() => setMode("shortest")}>CURTO</button>
          <button className={`modeBtn ${mode === "longest" ? "active" : ""}`} onClick={() => setMode("longest")}>LONGO</button>
        </div>
      </div>

      {lastMovement && (
        <div className="movementHighlight compact">
          <div className="highlightRow">
            <div className="highlightBox">
              <div className="highlightLabel">HORÁRIO</div>
              <div className="highlightValue" style={{ color: "#ffd000" }}>{targetHorario !== -1 ? targetHorario : "--"}</div>
            </div>
            <div className="highlightBox">
              <div className="highlightLabel">ATUAL</div>
              <div className="highlightValue">{lastMovement.to}</div>
            </div>
            <div className="highlightBox">
              <div className="highlightLabel">ANTI-HORÁRIO</div>
              <div className="highlightValue" style={{ color: "#ffd000" }}>{targetAntiHorario !== -1 ? targetAntiHorario : "--"}</div>
            </div>
            <div className="highlightBox">
              <div className="highlightLabel">RESULTADO</div>
              <div className="highlightValue" style={{ color: getMovementColor(lastDistance) }}>{lastDirection}/{lastDistance}</div>
            </div>
          </div>
        </div>
      )}

      {/* Calculadora de VALOR X com Múltipla Seleção */}
      <div className="calculatorSection">
        <div className="calcHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="calcLabel">VALORES X SELECIONADOS: </div>
          <button className="btn-clear-x" onClick={() => onXChange([])}>LIMPAR X</button>
        </div>
        
        <div className="xButtonsGrid">
          {[0, ...Array.from({ length: 18 }, (_, i) => i + 1)].map((val, i) => {
            const isSelected = selectedX.includes(val);
            const btnColor = val === 0 ? "#22c55e" : X_COLORS[(val - 1) % X_COLORS.length];
            return (
              <button
                key={val}
                className={`xBtn ${isSelected ? "active" : ""}`}
                style={isSelected ? { backgroundColor: btnColor, borderColor: '#fff', color: '#fff' } : {}}
                onClick={() => handleXClick(val)}
              >
                {val}
              </button>
            );
          })}
        </div>

        <div className="calcLabel" style={{ marginBottom: '6px' }}>VALORES Y SELECIONADOS: </div>
        <div className="yButtonsGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '10px' }}>
          <button 
            className={`yBtn ${selectedY === '1-5' ? 'active' : ''}`}
            style={{ 
              backgroundColor: selectedY === '1-5' ? '#ffd000' : 'rgba(255,208,0,0.1)', 
              color: selectedY === '1-5' ? '#000' : '#ffd000',
              border: '1px solid #ffd000',
              padding: '8px 0',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => handleYClick('1-5')}
          >
            1 a 5 AMARELO
          </button>
          <button 
            className={`yBtn ${selectedY === '6-12' ? 'active' : ''}`}
            style={{ 
              backgroundColor: selectedY === '6-12' ? '#ef4444' : 'rgba(239,68,68,0.1)', 
              color: selectedY === '6-12' ? '#fff' : '#ef4444',
              border: '1px solid #ef4444',
              padding: '8px 0',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => handleYClick('6-12')}
          >
            6 a 12 VERMELHO
          </button>
          <button 
            className={`yBtn ${selectedY === '13-18' ? 'active' : ''}`}
            style={{ 
              backgroundColor: selectedY === '13-18' ? '#22c55e' : 'rgba(34,197,94,0.1)', 
              color: selectedY === '13-18' ? '#fff' : '#22c55e',
              border: '1px solid #22c55e',
              padding: '8px 0',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => handleYClick('13-18')}
          >
            13 a 18 VERDE
          </button>
          <button 
            className={`yBtn ${selectedY === 'atual-vizinhos' ? 'active' : ''}`}
            style={{ 
              backgroundColor: selectedY === 'atual-vizinhos' ? '#3b82f6' : 'rgba(59,130,246,0.1)', 
              color: selectedY === 'atual-vizinhos' ? '#fff' : '#3b82f6',
              border: '1px solid #3b82f6',
              padding: '8px 0',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => handleYClick('atual-vizinhos')}
          >
            ATUAL + VIZINHOS
          </button>
        </div>

        {allCalcResults.length > 0 && (
          <div className="multiResultsContainer">
            <div className="resultsHeader">
              <span>X</span>
              <span>HORÁRIO</span>
              <span>ANTI-H</span>
            </div>
            <div className="resultsList">
              {allCalcResults.map((res) => (
                <div key={res.x} className="resultItem" style={{ borderLeft: `3px solid ${res.color}` }}>
                  <span className="resultX" style={{ color: res.color }}>{res.x}</span>
                  <span className="resultVal">{res.h}</span>
                  <span className="resultVal">{res.a}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="movementGrid compact">
        {movements.length === 0 ? (
          <div className="movementEmpty">Aguardando dados...</div>
        ) : (
          movements.map((mov, idx) => {
            const isH = mode === "shortest" ? mov.h <= mov.ah : mov.h >= mov.ah;
            const distance = isH ? mov.h : mov.ah;
            const direction = isH ? "H" : "A";
            const baseColor = getMovementColor(distance);
            const markColor = marks[`${direction}/${distance}`];
            return (
              <div
                key={idx}
                className={`movementGridCell ${idx === 0 ? "latest" : ""}`}
                style={{ 
                  borderLeftColor: baseColor,
                  backgroundColor: markColor ? `${markColor}33` : "transparent",
                  borderColor: markColor || "rgba(255,255,255,0.05)"
                }}
                onClick={() => handleCellClick(direction, distance)}
              >
                <div className="gridCellNum">{mov.to}</div>
                <div className="gridCellDist" style={{ color: markColor || baseColor }}>{direction}/{distance}</div>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .movementPanel.compact { padding: 8px; display: flex; flex-direction: column; height: auto; }
        .movementTitle { font-size: 11px; font-weight: 900; color: #888; }
        .movementHeader {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 8px;
        }
        .movementControls {
          display: flex;
          gap: 6px;
          align-items: center;
          margin-bottom: 8px;
        }
        .movementHighlight.compact { gap: 4px; margin-bottom: 8px; padding: 6px; }
        .highlightRow { 
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
        }
        .highlightBox { padding: 4px 2px; border-radius: 4px; text-align: center; }
        .highlightLabel { font-size: 7px; margin-bottom: 1px; color: #888; font-weight: bold; }
        .highlightValue { font-size: 14px; font-weight: bold; }
        
        .calculatorSection {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 8px;
          margin-bottom: 8px;
          display: flex;
          flex-direction: column;
        }
        .calcHeader {
          margin-bottom: 6px;
        }
        .calcLabel {
          font-size: 10px;
          font-weight: 800;
          color: #aaa;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .xButtonsGrid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 4px;
          margin-bottom: 10px;
        }
        
        .xBtn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          padding: 6px 0;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .xBtn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
        }
        
        .xBtn.active {
          box-shadow: 0 0 10px rgba(255,255,255,0.2);
          transform: scale(1.05);
        }

        .multiResultsContainer {
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 8px;
        }

        .resultsHeader {
          display: grid;
          grid-template-columns: 30px 1fr 1fr;
          padding: 4px 8px;
          background: rgba(255,255,255,0.05);
          font-size: 8px;
          font-weight: 900;
          color: #666;
          text-align: center;
        }

        .resultsList {
          max-height: 120px;
          overflow-y: auto;
        }

        .resultItem {
          display: grid;
          grid-template-columns: 30px 1fr 1fr;
          padding: 6px 8px;
          border-bottom: 1px solid rgba(255,255,255,0.02);
          align-items: center;
          text-align: center;
        }

        .resultX {
          font-weight: 900;
          font-size: 12px;
        }

        .resultVal {
          font-weight: bold;
          font-size: 13px;
          color: #fff;
        }
        
        .movementGrid.compact { 
          display: grid; 
          grid-template-columns: repeat(10, 1fr); 
          gap: 2px; 
          margin-bottom: 8px;
          flex: none;
          overflow-y: hidden;
        }
        .movementGridCell { 
          aspect-ratio: 1 / 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2px; 
          font-size: 9px; 
          text-align: center; 
          border-left: 3px solid transparent; 
          background: rgba(255,255,255,0.02); 
          border-radius: 4px; 
          cursor: pointer; 
          transition: all 0.2s;
        }
        .movementGridCell:hover { background: rgba(255,255,255,0.08); }
        .gridCellNum { font-weight: bold; color: #fff; }
        .gridCellDist { font-size: 8px; }
        .modeBtn { padding: 2px 6px; font-size: 9px; background: #333; color: #fff; border: none; border-radius: 3px; cursor: pointer; }
        .modeBtn.active { background: #555; font-weight: bold; }
        .btn-reset-marks { padding: 2px 6px; font-size: 9px; background: #444; color: #fff; border: none; border-radius: 3px; cursor: pointer; }
        .btn-clear-x { padding: 2px 6px; font-size: 8px; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; cursor: pointer; font-weight: bold; transition: all 0.2s; }
        .btn-clear-x:hover { background: rgba(239, 68, 68, 0.3); border-color: #ef4444; }
      `}</style>
    </div>
  );
}
