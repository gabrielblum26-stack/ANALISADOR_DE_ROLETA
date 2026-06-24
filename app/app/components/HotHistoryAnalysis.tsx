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

export default function HotHistoryAnalysis({
  history,
  onMarkNumbers,
  onColorChange
}: Props) {
  const [activeTab, setActiveTab] = useState<"terminals" | "strategies" | "sectors">(
    "terminals"
  );
  const [isMinimized, setIsMinimized] = useState(false);

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

  return (
    <div className={`panel hotHistoryPanel ${isMinimized ? "minimized" : ""}`}>
      <div className="panelHeader" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div className="sectionTitle" style={{ color: "#ff6b6b", fontWeight: "bold" }}>
          HISTÓRICO QUENTE
        </div>
        <button
          className="btn-min"
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          {isMinimized ? "+" : "−"}
        </button>
      </div>

      {!isMinimized && (
        <div style={{ padding: "15px" }}>
          {/* TAB BUTTONS */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
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
                transition: "all 0.2s"
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
                transition: "all 0.2s"
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
                transition: "all 0.2s"
              }}
            >
              Roda Quente
            </button>
          </div>

          {/* TAB 1: TERMINALS */}
          {activeTab === "terminals" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#888" }}>
                    PADRÃO (últimos N números):
                  </span>
                  <div style={{ display: "flex", gap: "5px" }}>
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        onClick={() => setTerminalPatternLength(n)}
                        style={{
                          padding: "4px 10px",
                          background:
                            terminalPatternLength === n ? "#ff6b6b" : "#333",
                          color: "#fff",
                          border: "1px solid #555",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "bold"
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#888" }}>
                    MÍNIMO DE REPETIÇÕES:
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={terminalMinReps}
                    onChange={(e) => setTerminalMinReps(Math.max(1, Number(e.target.value)))}
                    style={{
                      width: "60px",
                      padding: "4px 8px",
                      background: "#222",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px"
                    }}
                  />
                </label>
              </div>

              {/* PATTERNS */}
              {terminalAnalysis.patterns.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "bold", color: "#ffd000" }}>
                    PADRÕES ENCONTRADOS:
                  </div>
                  {terminalAnalysis.patterns.map((pattern, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#222",
                        border: "1px solid #444",
                        borderRadius: "6px",
                        padding: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "15px"
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                          Sequência: {pattern.pattern.join(" → ")}
                        </div>
                        <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                          Terminal Chamado: <strong>{pattern.nextTerminal}</strong>
                        </div>
                        <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                          Força: <strong>{pattern.strength.toFixed(1)}%</strong>
                        </div>
                        <div style={{ fontSize: "11px", color: "#888" }}>
                          Repetições: <strong>{pattern.count}</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkTerminal(pattern.nextTerminal)}
                        style={{
                          padding: "8px 16px",
                          background: "#ff6b6b",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Marcar Terminal {pattern.nextTerminal}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#888", fontSize: "12px" }}>
                  Nenhum padrão encontrado com os critérios selecionados.
                </div>
              )}

              {/* TERMINAL STATS */}
              <div style={{ marginTop: "15px" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", color: "#ffd000", marginBottom: "10px" }}>
                  PERCENTUAL GERAL DOS TERMINAIS:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                  {Object.entries(terminalAnalysis.terminalStats).map(([terminal, stats]) => (
                    <div
                      key={terminal}
                      style={{
                        background: "#222",
                        border: "1px solid #444",
                        borderRadius: "4px",
                        padding: "8px",
                        textAlign: "center"
                      }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#fff" }}>
                        T{terminal}
                      </div>
                      <div style={{ fontSize: "11px", color: "#888" }}>
                        {stats.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STRATEGIES */}
          {activeTab === "strategies" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {/* STRATEGY SELECTORS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* COLOR */}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "bold", color: "#888", marginBottom: "6px" }}>
                    COR:
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleToggleStrategy("color", "red")}
                      style={{
                        padding: "6px 12px",
                        background:
                          selectedStrategies.color === "red" ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "12px"
                      }}
                    >
                      Vermelho
                    </button>
                    <button
                      onClick={() => handleToggleStrategy("color", "black")}
                      style={{
                        padding: "6px 12px",
                        background:
                          selectedStrategies.color === "black" ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "12px"
                      }}
                    >
                      Preto
                    </button>
                  </div>
                </div>

                {/* PARITY */}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "bold", color: "#888", marginBottom: "6px" }}>
                    PAR / ÍMPAR:
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleToggleStrategy("parity", "even")}
                      style={{
                        padding: "6px 12px",
                        background:
                          selectedStrategies.parity === "even" ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "12px"
                      }}
                    >
                      Par
                    </button>
                    <button
                      onClick={() => handleToggleStrategy("parity", "odd")}
                      style={{
                        padding: "6px 12px",
                        background:
                          selectedStrategies.parity === "odd" ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "12px"
                      }}
                    >
                      Ímpar
                    </button>
                  </div>
                </div>

                {/* HALF */}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "bold", color: "#888", marginBottom: "6px" }}>
                    ALTO / BAIXO:
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleToggleStrategy("half", "low")}
                      style={{
                        padding: "6px 12px",
                        background:
                          selectedStrategies.half === "low" ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "12px"
                      }}
                    >
                      1–18
                    </button>
                    <button
                      onClick={() => handleToggleStrategy("half", "high")}
                      style={{
                        padding: "6px 12px",
                        background:
                          selectedStrategies.half === "high" ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "12px"
                      }}
                    >
                      19–36
                    </button>
                  </div>
                </div>

                {/* DOZEN */}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "bold", color: "#888", marginBottom: "6px" }}>
                    DÚZIA:
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[1, 2, 3].map((d) => (
                      <button
                        key={d}
                        onClick={() => handleToggleStrategy("dozen", d as 1 | 2 | 3)}
                        style={{
                          padding: "6px 12px",
                          background:
                            selectedStrategies.dozen === d ? "#ff6b6b" : "#333",
                          color: "#fff",
                          border: "1px solid #555",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "12px"
                        }}
                      >
                        {d}ª
                      </button>
                    ))}
                  </div>
                </div>

                {/* COLUMN */}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "bold", color: "#888", marginBottom: "6px" }}>
                    COLUNA:
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[1, 2, 3].map((c) => (
                      <button
                        key={c}
                        onClick={() => handleToggleStrategy("column", c as 1 | 2 | 3)}
                        style={{
                          padding: "6px 12px",
                          background:
                            selectedStrategies.column === c ? "#ff6b6b" : "#333",
                          color: "#fff",
                          border: "1px solid #555",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "12px"
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
                  <div style={{ fontSize: "12px", fontWeight: "bold", color: "#ffd000", marginBottom: "10px" }}>
                    RESULTADO DA INTERSECÇÃO:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#888" }}>Números encontrados:</div>
                      <div style={{ fontSize: "13px", fontWeight: "bold", color: "#fff" }}>
                        {strategyAnalysis.intersectionNumbers.length}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#888" }}>Ocorrências:</div>
                      <div style={{ fontSize: "13px", fontWeight: "bold", color: "#fff" }}>
                        {strategyAnalysis.intersectionOccurrences}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#888" }}>Percentual:</div>
                      <div style={{ fontSize: "13px", fontWeight: "bold", color: "#fff" }}>
                        {strategyAnalysis.intersectionPercentage.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#888" }}>Temperatura:</div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: "bold",
                          color:
                            strategyAnalysis.temperature === "very_hot"
                              ? "#ff4444"
                              : strategyAnalysis.temperature === "hot"
                              ? "#ff6b6b"
                              : strategyAnalysis.temperature === "warm"
                              ? "#ffa500"
                              : "#4488ff"
                        }}
                      >
                        {strategyAnalysis.temperature.toUpperCase()}
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
                      fontWeight: "bold"
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
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#888" }}>
                    PADRÃO (últimos N números):
                  </span>
                  <div style={{ display: "flex", gap: "5px" }}>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        onClick={() => setSectorPatternLength(n)}
                        style={{
                          padding: "4px 10px",
                          background:
                            sectorPatternLength === n ? "#ff6b6b" : "#333",
                          color: "#fff",
                          border: "1px solid #555",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "bold"
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#888" }}>
                    MÍNIMO DE REPETIÇÕES:
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={sectorMinReps}
                    onChange={(e) => setSectorMinReps(Math.max(1, Number(e.target.value)))}
                    style={{
                      width: "60px",
                      padding: "4px 8px",
                      background: "#222",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px"
                    }}
                  />
                </label>
              </div>

              {/* SECTOR PATTERNS */}
              {sectorAnalysis.patterns.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "bold", color: "#ffd000" }}>
                    PADRÕES ENCONTRADOS:
                  </div>
                  {sectorAnalysis.patterns.map((pattern, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#222",
                        border: "1px solid #444",
                        borderRadius: "6px",
                        padding: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "15px"
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                          Sequência: {pattern.pattern.join(" → ")}
                        </div>
                        <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                          Setor Chamado: <strong>{pattern.nextSector.toUpperCase()}</strong>
                        </div>
                        <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                          Força: <strong>{pattern.strength.toFixed(1)}%</strong>
                        </div>
                        <div style={{ fontSize: "11px", color: "#888" }}>
                          Repetições: <strong>{pattern.count}</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkSector(pattern.nextSector)}
                        style={{
                          padding: "8px 16px",
                          background: "#ff6b6b",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Marcar {pattern.nextSector}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#888", fontSize: "12px" }}>
                  Nenhum padrão encontrado com os critérios selecionados.
                </div>
              )}

              {/* SECTOR STATS */}
              <div style={{ marginTop: "15px" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", color: "#ffd000", marginBottom: "10px" }}>
                  PERCENTUAL GERAL DOS SETORES:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  {Object.entries(sectorAnalysis.sectorStats).map(([sector, stats]) => (
                    <div
                      key={sector}
                      style={{
                        background: "#222",
                        border: "1px solid #444",
                        borderRadius: "4px",
                        padding: "8px",
                        textAlign: "center"
                      }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#fff" }}>
                        {sector.toUpperCase()}
                      </div>
                      <div style={{ fontSize: "11px", color: "#888" }}>
                        {stats.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
