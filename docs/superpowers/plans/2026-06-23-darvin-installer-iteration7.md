# Darvin Installer - Iteration 7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Taskfile task names, implement a smart check to skip `git clone` if the repository exists, and improve the terminal UI (auto-scroll, copy logs, taller height).

**Architecture:**
- `pathExists` IPC handler provides access to `fs.existsSync` to the Renderer.
- `DeploymentScreen` validates if `Taskfile.yml` exists before running `git clone`.
- `DeploymentScreen` uses `useRef` for auto-scrolling the terminal and `navigator.clipboard` for the Copy Logs button.

## Global Constraints
- Tests must be written/updated for all logic.
- Frequent commits.

---

### Task 1: Preload and Main Updates

**Files:**
- Modify: `src/main/index.ts`
- Modify: `src/preload/index.d.ts`
- Modify: `src/preload/index.ts`

- [ ] **Step 1: Main IPC Handler**
Modify `src/main/index.ts`:
```typescript
import * as fs from 'fs'

// ... in app.whenReady().then() ...
ipcMain.handle('path-exists', (_, pathStr) => fs.existsSync(pathStr))
```

- [ ] **Step 2: Preload types**
Modify `src/preload/index.d.ts`:
```typescript
pathExists: (path: string) => Promise<boolean>
```

- [ ] **Step 3: Preload exposure**
Modify `src/preload/index.ts`:
```typescript
pathExists: (path) => ipcRenderer.invoke('path-exists', path),
```

- [ ] **Step 4: Verify typecheck**
Run: `npm run typecheck`

- [ ] **Step 5: Commit**
```bash
git add src/main/index.ts src/preload/index.d.ts src/preload/index.ts
git commit -m "feat: add pathExists IPC to securely check for files"
```

---

### Task 2: Taskfile Name Fix & Smart Clone

**Files:**
- Modify: `src/renderer/src/components/DeploymentScreen.tsx`

- [ ] **Step 1: Fix Task Names**
Update the `STEPS` array:
```tsx
const STEPS = [
  { id: 'clone', name: 'Clonando Repositório', command: 'git', args: ['clone', 'https://telefonica-vivo-brasil@dev.azure.com/telefonica-vivo-brasil/ECMC%20-%20Ecomm%20Cloud%20B2C/_git/src-devops-darvin-hybris-67-dev', '.'] },
  { id: 'prepare', name: 'Preparando Ambiente', command: 'task', args: ['commerce:hy67:prepare'] },
  { id: 'clean', name: 'Limpando Build Anterior', command: 'task', args: ['commerce:hy67:ant:clean:all'] },
  { id: 'update', name: 'Atualizando Sistema', command: 'task', args: ['commerce:hy67:update:system'] },
  { id: 'start', name: 'Iniciando Servidor', command: 'task', args: ['commerce:hy67:start'] }
]
```

- [ ] **Step 2: Smart Clone Logic**
In `startInstall`, replace the simple loop with:
```tsx
    for (const step of STEPS) {
      if (step.id === 'clone') {
        const repoExists = await window.api.pathExists(`${cwd}/Taskfile.yml`)
        if (repoExists) {
          setLogs((prev) => [...prev, `\n>>> [SMART SKIP] Repositório já detectado em ${cwd}. Pulando clone.`])
          continue
        }
      }
      
      setCurrentStepName(step.name)
      // ... rest of execution logic
```

- [ ] **Step 3: Commit**
```bash
git add src/renderer/src/components/DeploymentScreen.tsx
git commit -m "fix: update taskfile names and add smart clone skip"
```

---

### Task 3: Terminal UI Improvements

**Files:**
- Modify: `src/renderer/src/components/DeploymentScreen.tsx`

- [ ] **Step 1: Auto-Scroll and Copy Button**
Update the React component:
```tsx
  import { useState, useEffect, useRef } from 'react'

  // inside component
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'))
  }

  // in JSX
  <button onClick={copyLogs} style={{ marginLeft: '10px' }}>Copiar Logs</button>

  <div style={{ backgroundColor: '#000', color: '#0f0', padding: '10px', marginTop: '10px', height: '60vh', overflowY: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap', flexGrow: 1 }}>
    {logs.map((l, i) => <div key={i}>{l}</div>)}
    <div ref={bottomRef} />
  </div>
```

- [ ] **Step 2: Commit**
```bash
git add src/renderer/src/components/DeploymentScreen.tsx
git commit -m "feat: improve terminal UI with auto-scroll and copy logs"
```
