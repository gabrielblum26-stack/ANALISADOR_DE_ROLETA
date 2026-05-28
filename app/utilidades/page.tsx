"use client";

import { useRouter } from "next/navigation";

export default function UtilidadesPage() {
  const router = useRouter();

  const tools = [
    {
      name: "Microsoft PowerToys",
      description: "Conjunto de utilitários para usuários avançados ajustarem e simplificarem sua experiência no Windows para maior produtividade.",
      link: "https://github.com/microsoft/PowerToys/releases/download/v0.99.1/PowerToysSetup-0.99.1-x64.exe",
      icon: "🛠️"
    }
  ];

  return (
    <div style={{ background: "#121212", minHeight: "100vh", padding: "20px", color: "#fff", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "20px" }}>
          <h1 style={{ color: "#ffd000", margin: 0 }}>🛠️ Utilidades & Ferramentas</h1>
          <button 
            onClick={() => router.push("/app")}
            style={{ 
              padding: "10px 20px", 
              background: "#333", 
              color: "#fff", 
              border: "1px solid #555", 
              borderRadius: "4px", 
              cursor: "pointer", 
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            ⬅️ VOLTAR AO APP
          </button>
        </div>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ color: "#ffd000", fontSize: "20px", marginBottom: "20px" }}>Downloads Disponíveis</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {tools.map((tool, index) => (
              <div key={index} style={{ background: "#1e1e1e", padding: "20px", borderRadius: "8px", border: "1px solid #333", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "30px", marginBottom: "10px" }}>{tool.icon}</div>
                  <h3 style={{ margin: "0 0 10px 0", color: "#fff" }}>{tool.name}</h3>
                  <p style={{ fontSize: "14px", color: "#aaa", lineHeight: "1.5", marginBottom: "20px" }}>{tool.description}</p>
                </div>
                <a 
                  href={tool.link} 
                  style={{ 
                    display: "block", 
                    textAlign: "center", 
                    padding: "12px", 
                    background: "#3b82f6", 
                    color: "#fff", 
                    textDecoration: "none", 
                    borderRadius: "4px", 
                    fontWeight: "bold",
                    transition: "background 0.3s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "#2563eb"}
                  onMouseOut={(e) => e.currentTarget.style.background = "#3b82f6"}
                >
                  BAIXAR AGORA
                </a>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ color: "#ffd000", fontSize: "20px", marginBottom: "20px" }}>Vídeos & Tutoriais</h2>
          <div style={{ background: "#1e1e1e", padding: "40px", borderRadius: "8px", border: "1px solid #333", textAlign: "center", color: "#666" }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>🎬</div>
            <p>Novos vídeos e tutoriais serão adicionados em breve!</p>
          </div>
        </section>
      </div>
    </div>
  );
}
