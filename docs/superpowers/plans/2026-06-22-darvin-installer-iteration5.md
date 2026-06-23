# Darvin Installer - Iteration 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement dynamic task execution sequence in DeploymentScreen using the actual Taskfile commands.

**Architecture:**
- `runInstallerStep` IPC handles dynamic commands.
- `DeploymentScreen` iterates over an array of predefined tasks and awaits completion before moving to the next.

## Global Constraints
- Tests must be written/updated for all logic.
- Frequent commits.

---

### Task 1: Update IPC to accept generic commands

**Files:**
- Modify: `src/main/index.ts`
- Modify: `src/preload/index.d.ts`
- Modify: `src/preload/index.ts`

- [ ] **Step 1: Update type definitions**
Modify `src/preload/index.d.ts`:
```typescript
      runInstallerStep: (command: string, args: string[]) => Promise<number>
```

- [ ] **Step 2: Update Preload exposure**
Modify `src/preload/index.ts`:
```typescript
    runInstallerStep: (command, args) => ipcRenderer.invoke('run-installer-step', command, args),
```

- [ ] **Step 3: Update Main IPC handler**
Modify `src/main/index.ts` around line 46:
```typescript
  ipcMain.handle('run-installer-step', async (event, command: string, args: string[]) => {
    const webContents = event.sender
    const onLog = (log: string) => {
      webContents.send('log-received', log)
    }
    
    return await executeCommand(command, args, onLog)
  })
```

- [ ] **Step 4: Verify typecheck**
Run: `npm run typecheck`

- [ ] **Step 5: Commit**
```bash
git add src/main/index.ts src/preload/index.d.ts src/preload/index.ts
git commit -m "feat: make installer step IPC dynamic"
```

---

### Task 2: Taskfile Orchestration UI

**Files:**
- Modify: `src/renderer/src/components/DeploymentScreen.tsx`

- [ ] **Step 1: Define Tasks and Loop**
Update `src/renderer/src/components/DeploymentScreen.tsx`:
```tsx
import { useState, useEffect } from 'react'

const STEPS = [
  { id: 'prepare', name: 'Preparando Ambiente', command: 'task', args: ['prepare'] },
  { id: 'clean', name: 'Limpando Build Anterior', command: 'task', args: ['ant:clean:all'] },
  { id: 'update', name: 'Atualizando Sistema', command: 'task', args: ['update:system'] },
  { id: 'start', name: 'Iniciando Servidor', command: 'task', args: ['start'] }
]

export function DeploymentScreen() {
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
      
      const code = await window.api.runInstallerStep(step.command, step.args)
      
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
```

- [ ] **Step 2: Verify typecheck**
Run: `npm run typecheck`

- [ ] **Step 3: Commit**
```bash
git add src/renderer/src/components/DeploymentScreen.tsx
git commit -m "feat: implement taskfile orchestration loop in UI"
```
