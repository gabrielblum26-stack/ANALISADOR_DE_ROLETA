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

// Cores para marcação manual no painel de deslocamento
const MARK_COLORS = ["#3b82f6", "#a855f7", "#ec4899", "#eab308"]; // Azul, Roxo, Rosa, Amarelo

function getMovementColor(distance: number): string {
  if (distance <= 5) return "#ffd000"; // Amarelo (curto)
  if (distance <= 12) return "#ff6b6b"; // Vermelho (médio)
  return "#26d07c"; // Verde (longo)
}

export default function MovementPanel({
  history,
}: {
  history: number[];
}) {
  const [mode, setMode] = useState<DistanceMode>("shortest");
  const [activeMarkColor, setActiveMarkColor] = useState<number>(0);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [calcValue, setCalcValue] = useState<string>("");

  const movements: MovementRecord[] = [];
  for (let i = 0; i < Math.min(history.length - 1, 80); i++) {
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

  // Lógica da calculadora de VALOR X simplificada
  const calcResults = (() => {
    if (calcValue === "" || !lastMovement) return null;
    const x = parseInt(calcValue);
    if (isNaN(x) || x < 0) return null;

    // Mesma lógica: passos = X + 1
    const steps = x + 1;
    const h = wheelStepEU(lastMovement.to, steps);
    const a = wheelStepEU(lastMovement.to, -steps);

    return { h, a };
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

  return (
    <div className="movementPanel compact">
      <div className="movementHeader">
        <div className="movementTitle">DESLOCAMENTO (H/A)</div>
        <div className="movementControls">
          <button className="btn-reset-marks" onClick={() => setMarks({})}>RESET</button>
          <div className="movementModeSelector">
            <button className={`modeBtn ${mode === "shortest" ? "active" : ""}`} onClick={() => setMode("shortest")}>CURTO</button>
            <button className={`modeBtn ${mode === "longest" ? "active" : ""}`} onClick={() => setMode("longest")}>LONGO</button>
          </div>
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

      {/* Calculadora de VALOR X Simplificada */}
      <div className="calculatorSection">
        <div className="calcRow">
          <div className="calcLabel">VALOR X:</div>
          <input
            type="number"
            min="0"
            max="36"
            value={calcValue}
            onChange={(e) => setCalcValue(e.target.value)}
            placeholder="0"
            className="calcInput"
          />
          <div className="calcDisplay">{calcValue || "0"}</div>
        </div>

        {calcResults && (
          <div className="calcResults">
            <div className="calcResultRow">
              <div className="calcResultBox">
                <span className="calcResultLabel">HORÁRIO</span>
                <span className="calcResultValue">{calcResults.h}</span>
              </div>
              <div className="calcResultBox">
                <span className="calcResultLabel">ANTI-HORÁRIO</span>
                <span className="calcResultValue">{calcResults.a}</span>
              </div>
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
        .movementPanel.compact { padding: 8px; }
        .movementTitle { font-size: 11px; font-weight: 900; color: #888; }
        .movementHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-right: 10px;
        }
        .movementControls {
          display: flex;
          gap: 6px;
          align-items: center;
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
          padding-top: 6px;
          margin-bottom: 6px;
        }
        .calcRow {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        .calcLabel {
          font-size: 9px;
          font-weight: 700;
          color: #aaa;
          min-width: 50px;
        }
        .calcInput {
          width: 50px;
          padding: 4px 6px;
          border: 1px solid #444;
          background: #1a1a1a;
          color: #fff;
          border-radius: 3px;
          font-size: 11px;
          text-align: center;
        }
        .calcDisplay {
          font-size: 12px;
          font-weight: bold;
          color: #ffd000;
          min-width: 20px;
        }
        .calcResults {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .calcResultRow {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }
        .calcResultBox {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .calcResultLabel {
          font-size: 8px;
          color: #888;
          font-weight: 700;
          margin-bottom: 2px;
          text-align: center;
          line-height: 1;
        }
        .calcResultValue {
          font-size: 13px;
          font-weight: bold;
          color: #26d07c;
        }
        
        .movementGrid.compact { 
          display: grid; 
          grid-template-columns: repeat(8, 1fr); 
          gap: 2px; 
          margin-bottom: 8px;
        }
        .movementGridCell { padding: 2px; font-size: 9px; min-height: 30px; text-align: center; border-left: 3px solid transparent; background: rgba(255,255,255,0.02); border-radius: 2px; cursor: pointer; }
        .gridCellNum { font-weight: bold; color: #fff; }
        .gridCellDist { font-size: 8px; }
        .modeBtn { padding: 2px 6px; font-size: 9px; background: #333; color: #fff; border: none; border-radius: 3px; cursor: pointer; }
        .modeBtn.active { background: #555; font-weight: bold; }
        .btn-reset-marks { padding: 2px 6px; font-size: 9px; background: #444; color: #fff; border: none; border-radius: 3px; cursor: pointer; }
      `}</style>
    </div>
  );
}
