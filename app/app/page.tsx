"use client";

import { useEffect, useMemo, useState } from "react";
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

  if (authLoading || !user) {
    return (
      <div style={{ background: "#121212", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffd000", fontWeight: "bold" }}>
        CARREGANDO...
      </div>
    );
  }
  const [history, setHistory] = useState<number[]>([]);
  const [sel, setSel] = useState(initSel());
  const [selMode, setSelMode] = useState<SelMode>("neighbors");
  const [markingMode, setMarkingMode] = useState<"unique" | "cumulative">("cumulative");
  const [showEaster99, setShowEaster99] = useState(false);
  const [strategyMode, setStrategyMode] = useState<"total" | "intersection">("total");

  // Estados para o Calculador de Distância
  const [distN1, setDistN1] = useState<number | null>(null);
  const [distN2, setDistN2] = useState<number | null>(null);
  const [pickingFor, setPickingFor] = useState<"n1" | "n2" | null>(null);
  const [selectedX, setSelectedX] = useState<number[]>([]);

  // Estados para Automação
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [automationId, setAutomationId] = useState("");
  const [isAutoActive, setIsAutoActive] = useState(false);

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
              // Só atualiza se o número mais recente for diferente do que já temos
              if (history.length === 0 || newNumbers[0] !== history[0]) {
                // Sincroniza o histórico inteiro (limitado a LONG_N)
                setHistory(newNumbers.slice(0, LONG_N));
              }
            }
          }
        } catch (err) {
          console.error("Erro na automação:", err);
        }
      };

      fetchNumbers(); // Busca imediata
      interval = setInterval(fetchNumbers, 1000); // Polling a cada 1s
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
      // 1. Limpa no Banco de Dados via Backend
      await fetch(`https://padrao-fifa-backend.vercel.app/clear/${automationId}`, { method: 'POST' });
      
      // 2. Limpa no Sistema Local
      setHistory([]);
      setIsAutoActive(false);
      
      alert("Sistema e Banco de Dados limpos com sucesso!");
    } catch (err) {
      console.error("Erro ao limpar:", err);
      alert("Erro ao limpar o banco de dados.");
    }
  };

  // Estados para minimizar blocos
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
    const key = "easter99Seen";
    if (window.localStorage.getItem(key) === "1") return;
    window.localStorage.setItem(key, "1");
    setShowEaster99(true);
    window.setTimeout(() => setShowEaster99(false), 2600);
  }

  useEffect(() => {
    if (history.length > 0 && history[0] === 99) triggerEaster99();
    
    // Sincronizar histórico com outras janelas
    localStorage.setItem("roulette_history", JSON.stringify(history));
    const bc = new BroadcastChannel("roulette_history_sync");
    bc.postMessage({ type: "UPDATE_HISTORY", value: history });
    bc.close();
  }, [history]);

  useEffect(() => {
    // Escutar comandos vindos das janelas Keyboard ou Estratégias
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
    
    window.open(
      "/keyboard",
      "RouletteKeyboard",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
  };

  const openStrategies = () => {
    const width = 600;
    const height = 700;
    const left = 50;
    const top = 100;
    
    window.open(
      "/estrategias",
      "RouletteStrategies",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
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
      // Inverte a ordem dos números
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

  
  // Lógica de Números Mesclados (Convergência Máxima)
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
    
    // Filtro de intersecção
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

  // Cores para os botões X selecionados (Sincronizado com MovementPanel)
  const X_COLORS = [
    "#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", 
    "#06b6d4", "#f97316", "#8b5cf6", "#14b8a6", "#f43f5e", "#84cc16",
    "#d946ef", "#6366f1", "#0ea5e9", "#facc15", "#fb7185", "#2dd4bf"
  ];

  const xHighlightStyles = useMemo(() => {
    const styles: Record<number, { backgroundColor: string; boxShadow: string; color: string; border?: string }> = {};
    if (history.length === 0 || selectedX.length === 0) return styles;
    
    const lastNum = history[0];
    // Processamos na ordem inversa para que o X mais recente (último do array) tenha prioridade de cor se houver sobreposição
    [...selectedX].reverse().forEach((x) => {
      const color = X_COLORS[(x - 1) % X_COLORS.length];
      const steps = x + 1;
      const h = wheelStepEU(lastNum, steps);
      const ah = wheelStepEU(lastNum, -steps);
      
      const style = { 
        backgroundColor: color, 
        boxShadow: `0 0 15px ${color}`,
        color: "#fff",
        border: "2px solid #fff",
        zIndex: 10
      };
      
      // Se houver múltiplos X selecionados, o número atual pode acabar recebendo a cor do último X processado (o primeiro do array original).
      // No entanto, como usamos reverse(), o X mais recente (último clicado) terá a prioridade final no objeto styles.
      styles[h] = style;
      styles[ah] = style;
      styles[lastNum] = style;
    });
    return styles;
  }, [selectedX, history]);

	  const getTextColor = (n: number, styles: React.CSSProperties) => {
	    const bg = styles.backgroundColor as string;
	    if (!bg) return "#fff";
	    const lightColors = ["#ffffff", "white", "#ffd000", "#facc15", "#ffcc00", "var(--selC2)", "var(--selC9)", "var(--selC11)"];
	    if (lightColors.includes(bg.toLowerCase())) return "#000";
	    return "#fff";
	  };

	  const getEnhancedCellStyles = (n: number) => {
	    const xStyle = xHighlightStyles[n];
	    if (xStyle) return xStyle;
	    return getCellStyles(n);
	  };

  const topZonePattern = useMemo(() => {
    if (history.length === 0) return null;
    const last = history[0];
    const count = history.filter((x) => x === last).length;
    return {
      xExample: last,
      count,
      triggerKind: "T" as const,
      triggerLabel: `Terminal ${last % 10}`,
      triggerMembers: [],
      zones9: [last],
    };
  }, [history]);

  const calcDist = useMemo(() => {
    if (distN1 === null || distN2 === null) return null;
    
    const idx1 = WHEEL_EU.indexOf(distN1);
    const idx2 = WHEEL_EU.indexOf(distN2);
    const L = WHEEL_EU.length;
    
    const h = (idx2 - idx1 + L) % L;
    const ah = (idx1 - idx2 + L) % L;
    
    return { h, ah };
  }, [distN1, distN2]);

  return (
    <div className="app">
      {showEaster99 && (
        <div className="easterOverlay" onClick={() => setShowEaster99(false)}>
          <img src="/easter-99.gif" alt="Easter 99" />
        </div>
      )}
      
      <div className="panel topbar">
        <div className="topbarLine">
          {/* GRUPO 1: ENTRADA E ENVIO */}
          <div className="inputWrap">
            <input
              type="text"
              placeholder="Ex: 1 24 36 ou 1,24,36"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSend();
                }
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', paddingRight: '15px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <button className="btn btn-send" onClick={onSend}>ENVIAR</button>
            <button className="btn btn-send" onClick={onSendInverted} style={{ background: "#ef4444", color: "#fff" }}>INVERTER E ENVIAR</button>
            <button className="btn btn-undo" onClick={onUndoLast}>APAGAR</button>
          </div>
          
          {/* GRUPO 2: AUTOMAÇÃO */}
          <div style={{ display: 'flex', gap: '8px', padding: '0 15px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <button 
              className="btn" 
              onClick={() => setIsAutoModalOpen(true)} 
              style={{ 
                background: isAutoActive ? "#22c55e" : "#333", 
                color: "#fff",
                border: isAutoActive ? "1px solid #4ade80" : "1px solid #444",
                minWidth: '140px'
              }}
            >
              {isAutoActive ? "🟢 AUTOMATIZADO" : "🤖 AUTOMATIZAR"}
            </button>
          </div>

          {/* GRUPO 3: FERRAMENTAS */}
          <div style={{ display: 'flex', gap: '8px', paddingLeft: '15px' }}>
            <button className="btn btn-reset" onClick={onResetAll}>RESET TOTAL</button>
            <button className="btn btn-keyboard" onClick={openKeyboard} style={{ background: "#9333ea", color: "#fff" }}>
              KEYBOARD
            </button>
            <button className="btn btn-colors" onClick={openStrategies} style={{ background: "#22c55e", color: "#fff" }}>
              ESTRATEGIAS
            </button>
          </div>
        </div>

        <div className="topbarLine secondary">
          <button className="btn btn-colors" onClick={onResetColors} style={{ background: "#3b82f6", color: "#fff", minWidth: '150px' }}>
            RESET DE CORES
          </button>
          
          <div className="colorPicker">
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#888' }}>COR ATIVA:</span>
            {SEL_ORDER.map((_, i) => (
              <div
                key={i}
                className={`colorCircle ${sel.activeColorIndex === i ? "active" : ""}`}
                style={{ backgroundColor: `var(--selC${i + 1})` }}
                onClick={() => onColorChange(i)}
              />
            ))}
          </div>

          <div className="modeSelectWrap">
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#888' }}>MODO</span>
            <select 
              className="modeSelect"
              value={selMode}
              onChange={(e) => setSelMode(e.target.value as SelMode)}
            >
              <option value="neighbors">1 — Vizinhos</option>
              <option value="unique">2 — Único</option>
            </select>
          </div>

          <div className="markingModeWrap">
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#888' }}>MARCACAO</span>
            <button 
              className={`markingModeBtn ${markingMode === "unique" ? "active" : ""}`}
              onClick={() => setMarkingMode("unique")}
            >
              UNICA
            </button>
            <button 
              className={`markingModeBtn ${markingMode === "cumulative" ? "active" : ""}`}
              onClick={() => setMarkingMode("cumulative")}
            >
              ACUMULADA
            </button>
          </div>

          <div className="modeSelectWrap" style={{ marginLeft: '15px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ffd000' }}>MODO ESTRATÉGIAS</span>
            <select 
              className="modeSelect"
              value={strategyMode}
              onChange={(e) => setStrategyMode(e.target.value as "total" | "intersection")}
              style={{ borderColor: '#ffd000', color: '#ffd000' }}
            >
              <option value="total">TOTAL</option>
              <option value="intersection">INTERSECÇÃO</option>
            </select>
          </div>
        </div>
      </div>

      {mergedNumbers.numbers.length > 0 && (
        <div className="panel" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 15px' }}>
            <span style={{ fontWeight: 'bold', color: '#3b82f6', whiteSpace: 'nowrap' }}>
              MESCLADOS ({mergedNumbers.maxCount} MARCAÇÕES):
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {mergedNumbers.numbers.map((n) => (
                <div
                  key={n}
                  className={`chip ${colorOf(n)}`}
	                  style={{ 
	                    ...getCellStyles(n), 
	                    width: '35px', 
	                    height: '35px', 
	                    fontSize: '14px', 
	                    display: 'flex', 
	                    alignItems: 'center', 
	                    justifyContent: 'center', 
	                    borderRadius: '50%', 
	                    cursor: 'pointer', 
	                    fontWeight: 'bold', 
	                    color: getTextColor(n, getCellStyles(n)) 
	                  }}
	                  onClick={() => onSelect(n)}
	                >
	                  {n}
	                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="main">
        <div className={`panel left ${minimized.history ? "minimized" : ""}`}>
          <div className="panelHeader">
            <div className="sectionTitle">Histórico (80)</div>
            <button className="btn-min" onClick={() => toggleMin("history")}>{minimized.history ? "+" : "−"}</button>
          </div>
          {!minimized.history && (
            <>
              <div className="longGrid" aria-label="Histórico longo">
                {longGridItems.map((n, idx) => {
                  if (n === null) return <div key={idx} className="longCell empty" />;
                  return (
	                    <div
	                      key={idx}
	                      className={`longCell ${colorOf(n)} ${disguisedPairIdx.has(idx) ? "historyPair" : ""}`}
	                      style={{
	                        ...getCellStyles(n),
	                        color: getTextColor(n, getCellStyles(n))
	                      }}
	                      onClick={() => onSelect(n)}
	                      title="Clique para selecionar (não registra)"
	                    >
	                      {n}
	                    </div>
                  );
                })}
              </div>
              <div className="hint">
                Entrada só pelo input. Clique em número seleciona N e vizinhos (ou outro modo) com a cor ativa.
                A seleção substitui a cor do chip. "RESET DE CORES" limpa as marcações.
              </div>
            </>
          )}
        </div>

        <div className="middleCols">
          <div className="strategiesWrap">
            <NeighborsBlock 
              history={lastTen} 
              sel={sel} 
              onPick={onSelect} 
              onMarkStrategy={onMarkStrategy}
              strategyMode={strategyMode}
              isMinimized={minimized.neighbors}
              onToggle={() => toggleMin("neighbors")}
            />
          </div>
          <div className="movementWrap">
            <MovementPanel 
              history={history} 
              selectedX={selectedX} 
              onXChange={setSelectedX} 
            />
            <div className={`panel distCalcInside ${pickingFor ? 'isPicking' : ''}`}>
              <div className="distCalcTitle">CALCULADORA DE CASAS</div>
              <div className="distCalcContent">
                <div className="distBtnGroup">
                  <button className={`distSelectBtn ${pickingFor === 'n1' ? 'active' : ''}`} onClick={() => setPickingFor(pickingFor === 'n1' ? null : 'n1')}>{distN1 !== null ? `N1: ${distN1}` : 'SEL. N1'}</button>
                  <button className={`distSelectBtn ${pickingFor === 'n2' ? 'active' : ''}`} onClick={() => setPickingFor(pickingFor === 'n2' ? null : 'n2')}>{distN2 !== null ? `N2: ${distN2}` : 'SEL. N2'}</button>
                </div>
                <div className="distResults">
                  <div className="distItem"><span className="distLabel">H:</span><span className="distValue">{calcDist ? calcDist.h : "--"}</span></div>
                  <div className="distItem"><span className="distLabel">AH:</span><span className="distValue">{calcDist ? calcDist.ah : "--"}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="right">
          <div className={`panel-wrap ${minimized.trackMap ? "minimized" : ""}`}>
            <div className="panelHeader">
              <div className="sectionTitle">Mapa da Mesa</div>
              <button className="btn-min" onClick={() => toggleMin("trackMap")}>{minimized.trackMap ? "+" : "−"}</button>
            </div>
            {!minimized.trackMap && (
              <div className="tableMapContainer">
                <TableMap sel={sel} onPick={onSelect} repHighlights={repHighlights} getCellStyles={getEnhancedCellStyles} />
              </div>
            )}
          </div>

          <div className={`panel-wrap ${minimized.raceDist ? "minimized" : ""}`}>
            <div className="panelHeader">
              <div className="sectionTitle">RaceTrack</div>
              <button className="btn-min" onClick={() => toggleMin("raceDist")}>{minimized.raceDist ? "+" : "−"}</button>
            </div>
            {!minimized.raceDist && (
              <>
                <RaceTrack 
                  sel={sel} 
                  onPick={onSelect} 
                  getCellStyles={getEnhancedCellStyles}
                  strategyMode={strategyMode}
                />
                
                <div className="quickKeyboard">
                  <div className="keyboardRow">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <button key={n} className={`keyBtn ${colorOf(n)}`} onClick={() => addNumber(n)}>{n}</button>
                    ))}
                  </div>
                  <div className="keyboardRow">
                    {[13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map(n => (
                      <button key={n} className={`keyBtn ${colorOf(n)}`} onClick={() => addNumber(n)}>{n}</button>
                    ))}
                  </div>
                  <div className="keyboardRow">
                    {[25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36].map(n => (
                      <button key={n} className={`keyBtn ${colorOf(n)}`} onClick={() => addNumber(n)}>{n}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
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
    </div>
  );
}
