import { useState, useEffect } from 'react'

const STEPS = [
  { id: 'clone', name: 'Clonando Repositório', command: 'git', args: ['clone', 'https://telefonica-vivo-brasil@dev.azure.com/telefonica-vivo-brasil/ECMC%20-%20Ecomm%20Cloud%20B2C/_git/src-devops-darvin-hybris-67-dev', '.'] },
  { id: 'prepare', name: 'Preparando Ambiente', command: 'task', args: ['prepare'] },
  { id: 'clean', name: 'Limpando Build Anterior', command: 'task', args: ['ant:clean:all'] },
  { id: 'update', name: 'Atualizando Sistema', command: 'task', args: ['update:system'] },
  { id: 'start', name: 'Iniciando Servidor', command: 'task', args: ['start'] }
]

interface Props {
  cwd: string;
}

export function DeploymentScreen({ cwd }: Props) {
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<string>('idle')
  const [currentStepName, setCurrentStepName] = useState<string>('')

  useEffect(() => {
    window.api.onLogReceived((newLog: string) => {
      setLogs((prev) => [...prev, newLog])
    })
  }, [])

  const startInstall = async () => {
    setStatus('running')
    setLogs(['--- Iniciando Deploy Automático ---'])
    
    for (const step of STEPS) {
      setCurrentStepName(step.name)
      setLogs((prev) => [...prev, `\n>>> Executando: ${step.name} (${step.command} ${step.args.join(' ')})`])
      
      const code = await window.api.runInstallerStep(step.command, step.args, cwd)
      
      if (code !== 0) {
        setStatus('failed')
        setLogs((prev) => [...prev, `\n[ERRO] O passo "${step.name}" falhou com código ${code}. Instalação abortada.`])
        setCurrentStepName('')
        return
      }
    }
    
    setStatus('success')
    setCurrentStepName('')
    setLogs((prev) => [...prev, '\n✅ Instalação concluída com sucesso!'])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
      <h2>Instalação do Hybris</h2>
      <button onClick={startInstall} disabled={status === 'running'}>
        {status === 'running' ? 'Instalando...' : 'Iniciar Instalação'}
      </button>
      
      <p>
        Status geral: <strong>{status}</strong>
        {currentStepName && <span> | Etapa atual: <em>{currentStepName}</em></span>}
      </p>

      <div style={{ backgroundColor: '#000', color: '#0f0', padding: '10px', marginTop: '10px', height: '300px', overflowY: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
