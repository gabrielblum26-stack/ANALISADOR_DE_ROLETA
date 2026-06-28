"use client";

import { TABLE_ROWS, colorOf } from "../lib/roulette";
import type { SelState } from "../lib/selection";
import { getNumberColors } from "../lib/selection";

export type RepHighlight =
  | "red"
  | "black"
  | "even"
  | "odd"
  | "low"
  | "high"
  | "dozen1"
  | "dozen2"
  | "dozen3"
  | "col1"
  | "col2"
  | "col3";

type Props = {
  sel: SelState;
  repHighlights: Set<RepHighlight>;
  onPick: (n: number) => void;
  onSelect?: (n: number) => void; // Adicionado para compatibilidade
  getCellStyles: (n: number) => React.CSSProperties;
  xHighlightStyles?: any; // Adicionado para compatibilidade
  yHighlightStyles?: any; // Adicionado para compatibilidade
};

export default function TableMap({
  sel,
  repHighlights,
  onPick,
  onSelect,
  getCellStyles
}: Props) {
  const rowToCol: RepHighlight[] = ["col3", "col2", "col1"];

  const cellCls = (n: number) => {
    const base = `cell ${colorOf(n)}`;
    return base;
  };

  const betCls = (k: RepHighlight) => `bet ${repHighlights.has(k) ? "rep" : ""}`.trim();

  const getTextColor = (n: number) => {
    const styles = getCellStyles(n);
    const bg = styles.backgroundColor as string;
    if (!bg) return "#fff";
    
    // Se for branco ou amarelo claro, usa texto preto
    const lightColors = ["#ffffff", "white", "#ffd000", "#facc15", "#ffcc00", "var(--selC2)", "var(--selC9)", "var(--selC11)"];
    if (lightColors.includes(bg.toLowerCase())) return "#000";
    
    return "#fff";
  };

  return (
    <div className="mapBox" aria-label="Mapa completo (clicável para seleção)">
      <div className="table">
        <div 
          className={cellCls(0)} 
          style={{ 
            gridRow: "1 / span 3", 
            gridColumn: "1", 
            fontSize: 18, 
            ...getCellStyles(0),
            color: getTextColor(0),
            border: getCellStyles(0).border || undefined,
            boxShadow: getCellStyles(0).boxShadow || undefined,
            zIndex: getCellStyles(0).zIndex || undefined
          }} 
          onClick={() => onPick(0)}
        >
          0
        </div>

        {TABLE_ROWS.map((row, rIdx) => (
          <div key={rIdx} style={{ display: "contents" }}>
            {row.map((n, cIdx) => (
              <div
                key={n}
                className={cellCls(n)}
                style={{ 
                  gridRow: String(rIdx + 1), 
                  gridColumn: String(2 + cIdx), 
                  ...getCellStyles(n),
                  color: getTextColor(n),
                  border: getCellStyles(n).border || undefined,
                  boxShadow: getCellStyles(n).boxShadow || undefined,
                  zIndex: getCellStyles(n).zIndex || undefined
                }}
                onClick={() => onPick(n)}
              >
                {n}
              </div>
            ))}
            <div className={betCls(rowToCol[rIdx])} style={{ gridRow: String(rIdx + 1), gridColumn: "14" }}>
              2:1
            </div>
          </div>
        ))}

        <div className={betCls("dozen1")} style={{ gridRow: "4", gridColumn: "2 / span 4" }}>
          1st 12
        </div>
        <div className={betCls("dozen2")} style={{ gridRow: "4", gridColumn: "6 / span 4" }}>
          2nd 12
        </div>
        <div className={betCls("dozen3")} style={{ gridRow: "4", gridColumn: "10 / span 4" }}>
          3rd 12
        </div>

        <div className={betCls("low")} style={{ gridRow: "5", gridColumn: "2 / span 2" }}>
          1–18
        </div>
        <div className={betCls("even")} style={{ gridRow: "5", gridColumn: "4 / span 2" }}>
          EVEN
        </div>

        <div className={betCls("red")} style={{ gridRow: "5", gridColumn: "6 / span 2" }}>
          ♦ RED
        </div>
        <div className={betCls("black")} style={{ gridRow: "5", gridColumn: "8 / span 2" }}>
          ♦ BLACK
        </div>

        <div className={betCls("odd")} style={{ gridRow: "5", gridColumn: "10 / span 2" }}>
          ODD
        </div>
        <div className={betCls("high")} style={{ gridRow: "5", gridColumn: "12 / span 2" }}>
          19–36
        </div>
      </div>
    </div>
  );
}
