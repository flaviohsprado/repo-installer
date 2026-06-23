# Darvin Installer - Iteration 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement directory selection and fix the Taskfile execution error by running commands in the correct `cwd` (Current Working Directory), including a `git clone` step.

**Architecture:**
- `ConfigScreen` uses `dialog.showOpenDialog` via IPC to select an installation folder.
- `DeploymentScreen` uses the selected `cwd` and runs `git clone` followed by the `task` commands inside that folder.
- `executor.ts` passes the `cwd` option to `child_process.spawn`.

## Global Constraints
- Tests must be written/updated for all logic.
- Frequent commits.

---

### Task 1: Executor and Directory Selection (Main Process)

**Files:**
- Modify: `src/main/executor.ts`
- Modify: `src/main/executor.test.ts`
- Modify: `src/main/index.ts`

- [ ] **Step 1: Update Executor**
Modify `src/main/executor.ts` to accept `cwd`:
```typescript
import { spawn } from 'child_process'

export function executeCommand(command: string, args: string[], cwd: string | undefined, onLog: (data: string) => void): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: true, cwd })
    // ... rest remains same
```

- [ ] **Step 2: Update Executor Test**
Modify `src/main/executor.test.ts` to pass a `cwd` argument (e.g. `process.cwd()`) and verify tests pass.

- [ ] **Step 3: Update Main IPC**
Modify `src/main/index.ts`:
1. Import `dialog` from `electron`.
2. Add directory selection IPC:
```typescript
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })
```
3. Update `run-installer-step` to accept `cwd`:
```typescript
  ipcMain.handle('run-installer-step', async (event, command: string, args: string[], cwd?: string) => {
    // ...
    return await executeCommand(command, args, cwd, onLog)
  })
```

- [ ] **Step 4: Verify typecheck**
Run: `npm run typecheck`

- [ ] **Step 5: Commit**
```bash
git add src/main/executor.ts src/main/executor.test.ts src/main/index.ts
git commit -m "feat: add cwd support to executor and directory selection ipc"
```

---

### Task 2: IPC and Preload Updates

**Files:**
- Modify: `src/preload/index.d.ts`
- Modify: `src/preload/index.ts`

- [ ] **Step 1: Update type definitions**
Modify `src/preload/index.d.ts` inside `api`:
```typescript
      selectDirectory: () => Promise<string | null>
      runInstallerStep: (command: string, args: string[], cwd?: string) => Promise<number>
```

- [ ] **Step 2: Update Preload exposure**
Modify `src/preload/index.ts`:
```typescript
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    runInstallerStep: (command, args, cwd) => ipcRenderer.invoke('run-installer-step', command, args, cwd),
```

- [ ] **Step 3: Verify typecheck**
Run: `npm run typecheck`

- [ ] **Step 4: Commit**
```bash
git add src/preload/index.d.ts src/preload/index.ts
git commit -m "feat: setup IPC for directory selection and cwd"
```

---

### Task 3: Config Screen UI & Router Update (React)

**Files:**
- Create: `src/renderer/src/components/ConfigScreen.tsx`
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/components/DeploymentScreen.tsx`

- [ ] **Step 1: Create ConfigScreen**
Create `src/renderer/src/components/ConfigScreen.tsx`:
```tsx
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
```

- [ ] **Step 2: Update App router**
Modify `src/renderer/src/App.tsx`:
Add step 3 for `ConfigScreen`, shift deployment to step 4. Store `installPath`.
```tsx
import { useState } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { RequirementsScreen } from './components/RequirementsScreen'
import { ConfigScreen } from './components/ConfigScreen'
import { DeploymentScreen } from './components/DeploymentScreen'

export default function App() {
  const [step, setStep] = useState(1)
  const [installPath, setInstallPath] = useState('')

  return (
    <div>
      {step === 1 && <LoginScreen onLoginSuccess={() => setStep(2)} />}
      {step === 2 && <RequirementsScreen onNext={() => setStep(3)} />}
      {step === 3 && <ConfigScreen onNext={(path) => { setInstallPath(path); setStep(4); }} />}
      {step === 4 && <DeploymentScreen cwd={installPath} />}
    </div>
  )
}
```

- [ ] **Step 3: Update DeploymentScreen**
Modify `src/renderer/src/components/DeploymentScreen.tsx`:
- Add `cwd` to Props.
- Add git clone step: `{ id: 'clone', name: 'Clonando Repositório', command: 'git', args: ['clone', 'https://telefonica-vivo-brasil@dev.azure.com/telefonica-vivo-brasil/ECMC%20-%20Ecomm%20Cloud%20B2C/_git/src-devops-darvin-hybris-67-dev', '.'] }`
- Pass `cwd` to `runInstallerStep`.
```tsx
interface Props {
  cwd: string;
}

const STEPS = [
  { id: 'clone', name: 'Clonando Repositório', command: 'git', args: ['clone', 'https://telefonica-vivo-brasil@dev.azure.com/telefonica-vivo-brasil/ECMC%20-%20Ecomm%20Cloud%20B2C/_git/src-devops-darvin-hybris-67-dev', '.'] },
  { id: 'prepare', name: 'Preparando Ambiente', command: 'task', args: ['prepare'] },
  { id: 'clean', name: 'Limpando Build Anterior', command: 'task', args: ['ant:clean:all'] },
  { id: 'update', name: 'Atualizando Sistema', command: 'task', args: ['update:system'] },
  { id: 'start', name: 'Iniciando Servidor', command: 'task', args: ['start'] }
]

export function DeploymentScreen({ cwd }: Props) {
  // ...
      const code = await window.api.runInstallerStep(step.command, step.args, cwd)
  // ...
}
```

- [ ] **Step 4: Verify typecheck and Commit**
Run: `npm run typecheck`
```bash
git add src/renderer/src/components/ConfigScreen.tsx src/renderer/src/App.tsx src/renderer/src/components/DeploymentScreen.tsx
git commit -m "feat: implement directory selection UI and git clone step"
```
