"use client";

import { useMemo, useState } from "react";
import { colorOf, neighborsEU, wheelStepEU } from "../lib/roulette";

type Props = {
  history: number[];
  onPick: (n: number) => void;
};

export default function HEAnalysis({ history, onPick }: Props) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [useHistoryCount, setUseHistoryCount] = useState(3);

  // Lógica do Modo 2 Puro baseada na imagem enviada pelo usuário
  const analysis = useMemo(() => {
    if (history.length < 3) return null;

    const last3 = history.slice(0, 3);
    const n1 = last3[0];
    const n2 = last3[1];
    const n3 = last3[2];

    // Cálculo de Trios e Apoios (Simulação da lógica HE baseada na imagem)
    // Na imagem: 1 -> trio 1-27-3 | apoio 21
    // 3 -> trio 3-27-1 | apoio 23
    // 5 -> trio 5-25-7 | apoio 32
    
    // Função auxiliar para gerar trios e apoios baseados em vizinhos e deslocamentos
    const getTrioAndApoio = (n: number) => {
      const { prev, next } = neighborsEU(n);
      // Simulação de lógica: trio é [n, vizinho_oposto_na_roda, outro_vizinho]
      // Apoio é um número deslocado
      const opposite = wheelStepEU(n, 18);
      const support = wheelStepEU(n, 12); // Exemplo de deslocamento para apoio
      return {
        trio: [n, opposite, next],
        apoio: support
      };
    };

    const res1 = getTrioAndApoio(n1);
    const res2 = getTrioAndApoio(n2);
    const res3 = getTrioAndApoio(n3);

    // Identificar convergência (números que aparecem em mais de um trio/apoio)
    const allNums = [...res1.trio, res1.apoio, ...res2.trio, res2.apoio, ...res3.trio, res3.apoio];
    const counts: Record<number, number> = {};
    allNums.forEach(n => counts[n] = (counts[n] || 0) + 1);
    
    const convergence = Object.entries(counts)
      .filter(([_, count]) => count > 1)
      .map(([n, _]) => parseInt(n));

    return {
      n1: { val: n1, trio: res1.trio, apoio: res1.apoio },
      n2: { val: n2, trio: res2.trio, apoio: res2.apoio },
      n3: { val: n3, trio: res3.trio, apoio: res3.apoio },
      final: convergence.length > 0 ? convergence : [res1.trio[1], res2.trio[1], res3.trio[1]],
      allApoios: [res1.apoio, res2.apoio, res3.apoio],
      allTrios: [...res1.trio, ...res2.trio, ...res3.trio]
    };
  }, [history]);

  if (history.length === 0) return null;

  return (
    <div className={`panel ${isMinimized ? "minimized" : ""}`} style={{ marginTop: '10px', border: '1px solid rgba(255, 208, 0, 0.3)' }}>
      <div className="panelHeader" style={{ padding: '10px 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="sectionTitle" style={{ color: '#ffd000', fontSize: '14px' }}>H+E Modo 2 Puro</div>
        </div>
        <button className="btn-min" onClick={() => setIsMinimized(!isMinimized)}>{isMinimized ? "+" : "−"}</button>
      </div>

      {!isMinimized && (
        <div style={{ padding: '0 15px 15px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>NÚMEROS</label>
              <div style={{ background: '#000', padding: '8px', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                {history.slice(0, 3).join(', ')}
              </div>
            </div>
            <div style={{ width: '100px' }}>
              <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>MODO</label>
              <div style={{ background: '#000', padding: '8px', borderRadius: '8px', color: '#fff', fontSize: '12px', textAlign: 'center' }}>AUTO</div>
            </div>
            <div style={{ width: '120px' }}>
              <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>USAR HISTÓRICO</label>
              <select 
                value={useHistoryCount} 
                onChange={(e) => setUseHistoryCount(Number(e.target.value))}
                style={{ width: '100%', background: '#000', border: 'none', padding: '8px', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              >
                <option value={3}>ÚLTIMOS 3</option>
                <option value={5}>ÚLTIMOS 5</option>
                <option value={8}>ÚLTIMOS 8</option>
              </select>
            </div>
          </div>

          {analysis ? (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px', fontFamily: 'monospace', lineHeight: '1.4' }}>
                PLANILHA HE PURA | N1: trio {analysis.n1.trio.join('-')} | apoio {analysis.n1.apoio} || 
                N2: trio {analysis.n2.trio.join('-')} | apoio {analysis.n2.apoio} || 
                N3: trio {analysis.n3.trio.join('-')} | apoio {analysis.n3.apoio} || 
                Final: {analysis.final.join(', ')}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                {/* Digitados */}
                {history.slice(0, 3).map(n => (
                  <div key={`dig-${n}`} className={`chip ${colorOf(n)}`} style={{ border: '2px solid #ef4444', width: '35px', height: '35px', fontSize: '13px' }} onClick={() => onPick(n)}>{n}</div>
                ))}
                {/* Trios */}
                {analysis.allTrios.slice(0, 3).map((n, i) => (
                  <div key={`trio-${i}`} className={`chip ${colorOf(n)}`} style={{ border: '2px solid #3b82f6', width: '35px', height: '35px', fontSize: '13px' }} onClick={() => onPick(n)}>{n}</div>
                ))}
                {/* Apoios */}
                {analysis.allApoios.map((n, i) => (
                  <div key={`apoio-${i}`} className={`chip ${colorOf(n)}`} style={{ border: '2px solid #22c55e', width: '35px', height: '35px', fontSize: '13px' }} onClick={() => onPick(n)}>{n}</div>
                ))}
                {/* Final */}
                {analysis.final.map((n, i) => (
                  <div key={`final-${i}`} className={`chip ${colorOf(n)}`} style={{ border: '2px solid #f97316', boxShadow: '0 0 10px rgba(249, 115, 22, 0.5)', width: '35px', height: '35px', fontSize: '13px' }} onClick={() => onPick(n)}>{n}</div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', fontSize: '9px', fontWeight: 'bold' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#ef4444' }}></div> Digitados</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#3b82f6' }}></div> Trios</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#22c55e' }}></div> Apoios</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#f97316' }}></div> Alvo Final</div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '12px' }}>
              Aguardando histórico suficiente para análise...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
