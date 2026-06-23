import { useState, useEffect } from 'react'

export function DeploymentScreen() {
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<string>('idle')

  useEffect(() => {
    window.api.onLogReceived((newLog: string) => {
      setLogs((prev) => [...prev, newLog])
    })
  }, [])

  const startInstall = async () => {
    setStatus('running')
    setLogs(['Starting deployment...'])
    const code = await window.api.runInstallerStep('git', ['clone', '--help'])
    setStatus(code === 0 ? 'success' : 'failed')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
      <h2>Deployment</h2>
      <button onClick={startInstall}>Iniciar Instalação</button>
      <p>Status: {status}</p>
      <div style={{ backgroundColor: '#000', color: '#0f0', padding: '10px', marginTop: '20px', height: '200px', overflowY: 'auto' }}>
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
