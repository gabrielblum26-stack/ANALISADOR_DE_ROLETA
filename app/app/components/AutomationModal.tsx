"use client";

import { useState, useEffect } from "react";

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string) => void;
  currentId: string;
}

export default function AutomationModal({ isOpen, onClose, onSave, currentId }: AutomationModalProps) {
  const [id, setId] = useState(currentId);

  useEffect(() => {
    setId(currentId);
  }, [currentId]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (id.trim()) {
      onSave(id.trim());
      onClose();
    } else {
      alert("Por favor, insira um ID válido.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>CONFIGURAR AUTOMAÇÃO</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p>Insira a <strong>Chave de Identificação</strong> gerada pela sua extensão Padrão FIFA para receber os números automaticamente.</p>
          
          <div style={{ marginBottom: '20px', padding: '15px', background: '#222', borderRadius: '8px', border: '1px dashed #ffd000', textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#ffd000' }}>Ainda não tem a extensão?</p>
            <a 
              href="/extensao_padrao_fifa.zip" 
              download 
              className="btn btn-download"
              style={{ display: 'inline-block', textDecoration: 'none', background: '#333', color: '#ffd000', border: '1px solid #ffd000', padding: '8px 15px', borderRadius: '5px', fontSize: '0.8rem', fontWeight: 'bold' }}
            >
              📥 BAIXAR EXTENSÃO V14 (NOTIFICAÇÕES)
            </a>
          </div>

          <div className="input-group">
            <label>ID da Extensão:</label>
            <input 
              type="text" 
              value={id} 
              onChange={(e) => setId(e.target.value)} 
              placeholder="Ex: 123e4567-e89b-12d3-a456-426614174000"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-save" onClick={handleSave}>SALVAR E ATIVAR</button>
          <button className="btn btn-cancel" onClick={onClose}>CANCELAR</button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(5px);
        }
        .modal-content {
          background: #1a1a1a;
          border: 2px solid #ffd000;
          border-radius: 12px;
          width: 90%;
          max-width: 450px;
          padding: 20px;
          box-shadow: 0 0 30px rgba(255, 208, 0, 0.2);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #333;
          padding-bottom: 10px;
        }
        .modal-header h3 {
          color: #ffd000;
          margin: 0;
          font-size: 1.2rem;
        }
        .close-btn {
          background: none;
          border: none;
          color: #888;
          font-size: 1.5rem;
          cursor: pointer;
        }
        .modal-body p {
          color: #ccc;
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 20px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-group label {
          color: #ffd000;
          font-size: 0.8rem;
          font-weight: bold;
        }
        .input-group input {
          background: #000;
          border: 1px solid #444;
          color: #fff;
          padding: 12px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 0.85rem;
        }
        .modal-footer {
          display: flex;
          gap: 10px;
          margin-top: 25px;
        }
        .btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-save {
          background: #ffd000;
          color: #000;
        }
        .btn-save:hover {
          background: #ffea00;
          transform: translateY(-2px);
        }
        .btn-cancel {
          background: #333;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
