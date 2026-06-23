# Darvin Installer - Iteration 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Azure Login Screen placeholder and Requirements Checking screen.

**Architecture:** 
- `src/main/requirements.ts` handles checking local CLI tools using `child_process.exec`.
- React state controls the flow: Login -> Requirements -> Deployment.

## Global Constraints
- Tests must be written for all logic.
- Frequent commits.

---

### Task 1: Requirements Checker (Main Process)

**Files:**
- Create: `src/main/requirements.ts`
- Create: `src/main/requirements.test.ts`

**Interfaces:**
- Produces: `checkRequirements(): Promise<{ name: string; installed: boolean; version?: string }[]>`

- [ ] **Step 1: Write failing tests**
```typescript
// src/main/requirements.test.ts
import { describe, it, expect } from 'vitest'
import { checkRequirements } from './requirements'

describe('checkRequirements', () => {
  it('returns an array of requirement results', async () => {
    const results = await checkRequirements()
    expect(results).toHaveLength(4)
    expect(results.map(r => r.name)).toEqual(['Git', 'Java', 'Docker', 'Taskfile'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm run test`

- [ ] **Step 3: Write minimal implementation**
```typescript
// src/main/requirements.ts
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function checkCommand(name: string, command: string): Promise<{ name: string; installed: boolean; version?: string }> {
  try {
    const { stdout } = await execAsync(command)
    return { name, installed: true, version: stdout.trim().split('\n')[0] }
  } catch (error) {
    return { name, installed: false }
  }
}

export async function checkRequirements() {
  const checks = [
    checkCommand('Git', 'git --version'),
    checkCommand('Java', 'java -version'),
    checkCommand('Docker', 'docker --version'),
    checkCommand('Taskfile', 'task --version')
  ]
  return Promise.all(checks)
}
```
*Note: java prints version to stderr sometimes, but for this minimal version let's keep it simple or fix if needed in the subagent.*

- [ ] **Step 4: Run test to verify it passes**
Run: `npm run test`

- [ ] **Step 5: Commit**
```bash
git add src/main/requirements.ts src/main/requirements.test.ts
git commit -m "feat: add requirements checking logic in main process"
```

---

### Task 2: IPC and Preload for new Screens

**Files:**
- Create: `src/main/auth.ts`
- Modify: `src/main/index.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/preload/index.d.ts`

**Interfaces:**
- Produces: `window.api.loginAzure()`, `window.api.checkRequirements()`

- [ ] **Step 1: Create auth placeholder**
```typescript
// src/main/auth.ts
export async function loginAzure(): Promise<boolean> {
  // Placeholder for real Azure Auth
  return new Promise(resolve => setTimeout(() => resolve(true), 1000))
}
```

- [ ] **Step 2: Update IPC definitions**
Modify `src/preload/index.d.ts` inside `api`:
```typescript
      loginAzure: () => Promise<boolean>
      checkRequirements: () => Promise<{ name: string; installed: boolean; version?: string }[]>
```

- [ ] **Step 3: Expose API in preload**
Modify `src/preload/index.ts`:
```typescript
    loginAzure: () => ipcRenderer.invoke('login-azure'),
    checkRequirements: () => ipcRenderer.invoke('check-requirements')
```

- [ ] **Step 4: Register IPC in main**
Modify `src/main/index.ts`:
```typescript
  import { checkRequirements } from './requirements'
  import { loginAzure } from './auth'

  ipcMain.handle('login-azure', () => loginAzure())
  ipcMain.handle('check-requirements', () => checkRequirements())
```

- [ ] **Step 5: Run typecheck and Commit**
Run: `npm run typecheck`
```bash
git add src/main/auth.ts src/main/index.ts src/preload/index.ts src/preload/index.d.ts
git commit -m "feat: setup IPC for auth and requirements"
```

---

### Task 3: Login Screen UI (React)

**Files:**
- Create: `src/renderer/src/components/LoginScreen.tsx`

- [ ] **Step 1: Write the React component**
```tsx
// src/renderer/src/components/LoginScreen.tsx
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
```

- [ ] **Step 2: Commit**
```bash
git add src/renderer/src/components/LoginScreen.tsx
git commit -m "feat: create login screen component"
```

---

### Task 4: Requirements Screen & App Router

**Files:**
- Create: `src/renderer/src/components/RequirementsScreen.tsx`
- Modify: `src/renderer/src/App.tsx`

- [ ] **Step 1: Write Requirements component**
```tsx
// src/renderer/src/components/RequirementsScreen.tsx
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
```

- [ ] **Step 2: Update App router**
Modify `src/renderer/src/App.tsx`:
```tsx
import { useState } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { RequirementsScreen } from './components/RequirementsScreen'
import { DeploymentScreen } from './components/DeploymentScreen'

export default function App() {
  const [step, setStep] = useState(1)

  return (
    <div>
      {step === 1 && <LoginScreen onLoginSuccess={() => setStep(2)} />}
      {step === 2 && <RequirementsScreen onNext={() => setStep(3)} />}
      {step === 3 && <DeploymentScreen />}
    </div>
  )
}
```

- [ ] **Step 3: Test and Commit**
Run: `npm run typecheck`
```bash
git add src/renderer/src/components/RequirementsScreen.tsx src/renderer/src/App.tsx
git commit -m "feat: implement requirements screen and navigation"
```
