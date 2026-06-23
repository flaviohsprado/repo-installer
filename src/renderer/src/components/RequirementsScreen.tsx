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
      <button onClick={onNext} disabled={!allMet || loading}>
        Avançar
      </button>
    </div>
  )
}
