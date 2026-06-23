# Darvin Installer App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 3-click Electron application (Darvin) to simplify the installation of a Java environment, Hybris 6.7, and SAP Commerce.

**Architecture:** The application uses an Orchestrator pattern where the Node.js Main process executes shell commands (`task`, `git`) via `child_process.spawn` and streams logs/state via IPC to a React/Vite Renderer process, which displays a 3-step wizard (Login, Requirements, Deployment).

**Tech Stack:** Electron, React, TypeScript, Vite, Node.js (`child_process`), Vitest (to be added for testing).

## Global Constraints

- Must run on Mac (Primary) and Windows.
- Tests must be written for all logic (TDD approach).
- Frequent commits after every task.

---

### Task 1: Setup Testing Environment

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: A working test command (`npm run test`) using Vitest.

- [ ] **Step 1: Install dependencies**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitest/ui
```

- [ ] **Step 2: Add test script to package.json**
Modify `package.json` to add `"test": "vitest run"` to the scripts section.

- [ ] **Step 3: Create vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 4: Run test to verify setup**
Run: `npm run test`
Expected: PASS (No tests found, but command succeeds)

- [ ] **Step 5: Commit**
```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: setup vitest testing environment"
```

---

### Task 2: Main Process Command Executor

**Files:**
- Create: `src/main/executor.ts`
- Create: `src/main/executor.test.ts`

**Interfaces:**
- Produces: `executeCommand(command: string, args: string[], onLog: (data: string) => void): Promise<number>`

- [ ] **Step 1: Write the failing test**
```typescript
// src/main/executor.test.ts
import { describe, it, expect, vi } from 'vitest'
import { executeCommand } from './executor'

describe('executor', () => {
  it('executes a command and returns exit code 0', async () => {
    const onLog = vi.fn()
    const code = await executeCommand('echo', ['hello'], onLog)
    expect(code).toBe(0)
    expect(onLog).toHaveBeenCalledWith(expect.stringContaining('hello'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm run test`
Expected: FAIL with "executeCommand is not defined"

- [ ] **Step 3: Write minimal implementation**
```typescript
// src/main/executor.ts
import { spawn } from 'child_process'

export function executeCommand(command: string, args: string[], onLog: (data: string) => void): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: true })
    
    child.stdout.on('data', (data) => {
      onLog(data.toString())
    })
    
    child.stderr.on('data', (data) => {
      onLog(data.toString())
    })
    
    child.on('close', (code) => {
      resolve(code || 0)
    })
  })
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm run test`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/main/executor.ts src/main/executor.test.ts
git commit -m "feat: add command executor in main process"
```

---

### Task 3: IPC Setup and Preload API

**Files:**
- Modify: `src/main/index.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/preload/index.d.ts`

**Interfaces:**
- Consumes: `executeCommand`
- Produces: `window.api.runInstallerStep` and `window.api.onLogReceived`

- [ ] **Step 1: Define types in preload definitions**
Modify `src/preload/index.d.ts`:
```typescript
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      runInstallerStep: (stepName: string) => Promise<number>
      onLogReceived: (callback: (log: string) => void) => void
    }
  }
}
```

- [ ] **Step 2: Expose API in preload script**
Modify `src/preload/index.ts` inside `contextBridge.exposeInMainWorld('api', ...)`:
```typescript
  api: {
    runInstallerStep: (stepName: string) => ipcRenderer.invoke('run-installer-step', stepName),
    onLogReceived: (callback) => ipcRenderer.on('log-received', (_event, log) => callback(log))
  }
```

- [ ] **Step 3: Handle IPC in main process**
Modify `src/main/index.ts` inside `app.whenReady().then(() => {`:
```typescript
  import { executeCommand } from './executor'
  import { ipcMain } from 'electron'

  ipcMain.handle('run-installer-step', async (event, stepName) => {
    const webContents = event.sender
    const onLog = (log: string) => {
      webContents.send('log-received', log)
    }
    
    // Simple mapping for now
    if (stepName === 'git-clone') {
      return await executeCommand('git', ['clone', '--help'], onLog) // Mock for now
    }
    return 0
  })
```

- [ ] **Step 4: Verify compilation**
Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/main/index.ts src/preload/index.ts src/preload/index.d.ts
git commit -m "feat: setup IPC for installer steps"
```

---

### Task 4: Deployment Screen UI (React)

**Files:**
- Create: `src/renderer/src/components/DeploymentScreen.tsx`
- Create: `src/renderer/src/components/DeploymentScreen.test.tsx`
- Modify: `src/renderer/src/App.tsx`

**Interfaces:**
- Consumes: `window.api.runInstallerStep`, `window.api.onLogReceived`

- [ ] **Step 1: Write the failing test**
```tsx
// src/renderer/src/components/DeploymentScreen.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DeploymentScreen } from './DeploymentScreen'

// Mock the window.api
window.api = {
  runInstallerStep: vi.fn().mockResolvedValue(0),
  onLogReceived: vi.fn()
} as any

describe('DeploymentScreen', () => {
  it('renders a start button and a terminal area', () => {
    render(<DeploymentScreen />)
    expect(screen.getByText('Iniciar Instalação')).toBeDefined()
  })

  it('calls runInstallerStep when button is clicked', () => {
    render(<DeploymentScreen />)
    fireEvent.click(screen.getByText('Iniciar Instalação'))
    expect(window.api.runInstallerStep).toHaveBeenCalledWith('git-clone')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm run test`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
```tsx
// src/renderer/src/components/DeploymentScreen.tsx
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
    const code = await window.api.runInstallerStep('git-clone')
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
```

- [ ] **Step 4: Update App.tsx and Run tests**
Modify `src/renderer/src/App.tsx` to render `<DeploymentScreen />`.
Run: `npm run test`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/renderer/src/components/DeploymentScreen.tsx src/renderer/src/components/DeploymentScreen.test.tsx src/renderer/src/App.tsx
git commit -m "feat: create deployment screen UI"
```
