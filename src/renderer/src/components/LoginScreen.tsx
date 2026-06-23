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
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Darvin Installer</h1>
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Conectando...' : 'Conectar com Azure'}
      </button>
    </div>
  )
}
