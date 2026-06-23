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
    <div style={{ padding: '20px' }}>
      <h2>Diretório de Instalação</h2>
      <p>Selecione uma pasta vazia onde o projeto será clonado.</p>
      
      <button onClick={handleSelect}>Escolher Pasta</button>
      
      {selectedPath && (
        <div style={{ marginTop: '20px' }}>
          <p>Pasta selecionada: <strong>{selectedPath}</strong></p>
          <button onClick={() => onNext(selectedPath)}>Avançar</button>
        </div>
      )}
    </div>
  )
}
