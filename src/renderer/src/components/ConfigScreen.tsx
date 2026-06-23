import { useState } from 'react'

interface Props {
  onNext: (path: string) => void;
}

export function ConfigScreen({ onNext }: Props) {
  const [selectedPath, setSelectedPath] = useState<string>('')

  const handleSelect = async () => {
    const path = await window.api.selectDirectory()
    if (path) setSelectedPath(path)
  }

  return (
    <div className="app-container">
      <div className="card">
        <h2 className="card-title">Diretório de Instalação</h2>
        <p className="card-subtitle">Selecione uma pasta vazia onde o projeto será clonado.</p>
        
        <button className="btn-primary" onClick={handleSelect}>Escolher Pasta</button>
        
        {selectedPath && (
          <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <p style={{ margin: 0, marginBottom: '10px', fontSize: '0.9rem', color: 'var(--darvin-text-muted)' }}>Pasta selecionada:</p>
            <div style={{ fontFamily: 'monospace', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', marginBottom: '15px', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              {selectedPath}
            </div>
            <button className="btn-primary" onClick={() => onNext(selectedPath)}>Avançar</button>
          </div>
        )}
      </div>
    </div>
  )
}
