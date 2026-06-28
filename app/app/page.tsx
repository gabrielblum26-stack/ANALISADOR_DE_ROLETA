// Build Version: 2.2.1-fix
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../state/AuthProvider";
import { colorOf, parseInput, neighborsEU, WHEEL_EU, wheelStepEU } from "./lib/roulette";
import { initSel, applyClick, selClass, SelMode, setActiveColor, SEL_ORDER, markMultiple, getNumberColors } from "./lib/selection";
import RaceTrack from "./components/RaceTrack";
import TableMap, { type RepHighlight } from "./components/TableMap";
import NeighborsBlock from "./components/NeighborsBlock";
import { computeStreaks } from "./lib/streaks";
import { computeTerminals } from "./lib/terminals";
import { TerminalCard } from "./components/TerminalCard";
import { Metric } from "./components/Metric";
import MovementPanel from "./components/MovementPanel";
import AutomationModal from "./components/AutomationModal";
import HEAnalysis from "./components/HEAnalysis";
import HotHistoryAnalysis from "./components/HotHistoryAnalysis";

const SHORT_N = 20;
const LONG_N = 200;

export default function Page() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [raw, setRaw] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const [history, setHistory] = useState<number[]>([]);
  const [sel, setSel] = useState(initSel());
  const [selMode, setSelMode] = useState<SelMode>("neighbors");
  const [markingMode, setMarkingMode] = useState<"unique" | "cumulative">("cumulative");
  const [showEaster99, setShowEaster99] = useState(false);
  const [strategyMode, setStrategyMode] = useState<"total" | "intersection">("total");
  const [highlightedNumbers, setHighlightedNumbers] = useState<number[]>([]);
  const [historyTab, setHistoryTab] = useState<'tradicional' | 'quente'>('tradicional');
  const [highlightedHistoryIndices, setHighlightedHistoryIndices] = useState<Set<number>>(new Set());

  // Estados para o Calculador de Distância
  const [distN1, setDistN1] = useState<number | null>(null);
  const [distN2, setDistN2] = useState<number | null>(null);
  const [pickingFor, setPickingFor] = useState<"n1" | "n2" | null>(null);
  const [selectedX, setSelectedX] = useState<number[]>([]);
  const [selectedY, setSelectedY] = useState<string | null>(null);

  // Sincronizar TODAS as marcações com janelas expandidas
  useEffect(() => {
    const bc = new BroadcastChannel('roulette_selections');
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'REQUEST_SELECTIONS') {
        bc.postMessage({ 
          type: 'UPDATE_SELECTIONS', 
          sel, 
          selectedX, 
          selectedY,
          selMode,
          markingMode,
          strategyMode
        });
      } else if (event.data.type === 'UPDATE_HIGHLIGHTS') {
        setHighlightedNumbers(event.data.isActive ? event.data.numbers : []);
      } else if (event.data.type === 'UPDATE_X_Y') {
        if (event.data.selectedX !== undefined) {
          setSelectedX(event.data.selectedX);
        }
        if (event.data.selectedY !== undefined) {
          setSelectedY(event.data.selectedY);
        }
      } else if (event.data.type === 'RACETRACK_CLICK' || event.data.type === 'MAPA_CLICK') {
        const n = event.data.number;
        if (n !== undefined) {
          setSel((prev) => applyClick(prev, n, selMode, markingMode));
        }
      }
    };
    
    bc.onmessage = handleMessage;
    
    bc.postMessage({ 
      type: 'UPDATE_SELECTIONS', 
      sel, 
      selectedX, 
      selectedY,
      selMode,
      markingMode,
      strategyMode
    });
    return () => bc.close();
  }, [sel, selectedX, selectedY, selMode, markingMode, strategyMode]);

  // Estados para Automação
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [automationId, setAutomationId] = useState("");
  const [isAutoActive, setIsAutoActive] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configPassword, setConfigPassword] = useState("");
  const [configPasswordError, setConfigPasswordError] = useState("");

  useEffect(() => {
    const savedId = localStorage.getItem("automation_id");
    if (savedId) {
      setAutomationId(savedId);
      setIsAutoActive(true);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoActive && automationId) {
      const fetchNumbers = async () => {
        try {
          const res = await fetch(`https://padrao-fifa-backend.vercel.app/data/${automationId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.numbers && data.numbers.length > 0) {
              const newNumbers = data.numbers.map(Number);
              if (history.length === 0 || newNumbers[0] !== history[0]) {
                setHistory(newNumbers.slice(0, LONG_N));
              }
            }
          }
        } catch (err) {
          console.error("Erro na automação:", err);
        }
      };

      fetchNumbers();
      interval = setInterval(fetchNumbers, 300);
    }
    return () => clearInterval(interval);
  }, [isAutoActive, automationId, history]);

  const handleSaveAutomation = (id: string) => {
    setAutomationId(id);
    setIsAutoActive(true);
    localStorage.setItem("automation_id", id);
  };

  const handleDeactivateAutomation = () => {
    setIsAutoActive(false);
  };

  const handleClearAutomation = async () => {
    if (!automationId) return;
    if (!confirm("Deseja realmente LIMPAR o histórico no sistema e no banco de dados?")) return;

    try {
      await fetch(`https://padrao-fifa-backend.vercel.app/clear/${automationId}`, { method: 'POST' });
      setHistory([]);
      setIsAutoActive(false);
      alert("Sistema e Banco de Dados limpos com sucesso!");
    } catch (err) {
      console.error("Erro ao limpar:", err);
      alert("Erro ao limpar o banco de dados.");
    }
  };

  const [minimized, setMinimized] = useState({
    history: false,
    neighbors: false,
    raceDist: false,
    trackMap: false,
    terminals: false,
    reps: false,
    zone: false
  });

  const toggleMin = (key: keyof typeof minimized) => {
    setMinimized(prev => ({ ...prev, [key]: !prev[key] }));
  };

  function triggerEaster99() {
    if (typeof window === "undefined") return;
    const audioUrl = "https://www.myinstants.com/media/sounds/cala-a-boca-e-escuta-o-som-da-minha-kombi-ai-2767.mp3";
    const audio = new Audio(audioUrl);
    audio.volume = 1.0;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error("Erro ao tocar áudio da Kombi:", error);
        const msg = new SpeechSynthesisUtterance("Cala a boca e escuta o som da minha kombi aí");
        msg.lang = 'pt-BR';
        window.speechSynthesis.speak(msg);
      });
    }
    
    setShowEaster99(true);
    window.setTimeout(() => setShowEaster99(false), 6000);
  }

  useEffect(() => {
    localStorage.setItem("roulette_history", JSON.stringify(history));
    const bc = new BroadcastChannel("roulette_history_sync");
    bc.postMessage({ type: "UPDATE_HISTORY", value: history });
    bc.close();
  }, [history]);

  useEffect(() => {
    const bc = new BroadcastChannel("roulette_keyboard");
    bc.onmessage = (event) => {
      if (event.data.type === "ADD_NUMBER") {
        addNumber(event.data.value);
      } else if (event.data.type === "MARK_STRATEGY") {
        const nums = event.data.value as number[];
        const colorIndex = event.data.colorIndex;
        onMarkStrategy(nums, colorIndex);
      } else if (event.data.type === "RESET_COLORS") {
        onResetColors();
      } else if (event.data.type === "SET_ACTIVE_COLOR") {
        onColorChange(event.data.value);
      }
    };
    return () => bc.close();
  }, [markingMode, sel]);

  const openKeyboard = () => {
    const width = 500;
    const height = 600;
    const left = window.screen.width - width - 50;
    const top = 100;
    window.open("/keyboard", "RouletteKeyboard", `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`);
  };

  const openPopup = (url: string, title: string, w = 600, h = 700) => {
    const left = (window.screen.width / 2) - (w / 2);
    const top = (window.screen.height / 2) - (h / 2);
    window.open(url, title, `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`);
  };

  const openStrategies = () => openPopup("/estrategias", "RouletteStrategies");
  const openHistoryPopup = () => openPopup("/historico", "RouletteHistory", 800, 800);
  const openDeslocamentoPopup = () => openPopup("/deslocamento", "RouletteMovement", 600, 800);
  const openMapaPopup = () => openPopup("/mapa", "RouletteMap", 900, 600);
  const openRacetrackPopup = () => openPopup("/racetrack", "RouletteRacetrack", 1000, 500);
  const openTecladoPopup = () => openPopup("/teclado_full", "RouletteKeyboard", 800, 400);
  const openFifaCopaPopup = () => openPopup("/fifa-copa", "RouletteFifaCopa", 600, 700);

  const open777Config = () => setIsConfigModalOpen(true);
  const openUtilidades = () => router.push("/utilidades");

  const handleConfigPasswordSubmit = () => {
    if (configPassword === "6431") {
      setConfigPasswordError("");
      setConfigPassword("");
      setIsConfigModalOpen(false);
      window.location.href = "/admin/strategies";
    } else {
      setConfigPasswordError("Senha incorreta!");
      setConfigPassword("");
    }
  };

  const longGridItems = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < 80; i++) arr.push(history[i] ?? null);
    return arr;
  }, [history]);

  const lastTen = useMemo(() => history.slice(0, 10), [history]);

  const repHighlights = useMemo((): Set<RepHighlight> => {
    return new Set();
  }, [lastTen]);

  const disguisedPairIdx = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i < history.length - 1; i++) {
      const a = history[i];
      const b = history[i + 1];
      if (a !== undefined && b !== undefined) {
        const aRoot = a === 28 ? 0 : 1 + ((a - 1) % 9);
        const bRoot = b === 28 ? 0 : 1 + ((b - 1) % 9);
        if (aRoot === bRoot && a !== b) {
          set.add(i);
          set.add(i + 1);
        }
      }
    }
    return set;
  }, [history]);

  function addNumber(n: number) {
    if (n === 99) {
      triggerEaster99();
      return;
    }
    setHistory((prev) => {
      const next = [n, ...prev];
      return next.slice(0, LONG_N);
    });
  }

  function onSend() {
    const nums = parseInput(raw);
    if (nums.length > 0) {
      nums.forEach(addNumber);
      setRaw("");
    }
  }

  function onSendInverted() {
    const nums = parseInput(raw);
    if (nums.length > 0) {
      const invertedNums = nums.reverse();
      invertedNums.forEach(addNumber);
      setRaw("");
    }
  }

  function onUndoLast() {
    if (history.length > 0) setHistory(history.slice(1));
  }

  function onResetAll() {
    setHistory([]);
    setSel(initSel());
  }

  function onResetColors() {
    setSel(initSel());
  }

  function onSelect(n: number) {
    if (pickingFor === "n1") {
      setDistN1(n);
      setPickingFor(null);
      return;
    }
    if (pickingFor === "n2") {
      setDistN2(n);
      setPickingFor(null);
      return;
    }
    setSel((prev) => applyClick(prev, n, selMode, markingMode));
  }

  function onColorChange(index: number) {
    setSel((prev) => setActiveColor(prev, index));
  }

  function onMarkStrategy(nums: number[], colorIndex?: number) {
    setSel((prev) => {
      const targetColorIndex = colorIndex !== undefined ? colorIndex : prev.activeColorIndex;
      const tempSel = setActiveColor(prev, targetColorIndex);
      return markMultiple(tempSel, nums, markingMode);
    });
  }

  const mergedNumbers = useMemo(() => {
    const counts: Record<number, number> = {};
    let maxCount = 0;
    for (let n = 0; n <= 36; n++) {
      const count = getNumberColors(sel, n).length;
      if (count > 0) {
        counts[n] = count;
        if (count > maxCount) maxCount = count;
      }
    }
    if (maxCount <= 1) return { numbers: [], maxCount: 0 };
    const result = Object.entries(counts)
      .filter(([_, count]) => count === maxCount)
      .map(([n, _]) => parseInt(n));
    return { numbers: result, maxCount };
  }, [sel]);

  const streaks = useMemo(() => computeStreaks(history), [history]);
  const terminals = useMemo(() => computeTerminals(history), [history]);

  const getCellStyles = (n: number) => {
    const colors = getNumberColors(sel, n);
    if (strategyMode === "intersection" && mergedNumbers.maxCount > 1) {
      if (colors.length < mergedNumbers.maxCount) {
        return { opacity: 0.1, pointerEvents: 'none' as const, transition: 'all 0.3s' };
      }
    }
    if (colors.length === 0) return {};
    if (colors.length === 1) return { backgroundColor: colors[0], boxShadow: `0 0 15px ${colors[0]}88` };
    const step = 100 / colors.length;
    const gradientParts = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`);
    return {
      background: `linear-gradient(135deg, ${gradientParts.join(", ")})`,
      boxShadow: `0 0 15px ${colors[0]}88`
    };
  };

  const X_COLORS = [
    "#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", 
    "#06b6d4", "#f97316", "#8b5cf6", "#14b8a6", "#f43f5e", "#84cc16",
    "#d946ef", "#6366f1", "#0ea5e9", "#facc15", "#fb7185", "#2dd4bf"
  ];

  const xHighlightStyles = useMemo(() => {
    const styles: Record<number, { backgroundColor: string; boxShadow: string; color: string; border?: string }> = {};
    if (history.length === 0 || selectedX.length === 0) return styles;
    const lastNum = history[0];
    selectedX.forEach((dist, i) => {
      const target = WHEEL_EU[(WHEEL_EU.indexOf(lastNum) + dist + 37) % 37];
      styles[target] = { 
        backgroundColor: X_COLORS[i % X_COLORS.length], 
        boxShadow: `0 0 20px ${X_COLORS[i % X_COLORS.length]}`,
        color: "#fff",
        border: "2px solid #fff"
      };
    });
    return styles;
  }, [history, selectedX]);

  const yHighlightStyles = useMemo(() => {
    const styles: Record<number, { backgroundColor: string; boxShadow: string; color: string; border?: string }> = {};
    if (!selectedY || history.length === 0) return styles;
    const lastNum = history[0];
    const steps = selectedY.split(/[\s,]+/).filter(Boolean).map(s => Number(s));
    steps.forEach(s => {
      const targetIdx = (WHEEL_EU.indexOf(lastNum) + s + 37) % 37;
      const target = WHEEL_EU[targetIdx];
      styles[target] = { 
        backgroundColor: "#a855f7", 
        boxShadow: "0 0 20px #a855f7",
        color: "#fff",
        border: "2px solid #fff"
      };
    });
    return styles;
  }, [history, selectedY]);

  if (authLoading || !user) {
    return (
      <div style={{ background: "#121212", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffd000", fontWeight: "bold" }}>
        CARREGANDO...
      </div>
    );
  }

  return (
    <main style={{ background: "#000", minHeight: "100vh", color: "#fff", padding: "10px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {showEaster99 && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px"
        }}>
          <h1 style={{ color: "#ffd000", fontSize: "40px", fontWeight: "900", marginBottom: "20px", textShadow: "0 0 20px #ffd000" }}>
            🚐 CALA A BOCA E ESCUTA O SOM DA MINHA KOMBI AÍ!
          </h1>
          <div style={{ fontSize: "100px" }}>🚐💨💨💨</div>
        </div>
      )}

      <div style={{ maxWidth: "1400px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 400px", gap: "10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "15px", border: "1px solid #333" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <h2 style={{ color: "#ffd000", fontWeight: "900", fontSize: "18px", margin: 0 }}>ROULETTE PRO</h2>
                <div style={{ background: "#333", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", color: "#aaa" }}>
                  {isAutoActive ? `AUTOMAÇÃO ATIVA: ${automationId}` : "MODO MANUAL"}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setIsAutoModalOpen(true)} style={{ background: "#333", border: "none", color: "#fff", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                  CONECTAR
                </button>
                <button onClick={openUtilidades} style={{ background: "#4a90e2", border: "none", color: "#fff", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                  UTILIDADES
                </button>
                <button onClick={open777Config} style={{ background: "#333", border: "none", color: "#fff", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                  ⚙️
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <input
                type="text"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSend()}
                placeholder="Digite os números (ex: 1, 2, 3)"
                style={{ flex: 1, background: "#000", border: "1px solid #444", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px" }}
              />
              <button onClick={onSend} style={{ background: "#ffd000", color: "#000", border: "none", borderRadius: "8px", padding: "0 25px", fontWeight: "900", cursor: "pointer" }}>
                ENVIAR
              </button>
              <button onClick={onSendInverted} style={{ background: "#333", color: "#fff", border: "none", borderRadius: "8px", padding: "0 15px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}>
                INV
              </button>
              <button onClick={onUndoLast} style={{ background: "#333", color: "#fff", border: "none", borderRadius: "8px", padding: "0 15px", fontWeight: "bold", cursor: "pointer" }}>
                ↩
              </button>
              <button onClick={onResetAll} style={{ background: "#ff4b4b", color: "#fff", border: "none", borderRadius: "8px", padding: "0 15px", fontWeight: "bold", cursor: "pointer" }}>
                LIMPAR
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "5px" }}>
              {history.slice(0, 20).map((n, i) => (
                <div key={i} style={{
                  minWidth: "40px", height: "40px", borderRadius: "8px", background: colorOf(n),
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900",
                  fontSize: "16px", border: i === 0 ? "2px solid #fff" : "none",
                  boxShadow: i === 0 ? "0 0 15px rgba(255,255,255,0.5)" : "none"
                }}>
                  {n}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "15px", border: "1px solid #333" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <div style={{ display: "flex", gap: "15px" }}>
                <button onClick={() => setSelMode("neighbors")} style={{ background: selMode === "neighbors" ? "#ffd000" : "#333", color: selMode === "neighbors" ? "#000" : "#fff", border: "none", padding: "8px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                  VIZINHOS
                </button>
                <button onClick={() => setSelMode("unique")} style={{ background: selMode === "unique" ? "#ffd000" : "#333", color: selMode === "unique" ? "#000" : "#fff", border: "none", padding: "8px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                  ÚNICO
                </button>
              </div>
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <div style={{ display: "flex", background: "#000", padding: "4px", borderRadius: "8px", border: "1px solid #444" }}>
                  <button onClick={() => setStrategyMode("total")} style={{ background: strategyMode === "total" ? "#444" : "transparent", color: "#fff", border: "none", padding: "5px 15px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>TOTAL</button>
                  <button onClick={() => setStrategyMode("intersection")} style={{ background: strategyMode === "intersection" ? "#444" : "transparent", color: "#fff", border: "none", padding: "5px 15px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>INTERSECÇÃO</button>
                </div>
                <button onClick={onResetColors} style={{ color: "#ff4b4b", background: "none", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}>LIMPAR MARCAÇÕES</button>
              </div>
            </div>

            <TableMap 
              sel={sel} 
              onSelect={onSelect} 
              getCellStyles={getCellStyles} 
              xHighlightStyles={xHighlightStyles}
              yHighlightStyles={yHighlightStyles}
              repHighlights={repHighlights}
              highlightedNumbers={highlightedNumbers}
            />
            
            <div style={{ marginTop: "20px" }}>
              <RaceTrack 
                sel={sel} 
                onSelect={onSelect} 
                getCellStyles={getCellStyles}
                xHighlightStyles={xHighlightStyles}
                yHighlightStyles={yHighlightStyles}
                highlightedNumbers={highlightedNumbers}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <HotHistoryAnalysis 
            history={history} 
            onMarkNumbers={onMarkStrategy}
            onColorChange={(colorIndex) => {
              // Sincroniza a cor ativa com o componente de seleção
              setSel(prev => setActiveColor(prev, colorIndex));
            }}
            onResetColors={onResetColors}
            onHighlightPattern={(nums) => {
              setHighlightedNumbers(nums);
              setTimeout(() => setHighlightedNumbers([]), 3000);
            }}
          />
          
          <MovementPanel 
            history={history}
            selectedX={selectedX}
            onXChange={setSelectedX}
            selectedY={selectedY}
            onYChange={setSelectedY}
          />
        </div>
      </div>

      <AutomationModal 
        isOpen={isAutoModalOpen}
        onClose={() => setIsAutoModalOpen(false)}
        onSave={handleSaveAutomation}
        onPause={handleDeactivateAutomation}
        onClear={handleClearAutomation}
        currentId={automationId}
        isAutoActive={isAutoActive}
      />

      {isConfigModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1a1a1a", padding: "30px", borderRadius: "15px", border: "1px solid #333", width: "300px" }}>
            <h3 style={{ color: "#ffd000", marginTop: 0 }}>CONFIGURAÇÃO</h3>
            <input 
              type="password" 
              value={configPassword}
              onChange={(e) => setConfigPassword(e.target.value)}
              placeholder="Senha de acesso"
              style={{ width: "100%", background: "#000", border: "1px solid #444", padding: "10px", borderRadius: "8px", color: "#fff", marginBottom: "10px" }}
            />
            {configPasswordError && <div style={{ color: "#ff4b4b", fontSize: "12px", marginBottom: "10px" }}>{configPasswordError}</div>}
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleConfigPasswordSubmit} style={{ flex: 1, background: "#ffd000", color: "#000", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>ENTRAR</button>
              <button onClick={() => setIsConfigModalOpen(false)} style={{ flex: 1, background: "#333", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
