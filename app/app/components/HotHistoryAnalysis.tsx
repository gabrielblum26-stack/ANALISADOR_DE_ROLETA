"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { colorOf } from "../lib/roulette";
import {
  analyzeTerminalPatterns,
  analyzeStrategy,
  analyzeSectorPatterns,
  analyzeDegreePatterns,
  TERMINAL_NUMBERS,
  SECTORS,
  StrategyClassification,
  SectorName,
  DegreeAnalysisResult
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
  const [activeTab, setActiveTab] = useState<"terminals" | "strategies" | "sectors" | "degree">(
    "terminals"
  );
  
  type AlertMode = "OFF" | "FOCO" | "GLOBAL";
  const [alertMode, setAlertMode] = useState<AlertMode>("FOCO");
  
  type SoundMode = "VOZ" | "RAPAZ" | "FAAAH";
  const [soundMode, setSoundMode] = useState<SoundMode>("RAPAZ");

  type AlertData = {
    id: string;
    message: string; 
    type: "terminal" | "sector";
    numbers: number[];
    label: string;
    sequence: number[];
  };

  const [alerts, setAlerts] = useState<AlertData[]>([]);

  // Carregar preferência de alertas, som e configurações de padrões
  useEffect(() => {
    const savedMode = localStorage.getItem("roulette_alert_mode") as AlertMode;
    if (savedMode && ["OFF", "FOCO", "GLOBAL"].includes(savedMode)) {
      setAlertMode(savedMode);
    }
    const savedSound = localStorage.getItem("roulette_sound_mode") as SoundMode;
    if (savedSound && ["VOZ", "RAPAZ", "FAAAH"].includes(savedSound)) {
      setSoundMode(savedSound);
    } else {
      setSoundMode("RAPAZ");
    }
    
    // Carregar configurações de padrões
    const savedTerminalPatternLength = localStorage.getItem("roulette_terminal_pattern_length");
    if (savedTerminalPatternLength) setTerminalPatternLength(parseInt(savedTerminalPatternLength));
    const savedTerminalMinReps = localStorage.getItem("roulette_terminal_min_reps");
    if (savedTerminalMinReps) setTerminalMinReps(parseInt(savedTerminalMinReps));
    
    const savedSectorPatternLength = localStorage.getItem("roulette_sector_pattern_length");
    if (savedSectorPatternLength) setSectorPatternLength(parseInt(savedSectorPatternLength));
    const savedSectorMinReps = localStorage.getItem("roulette_sector_min_reps");
    if (savedSectorMinReps) setSectorMinReps(parseInt(savedSectorMinReps));
    
    const savedDegree = localStorage.getItem("roulette_degree");
    if (savedDegree) setDegree(parseInt(savedDegree) as 1 | 2);
    const savedDegreePatternLength = localStorage.getItem("roulette_degree_pattern_length");
    if (savedDegreePatternLength) setDegreePatternLength(parseInt(savedDegreePatternLength));
    const savedDegreeMinReps = localStorage.getItem("roulette_degree_min_reps");
    if (savedDegreeMinReps) setDegreeMinReps(parseInt(savedDegreeMinReps));
    const savedMaxValetas = localStorage.getItem("roulette_max_valetas");
    if (savedMaxValetas) setMaxValetas(parseInt(savedMaxValetas));
    
    const savedSelectedStrategies = localStorage.getItem("roulette_selected_strategies");
    if (savedSelectedStrategies) setSelectedStrategies(JSON.parse(savedSelectedStrategies));
  }, []);

  // Salvar todas as preferências e configurações
  useEffect(() => {
    localStorage.setItem("roulette_alert_mode", alertMode);
    localStorage.setItem("roulette_sound_mode", soundMode);
    localStorage.setItem("roulette_terminal_pattern_length", terminalPatternLength.toString());
    localStorage.setItem("roulette_terminal_min_reps", terminalMinReps.toString());
    localStorage.setItem("roulette_sector_pattern_length", sectorPatternLength.toString());
    localStorage.setItem("roulette_sector_min_reps", sectorMinReps.toString());
    localStorage.setItem("roulette_degree", degree.toString());
    localStorage.setItem("roulette_degree_pattern_length", degreePatternLength.toString());
    localStorage.setItem("roulette_degree_min_reps", degreeMinReps.toString());
    localStorage.setItem("roulette_max_valetas", maxValetas.toString());
    localStorage.setItem("roulette_selected_strategies", JSON.stringify(selectedStrategies));
  }, [alertMode, soundMode, terminalPatternLength, terminalMinReps, sectorPatternLength, sectorMinReps, degree, degreePatternLength, degreeMinReps, maxValetas, selectedStrategies])

  // Limpar alertas quando o histórico mudar (nova rodada)
  useEffect(() => {
    setAlerts([]);
  }, [history.length]);

  const addAlert = (newAlert: Omit<AlertData, "id">) => {
    const id = `${newAlert.type}-${newAlert.label}-${Date.now()}`;
    setAlerts(prev => {
      // Evitar alertas duplicados idênticos ativos
      if (prev.some(a => a.message === newAlert.message)) return prev;
      return [...prev, { ...newAlert, id }];
    });
  };

  // ============ TAB 1: TERMINALS ============
  const [terminalPatternLength, setTerminalPatternLength] = useState(1);
  const [terminalMinReps, setTerminalMinReps] = useState(6);
  const lastSpokenPattern = useRef<string>("");

  const terminalAnalysis = useMemo(() => {
    return analyzeTerminalPatterns(history, terminalPatternLength, terminalMinReps);
  }, [history, terminalPatternLength, terminalMinReps]);

  const lastAudioPlayedRound = useRef<number>(-1);

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

  // ============ TAB 4: DEGREE PATTERNS ============
  const [degree, setDegree] = useState<1 | 2>(1);
  const [degreePatternLength, setDegreePatternLength] = useState(1);
  const [degreeMinReps, setDegreeMinReps] = useState(6);
  const [maxValetas, setMaxValetas] = useState(0);

  const degreeAnalysis = useMemo(() => {
    return analyzeDegreePatterns(history, degree, degreePatternLength, degreeMinReps, maxValetas);
  }, [history, degree, degreePatternLength, degreeMinReps, maxValetas]);

  // Efeito para Alerta de Voz e Visual
  useEffect(() => {
    if (alertMode === "OFF" || history.length < 1) return;

    // Função auxiliar para disparar alerta
    const triggerAlert = (msgText: string, alertData: Omit<AlertData, "id">, patternKey: string) => {
      if (lastSpokenPattern.current === patternKey) return;
      
      if (soundMode === "VOZ") {
        // Cancelar falas anteriores para não acumular
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(`Atenção! ${msgText}`);
        msg.lang = 'pt-BR';
        msg.rate = 1.2;
        window.speechSynthesis.speak(msg);
      } else if (lastAudioPlayedRound.current !== history.length) {
        // Tocar apenas uma vez por rodada para efeitos sonoros
        let audioUrl = "";
        if (soundMode === "RAPAZ") {
          audioUrl = "https://www.myinstants.com/media/sounds/xaropinho-rapaz.mp3";
        } else if (soundMode === "FAAAH") {
          audioUrl = "https://www.myinstants.com/media/sounds/faaah.mp3";
        }

        if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.play().catch(e => console.error("Erro ao tocar áudio:", e));
          lastAudioPlayedRound.current = history.length;
        }
      }
      
      // Alerta Visual
      addAlert(alertData);
      lastSpokenPattern.current = patternKey;
    };

    // 1. Padrões de Grau
    if (alertMode === "GLOBAL" || (alertMode === "FOCO" && activeTab === "degree")) {
      degreeAnalysis.patterns.forEach(p => {
        if (p.pattern.length > 0) {
          // Verificar se o padrão está se formando (últimos N números correspondem ao padrão)
          // Mas ANTES que o hit já tenha caído na zona (alerta no momento da armação, não após o resultado)
          const historyEnd = history.slice(-p.pattern.length);
          if (historyEnd.every((v, i) => v === p.pattern[i])) {
            // Padrão detectado - disparar alerta AGORA, não após o hit
            const patternKey = `degree-${degree}-${p.pattern.join(",")}-${p.target}-${history.length}`;
            triggerAlert(
              `Padrão Armado: Zona do ${p.target} (${degree}º Grau)`,
              { message: `Padrão Armado: Zona do ${p.target} (${degree}º Grau)`, type: "sector", numbers: p.zona, label: `Zona ${p.target}`, sequence: p.pattern },
              patternKey
            );
          }
        }
      });
    }

    // 2. Padrões de Terminais
    if (alertMode === "GLOBAL" || (alertMode === "FOCO" && activeTab === "terminals")) {
      terminalAnalysis.patterns.forEach(p => {
        if (p.pattern.length > 0) {
          const historyEnd = history.slice(-p.pattern.length);
          if (historyEnd.every((v, i) => v === p.pattern[i])) {
            const patternKey = `terminal-${p.pattern.join(",")}-${p.nextTerminal}-${history.length}`;
            triggerAlert(
              `Possível Terminal ${p.nextTerminal}`,
              { message: `Possível Terminal ${p.nextTerminal}`, type: "terminal", numbers: TERMINAL_NUMBERS[p.nextTerminal], label: `T${p.nextTerminal}`, sequence: p.pattern },
              patternKey
            );
          }
        }
      });
    }

    // 3. Padrões de Setores (Roda Quente)
    if (alertMode === "GLOBAL" || (alertMode === "FOCO" && activeTab === "sectors")) {
      sectorAnalysis.patterns.forEach(p => {
        if (p.pattern.length > 0) {
          const historyEnd = history.slice(-p.pattern.length);
          if (historyEnd.every((v, i) => v === p.pattern[i])) {
            const patternKey = `sector-${p.pattern.join(",")}-${p.nextSector}-${history.length}`;
            const sectorNames: Record<string, string> = { voisins: "Vizinhos do Zero", tier: "Terço do Cilindro", orphelins: "Órfãos", zero_game: "Zero Game" };
            const sectorName = sectorNames[p.nextSector] || p.nextSector;
            triggerAlert(
              `Possível entrada: ${sectorName}`,
              { message: `Possível entrada: ${sectorName}`, type: "sector", numbers: SECTORS[p.nextSector], label: sectorName, sequence: p.pattern },
              patternKey
            );
          }
        }
      });
    }
  }, [history.length, activeTab, alertMode, terminalAnalysis.patterns, sectorAnalysis.patterns, degreeAnalysis.patterns, addAlert]);

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
      {/* HEADER */}
      <div style={{
        padding: "8px 15px",
        background: "#1a1a1a",
        borderBottom: "1px solid #333",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopLeftRadius: "8px",
        borderTopRightRadius: "8px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: "900", color: "#fff", letterSpacing: "1px" }}>
            HISTÓRICO ({history.length})
          </span>
          
          {/* ALERT & SOUND SELECTORS */}
          <div style={{ display: "flex", gap: "6px", marginLeft: "8px", flexWrap: "nowrap" }}>
            <div style={{ 
              display: "flex", 
              background: "#000", 
              borderRadius: "5px", 
              padding: "1px",
              border: "1px solid #333"
            }}>
              {(["OFF", "FOCO", "GLB"] as any[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAlertMode(mode === "GLB" ? "GLOBAL" : mode as AlertMode)}
                  style={{
                    padding: "3px 6px",
                    fontSize: "8px",
                    fontWeight: "bold",
                    background: (alertMode === mode || (mode === "GLB" && alertMode === "GLOBAL")) ? (mode === "OFF" ? "#ff4b4b" : "#4a90e2") : "transparent",
                    color: (alertMode === mode || (mode === "GLB" && alertMode === "GLOBAL")) ? "#fff" : "#555",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div style={{ 
              display: "flex", 
              background: "#000", 
              borderRadius: "5px", 
              padding: "1px",
              border: "1px solid #333"
            }}>
              {(["VOZ", "RPZ", "FAH"] as any[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSoundMode(mode === "RPZ" ? "RAPAZ" : mode === "FAH" ? "FAAAH" : "VOZ")}
                  style={{
                    padding: "3px 6px",
                    fontSize: "8px",
                    fontWeight: "bold",
                    background: (soundMode === (mode === "RPZ" ? "RAPAZ" : mode === "FAH" ? "FAAAH" : "VOZ")) ? "#ffd000" : "transparent",
                    color: (soundMode === (mode === "RPZ" ? "RAPAZ" : mode === "FAH" ? "FAAAH" : "VOZ")) ? "#000" : "#555",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#333" }}></div>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#333" }}></div>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ff4b4b", cursor: "pointer" }}></div>
        </div>
      </div>

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
        <button
          onClick={() => setActiveTab("degree")}
          style={{
            flex: 1,
            padding: "8px 4px",
            background: activeTab === "degree" ? "#ff6b6b" : "#333",
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
          Padrão de Grau
        </button>
      </div>

      {/* ALERT BANNERS LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {alerts
          .filter(a => {
            if (alertMode === "OFF") return false;
            if (alertMode === "GLOBAL") return true;
            // Modo FOCO: filtra pela aba ativa
            if (activeTab === "terminals") return a.type === "terminal";
            if (activeTab === "sectors") return a.type === "sector" && !a.label.startsWith("Zona");
            if (activeTab === "degree") return a.type === "sector" && a.label.startsWith("Zona");
            return false;
          })
          .map((a) => (
          <div key={a.id} style={{
            background: a.type === "terminal" ? "linear-gradient(90deg, #ff6b6b, #ee5253)" : "linear-gradient(90deg, #4a90e2, #357abd)",
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
                <span style={{ fontSize: "10px", opacity: 0.9, textTransform: "uppercase" }}>Padrão Detectado: {a.sequence.join(" → ")}</span>
                <span style={{ fontSize: "15px" }}>{a.message}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onMarkNumbers(a.numbers);
                setAlerts(prev => prev.filter(item => item.id !== a.id));
              }}
              style={{
                background: "#fff",
                color: a.type === "terminal" ? "#ff6b6b" : "#4a90e2",
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
              MARCAR {a.label.toUpperCase()}
            </button>
          </div>
        ))}
      </div>

      {/* TAB CONTENT - SCROLLABLE */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "15px",
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

            {/* TERMINAL PATTERNS */}
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
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {/* SELECTION GRID */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* COLORS */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", marginBottom: "6px" }}>CORES:</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["red", "black"].map((color) => (
                    <button
                      key={color}
                      onClick={() => handleToggleStrategy("color", color)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        background: selectedStrategies.color === color ? (color === "red" ? "#ff4b4b" : "#444") : "#222",
                        color: "#fff",
                        border: selectedStrategies.color === color ? "2px solid #fff" : "1px solid #555",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "10px",
                        textTransform: "uppercase"
                      }}
                    >
                      {color === "red" ? "Vermelho" : "Preto"}
                      <div style={{ fontSize: "9px", color: "#ffd000" }}>
                        {strategyAnalysis ? getTemperatureEmoji(calculateTemperature(((strategyAnalysis.colors[color as "red"|"black"] || 0) / Math.max(1, history.length)) * 100)) : ""} {formatPercentage(((strategyAnalysis?.colors[color as "red"|"black"] || 0) / Math.max(1, history.length)) * 100)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* PARITY */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", marginBottom: "6px" }}>PARIDADE:</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["even", "odd"].map((p) => (
                    <button
                      key={p}
                      onClick={() => handleToggleStrategy("parity", p)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        background: selectedStrategies.parity === p ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "10px",
                        textTransform: "uppercase"
                      }}
                    >
                      {p === "even" ? "Par" : "Ímpar"}
                      <div style={{ fontSize: "9px", color: "#ffd000" }}>
                        {strategyAnalysis ? getTemperatureEmoji(calculateTemperature(((strategyAnalysis.parities[p as "even"|"odd"] || 0) / Math.max(1, history.length)) * 100)) : ""} {formatPercentage(((strategyAnalysis?.parities[p as "even"|"odd"] || 0) / Math.max(1, history.length)) * 100)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* DOZENS */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", marginBottom: "6px" }}>DÚZIAS:</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[1, 2, 3].map((d) => (
                    <button
                      key={d}
                      onClick={() => handleToggleStrategy("dozen", d)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        background: selectedStrategies.dozen === d ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "10px"
                      }}
                    >
                      {d}ª Dúzia
                      <div style={{ fontSize: "9px", color: "#ffd000" }}>
                        {strategyAnalysis ? getTemperatureEmoji(calculateTemperature(((strategyAnalysis.dozens[d as 1|2|3] || 0) / Math.max(1, history.length)) * 100)) : ""} {formatPercentage(((strategyAnalysis?.dozens[d as 1|2|3] || 0) / Math.max(1, history.length)) * 100)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* COLUMNS */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", marginBottom: "6px" }}>COLUNAS:</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[1, 2, 3].map((c) => (
                    <button
                      key={c}
                      onClick={() => handleToggleStrategy("column", c)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        background: selectedStrategies.column === c ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "10px"
                      }}
                    >
                      {c}ª Coluna
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
                      {stats.percentage > 0 ? `${getTemperatureEmoji(stats.percentage)} ${sector.toUpperCase().replace("_", " ")}` : sector.toUpperCase().replace("_", " ")}
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
                          Setor: <strong style={{ color: "#ff6b6b" }}>{pattern.nextSector.toUpperCase().replace("_", " ")}</strong>
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

        {/* TAB 4: DEGREE PATTERNS */}
        {activeTab === "degree" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {/* CONTROLS */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "12px",
              background: "#222",
              borderRadius: "6px",
              border: "1px solid #333"
            }}>
              {/* DEGREE SELECTOR */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", marginBottom: "6px" }}>
                  GRAU DOS VIZINHOS:
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDegree(d as 1 | 2)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        background: degree === d ? "#ff6b6b" : "#333",
                        color: "#fff",
                        border: "1px solid #555",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "11px"
                      }}
                    >
                      {d}º Grau ({d === 1 ? "3" : "5"} Números)
                    </button>
                  ))}
                </div>
              </div>

              {/* PATTERN LENGTH SELECTOR */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", marginBottom: "6px" }}>
                  PADRÃO (últimos N):
                </div>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => setDegreePatternLength(n)}
                      style={{
                        flex: "1 0 15%",
                        padding: "6px 0",
                        background: degreePatternLength === n ? "#ff6b6b" : "#333",
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

              {/* REPS AND VALETAS */}
              <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "bold", color: "#888" }}>MÍNIMO REPS:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button onClick={() => setDegreeMinReps(Math.max(1, degreeMinReps - 1))} style={{ width: "22px", height: "22px", background: "#333", border: "1px solid #555", borderRadius: "4px", color: "#fff" }}>-</button>
                    <input type="number" value={degreeMinReps} readOnly style={{ width: "30px", background: "#111", color: "#fff", border: "1px solid #555", textAlign: "center", fontSize: "10px" }} />
                    <button onClick={() => setDegreeMinReps(degreeMinReps + 1)} style={{ width: "22px", height: "22px", background: "#333", border: "1px solid #555", borderRadius: "4px", color: "#fff" }}>+</button>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "bold", color: "#888" }}>MÁX VALETAS:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button onClick={() => setMaxValetas(Math.max(0, maxValetas - 1))} style={{ width: "22px", height: "22px", background: "#333", border: "1px solid #555", borderRadius: "4px", color: "#fff" }}>-</button>
                    <input type="number" value={maxValetas} readOnly style={{ width: "30px", background: "#111", color: "#fff", border: "1px solid #555", textAlign: "center", fontSize: "10px" }} />
                    <button onClick={() => setMaxValetas(maxValetas + 1)} style={{ width: "22px", height: "22px", background: "#333", border: "1px solid #555", borderRadius: "4px", color: "#fff" }}>+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* RESULTS */}
            {degreeAnalysis.patterns.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#ffd000" }}>
                  PADRÕES DE GRAU ENCONTRADOS:
                </div>
                {degreeAnalysis.patterns.map((p, idx) => {
                  const temp = calculateTemperature(p.strength);
                  return (
                    <div key={idx} style={{ background: "#222", border: "1px solid #444", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div>
                          <div style={{ fontSize: "10px", color: "#888" }}>Sequência: <strong>{p.pattern.join(" → ")}</strong></div>
                          <div style={{ fontSize: "11px", color: "#fff", marginTop: "4px" }}>Alvo Principal: <strong style={{ color: "#ff6b6b", fontSize: "14px" }}>{p.target}</strong></div>
                          <div style={{ fontSize: "10px", color: "#888", marginTop: "2px" }}>Zona: <strong>{p.zona.join(", ")}</strong></div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "10px", color: "#888" }}>Reps: <strong>{p.count}</strong></div>
                          <div style={{ fontSize: "11px", color: "#ffd000", fontWeight: "bold" }}>{formatPercentage(p.strength)}</div>
                          <div style={{ fontSize: "12px" }}>{getTemperatureEmoji(temp)}</div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                        <button
                          onClick={() => onMarkNumbers([p.target])}
                          style={{ padding: "6px 2px", background: "#ff6b6b", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "9px" }}
                        >
                          Marcar Alvo
                        </button>
                        <button
                          onClick={() => onMarkNumbers(p.zona)}
                          style={{ padding: "6px 2px", background: "#4a90e2", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "9px" }}
                        >
                          Marcar Zona
                        </button>
                        <button
                          onClick={() => onHighlightPattern(p.pattern)}
                          style={{ padding: "6px 2px", background: "#ffd000", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "9px" }}
                        >
                          Ver no Hist.
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "#888", fontSize: "11px", padding: "20px", textAlign: "center", background: "#222", borderRadius: "6px", border: "1px dashed #444" }}>
                Nenhum padrão de grau detectado com as configurações atuais.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
