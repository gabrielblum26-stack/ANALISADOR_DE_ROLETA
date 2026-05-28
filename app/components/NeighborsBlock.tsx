"use client";

import { useMemo, useEffect, useState } from "react";
import { type SelState, SEL_ORDER } from "../lib/selection";
import { colorOf } from "../lib/roulette";
import { api } from "../lib/api";

type Strategy = {
  id: number;
  name: string;
  nums: number[];
  color?: string;
};

type Props = {
  history: number[];
  sel: SelState;
  onPick: (n: number) => void;
  onMarkStrategy?: (nums: number[], colorIndex: number) => void;
  isMinimized?: boolean;
  onToggle?: () => void;
  strategyMode?: "total" | "intersection";
};

export default function NeighborsBlock({ 
  history, 
  sel, 
  onPick, 
  onMarkStrategy, 
  isMinimized, 
  onToggle, 
  strategyMode
}: Props) {
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  const loadStrategies = async () => {
    try {
      const data = await api.listStrategies();
      setStrategies(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStrategies();
    const bc = new BroadcastChannel("strategies_sync");
    bc.onmessage = () => loadStrategies();
    return () => bc.close();
  }, []);
  
  // 1. Lógica de Sincronização (Intersecção entre estratégias ativas)
  const syncData = useMemo(() => {
    const activeStrategies = strategies.map((s, i) => {
      const colorIdx = i === 3 ? 6 : i % 10;
      const colorKey = SEL_ORDER[colorIdx];
      const isActive = s.nums.length > 0 && sel.sets[colorKey]?.has(s.nums[0]);
      return { ...s, isActive, colorIdx };
    }).filter(s => s.isActive);

    const counts: Record<number, number> = {};
    activeStrategies.forEach(s => {
      s.nums.forEach(n => {
        counts[n] = (counts[n] || 0) + 1;
      });
    });

    const syncedIndices = new Set<number>();
    strategies.forEach((s, i) => {
      if (s.nums.some(n => counts[n] > 1)) {
        syncedIndices.add(i);
      }
    });

    return syncedIndices;
  }, [sel, strategies]);

  // 2. Lógica de Padrão Repetitivo
  const patternAlert = useMemo(() => {
    if (history.length < 4 || strategies.length === 0) return null;
    
    const last4 = history.slice(0, 4).map(n => colorOf(n));
    const currentPattern = last4.join("-");
    const alerts = new Set<number>();
    
    for (let i = 4; i < history.length - 1; i++) {
      const past4 = history.slice(i, i + 4).map(n => colorOf(n));
      const pastPattern = past4.join("-");
      
      if (currentPattern === pastPattern) {
        const nextNum = history[i - 1];
        if (nextNum !== undefined) {
          strategies.forEach((s, idx) => {
            if (s.nums.includes(nextNum)) {
              alerts.add(idx);
            }
          });
        }
      }
    }
    return alerts;
  }, [history, strategies]);

  const handleMarkStrategy = (nums: number[], strategyIdx: number) => {
    const colorIndex = strategyIdx === 3 ? 6 : strategyIdx % 10;
    if (onMarkStrategy) {
      onMarkStrategy(nums, colorIndex);
    } else {
      nums.forEach((n) => onPick(n));
    }
  };

  return (
    <div className={`panel neighborsPanel ${isMinimized ? "minimized" : ""}`} aria-label="Estratégias personalizadas">
      <div className="panelHeader">
        <div className="neighborsTitle">ESTRATÉGIAS</div>
        {onToggle && <button className="btn-min" onClick={onToggle}>{isMinimized ? "+" : "−"}</button>}
      </div>

      {!isMinimized && (
        <>
          {strategyMode === "intersection" && (
            <div style={{ padding: "0 10px 10px" }}>
              <div style={{
                width: "100%",
                padding: "8px",
                background: "rgba(255, 208, 0, 0.1)",
                color: "#ffd000",
                border: "1px solid #ffd000",
                borderRadius: "4px",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "10px",
                letterSpacing: "1px"
              }}>
                MODO INTERSECÇÃO ATIVO
              </div>
            </div>
          )}
          
          <div className="strategiesList">
            {strategies.map((strategy, idx) => {
              const colorIdx = idx === 3 ? 6 : idx % 10;
              const colorKey = SEL_ORDER[colorIdx];
              const isActive = strategy.nums.length > 0 && sel.sets[colorKey]?.has(strategy.nums[0]);
              const colorVar = `var(--selC${colorIdx + 1})`;
              
              const isSynced = syncData.has(idx);
              const hasPatternMatch = patternAlert?.has(idx);
              const showAlert = isSynced || hasPatternMatch;
              
              return (
                <div 
                  key={strategy.id} 
                  className={`strategyRow ${showAlert ? "synced-alert" : ""}`} 
                  style={{ 
                    borderLeft: `4px solid ${colorVar}`,
                    position: "relative",
                    overflow: "hidden",
                    animation: showAlert ? "pulse-yellow 2s infinite" : "none",
                    backgroundColor: showAlert ? "rgba(255, 208, 0, 0.05)" : "transparent"
                  }}
                >
                  <div className="strategyName" style={{ color: strategy.color, fontWeight: showAlert ? "bold" : "normal" }}>
                    {strategy.name}
                    {hasPatternMatch && <span style={{ fontSize: "9px", color: "#ffd000", marginLeft: "5px" }}>[PADRÃO!]</span>}
                    {isSynced && isActive && <span style={{ fontSize: "9px", color: "#3b82f6", marginLeft: "5px" }}>[SYNC]</span>}
                  </div>
                  
                  <button 
                    className={`strategyActionBtn ${isActive ? "active" : ""}`}
                    onClick={() => handleMarkStrategy(strategy.nums, idx)}
                    title="Marcar na roleta"
                    style={{ 
                      color: isActive ? "#fff" : colorVar,
                      backgroundColor: isActive ? colorVar : "transparent",
                      borderColor: colorVar,
                      zIndex: 2
                    }}
                  >
                    ⚡
                  </button>

                  <div className="strategyHistory">
                    {Array.from({ length: 15 }).map((_, hIdx) => {
                      const num = history[hIdx];
                      const hit = num !== undefined && strategy.nums.includes(num);
                      return (
                        <div 
                          key={hIdx} 
                          className={`historyBox ${hit ? "hit" : "miss"}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes pulse-yellow {
          0% { box-shadow: inset 0 0 0px rgba(255, 208, 0, 0); }
          50% { box-shadow: inset 0 0 15px rgba(255, 208, 0, 0.3); }
          100% { box-shadow: inset 0 0 0px rgba(255, 208, 0, 0); }
        }
        .synced-alert {
          border-right: 2px solid #ffd000 !important;
        }
      `}</style>
    </div>
  );
}
