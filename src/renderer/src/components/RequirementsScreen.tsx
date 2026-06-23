import { useState, useEffect } from 'react'

interface Requirement {
  name: string;
  installed: boolean;
  version?: string;
}

interface Props {
  onNext: () => void;
}

export function RequirementsScreen({ onNext }: Props) {
  const [reqs, setReqs] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState(false)
  const [installingName, setInstallingName] = useState('')

  const handleInstallMissing = async () => {
    setInstalling(true)
    const missing = reqs.filter(r => !r.installed)
    for (const req of missing) {
      setInstallingName(req.name)
      await window.api.installRequirement(req.name)
    }
    setInstallingName('')
    // Re-check
    setLoading(true)
    const results = await window.api.checkRequirements()
    setReqs(results)
    setLoading(false)
    setInstalling(false)
  }

  useEffect(() => {
    window.api.checkRequirements().then(results => {
      setReqs(results)
      setLoading(false)
    })
  }, [])

  const allMet = reqs.length > 0 && reqs.every(r => r.installed)

  return (
    <div className="app-container">
      <div className="card">
        <h2 className="card-title">Requisitos do Sistema</h2>
        <p className="card-subtitle">Verificando dependências necessárias</p>
        {loading ? <p>Verificando...</p> : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
            {reqs.map(r => (
              <li key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid var(--darvin-card-border)' }}>
                <span>{r.name} {r.version ? `(${r.version})` : ''}</span>
                <span>{r.installed ? '✅' : '❌'}</span>
              </li>
            ))}
          </ul>
        )}
        {!allMet && !loading && (
          <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            <button className="btn-primary" onClick={handleInstallMissing} disabled={installing}>
              {installing ? `Instalando ${installingName}...` : 'Instalar Pendências'}
            </button>
          </div>
        )}
        <button className="btn-primary" onClick={onNext} disabled={!allMet || loading || installing}>
          Avançar
        </button>
      </div>
    </div>
  )
}
