"use client";

import { useEffect, useMemo, useState } from "react";
import { colorOf, parseInput, wheelStepEU } from "../lib/roulette";

type Props = {
  history: number[];
  onPick: (n: number) => void;
  onToggleHighlight: (isActive: boolean, numbersToHighlight: number[]) => void;
};

type AnalysisItem = {
  val: number;
  trio: [number, number, number];
  apoio: number;
};

type AnalysisResult = {
  source: number[];
  n1: AnalysisItem;
  n2: AnalysisItem;
  n3: AnalysisItem;
  final: [number, number, number];
  allApoios: number[];
  displayTrios: number[];
};

const makeHEItem = (n: number): AnalysisItem => ({
  val: n,
  trio: [n, wheelStepEU(n, 18), wheelStepEU(n, 1)],
  apoio: wheelStepEU(n, 12),
});

const calculateHEMode2Pure = (source: number[]): AnalysisResult | null => {
  const base = source.slice(0, 3);
  if (base.length < 3) return null;

  const n1 = makeHEItem(base[0]);
  const n2 = makeHEItem(base[1]);
  const n3 = makeHEItem(base[2]);

  return {
    source: base,
    n1,
    n2,
    n3,
    final: [n1.trio[1], n2.trio[1], n3.trio[1]],
    allApoios: [n1.apoio, n2.apoio, n3.apoio],
    displayTrios: n1.trio,
  };
};

