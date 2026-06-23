import { useState } from 'react'

interface Props {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: Props) {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    const success = await window.api.loginAzure()
    if (success) onLoginSuccess()
    setLoading(false)
  }

  return (
    <div className="app-container">
      <div className="card" style={{ textAlign: 'center' }}>
        <h1 className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          Darvin Installer
        </h1>
        <p className="card-subtitle">Autentique-se para continuar</p>
        <button className="btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? 'Conectando...' : 'Conectar com Azure'}
        </button>
      </div>
    </div>
  )
}
