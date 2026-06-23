# Darvin Installer - Iteration 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement auto-installer functionality for missing system requirements using Homebrew (Mac) and Winget (Windows).

**Architecture:**
- `src/main/installer.ts` detects the platform and executes the respective package manager command.
- The UI triggers `installRequirement` for each missing tool and re-runs the checks automatically.

## Global Constraints
- Tests must be written for all logic.
- Frequent commits.

---

### Task 1: Installer Logic (Main Process)

**Files:**
- Create: `src/main/installer.ts`
- Create: `src/main/installer.test.ts`

- [ ] **Step 1: Write failing test**
Create `src/main/installer.test.ts`: mock `child_process.exec` and test that `installRequirement('Git')` returns true.

- [ ] **Step 2: Verify test fails**
Run: `npm run test`

- [ ] **Step 3: Update implementation**
Modify `src/main/installer.ts`: 
```typescript
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const macCommands: Record<string, string> = {
  'Git': 'brew install git',
  'Java': 'brew install openjdk@8',
  'Docker': 'brew install --cask docker',
  'Taskfile': 'brew install go-task/tap/go-task',
  'Azure CLI': 'brew install azure-cli'
}

const winCommands: Record<string, string> = {
  'Git': 'winget install --id Git.Git -e --accept-source-agreements',
  'Java': 'winget install ojdkbuild.openjdk.8 -e --accept-source-agreements',
  'Docker': 'winget install Docker.DockerDesktop -e --accept-source-agreements',
  'Taskfile': 'winget install --id GoTask.GoTask -e --accept-source-agreements',
  'Azure CLI': 'winget install -e --id Microsoft.AzureCLI --accept-source-agreements'
}

export async function installRequirement(name: string): Promise<boolean> {
  const isMac = process.platform === 'darwin'
  const commands = isMac ? macCommands : winCommands
  const command = commands[name]

  if (!command) return false

  try {
    await execAsync(command)
    return true
  } catch (error) {
    console.error(`Failed to install ${name}:`, error)
    return false
  }
}
```

- [ ] **Step 4: Verify test passes**
Run: `npm run test`

- [ ] **Step 5: Commit**
```bash
git add src/main/installer.ts src/main/installer.test.ts
git commit -m "feat: add dependency installer logic"
```

---

### Task 2: IPC and Preload

**Files:**
- Modify: `src/main/index.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/preload/index.d.ts`

- [ ] **Step 1: Update IPC definitions**
Modify `src/preload/index.d.ts` inside `api`:
```typescript
      installRequirement: (name: string) => Promise<boolean>
```

- [ ] **Step 2: Expose API in preload**
Modify `src/preload/index.ts`:
```typescript
    installRequirement: (name) => ipcRenderer.invoke('install-requirement', name)
```

- [ ] **Step 3: Register IPC in main**
Modify `src/main/index.ts`:
```typescript
  import { installRequirement } from './installer'

  ipcMain.handle('install-requirement', (_, name) => installRequirement(name))
```

- [ ] **Step 4: Run typecheck and Commit**
Run: `npm run typecheck`
```bash
git add src/main/index.ts src/preload/index.ts src/preload/index.d.ts
git commit -m "feat: setup IPC for auto-installer"
```

---

### Task 3: Requirements Screen Auto-Install UI

**Files:**
- Modify: `src/renderer/src/components/RequirementsScreen.tsx`

- [ ] **Step 1: Write the React logic**
Modify `src/renderer/src/components/RequirementsScreen.tsx`:
Add a button for auto-installation that iterates over missing requirements.
```tsx
  const [installing, setInstalling] = useState(false)
  const [installingName, setInstallingName] = useState('')

  const handleInstallMissing = async () => {
    setInstalling(true)
    const missing = reqs.filter(r => !r.installed)
    for (const req of missing) {
      setInstallingName(req.name)
      await window.api.installRequirement(req.name)
    }
    setInstallingName('')
    // Re-check
    setLoading(true)
    const results = await window.api.checkRequirements()
    setReqs(results)
    setLoading(false)
    setInstalling(false)
  }

  // inside return:
  {!allMet && !loading && (
    <div style={{ marginTop: '20px' }}>
      <button onClick={handleInstallMissing} disabled={installing}>
        {installing ? `Instalando ${installingName}...` : 'Instalar Pendências'}
      </button>
    </div>
  )}
```

- [ ] **Step 2: Run typecheck and Commit**
Run: `npm run typecheck`
```bash
git add src/renderer/src/components/RequirementsScreen.tsx
git commit -m "feat: add auto-install button to UI"
```