export default function HEAnalysis({ history, onPick, onToggleHighlight }: Props) {
  const [isHighlightActive, setIsHighlightActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mode, setMode] = useState<"AUTO" | "MANUAL">("AUTO");
  const [useHistoryCount, setUseHistoryCount] = useState(3);
  const [manualNumbers, setManualNumbers] = useState("");
  const [manualHistory, setManualHistory] = useState("");

  const autoSource = useMemo(() => history.slice(0, useHistoryCount), [history, useHistoryCount]);
  const manualTypedNumbers = useMemo(() => parseInput(manualNumbers), [manualNumbers]);
  const manualAuxHistory = useMemo(() => parseInput(manualHistory), [manualHistory]);

  const sourceNumbers = useMemo(() => {
    if (mode === "AUTO") return autoSource;
    return manualTypedNumbers.length >= 3 ? manualTypedNumbers : manualAuxHistory.slice(0, useHistoryCount);
  }, [autoSource, manualAuxHistory, manualTypedNumbers, mode, useHistoryCount]);

  const analysis = useMemo(() => calculateHEMode2Pure(sourceNumbers), [sourceNumbers]);

  useEffect(() => {
    if (isHighlightActive) {
      if (analysis) {
        const numbers = [...analysis.source, ...analysis.displayTrios, ...analysis.allApoios, ...analysis.final];
        onToggleHighlight(true, numbers);
      } else {
        onToggleHighlight(true, []);
      }
    }
  }, [analysis, isHighlightActive, onToggleHighlight]);

  const numberFieldValue = mode === "AUTO"
    ? autoSource.slice(0, 3).join(", ")
    : manualNumbers;

  const fillManualHistory = () => {
    setManualHistory(history.slice(0, 14).join(", "));
    if (!manualNumbers.trim()) setManualNumbers(history.slice(0, 3).join(", "));
  };

  return (
    <div className={`panel heMode2Panel ${isMinimized ? "minimized" : ""}`}>
      <div className="panelHeader heMode2Header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="sectionTitle heMode2Title">MARCAÇÃO FIFA COPA</div>
        
        <button 
          onClick={() => {
            const w = 600;
            const h = 700;
            const left = (window.screen.width / 2) - (w / 2);
            const top = (window.screen.height / 2) - (h / 2);
            window.open('/fifa-copa', 'FifaCopaPopup', `width=${w},height=${h},left=${left},top=${top}`);
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', marginRight: 'auto' }}
          title="Expandir Marcação"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
        </button>

        <button
          type="button"
          className={`btn btn-highlight ${isHighlightActive ? "active" : ""}`}
          style={{ 
            padding: '2px 6px', 
            fontSize: '10px', 
            borderRadius: '4px',
            width: 'auto',
            minWidth: 'fit-content',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap'
          }}
          onClick={() => {
            const newState = !isHighlightActive;
            setIsHighlightActive(newState);
            if (analysis) {
              const numbers = [...analysis.source, ...analysis.displayTrios, ...analysis.allApoios, ...analysis.final];
              onToggleHighlight(newState, numbers);
              // Enviar sinal via BroadcastChannel para a racetrack expandida
              try {
                const bc = new BroadcastChannel('racetrack-highlight');
                bc.postMessage({ active: newState, numbers });
                bc.close();
              } catch (e) {
                console.log('BroadcastChannel não disponível');
              }
            } else {
              onToggleHighlight(newState, []);
              try {
                const bc = new BroadcastChannel('racetrack-highlight');
                bc.postMessage({ active: newState, numbers: [] });
                bc.close();
              } catch (e) {
                console.log('BroadcastChannel não disponível');
              }
            }
          }}
        >
          DESTACAR NA RACE {isHighlightActive ? "🟢" : "⚪"}
        </button>

        <button className="btn-min" onClick={() => setIsMinimized(!isMinimized)}>{isMinimized ? "+" : "−"}</button>
      </div>

      {!isMinimized && (
        <div className="heMode2Body">
          <div className="heMode2Controls">
            <label className="heMode2Field heMode2NumbersField">
              <span>NÚMEROS</span>
              <input
                value={numberFieldValue}
                readOnly={mode === "AUTO"}
                onChange={(event) => setManualNumbers(event.target.value)}
                placeholder="Ex: 11, 10, 9"
              />
            </label>

            <label className="heMode2Field heMode2ModeField">
              <span>MODO</span>
              <select value={mode} onChange={(event) => setMode(event.target.value as "AUTO" | "MANUAL")}>
                <option value="AUTO">AUTO</option>
                <option value="MANUAL">MANUAL</option>
              </select>
            </label>

            <label className="heMode2Field heMode2UseHistoryField">
              <span>USAR HISTÓRICO</span>
              <select value={useHistoryCount} onChange={(event) => setUseHistoryCount(Number(event.target.value))}>
                <option value={2}>ÚLTIMOS 2</option>
                <option value={3}>ÚLTIMOS 3</option>
                <option value={5}>ÚLTIMOS 5</option>
                <option value={8}>ÚLTIMOS 8</option>
                <option value={14}>ÚLTIMOS 14</option>
              </select>
            </label>


          </div>

          {mode === "MANUAL" && (
            <div className="heMode2ManualBox">
              <label className="heMode2Field heMode2AuxField">
                <span>HISTÓRICO AUXILIAR SEPARADO</span>
                <textarea
                  value={manualHistory}
                  onChange={(event) => setManualHistory(event.target.value)}
                  placeholder="Ex: 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11"
                />
              </label>
              <div className="heMode2ManualActions">
                <button type="button" onClick={fillManualHistory}>PREENCHER HISTÓRICO</button>
                <button type="button" onClick={() => { setManualNumbers(""); setManualHistory(""); }}>LIMPAR</button>
              </div>
            </div>
          )}

          {analysis ? (
            <div className="heMode2ResultBox">
              <div className="heMode2ResultGrid">
                <div className="heMode2ResultColumn">
                  <div className="heMode2ColumnTitle">Digitados</div>
                  <div className="heMode2ColumnChips">
                    {analysis.source.map((n, index) => (
                      <button key={`typed-${index}-${n}`} type="button" className={`chip ${colorOf(n)} heMode2Chip typed`} onClick={() => onPick(n)}>{n}</button>
                    ))}
                  </div>
                </div>

                <div className="heMode2ResultColumn">
                  <div className="heMode2ColumnTitle">Trios</div>
                  <div className="heMode2ColumnChips">
                    {analysis.displayTrios.map((n, index) => (
                      <button key={`trio-${index}-${n}`} type="button" className={`chip ${colorOf(n)} heMode2Chip trio`} onClick={() => onPick(n)}>{n}</button>
                    ))}
                  </div>
                </div>

                <div className="heMode2ResultColumn">
                  <div className="heMode2ColumnTitle">Apoios</div>
                  <div className="heMode2ColumnChips">
                    {analysis.allApoios.map((n, index) => (
                      <button key={`apoio-${index}-${n}`} type="button" className={`chip ${colorOf(n)} heMode2Chip apoio`} onClick={() => onPick(n)}>{n}</button>
                    ))}
                  </div>
                </div>

                <div className="heMode2ResultColumn">
                  <div className="heMode2ColumnTitle">Alvo Final</div>
                  <div className="heMode2ColumnChips">
                    {analysis.final.map((n, index) => (
                      <button key={`final-${index}-${n}`} type="button" className={`chip ${colorOf(n)} heMode2Chip final`} onClick={() => onPick(n)}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="heMode2Legend">
                <span><i className="typed" />Digitados</span>
                <span><i className="trio" />Trios</span>
                <span><i className="apoio" />Apoios</span>
                <span><i className="final" />Alvo Final</span>
              </div>
            </div>
          ) : (
            <div className="heMode2Empty">
              {mode === "AUTO" ? "Aguardando pelo menos 3 números no histórico." : "Digite 3 números ou informe o histórico auxiliar manual."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Adicionar estilos para o botão de destaque
const highlightButtonStyles = `
.btn-highlight {
  background: #5a5a5a;
  color: #fff;
  border: 1px solid #777;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: bold;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.btn-highlight.active {
  background: #ffd000;
  color: #000;
  border-color: #fff;
  box-shadow: 0 0 10px rgba(255, 208, 0, 0.5);
}

.btn-highlight:hover {
  opacity: 0.9;
}
`;
