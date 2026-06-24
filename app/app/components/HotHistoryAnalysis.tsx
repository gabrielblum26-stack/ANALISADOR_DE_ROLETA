"use client";

import { useEffect, useMemo, useState, useRef } from "react";
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
  onHighlightPattern: (pattern: number[]) => void;
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
  return Math.min(100, Math.max(0, percentage * 10));
}

// Função auxiliar para formatar percentual com segurança
function formatPercentage(value: number): string {
  if (!Number.isFinite(value) || isNaN(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

export default function HotHistoryAnalysis({
  history,
  onMarkNumbers,
  onColorChange,
  onHighlightPattern
}: Props) {
  const [activeTab, setActiveTab] = useState<"terminals" | "strategies" | "sectors">(
    "terminals"
  );
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(true);
  const [alert, setAlert] = useState<{ 
    message: string; 
    type: "terminal" | "sector";
    numbers: number[];
    label: string;
    sequence: number[];
  } | null>(null);

  // Carregar preferência de alertas
  useEffect(() => {
    const saved = localStorage.getItem("roulette_alerts_enabled");
    if (saved !== null) {
      setAlertsEnabled(saved === "true");
    }
  }, []);

  // Salvar preferência de alertas
  useEffect(() => {
    localStorage.setItem("roulette_alerts_enabled", String(alertsEnabled));
  }, [alertsEnabled]);

  // Limpar alerta após 5 segundos
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // ============ TAB 1: TERMINALS ============
  const [terminalPatternLength, setTerminalPatternLength] = useState(1);
  const [terminalMinReps, setTerminalMinReps] = useState(6);
  const lastSpokenPattern = useRef<string>("");

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
  const [sectorMinReps, setSectorMinReps] = useState(6);

  const sectorAnalysis = useMemo(() => {
    return analyzeSectorPatterns(history, sectorPatternLength, sectorMinReps);
  }, [history, sectorPatternLength, sectorMinReps]);

  // Efeito para Alerta de Voz e Visual
  useEffect(() => {
    if (!alertsEnabled || history.length < 1) return;

    // Verificar padrões de Terminais
    terminalAnalysis.patterns.forEach(p => {
      if (p.pattern.length > 0) {
        const historyEnd = history.slice(-p.pattern.length);
        if (historyEnd.every((v, i) => v === p.pattern[i])) {
          const patternKey = `terminal-${p.pattern.join(",")}-${p.nextTerminal}-${history.length}`;
          if (lastSpokenPattern.current !== patternKey) {
            const message = `Possível Terminal ${p.nextTerminal}`;
            
            // Alerta de Voz
            const msg = new SpeechSynthesisUtterance(`Atenção! ${message}`);
            msg.lang = 'pt-BR';
            msg.rate = 1.1;
            window.speechSynthesis.speak(msg);
            
            // Alerta Visual
            setAlert({ 
              message, 
              type: "terminal", 
              numbers: TERMINAL_NUMBERS[p.nextTerminal],
              label: `T${p.nextTerminal}`,
              sequence: p.pattern
            });
            lastSpokenPattern.current = patternKey;
          }
        }
      }
    });

    // Alerta para Setores
    if (!alertsEnabled) return;
    sectorAnalysis.patterns.forEach(p => {
      if (p.pattern.length > 0) {
        const historyEnd = history.slice(-p.pattern.length);
        if (historyEnd.every((v, i) => v === p.pattern[i])) {
          const patternKey = `sector-${p.pattern.join(",")}-${p.nextSector}-${history.length}`;
          if (lastSpokenPattern.current !== patternKey) {
            const sectorNames: Record<string, string> = {
              voisins: "Vizinhos do Zero",
              tier: "Terço do Cilindro",
              orphelins: "Órfãos",
              zero_game: "Zero Game"
            };
            const sectorName = sectorNames[p.nextSector] || p.nextSector;
            const message = `Possível entrada: ${sectorName}`;

            // Alerta de Voz
            const msg = new SpeechSynthesisUtterance(`Atenção! ${message}`);
            msg.lang = 'pt-BR';
            msg.rate = 1.1;
            window.speechSynthesis.speak(msg);

            // Alerta Visual
            setAlert({ 
              message, 
              type: "sector", 
              numbers: SECTORS[p.nextSector],
              label: sectorName,
              sequence: p.pattern
            });
            lastSpokenPattern.current = patternKey;
          }
        }
      }
    });
  }, [history.length, terminalAnalysis.patterns, sectorAnalysis.patterns]);

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
            flex: 1,
            padding: "8px 4px",
            background: activeTab === "terminals" ? "#ff6b6b" : "#333",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s",
            fontSize: "10px",
            whiteSpace: "normal",
            lineHeight: "1.2",
            minHeight: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center"
          }}
        >
          Terminais + Padrão
        </button>
        <button
          onClick={() => setActiveTab("strategies")}
          style={{
            flex: 1,
            padding: "8px 4px",
            background: activeTab === "strategies" ? "#ff6b6b" : "#333",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s",
            fontSize: "10px",
            whiteSpace: "normal",
            lineHeight: "1.2",
            minHeight: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center"
          }}
        >
          Estratégias Simples
        </button>
        <button
          onClick={() => setActiveTab("sectors")}
          style={{
            flex: 1,
            padding: "8px 4px",
            background: activeTab === "sectors" ? "#ff6b6b" : "#333",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s",
            fontSize: "10px",
            whiteSpace: "normal",
            lineHeight: "1.2",
            minHeight: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center"
          }}
        >
          Roda Quente
        </button>
      </div>

      {/* ALERT TOGGLE CONTROL */}
      <div style={{
        padding: "0 12px 10px 12px",
        background: "#0f0f0f",
        borderBottom: "1px solid #333"
      }}>
        <button
          onClick={() => setAlertsEnabled(!alertsEnabled)}
          style={{
            width: "100%",
            padding: "8px",
            background: alertsEnabled ? "#2ecc71" : "#e74c3c",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.3s ease"
          }}
        >
          <span style={{ fontSize: "14px" }}>{alertsEnabled ? "🔊" : "🔇"}</span>
          {alertsEnabled ? "ALERTAS ATIVADOS" : "ALERTAS DESATIVADOS"}
        </button>
      </div>

      {/* ALERT BANNER */}
      {alert && (
        <div style={{
          background: alert.type === "terminal" ? "linear-gradient(90deg, #ff6b6b, #ee5253)" : "linear-gradient(90deg, #4a90e2, #357abd)",
          color: "#fff",
          padding: "12px 15px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: "bold",
          fontSize: "13px",
          animation: "slideDown 0.3s ease-out, pulse 2s infinite",
          borderBottom: "2px solid rgba(255,255,255,0.3)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          zIndex: 100,
          position: "relative"
        }}>
          <style>{`
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
              70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
              100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
            }
            @keyframes slideDown {
              from { transform: translateY(-100%); }
              to { transform: translateY(0); }
            }
          `}</style>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🔔</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "10px", opacity: 0.9, textTransform: "uppercase" }}>Padrão Detectado: {alert.sequence.join(" → ")}</span>
              <span style={{ fontSize: "15px" }}>{alert.message}</span>
            </div>
          </div>

          <button
            onClick={() => {
              onMarkNumbers(alert.numbers);
              setAlert(null);
            }}
            style={{
              background: "#fff",
              color: alert.type === "terminal" ? "#ff6b6b" : "#4a90e2",
              border: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              fontWeight: "900",
              fontSize: "11px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              transition: "transform 0.1s active"
            }}
          >
            MARCAR {alert.label.toUpperCase()}
          </button>
        </div>
      )}

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
              <div style={{ width: "100%" }}>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", marginBottom: "6px" }}>
                  PADRÃO (últimos N):
                </div>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTerminalPatternLength(n)}
                      style={{
                        flex: "1 0 18%",
                        padding: "4px 0",
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
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <span style={{ fontSize: "10px", fontWeight: "bold", color: "#888" }}>
                  MÍNIMO REPS:
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    onClick={() => setTerminalMinReps(Math.max(1, terminalMinReps - 1))}
                    style={{
                      width: "20px",
                      height: "20px",
                      background: "#333",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={terminalMinReps}
                    onChange={(e) => setTerminalMinReps(Math.max(1, Number(e.target.value)))}
                    style={{
                      width: "35px",
                      padding: "2px 4px",
                      background: "#111",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      fontSize: "10px",
                      textAlign: "center"
                    }}
                  />
                  <button
                    onClick={() => setTerminalMinReps(terminalMinReps + 1)}
                    style={{
                      width: "20px",
                      height: "20px",
                      background: "#333",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
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
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <button
                          onClick={() => handleMarkTerminal(pattern.nextTerminal)}
                          style={{
                            padding: "4px 8px",
                            background: "#ff6b6b",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "9px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Marcar Race
                        </button>
                        <button
                          onClick={() => onHighlightPattern(pattern.pattern)}
                          style={{
                            padding: "4px 8px",
                            background: "#4a90e2",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "9px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Circular Hist.
                        </button>
                      </div>
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
                      flex: 1,
                      padding: "6px 4px",
                      background: selectedStrategies.color === "red" ? "#ff6b6b" : "#333",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "10px",
                      textAlign: "center"
                    }}
                  >
                    Vermelho
                    <div style={{ fontSize: "9px", color: "#ffd000" }}>
                      {strategyAnalysis ? getTemperatureEmoji(calculateTemperature((strategyAnalysis.colors.red / Math.max(1, history.length)) * 100)) : ""} {formatPercentage((strategyAnalysis?.colors.red || 0) / Math.max(1, history.length) * 100)}
                    </div>
                  </button>
                  <button
                    onClick={() => handleToggleStrategy("color", "black")}
                    style={{
                      flex: 1,
                      padding: "6px 4px",
                      background: selectedStrategies.color === "black" ? "#ff6b6b" : "#333",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "10px",
                      textAlign: "center"
                    }}
                  >
                    Preto
                    <div style={{ fontSize: "9px", color: "#ffd000" }}>
                      {strategyAnalysis ? getTemperatureEmoji(calculateTemperature((strategyAnalysis.colors.black / Math.max(1, history.length)) * 100)) : ""} {formatPercentage((strategyAnalysis?.colors.black || 0) / Math.max(1, history.length) * 100)}
                    </div>
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
                      flex: 1,
                      padding: "6px 4px",
                      background: selectedStrategies.parity === "even" ? "#ff6b6b" : "#333",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "10px",
                      textAlign: "center"
                    }}
                  >
                    Par
                    <div style={{ fontSize: "9px", color: "#ffd000" }}>
                      {strategyAnalysis ? getTemperatureEmoji(calculateTemperature((strategyAnalysis.parities.even / Math.max(1, history.length)) * 100)) : ""} {formatPercentage((strategyAnalysis?.parities.even || 0) / Math.max(1, history.length) * 100)}
                    </div>
                  </button>
                  <button
                    onClick={() => handleToggleStrategy("parity", "odd")}
                    style={{
                      flex: 1,
                      padding: "6px 4px",
                      background: selectedStrategies.parity === "odd" ? "#ff6b6b" : "#333",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "10px",
                      textAlign: "center"
                    }}
                  >
                    Ímpar
                    <div style={{ fontSize: "9px", color: "#ffd000" }}>
                      {strategyAnalysis ? getTemperatureEmoji(calculateTemperature((strategyAnalysis.parities.odd / Math.max(1, history.length)) * 100)) : ""} {formatPercentage((strategyAnalysis?.parities.odd || 0) / Math.max(1, history.length) * 100)}
                    </div>
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
                      flex: 1,
                      padding: "6px 4px",
                      background: selectedStrategies.half === "low" ? "#ff6b6b" : "#333",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "10px",
                      textAlign: "center"
                    }}
                  >
                    1–18
                    <div style={{ fontSize: "9px", color: "#ffd000" }}>
                      {strategyAnalysis ? getTemperatureEmoji(calculateTemperature((strategyAnalysis.halves.low / Math.max(1, history.length)) * 100)) : ""} {formatPercentage((strategyAnalysis?.halves.low || 0) / Math.max(1, history.length) * 100)}
                    </div>
                  </button>
                  <button
                    onClick={() => handleToggleStrategy("half", "high")}
                    style={{
                      flex: 1,
                      padding: "6px 4px",
                      background: selectedStrategies.half === "high" ? "#ff6b6b" : "#333",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "10px",
                      textAlign: "center"
                    }}
                  >
                    19–36
                    <div style={{ fontSize: "9px", color: "#ffd000" }}>
                      {strategyAnalysis ? getTemperatureEmoji(calculateTemperature((strategyAnalysis.halves.high / Math.max(1, history.length)) * 100)) : ""} {formatPercentage((strategyAnalysis?.halves.high || 0) / Math.max(1, history.length) * 100)}
                    </div>
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
                        flex: 1,
                        padding: "6px 4px",
                        background: selectedStrategies.dozen === d ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "10px",
                        textAlign: "center"
                      }}
                    >
                      {d}ª
                      <div style={{ fontSize: "9px", color: "#ffd000" }}>
                        {strategyAnalysis ? getTemperatureEmoji(calculateTemperature(((strategyAnalysis.dozens[d as 1|2|3] || 0) / Math.max(1, history.length)) * 100)) : ""} {formatPercentage(((strategyAnalysis?.dozens[d as 1|2|3] || 0) / Math.max(1, history.length)) * 100)}
                      </div>
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
                        flex: 1,
                        padding: "6px 4px",
                        background: selectedStrategies.column === c ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "10px",
                        textAlign: "center"
                      }}
                    >
                      C{c}
                      <div style={{ fontSize: "9px", color: "#ffd000" }}>
                        {strategyAnalysis ? getTemperatureEmoji(calculateTemperature(((strategyAnalysis.columns[c as 1|2|3] || 0) / Math.max(1, history.length)) * 100)) : ""} {formatPercentage(((strategyAnalysis?.columns[c as 1|2|3] || 0) / Math.max(1, history.length)) * 100)}
                      </div>
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
              <div style={{ width: "100%" }}>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", marginBottom: "6px" }}>
                  PADRÃO (últimos N):
                </div>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setSectorPatternLength(n)}
                      style={{
                        flex: "1 0 18%",
                        padding: "4px 0",
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
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <span style={{ fontSize: "10px", fontWeight: "bold", color: "#888" }}>
                  MÍNIMO REPS:
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    onClick={() => setSectorMinReps(Math.max(1, sectorMinReps - 1))}
                    style={{
                      width: "20px",
                      height: "20px",
                      background: "#333",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={sectorMinReps}
                    onChange={(e) => setSectorMinReps(Math.max(1, Number(e.target.value)))}
                    style={{
                      width: "35px",
                      padding: "2px 4px",
                      background: "#111",
                      color: "#fff",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      fontSize: "10px",
                      textAlign: "center"
                    }}
                  />
                  <button
                    onClick={() => setSectorMinReps(sectorMinReps + 1)}
                    style={{
                      width: "20px",
                      height: "20px",
                      background: "#333",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
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
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <button
                          onClick={() => handleMarkSector(pattern.nextSector)}
                          style={{
                            padding: "4px 8px",
                            background: "#ff6b6b",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "9px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Marcar Race
                        </button>
                        <button
                          onClick={() => onHighlightPattern(pattern.pattern)}
                          style={{
                            padding: "4px 8px",
                            background: "#4a90e2",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "9px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Circular Hist.
                        </button>
                      </div>
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
