"use client";

import React from "react";
import { WHEEL_EU, colorOf } from "../lib/roulette";
import type { SelState } from "../lib/selection";
import { getNumberColors } from "../lib/selection";

type Pt = { x: number; y: number; angle: number; n: number };

function buildTrackPoints(): Pt[] {
  const W = 1100;
  const H = 300;
  const r = 110; 
  const paddingX = 60;
  const straightLen = W - 2 * paddingX - 2 * r;
  
  const leftX = paddingX + r;
  const rightX = W - paddingX - r;
  const topY = (H / 2) - r;
  const bottomY = (H / 2) + r;
  const midY = H / 2;

  const arcLen = Math.PI * r;
  const totalLen = 2 * straightLen + 2 * arcLen;
  const step = totalLen / WHEEL_EU.length;

  const offset = (arcLen / 2) + step;

  function pointAt(index: number): Pt {
    let s = (offset + (index * step)) % totalLen;
    const n = WHEEL_EU[index];

    if (s <= arcLen) {
      const t = s / arcLen;
      const ang = (-Math.PI / 2) + t * Math.PI;
      return { x: rightX + r * Math.cos(ang), y: midY + r * Math.sin(ang), angle: ang, n };
    }
    s -= arcLen;

    if (s <= straightLen) {
      return { x: rightX - s, y: bottomY, angle: Math.PI / 2, n };
    }
    s -= straightLen;

    if (s <= arcLen) {
      const t = s / arcLen;
      const ang = (Math.PI / 2) + t * Math.PI;
      return { x: leftX + r * Math.cos(ang), y: midY + r * Math.sin(ang), angle: ang, n };
    }
    s -= arcLen;

    return { x: leftX + s, y: topY, angle: -Math.PI / 2, n };
  }

  const pts: Pt[] = [];
  for (let i = 0; i < WHEEL_EU.length; i++) {
    pts.push(pointAt(i));
  }
  return pts;
}

function selectionFill(sel: SelState, n: number, customStyles?: React.CSSProperties) {
  if (customStyles?.backgroundColor) return customStyles.backgroundColor;
  const colors = getNumberColors(sel, n);
  if (colors.length === 0) return null;
  if (colors.length === 1) return colors[0];
  return `url(#grad-race-${n})`;
}

type Props = {
  sel: SelState;
  onPick: (n: number) => void;
  getCellStyles: (n: number) => React.CSSProperties;
  strategyMode?: "total" | "intersection";
  highlightedNumbers: number[];
};

export default function RaceTrack({
  sel,
  onPick,
  getCellStyles,
  strategyMode,
  highlightedNumbers
}: Props) {
  const pts = buildTrackPoints();
  const viewW = 1100;
  const viewH = 300;

  const getTextColor = (n: number) => {
    const styles = getCellStyles(n);
    const bg = styles.backgroundColor as string;
    if (!bg) return "#fff";
    
    const lightColors = ["#ffffff", "white", "#ffd000", "#facc15", "#ffcc00", "var(--selC2)", "var(--selC9)", "var(--selC11)"];
    if (lightColors.includes(bg.toLowerCase())) return "#000";
    
    return "#fff";
  };

  return (
    <div className="raceBox" aria-label="Race Profissional">
      <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          {WHEEL_EU.map(n => {
            const colors = getNumberColors(sel, n);
            if (colors.length <= 1) return null;
            const step = 100 / colors.length;
            return (
              <linearGradient id={`grad-race-${n}`} key={n} x1="0%" y1="0%" x2="100%" y2="100%">
                {colors.map((c, idx) => (
                  <React.Fragment key={idx}>
                    <stop offset={`${idx * step}%`} stopColor={c} />
                    <stop offset={`${(idx + 1) * step}%`} stopColor={c} />
                  </React.Fragment>
                ))}
              </linearGradient>
            );
          })}
        </defs>

        <path
          d="M 170,40 L 930,40 A 110,110 0 0 1 930,260 L 170,260 A 110,110 0 0 1 170,40 Z"
          fill="rgba(0,0,0,0.8)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
        />

        <path
          d="M 170,95 L 930,95 A 55,55 0 0 1 930,205 L 170,205 A 55,55 0 0 1 170,95 Z"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
        />

        <line x1="320" y1="95" x2="420" y2="205" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        <line x1="550" y1="95" x2="550" y2="205" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        <path d="M 850,95 Q 920,150 850,205" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />

        <text x="250" y="155" textAnchor="middle" fontSize="20" fontWeight="bold" fill="rgba(255,255,255,0.7)">TIER</text>
        <text x="480" y="155" textAnchor="middle" fontSize="20" fontWeight="bold" fill="rgba(255,255,255,0.7)">ORPHELINS</text>
        <text x="700" y="155" textAnchor="middle" fontSize="20" fontWeight="bold" fill="rgba(255,255,255,0.7)">VOISINS</text>
        <text x="950" y="155" textAnchor="middle" fontSize="20" fontWeight="bold" fill="rgba(255,255,255,0.7)">ZERO</text>

        {pts.map((p) => {
          const n = p.n;
          const base = colorOf(n);
          const customStyles = getCellStyles(n);
          const override = selectionFill(sel, n, customStyles);
          const fill = override ?? `var(--${base})`;
          
          const styles = getCellStyles(n);
          const opacity = styles.opacity !== undefined ? styles.opacity : 1;

          return (
            <g 
              key={n} 
              onClick={() => onPick(n)} 
              style={{ cursor: "pointer", opacity }}
              className="raceNode"
            >
              <circle
                cx={p.x}
                cy={p.y}
                r="22"
                fill={fill}
                stroke={highlightedNumbers.includes(n) ? "#fff" : (customStyles?.border ? "#fff" : "rgba(255,255,255,0.2)")}
                strokeWidth={highlightedNumbers.includes(n) ? "3" : (customStyles?.border ? "3" : "1")}
                style={{ 
                  filter: highlightedNumbers.includes(n) ? "drop-shadow(0 0 8px #fff)" : (customStyles?.boxShadow ? `drop-shadow(0 0 8px ${customStyles.backgroundColor})` : 'none'),
                  transition: "all 0.2s ease-in-out"
                }}
                className="raceCell"
              />
              <text 
                x={p.x} 
                y={p.y + 5} 
                textAnchor="middle" 
                fontSize="17" 
                fontWeight="bold" 
                fill={getTextColor(n)}
                style={{ userSelect: 'none' }}
              >
                {n}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
