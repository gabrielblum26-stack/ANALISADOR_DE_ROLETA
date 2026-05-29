"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Video {
  title: string;
  filename: string;
  url: string;
  extension: string;
}

export default function UtilidadesPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch('/api/videos');
        if (res.ok) {
          const data = await res.json();
          setVideos(data.videos || []);
        }
      } catch (error) {
        console.error('Erro ao carregar vídeos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

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
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
          <h2 style={{ color: "#ffd000", fontSize: "20px", marginBottom: "20px" }}>🎬 Vídeos & Tutoriais ({videos.length})</h2>
          
          {loading ? (
            <div style={{ background: "#1e1e1e", padding: "40px", borderRadius: "8px", border: "1px solid #333", textAlign: "center", color: "#666" }}>
              <p>Carregando vídeos...</p>
            </div>
          ) : videos.length === 0 ? (
            <div style={{ background: "#1e1e1e", padding: "40px", borderRadius: "8px", border: "1px solid #333", textAlign: "center", color: "#666" }}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🎬</div>
              <p>Nenhum vídeo disponível no momento.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Coluna de Vídeos */}
              <div>
                <h3 style={{ color: "#fff", marginBottom: "15px", fontSize: "16px" }}>Galeria de Vídeos</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px", maxHeight: "600px", overflowY: "auto", paddingRight: "10px" }}>
                  {videos.map((video, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedVideo(video)}
                      style={{
                        background: selectedVideo?.filename === video.filename ? "#ffd000" : "#1e1e1e",
                        padding: "12px",
                        borderRadius: "6px",
                        border: selectedVideo?.filename === video.filename ? "2px solid #ffed4e" : "1px solid #333",
                        cursor: "pointer",
                        transition: "all 0.3s",
                        textAlign: "center",
                        color: selectedVideo?.filename === video.filename ? "#000" : "#fff"
                      }}
                      onMouseOver={(e) => {
                        if (selectedVideo?.filename !== video.filename) {
                          e.currentTarget.style.background = "#2a2a2a";
                          e.currentTarget.style.borderColor = "#555";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedVideo?.filename !== video.filename) {
                          e.currentTarget.style.background = "#1e1e1e";
                          e.currentTarget.style.borderColor = "#333";
                        }
                      }}
                    >
                      <div style={{ fontSize: "20px", marginBottom: "8px" }}>🎥</div>
                      <p style={{ margin: "0", fontSize: "12px", fontWeight: "bold", wordBreak: "break-word" }}>
                        {video.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coluna de Reprodução */}
              <div>
                {selectedVideo ? (
                  <div style={{ background: "#1e1e1e", padding: "20px", borderRadius: "8px", border: "1px solid #333" }}>
                    <h3 style={{ color: "#ffd000", marginTop: "0", marginBottom: "15px" }}>{selectedVideo.title}</h3>
                    <video
                      key={selectedVideo.filename}
                      controls
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: "6px",
                        background: "#000",
                        marginBottom: "15px"
                      }}
                    >
                      <source src={selectedVideo.url} type={`video/${selectedVideo.extension.slice(1)}`} />
                      Seu navegador não suporta o elemento de vídeo.
                    </video>
                    <p style={{ fontSize: "12px", color: "#888", margin: "0" }}>
                      Arquivo: {selectedVideo.filename}
                    </p>
                  </div>
                ) : (
                  <div style={{ background: "#1e1e1e", padding: "40px", borderRadius: "8px", border: "1px solid #333", textAlign: "center", color: "#666", minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div>
                      <div style={{ fontSize: "40px", marginBottom: "10px" }}>▶️</div>
                      <p>Selecione um vídeo para assistir</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
