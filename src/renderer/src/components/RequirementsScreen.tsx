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
    <div style={{ padding: '20px' }}>
      <h2>Requisitos do Sistema</h2>
      {loading ? <p>Verificando...</p> : (
        <ul>
          {reqs.map(r => (
            <li key={r.name}>
              {r.installed ? '✅' : '❌'} {r.name} {r.version ? `(${r.version})` : ''}
            </li>
          ))}
        </ul>
      )}
      {!allMet && !loading && (
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <button onClick={handleInstallMissing} disabled={installing}>
            {installing ? `Instalando ${installingName}...` : 'Instalar Pendências'}
          </button>
        </div>
      )}
      <button onClick={onNext} disabled={!allMet || loading || installing}>
        Avançar
      </button>
    </div>
  )
}
