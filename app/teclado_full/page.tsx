"use client";

import { useEffect } from "react";
import { colorOf } from "../app/lib/roulette";

export default function TecladoFullPage() {
  useEffect(() => {
    document.documentElement.classList.add("theme-dark");
    document.body.classList.add("theme-dark");
    document.body.style.background = "#121212";
    document.body.style.color = "#fff";
  }, []);

  const addNumber = (n: number) => {
    const bc = new BroadcastChannel("roulette_keyboard");
    bc.postMessage({ type: "ADD_NUMBER", value: n });
    bc.close();
  };

  return (
    <div style={{ padding: "20px", minHeight: "auto", display: "flex", flexDirection: "column" }}>
      <div className="sectionTitle" style={{ marginBottom: "20px", fontSize: "18px", color: "#ffd000", fontWeight: "bold", textAlign: "center" }}>TECLADO</div>
      <div className="quickKeyboard" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div className="keyboardRow" style={{ display: "grid", gridTemplateColumns: "repeat(13, 1fr)", gap: "5px" }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
            <button 
                key={n} 
                className={`keyBtn ${colorOf(n)}`} 
                onClick={() => addNumber(n)}
                style={{
                    padding: "15px 5px",
                    borderRadius: "8px",
                    border: "none",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "16px",
                    background: colorOf(n) === "red" ? "#c82d2d" : colorOf(n) === "black" ? "#1c1c1c" : "#0f7a3a"
                }}
            >
                {n}
            </button>
          ))}
        </div>
        <div className="keyboardRow" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
          {[13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map(n => (
            <button 
                key={n} 
                className={`keyBtn ${colorOf(n)}`} 
                onClick={() => addNumber(n)}
                style={{
                    padding: "15px 5px",
                    borderRadius: "8px",
                    border: "none",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "16px",
                    background: colorOf(n) === "red" ? "#c82d2d" : colorOf(n) === "black" ? "#1c1c1c" : "#0f7a3a"
                }}
            >
                {n}
            </button>
          ))}
        </div>
        <div className="keyboardRow" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "5px" }}>
          {[25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36].map(n => (
            <button 
                key={n} 
                className={`keyBtn ${colorOf(n)}`} 
                onClick={() => addNumber(n)}
                style={{
                    padding: "15px 5px",
                    borderRadius: "8px",
                    border: "none",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "16px",
                    background: colorOf(n) === "red" ? "#c82d2d" : colorOf(n) === "black" ? "#1c1c1c" : "#0f7a3a"
                }}
            >
                {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
