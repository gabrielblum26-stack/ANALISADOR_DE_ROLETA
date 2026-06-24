"use client";

import { useEffect, useMemo, useState } from "react";
import { colorOf } from "../lib/roulette";
import {
  analyzeTerminalPatterns,
  analyzeStrategy,
  analyzeSectorPatterns,
  TERMINAL_NUMBERS,
  SECTORS,
  StrategyClassification,
  SectorName
} from "../lib/hothistory";
import { markMultiple, SelState } from "../lib/selection";

type Props = {
  history: number[];
  onMarkNumbers: (nums: number[]) => void;
  onColorChange: (index: number) => void;
};

// Função auxiliar para determinar emoji de temperatura
function getTemperatureEmoji(temp: number): string {
  if (temp >= 80) return "🚀";
  if (temp >= 60) return "🔥";
  if (temp >= 40) return "🌡️";
  return "❄️";
}

// Função auxiliar para calcular temperatura baseada em percentual
function calculateTemperature(percentage: number): number {
  return Math.min(100, Math.max(0, percentage * 2));
}

// Função auxiliar para formatar percentual com segurança
function formatPercentage(value: number): string {
  if (!Number.isFinite(value) || isNaN(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

export default function HotHistoryAnalysis({
  history,
  onMarkNumbers,
  onColorChange
}: Props) {
  const [activeTab, setActiveTab] = useState<"terminals" | "strategies" | "sectors">(
    "terminals"
  );

  // ============ TAB 1: TERMINALS ============
  const [terminalPatternLength, setTerminalPatternLength] = useState(1);
  const [terminalMinReps, setTerminalMinReps] = useState(1);

  const terminalAnalysis = useMemo(() => {
    return analyzeTerminalPatterns(history, terminalPatternLength, terminalMinReps);
  }, [history, terminalPatternLength, terminalMinReps]);

  const handleMarkTerminal = (terminal: number) => {
    const nums = TERMINAL_NUMBERS[terminal];
    onMarkNumbers(nums);
  };

  // ============ TAB 2: STRATEGIES ============
  const [selectedStrategies, setSelectedStrategies] = useState<StrategyClassification>({});

  const strategyAnalysis = useMemo(() => {
    if (Object.keys(selectedStrategies).length === 0) {
      return null;
    }
    return analyzeStrategy(history, selectedStrategies);
  }, [history, selectedStrategies]);

  const handleToggleStrategy = (key: keyof StrategyClassification, value: any) => {
    setSelectedStrategies((prev) => {
      const newStrategies = { ...prev };
      if (newStrategies[key] === value) {
        delete newStrategies[key];
      } else {
        newStrategies[key] = value;
      }
      return newStrategies;
    });
  };

  const handleMarkStrategy = () => {
    if (strategyAnalysis) {
      onMarkNumbers(strategyAnalysis.intersectionNumbers);
    }
  };

  // ============ TAB 3: SECTORS ============
  const [sectorPatternLength, setSectorPatternLength] = useState(1);
  const [sectorMinReps, setSectorMinReps] = useState(1);

  const sectorAnalysis = useMemo(() => {
    return analyzeSectorPatterns(history, sectorPatternLength, sectorMinReps);
  }, [history, sectorPatternLength, sectorMinReps]);

  const handleMarkSector = (sector: SectorName) => {
    const nums = SECTORS[sector];
    onMarkNumbers(nums);
  };

  // Ordenar terminais por percentual (decrescente)
  const sortedTerminalStats = useMemo(() => {
    return Object.entries(terminalAnalysis.terminalStats)
      .sort(([_, a], [__, b]) => b.percentage - a.percentage);
  }, [terminalAnalysis]);

  // Ordenar setores por percentual (decrescente)
  const sortedSectorStats = useMemo(() => {
    return Object.entries(sectorAnalysis.sectorStats)
      .sort(([_, a], [__, b]) => b.percentage - a.percentage);
  }, [sectorAnalysis]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "#1a1a1a",
      borderRadius: "8px",
      overflow: "hidden"
    }}>
      {/* TAB BUTTONS - FIXED */}
      <div style={{
        display: "flex",
        gap: "8px",
        padding: "12px",
        borderBottom: "1px solid #333",
        background: "#0f0f0f",
        flexShrink: 0
      }}>
        <button
          onClick={() => setActiveTab("terminals")}
          style={{
            padding: "8px 16px",
            background: activeTab === "terminals" ? "#ff6b6b" : "#333",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s",
            fontSize: "12px"
          }}
        >
          Terminais + Padrão
        </button>
        <button
          onClick={() => setActiveTab("strategies")}
          style={{
            padding: "8px 16px",
            background: activeTab === "strategies" ? "#ff6b6b" : "#333",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s",
            fontSize: "12px"
          }}
        >
          Estratégias Simples
        </button>
        <button
          onClick={() => setActiveTab("sectors")}
          style={{
            padding: "8px 16px",
            background: activeTab === "sectors" ? "#ff6b6b" : "#333",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s",
            fontSize: "12px"
          }}
        >
          Roda Quente
        </button>
      </div>

      {/* TAB CONTENT - SCROLLABLE */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "15px"
      }}>
        {/* TAB 1: TERMINALS */}
        {activeTab === "terminals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {/* CONTROLS */}
            <div style={{
              display: "flex",
              gap: "15px",
              alignItems: "center",
              flexWrap: "wrap",
              padding: "10px",
              background: "#222",
              borderRadius: "6px",
              border: "1px solid #333"
            }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "#888" }}>
                  PADRÃO (últimos N):
                </span>
                <div style={{ display: "flex", gap: "5px" }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTerminalPatternLength(n)}
                      style={{
                        padding: "4px 8px",
                        background: terminalPatternLength === n ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "10px"
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "#888" }}>
                  MÍNIMO REPS:
                </span>
                <input
                  type="number"
                  min="1"
                  value={terminalMinReps}
                  onChange={(e) => setTerminalMinReps(Math.max(1, Number(e.target.value)))}
                  style={{
                    width: "50px",
                    padding: "4px 6px",
                    background: "#111",
                    color: "#fff",
                    border: "1px solid #555",
                    borderRadius: "4px",
                    fontSize: "11px"
                  }}
                />
              </label>
            </div>

            {/* TERMINAL STATS - RANKING */}
            <div>
              <div style={{ fontSize: "11px", fontWeight: "bold", color: "#ffd000", marginBottom: "8px" }}>
                PERCENTUAL DOS TERMINAIS (Ranking):
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                {sortedTerminalStats.map(([terminal, stats]) => (
                  <div
                    key={terminal}
                    style={{
                      background: "#222",
                      border: "1px solid #444",
                      borderRadius: "4px",
                      padding: "8px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      opacity: stats.percentage > 0 ? 1 : 0.5
                    }}
                    onClick={() => handleMarkTerminal(Number(terminal))}
                  >
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#fff" }}>
                      {stats.percentage > 0 ? `${getTemperatureEmoji(stats.percentage)} T${terminal}` : `T${terminal}`}
                    </div>
                    <div style={{ fontSize: "11px", color: "#ffd000", fontWeight: "bold" }}>
                      {formatPercentage(stats.percentage)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PATTERNS */}
            {terminalAnalysis.patterns.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#ffd000" }}>
                  PADRÕES ENCONTRADOS:
                </div>
                {terminalAnalysis.patterns.map((pattern, idx) => {
                  const temp = calculateTemperature(pattern.strength);
                  return (
                    <div
                      key={idx}
                      style={{
                        background: "#222",
                        border: "1px solid #444",
                        borderRadius: "6px",
                        padding: "10px",
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: "10px",
                        alignItems: "start"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "10px", color: "#888", marginBottom: "4px" }}>
                          Sequência: <strong>{pattern.pattern.join(" → ")}</strong>
                        </div>
                        <div style={{ fontSize: "10px", color: "#888", marginBottom: "4px" }}>
                          Terminal: <strong style={{ color: "#ff6b6b" }}>T{pattern.nextTerminal}</strong>
                        </div>
                        <div style={{ fontSize: "10px", color: "#888", marginBottom: "4px" }}>
                          Força: <strong>{formatPercentage(pattern.strength)}</strong> | Reps: <strong>{pattern.count}</strong>
                        </div>
                        <div style={{ fontSize: "10px", color: "#888" }}>
                          Temperatura: <strong>{getTemperatureEmoji(temp)} {Math.round(temp)}/100</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkTerminal(pattern.nextTerminal)}
                        style={{
                          padding: "6px 12px",
                          background: "#ff6b6b",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "10px",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Marcar
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "#888", fontSize: "11px", padding: "10px", textAlign: "center" }}>
                {history.length === 0 ? "Aguardando histórico..." : "Nenhum padrão encontrado."}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STRATEGIES */}
        {activeTab === "strategies" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* STRATEGY SELECTORS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* COLOR */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", marginBottom: "4px" }}>
                  COR:
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => handleToggleStrategy("color", "red")}
                    style={{
                      padding: "6px 12px",
                      background: selectedStrategies.color === "red" ? "#ff6b6b" : "#333",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "11px"
                    }}
                  >
                    Vermelho
                  </button>
                  <button
                    onClick={() => handleToggleStrategy("color", "black")}
                    style={{
                      padding: "6px 12px",
                      background: selectedStrategies.color === "black" ? "#ff6b6b" : "#333",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "11px"
                    }}
                  >
                    Preto
                  </button>
                </div>
              </div>

              {/* PARITY */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", marginBottom: "4px" }}>
                  PAR / ÍMPAR:
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => handleToggleStrategy("parity", "even")}
                    style={{
                      padding: "6px 12px",
                      background: selectedStrategies.parity === "even" ? "#ff6b6b" : "#333",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "11px"
                    }}
                  >
                    Par
                  </button>
                  <button
                    onClick={() => handleToggleStrategy("parity", "odd")}
                    style={{
                      padding: "6px 12px",
                      background: selectedStrategies.parity === "odd" ? "#ff6b6b" : "#333",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "11px"
                    }}
                  >
                    Ímpar
                  </button>
                </div>
              </div>

              {/* HALF */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", marginBottom: "4px" }}>
                  ALTO / BAIXO:
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => handleToggleStrategy("half", "low")}
                    style={{
                      padding: "6px 12px",
                      background: selectedStrategies.half === "low" ? "#ff6b6b" : "#333",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "11px"
                    }}
                  >
                    1–18
                  </button>
                  <button
                    onClick={() => handleToggleStrategy("half", "high")}
                    style={{
                      padding: "6px 12px",
                      background: selectedStrategies.half === "high" ? "#ff6b6b" : "#333",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "11px"
                    }}
                  >
                    19–36
                  </button>
                </div>
              </div>

              {/* DOZEN */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", marginBottom: "4px" }}>
                  DÚZIA:
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[1, 2, 3].map((d) => (
                    <button
                      key={d}
                      onClick={() => handleToggleStrategy("dozen", d as 1 | 2 | 3)}
                      style={{
                        padding: "6px 12px",
                        background: selectedStrategies.dozen === d ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "11px"
                      }}
                    >
                      {d}ª
                    </button>
                  ))}
                </div>
              </div>

              {/* COLUMN */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", marginBottom: "4px" }}>
                  COLUNA:
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[1, 2, 3].map((c) => (
                    <button
                      key={c}
                      onClick={() => handleToggleStrategy("column", c as 1 | 2 | 3)}
                      style={{
                        padding: "6px 12px",
                        background: selectedStrategies.column === c ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "11px"
                      }}
                    >
                      C{c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STRATEGY RESULTS */}
            {strategyAnalysis && (
              <div style={{ background: "#222", border: "1px solid #444", borderRadius: "6px", padding: "10px" }}>
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#ffd000", marginBottom: "8px" }}>
                  RESULTADO DA INTERSECÇÃO:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "#888" }}>Números:</div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#fff" }}>
                      {strategyAnalysis.intersectionNumbers.length}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "#888" }}>Ocorrências:</div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#fff" }}>
                      {strategyAnalysis.intersectionOccurrences}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "#888" }}>Percentual:</div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#ffd000" }}>
                      {formatPercentage(strategyAnalysis.intersectionPercentage)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "#888" }}>Confiabilidade:</div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#ff6b6b" }}>
                      {Math.round(strategyAnalysis.intersectionPercentage)}%
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleMarkStrategy}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: "#ff6b6b",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "11px"
                  }}
                >
                  Marcar Seleção
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SECTORS */}
        {activeTab === "sectors" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {/* CONTROLS */}
            <div style={{
              display: "flex",
              gap: "15px",
              alignItems: "center",
              flexWrap: "wrap",
              padding: "10px",
              background: "#222",
              borderRadius: "6px",
              border: "1px solid #333"
            }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "#888" }}>
                  PADRÃO (últimos N):
                </span>
                <div style={{ display: "flex", gap: "5px" }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setSectorPatternLength(n)}
                      style={{
                        padding: "4px 8px",
                        background: sectorPatternLength === n ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "10px"
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "#888" }}>
                  MÍNIMO REPS:
                </span>
                <input
                  type="number"
                  min="1"
                  value={sectorMinReps}
                  onChange={(e) => setSectorMinReps(Math.max(1, Number(e.target.value)))}
                  style={{
                    width: "50px",
                    padding: "4px 6px",
                    background: "#111",
                    color: "#fff",
                    border: "1px solid #555",
                    borderRadius: "4px",
                    fontSize: "11px"
                  }}
                />
              </label>
            </div>

            {/* SECTOR STATS - RANKING */}
            <div>
              <div style={{ fontSize: "11px", fontWeight: "bold", color: "#ffd000", marginBottom: "8px" }}>
                PERCENTUAL DOS SETORES (Ranking):
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
                {sortedSectorStats.map(([sector, stats]) => (
                  <div
                    key={sector}
                    style={{
                      background: "#222",
                      border: "1px solid #444",
                      borderRadius: "4px",
                      padding: "8px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      opacity: stats.percentage > 0 ? 1 : 0.5
                    }}
                    onClick={() => handleMarkSector(sector as SectorName)}
                  >
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#fff" }}>
                      {stats.percentage > 0 ? `${getTemperatureEmoji(stats.percentage)} ${sector.toUpperCase()}` : sector.toUpperCase()}
                    </div>
                    <div style={{ fontSize: "11px", color: "#ffd000", fontWeight: "bold" }}>
                      {formatPercentage(stats.percentage)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTOR PATTERNS */}
            {sectorAnalysis.patterns.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#ffd000" }}>
                  PADRÕES ENCONTRADOS:
                </div>
                {sectorAnalysis.patterns.map((pattern, idx) => {
                  const temp = calculateTemperature(pattern.strength);
                  return (
                    <div
                      key={idx}
                      style={{
                        background: "#222",
                        border: "1px solid #444",
                        borderRadius: "6px",
                        padding: "10px",
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: "10px",
                        alignItems: "start"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "10px", color: "#888", marginBottom: "4px" }}>
                          Sequência: <strong>{pattern.pattern.join(" → ")}</strong>
                        </div>
                        <div style={{ fontSize: "10px", color: "#888", marginBottom: "4px" }}>
                          Setor: <strong style={{ color: "#ff6b6b" }}>{pattern.nextSector.toUpperCase()}</strong>
                        </div>
                        <div style={{ fontSize: "10px", color: "#888", marginBottom: "4px" }}>
                          Força: <strong>{formatPercentage(pattern.strength)}</strong> | Reps: <strong>{pattern.count}</strong>
                        </div>
                        <div style={{ fontSize: "10px", color: "#888" }}>
                          Temperatura: <strong>{getTemperatureEmoji(temp)} {Math.round(temp)}/100</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkSector(pattern.nextSector)}
                        style={{
                          padding: "6px 12px",
                          background: "#ff6b6b",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "10px",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Marcar
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "#888", fontSize: "11px", padding: "10px", textAlign: "center" }}>
                {history.length === 0 ? "Aguardando histórico..." : "Nenhum padrão encontrado."}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
