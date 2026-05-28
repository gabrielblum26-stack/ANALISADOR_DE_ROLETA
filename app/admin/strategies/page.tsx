"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../state/AuthProvider";
import { useRouter } from "next/navigation";

const WHEEL_LAYOUT = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export default function StrategiesAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [strategies, setStrategies] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const loadStrategies = async () => {
    try {
      const data = await api.listStrategies();
      setStrategies(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "6431") {
      setAuthorized(true);
      loadStrategies();
    } else {
      alert("Senha incorreta");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing.id) {
        await api.updateStrategy(editing.id, editing);
      } else {
        await api.createStrategy(editing);
      }
      setShowModal(false);
      loadStrategies();
      
      // Sincronizar outras abas
      const bc = new BroadcastChannel("strategies_sync");
      bc.postMessage({ type: "STRATEGIES_UPDATED" });
      bc.close();
    } catch (err) {
      alert("Erro ao salvar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta estratégia?")) return;
    try {
      await api.deleteStrategy(id);
      loadStrategies();
      
      // Sincronizar outras abas
      const bc = new BroadcastChannel("strategies_sync");
      bc.postMessage({ type: "STRATEGIES_UPDATED" });
      bc.close();
    } catch (err) {
      alert("Erro ao excluir");
    }
  };

  const toggleNum = (n: number) => {
    const nums = [...editing.nums];
    const idx = nums.indexOf(n);
    if (idx > -1) nums.splice(idx, 1);
    else nums.push(n);
    setEditing({ ...editing, nums: nums.sort((a, b) => a - b) });
  };

  if (!authorized) {
    return (
      <div style={{ background: "#121212", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <form onSubmit={handleAuth} style={{ background: "#1e1e1e", padding: "30px", borderRadius: "8px", border: "1px solid #333", width: "300px" }}>
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Acesso Restrito</h2>
          <input 
            type="password" 
            placeholder="Digite a senha" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "15px", background: "#262626", border: "1px solid #444", color: "#fff", borderRadius: "4px" }}
          />
          <button type="submit" style={{ width: "100%", padding: "10px", background: "#ffd000", color: "#000", fontWeight: "bold", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            ACESSAR
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: "#121212", minHeight: "100vh", padding: "20px", color: "#fff" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1>Gerenciar Estratégias</h1>
          <button 
            onClick={() => { setEditing({ name: "", nums: [], color: "#3b82f6" }); setShowModal(true); }}
            style={{ padding: "10px 20px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
          >
            + NOVA ESTRATÉGIA
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {strategies.map((s) => (
            <div key={s.id} style={{ background: "#1e1e1e", padding: "15px", borderRadius: "8px", border: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "bold", color: s.color || "#fff", fontSize: "16px" }}>{s.name}</div>
                <div style={{ fontSize: "12px", color: "#aaa", marginTop: "5px" }}>{s.nums.join(", ")}</div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => { setEditing(s); setShowModal(true); }} style={{ padding: "5px 15px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Editar</button>
                <button onClick={() => handleDelete(s.id)} style={{ padding: "5px 15px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1e1e1e", padding: "25px", borderRadius: "12px", border: "1px solid #444", width: "90%", maxWidth: "500px" }}>
            <h2>{editing.id ? "Editar" : "Nova"} Estratégia</h2>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>Nome da Estratégia</label>
                <input 
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  style={{ width: "100%", padding: "10px", background: "#262626", border: "1px solid #444", color: "#fff", borderRadius: "4px" }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>Cor</label>
                <input 
                  type="color"
                  value={editing.color || "#3b82f6"}
                  onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                  style={{ width: "100%", height: "40px", padding: "2px", background: "#262626", border: "1px solid #444", borderRadius: "4px" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "10px", fontSize: "14px" }}>Selecione os Números ({editing.nums.length})</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "5px" }}>
                  {Array.from({ length: 37 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleNum(i)}
                      style={{
                        padding: "8px 0",
                        background: editing.nums.includes(i) ? "#ffd000" : "#262626",
                        color: editing.nums.includes(i) ? "#000" : "#fff",
                        border: "1px solid #444",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", background: "#444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>CANCELAR</button>
                <button type="submit" style={{ flex: 1, padding: "12px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>SALVAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
