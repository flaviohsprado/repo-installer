import { useState, useEffect, useRef } from 'react'

const STEPS = [
  { id: 'clone', name: 'Clonando Repositório', command: 'git', args: ['clone', 'https://telefonica-vivo-brasil@dev.azure.com/telefonica-vivo-brasil/ECMC%20-%20Ecomm%20Cloud%20B2C/_git/src-devops-darvin-hybris-67-dev', '.'] },
  { id: 'prepare', name: 'Preparando Ambiente', command: 'task', args: ['commerce:hy67:prepare'] },
  { id: 'clean', name: 'Limpando Build Anterior', command: 'task', args: ['commerce:hy67:ant:clean:all'] },
  { id: 'update', name: 'Atualizando Sistema', command: 'task', args: ['commerce:hy67:update:system'] },
  { id: 'start', name: 'Iniciando Servidor', command: 'task', args: ['commerce:hy67:start'] }
]

interface Props {
  cwd: string;
}

export function DeploymentScreen({ cwd }: Props) {
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<string>('idle')
  const [currentStepName, setCurrentStepName] = useState<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    window.api.onLogReceived((newLog: string) => {
      setLogs((prev) => [...prev, newLog])
    })
  }, [])

  const startInstall = async () => {
    setStatus('running')
    setLogs(['--- Iniciando Deploy Automático ---'])
    
    const hasTaskfile = await window.api.pathExists(cwd + '/Taskfile.yml')
    
    for (const step of STEPS) {
      if (step.id === 'clone' && hasTaskfile) {
        setLogs((prev) => [...prev, '\n>>> Repositório já clonado (Taskfile.yml encontrado), pulando clone.'])
        continue
      }
      
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

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'))
  }

  return (
    <div className="app-container">
      <div className="card" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column' }}>
        <h2 className="card-title">Instalação do Hybris</h2>
        <p className="card-subtitle">
          Status geral: <strong>{status}</strong>
          {currentStepName && <span> | Etapa atual: <em>{currentStepName}</em></span>}
        </p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
          <button className="btn-primary" style={{ marginTop: 0 }} onClick={startInstall} disabled={status === 'running'}>
            {status === 'running' ? 'Instalando...' : 'Iniciar Instalação'}
          </button>
          <button className="btn-primary" style={{ marginTop: 0 }} onClick={copyLogs}>Copiar Logs</button>
        </div>
        
        <div className="terminal-wrapper" style={{ flexGrow: 1 }}>
          <div className="terminal-header">
            <div className="terminal-dot dot-red"></div>
            <div className="terminal-dot dot-yellow"></div>
            <div className="terminal-dot dot-green"></div>
          </div>
          <div style={{ padding: '10px', height: '400px', overflowY: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {logs.map((l, i) => <div key={i}>{l}</div>)}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
