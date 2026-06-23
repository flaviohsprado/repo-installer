# Darvin Installer — Repaginada visual + dependências robustas (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar todas as telas para Tailwind/shadcn num visual dark sóbrio com wizard/stepper, e tornar a verificação/instalação de dependências robusta e transparente (por item, com logs ao vivo e tratamento de casos que exigem ação manual).

**Architecture:** O processo `main` ganha resultados estruturados para checagem/instalação e streaming de logs (reusando o padrão `spawn` do `executor.ts`). O `renderer` ganha um casco de wizard com stepper persistente, telas migradas para shadcn e uma tela de Requisitos com máquina de estados por item.

**Tech Stack:** Electron 39, React 19, TypeScript, electron-vite, Tailwind v4, shadcn (new-york), Radix UI, lucide-react, Vitest + Testing Library.

## Global Constraints

- Plataformas-alvo de primeira classe: **Windows (winget)** e **macOS (brew)**.
- Direção visual: dark **sóbrio/enterprise**, um único accent contido (azul/teal); glassmorphism sutil.
- Login é **porta de entrada** (tela cheia); o stepper envolve apenas Requisitos → Pasta → Deploy.
- UX de instalação: **por item** + **logs ao vivo** + erros visíveis.
- Casos especiais: **detectar e guiar** (ex: Docker instalado mas daemon parado → "Abrir Docker Desktop").
- NÃO alterar os comandos de deploy (`task commerce:hy67:*`) nem a lógica de auth além do visual.
- Estilo shadcn: `new-york`, alias `@` → `src/renderer/src`, `cssVariables: true`.
- Comando de teste: `npm test` (vitest, ambiente jsdom, globals).

---

### Task 1: Helpers de detecção do Docker (`src/main/docker.ts`)

**Files:**
- Create: `src/main/docker.ts`
- Test: `src/main/docker.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `isDockerInstalled(): Promise<boolean>`
  - `isDockerDaemonRunning(): Promise<boolean>`
  - `openDockerDesktop(): Promise<void>`

- [ ] **Step 1: Write the failing test**

`src/main/docker.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const execMock = vi.fn()
vi.mock('child_process', () => ({
  exec: (cmd: string, cb: (e: Error | null, r: { stdout: string; stderr: string }) => void) =>
    execMock(cmd, cb)
}))

import { isDockerInstalled, isDockerDaemonRunning } from './docker'

describe('docker helpers', () => {
  beforeEach(() => execMock.mockReset())

  it('isDockerInstalled returns true when docker --version succeeds', async () => {
    execMock.mockImplementation((_cmd, cb) => cb(null, { stdout: 'Docker version 27', stderr: '' }))
    expect(await isDockerInstalled()).toBe(true)
  })

  it('isDockerInstalled returns false when command fails', async () => {
    execMock.mockImplementation((_cmd, cb) => cb(new Error('not found'), { stdout: '', stderr: '' }))
    expect(await isDockerInstalled()).toBe(false)
  })

  it('isDockerDaemonRunning returns false when docker info fails', async () => {
    execMock.mockImplementation((_cmd, cb) => cb(new Error('daemon down'), { stdout: '', stderr: '' }))
    expect(await isDockerDaemonRunning()).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/main/docker.test.ts`
Expected: FAIL — `Cannot find module './docker'`.

- [ ] **Step 3: Write minimal implementation**

`src/main/docker.ts`:
```ts
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function isDockerInstalled(): Promise<boolean> {
  try {
    await execAsync('docker --version')
    return true
  } catch {
    return false
  }
}

export async function isDockerDaemonRunning(): Promise<boolean> {
  try {
    await execAsync('docker info')
    return true
  } catch {
    return false
  }
}

export async function openDockerDesktop(): Promise<void> {
  if (process.platform === 'darwin') {
    await execAsync('open -a Docker')
  } else {
    // No Windows, cmd expande %ProgramFiles%; aspas vazias evitam erro de título do `start`.
    await execAsync('start "" "%ProgramFiles%\\Docker\\Docker\\Docker Desktop.exe"')
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/main/docker.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/main/docker.ts src/main/docker.test.ts
git commit -m "feat: add docker detection helpers"
```

---

### Task 2: Checagem de requisitos com resultado estruturado (`src/main/requirements.ts`)

**Files:**
- Modify: `src/main/requirements.ts`
- Test: `src/main/requirements.test.ts`

**Interfaces:**
- Consumes: `isDockerInstalled`, `isDockerDaemonRunning` de `./docker` (Task 1).
- Produces:
  - `type RequirementStatus = 'ok' | 'missing' | 'needs-action'`
  - `interface RequirementResult { name: string; status: RequirementStatus; installed: boolean; version?: string; message?: string; actionId?: string; actionLabel?: string }`
  - `checkRequirements(): Promise<RequirementResult[]>`
  - `checkRequirement(name: string): Promise<RequirementResult>`

- [ ] **Step 1: Write the failing test**

Substitua todo o conteúdo de `src/main/requirements.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { checkRequirements, checkRequirement } from './requirements'

describe('checkRequirements', () => {
  it('returns 5 results with the expected names and a status field', async () => {
    const results = await checkRequirements()
    expect(results).toHaveLength(5)
    expect(results.map((r) => r.name)).toEqual(['Git', 'Java (1.8)', 'Docker', 'Taskfile', 'Azure CLI'])
    for (const r of results) {
      expect(['ok', 'missing', 'needs-action']).toContain(r.status)
    }
  })

  it('checkRequirement returns a missing result for an unknown name', async () => {
    const r = await checkRequirement('Unknown')
    expect(r).toEqual({ name: 'Unknown', status: 'missing', installed: false })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/main/requirements.test.ts`
Expected: FAIL — `checkRequirement` não é exportado / sem campo `status`.

- [ ] **Step 3: Write minimal implementation**

Substitua todo o conteúdo de `src/main/requirements.ts`:
```ts
import { exec } from 'child_process'
import { promisify } from 'util'
import { isDockerInstalled, isDockerDaemonRunning } from './docker'

const execAsync = promisify(exec)

export type RequirementStatus = 'ok' | 'missing' | 'needs-action'

export interface RequirementResult {
  name: string
  status: RequirementStatus
  installed: boolean
  version?: string
  message?: string
  actionId?: string
  actionLabel?: string
}

const javaCommand =
  process.platform === 'darwin'
    ? '"$(/usr/libexec/java_home -v 1.8)/bin/java" -version'
    : 'java -version'

async function checkCommand(
  name: string,
  command: string,
  versionCheck?: (output: string) => boolean
): Promise<RequirementResult> {
  try {
    const { stdout, stderr } = await execAsync(command)
    const output = stdout.trim() || stderr.trim()
    if (versionCheck && !versionCheck(output)) {
      return { name, status: 'missing', installed: false }
    }
    return { name, status: 'ok', installed: true, version: output.split('\n')[0] }
  } catch {
    return { name, status: 'missing', installed: false }
  }
}

async function checkDocker(): Promise<RequirementResult> {
  const name = 'Docker'
  if (!(await isDockerInstalled())) {
    return { name, status: 'missing', installed: false }
  }
  let version: string | undefined
  try {
    const { stdout } = await execAsync('docker --version')
    version = stdout.trim()
  } catch {
    version = undefined
  }
  if (await isDockerDaemonRunning()) {
    return { name, status: 'ok', installed: true, version }
  }
  return {
    name,
    status: 'needs-action',
    installed: true,
    version,
    message: 'Docker está instalado, mas o daemon não está em execução.',
    actionId: 'open-docker',
    actionLabel: 'Abrir Docker Desktop'
  }
}

const CHECKS: { name: string; check: () => Promise<RequirementResult> }[] = [
  { name: 'Git', check: () => checkCommand('Git', 'git --version') },
  {
    name: 'Java (1.8)',
    check: () => checkCommand('Java (1.8)', javaCommand, (out) => out.includes('1.8.'))
  },
  { name: 'Docker', check: checkDocker },
  { name: 'Taskfile', check: () => checkCommand('Taskfile', 'task --version') },
  { name: 'Azure CLI', check: () => checkCommand('Azure CLI', 'az --version') }
]

export async function checkRequirements(): Promise<RequirementResult[]> {
  return Promise.all(CHECKS.map((c) => c.check()))
}

export async function checkRequirement(name: string): Promise<RequirementResult> {
  const found = CHECKS.find((c) => c.name === name)
  return found ? found.check() : { name, status: 'missing', installed: false }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/main/requirements.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/main/requirements.ts src/main/requirements.test.ts
git commit -m "feat: structured requirement results with docker daemon detection"
```

---

### Task 3: Instalação com streaming + resultado estruturado (`src/main/installer.ts`)

**Files:**
- Modify: `src/main/installer.ts`
- Test: `src/main/installer.test.ts`

**Interfaces:**
- Consumes: nada novo.
- Produces:
  - `interface InstallResult { status: 'success' | 'error' | 'needs-action'; message?: string }`
  - `installRequirement(name: string, options?: { elevated?: boolean }, onLog?: (chunk: string) => void): Promise<InstallResult>`

- [ ] **Step 1: Write the failing test**

Substitua todo o conteúdo de `src/main/installer.test.ts`:
```ts
import { describe, test, expect, vi } from 'vitest'
import { EventEmitter } from 'events'

vi.mock('child_process', () => {
  return {
    spawn: vi.fn(() => {
      const child = new EventEmitter() as EventEmitter & {
        stdout: EventEmitter
        stderr: EventEmitter
      }
      child.stdout = new EventEmitter()
      child.stderr = new EventEmitter()
      setTimeout(() => {
        child.stdout.emit('data', Buffer.from('installing...'))
        child.emit('close', 0)
      }, 0)
      return child
    }),
    exec: vi.fn((_cmd: string, optsOrCb: unknown, cb?: unknown) => {
      const fn = typeof optsOrCb === 'function' ? optsOrCb : cb
      if (typeof fn === 'function') (fn as (e: null, r: object) => void)(null, { stdout: '', stderr: '' })
    })
  }
})

import { installRequirement } from './installer'

describe('installer', () => {
  test('installRequirement streams logs and returns success on exit code 0', async () => {
    const logs: string[] = []
    const result = await installRequirement('Git', {}, (chunk) => logs.push(chunk))
    expect(result.status).toBe('success')
    expect(logs.join('')).toContain('installing')
  })

  test('installRequirement returns error for an unknown package', async () => {
    const result = await installRequirement('Unknown')
    expect(result.status).toBe('error')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/main/installer.test.ts`
Expected: FAIL — assinatura/retorno antigos (`boolean`).

- [ ] **Step 3: Write minimal implementation**

Substitua todo o conteúdo de `src/main/installer.ts`:
```ts
import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

const execAsync = promisify(exec)

export interface InstallResult {
  status: 'success' | 'error' | 'needs-action'
  message?: string
}

const macCommands: Record<string, string> = {
  Git: 'brew install git',
  'Java (1.8)': 'brew install --cask zulu@8',
  Docker: 'brew install --cask docker',
  Taskfile: 'brew install go-task/tap/go-task',
  'Azure CLI': 'brew install azure-cli'
}

const winCommands: Record<string, string> = {
  Git: 'winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements',
  'Java (1.8)':
    'winget install --id ojdkbuild.openjdk.8.jre -e --accept-source-agreements --accept-package-agreements',
  Docker:
    'winget install --id Docker.DockerDesktop -e --accept-source-agreements --accept-package-agreements',
  Taskfile: 'winget install --id Task.Task -e --accept-source-agreements --accept-package-agreements',
  'Azure CLI':
    'winget install --id Microsoft.AzureCLI -e --accept-source-agreements --accept-package-agreements'
}

function buildAskpassScript(name: string): string {
  return `#!/bin/sh
osascript -e 'Tell application (path to frontmost application as text) to display dialog "O Darvin Installer precisa de privilégios de Administrador para instalar o pacote: ${name}.\\n\\nPor favor, informe a senha do seu Mac:" default answer "" with hidden answer with title "Permissão Necessária"' -e 'text returned of result'
`
}

async function installElevatedWindows(command: string, onLog: (chunk: string) => void): Promise<InstallResult> {
  onLog('\nSolicitando privilégios de administrador (UAC)...\n')
  // Roda o comando elevado numa nova janela do PowerShell; sem streaming (a UI re-checa depois).
  const psCommand = `Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile','-Command','${command.replace(/'/g, "''")}'`
  try {
    await execAsync(`powershell -NoProfile -Command "${psCommand.replace(/"/g, '\\"')}"`)
    onLog('Processo de instalação elevado finalizado.\n')
    return { status: 'success' }
  } catch {
    return { status: 'error', message: 'Instalação como administrador falhou ou foi cancelada.' }
  }
}

export async function installRequirement(
  name: string,
  options: { elevated?: boolean } = {},
  onLog: (chunk: string) => void = () => {}
): Promise<InstallResult> {
  const isMac = process.platform === 'darwin'
  const command = (isMac ? macCommands : winCommands)[name]
  if (!command) {
    return { status: 'error', message: `Sem comando de instalação para "${name}".` }
  }

  if (!isMac && options.elevated) {
    return installElevatedWindows(command, onLog)
  }

  let askpassScriptPath: string | undefined
  const env = { ...process.env }
  if (isMac && command.includes('--cask')) {
    askpassScriptPath = path.join(os.tmpdir(), `darvin-askpass-${Date.now()}.sh`)
    fs.writeFileSync(askpassScriptPath, buildAskpassScript(name))
    fs.chmodSync(askpassScriptPath, 0o700)
    env.SUDO_ASKPASS = askpassScriptPath
  }

  return new Promise<InstallResult>((resolve) => {
    const child = spawn(command, { shell: true, env })
    child.stdout?.on('data', (data) => onLog(data.toString()))
    child.stderr?.on('data', (data) => onLog(data.toString()))
    child.on('close', (code) => {
      if (askpassScriptPath && fs.existsSync(askpassScriptPath)) fs.unlinkSync(askpassScriptPath)
      if (code === 0) {
        resolve({ status: 'success' })
      } else {
        resolve({ status: 'error', message: `Instalação falhou com código ${code}.` })
      }
    })
    child.on('error', (err) => {
      if (askpassScriptPath && fs.existsSync(askpassScriptPath)) fs.unlinkSync(askpassScriptPath)
      resolve({ status: 'error', message: err.message })
    })
  })
}
```

> Nota de pacotes (validar ao executar): os IDs winget `ojdkbuild.openjdk.8.jre` e `Task.Task` foram corrigidos vs. a versão antiga (`ojdkbuild.openjdk.8`, `GoTask.GoTask`). Se um `winget install` falhar com "No package found", rode `winget search <termo>` e ajuste o ID no mapa antes de prosseguir.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/main/installer.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/main/installer.ts src/main/installer.test.ts
git commit -m "feat: streaming installer with structured result and windows elevation fallback"
```

---

### Task 4: Wiring de IPC + preload

**Files:**
- Modify: `src/main/index.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/preload/index.d.ts`

**Interfaces:**
- Consumes: `checkRequirements`, `checkRequirement` (Task 2); `installRequirement`, `InstallResult` (Task 3); `openDockerDesktop` (Task 1).
- Produces (em `window.api`):
  - `checkRequirements(): Promise<RequirementResult[]>`
  - `checkRequirement(name: string): Promise<RequirementResult>`
  - `installRequirement(name: string, options?: { elevated?: boolean }): Promise<InstallResult>`
  - `onInstallLog(callback: (payload: { name: string; chunk: string }) => void): void`
  - `runRequirementAction(actionId: string): Promise<boolean>`
  - `platform: NodeJS.Platform`
  - (mantém `runInstallerStep`, `onLogReceived`, `loginAzure`, `selectDirectory`, `pathExists`)

Não há teste unitário de IPC; a verificação é via `npm run typecheck` e execução do app.

- [ ] **Step 1: Atualizar os handlers no main**

Em `src/main/index.ts`, ajuste os imports e substitua os handlers de requisitos/instalação:

Imports (topo do arquivo):
```ts
import { checkRequirements, checkRequirement } from './requirements'
import { loginAzure } from './auth'
import { installRequirement } from './installer'
import { openDockerDesktop } from './docker'
```

Dentro de `app.whenReady().then(() => { ... })`, substitua as linhas
`ipcMain.handle('check-requirements', ...)` e `ipcMain.handle('install-requirement', ...)` por:
```ts
  ipcMain.handle('check-requirements', () => checkRequirements())
  ipcMain.handle('check-requirement', (_, name: string) => checkRequirement(name))

  ipcMain.handle(
    'install-requirement',
    async (event, name: string, options?: { elevated?: boolean }) => {
      const webContents = event.sender
      const onLog = (chunk: string) => webContents.send('install-log', { name, chunk })
      return installRequirement(name, options ?? {}, onLog)
    }
  )

  ipcMain.handle('run-requirement-action', async (_, actionId: string) => {
    if (actionId === 'open-docker') {
      await openDockerDesktop()
      return true
    }
    return false
  })
```

- [ ] **Step 2: Atualizar o preload**

Em `src/preload/index.ts`, substitua o objeto `api` por:
```ts
const api = {
  runInstallerStep: (command: string, args: string[], cwd?: string) =>
    ipcRenderer.invoke('run-installer-step', command, args, cwd),
  onLogReceived: (callback: (log: string) => void) =>
    ipcRenderer.on('log-received', (_event, log) => callback(log)),
  loginAzure: () => ipcRenderer.invoke('login-azure'),
  checkRequirements: () => ipcRenderer.invoke('check-requirements'),
  checkRequirement: (name: string) => ipcRenderer.invoke('check-requirement', name),
  installRequirement: (name: string, options?: { elevated?: boolean }) =>
    ipcRenderer.invoke('install-requirement', name, options),
  onInstallLog: (callback: (payload: { name: string; chunk: string }) => void) =>
    ipcRenderer.on('install-log', (_event, payload) => callback(payload)),
  runRequirementAction: (actionId: string) =>
    ipcRenderer.invoke('run-requirement-action', actionId),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  pathExists: (path: string) => ipcRenderer.invoke('path-exists', path),
  platform: process.platform
}
```

- [ ] **Step 3: Atualizar os tipos do preload**

Substitua todo o conteúdo de `src/preload/index.d.ts`:
```ts
import { ElectronAPI } from '@electron-toolkit/preload'

type RequirementStatus = 'ok' | 'missing' | 'needs-action'

interface RequirementResult {
  name: string
  status: RequirementStatus
  installed: boolean
  version?: string
  message?: string
  actionId?: string
  actionLabel?: string
}

interface InstallResult {
  status: 'success' | 'error' | 'needs-action'
  message?: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      runInstallerStep: (command: string, args: string[], cwd?: string) => Promise<number>
      onLogReceived: (callback: (log: string) => void) => void
      loginAzure: () => Promise<boolean>
      checkRequirements: () => Promise<RequirementResult[]>
      checkRequirement: (name: string) => Promise<RequirementResult>
      installRequirement: (
        name: string,
        options?: { elevated?: boolean }
      ) => Promise<InstallResult>
      onInstallLog: (callback: (payload: { name: string; chunk: string }) => void) => void
      runRequirementAction: (actionId: string) => Promise<boolean>
      selectDirectory: () => Promise<string | null>
      pathExists: (path: string) => Promise<boolean>
      platform: NodeJS.Platform
    }
  }
}
```

- [ ] **Step 4: Verificar typecheck**

Run: `npm run typecheck`
Expected: PASS (sem erros). Se a RequirementsScreen/DeploymentScreen acusarem erro de tipo, isso é esperado e será resolvido nas Tasks 11/12 — confirme que `typecheck:node` (main/preload) passa; falhas restantes devem ser apenas em `typecheck:web`.

- [ ] **Step 5: Commit**

```bash
git add src/main/index.ts src/preload/index.ts src/preload/index.d.ts
git commit -m "feat: wire structured requirement IPC, install streaming and docker action"
```

---

### Task 5: Refinar os tokens visuais (`src/renderer/src/assets/main.css`)

**Files:**
- Modify: `src/renderer/src/assets/main.css`

Não há teste unitário; verificação via `npm run build`.

- [ ] **Step 1: Atualizar `@theme` para registrar success/warning**

Em `src/renderer/src/assets/main.css`, dentro do bloco `@theme { ... }`, adicione antes de `--radius-lg`:
```css
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
```

- [ ] **Step 2: Substituir os valores do `:root`**

Substitua todo o bloco `@layer base { :root { ... } }` (o primeiro, com as variáveis de cor) por:
```css
@layer base {
  :root {
    --background: oklch(0.16 0.012 248);
    --foreground: oklch(0.96 0.005 248);
    --card: oklch(0.2 0.014 248);
    --card-foreground: oklch(0.96 0.005 248);
    --popover: oklch(0.2 0.014 248);
    --popover-foreground: oklch(0.96 0.005 248);
    --primary: oklch(0.62 0.13 235);
    --primary-foreground: oklch(0.98 0.005 248);
    --secondary: oklch(0.26 0.015 248);
    --secondary-foreground: oklch(0.96 0.005 248);
    --muted: oklch(0.26 0.015 248);
    --muted-foreground: oklch(0.7 0.02 248);
    --accent: oklch(0.3 0.02 235);
    --accent-foreground: oklch(0.96 0.005 248);
    --destructive: oklch(0.55 0.2 25);
    --destructive-foreground: oklch(0.98 0 0);
    --success: oklch(0.65 0.15 150);
    --success-foreground: oklch(0.98 0 0);
    --warning: oklch(0.78 0.14 80);
    --warning-foreground: oklch(0.2 0.02 80);
    --border: oklch(0.3 0.015 248);
    --input: oklch(0.3 0.015 248);
    --ring: oklch(0.62 0.13 235);
    --radius: 0.625rem;
  }
}
```

- [ ] **Step 3: Simplificar o `body`**

Em `main.css`, substitua o bloco `body { ... }` que tem `background-image: url('./wavy-lines.svg')` por:
```css
body {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
  background:
    radial-gradient(60% 60% at 50% 0%, oklch(0.24 0.03 248 / 0.6) 0%, transparent 70%),
    var(--background);
}
```

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: build conclui sem erro (telas legadas ainda funcionam pois o CSS antigo continua presente).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/assets/main.css
git commit -m "style: refine dark token palette and add success/warning tokens"
```

---

### Task 6: Adicionar componentes shadcn + alias do vitest

**Files:**
- Create: `src/renderer/src/components/ui/badge.tsx`, `progress.tsx`, `scroll-area.tsx`, `alert.tsx`, `separator.tsx` (via CLI)
- Modify: `vitest.config.ts`
- Modify: `package.json` / `package-lock.json` (deps Radix via CLI)

**Interfaces:**
- Produces: `Badge`, `Progress`, `ScrollArea`, `Alert`/`AlertTitle`/`AlertDescription`, `Separator` de `@/components/ui/*`.

- [ ] **Step 1: Adicionar os componentes via shadcn CLI**

Run: `npx shadcn@latest add badge progress scroll-area alert separator`
Expected: cria os 5 arquivos em `src/renderer/src/components/ui/` e instala as deps Radix necessárias (`@radix-ui/react-progress`, `@radix-ui/react-scroll-area`, `@radix-ui/react-separator`).

Se o CLI perguntar algo de forma interativa, aceite os padrões. Se falhar por rede, instale as deps manualmente (`npm i @radix-ui/react-progress @radix-ui/react-scroll-area @radix-ui/react-separator`) e crie os componentes a partir da fonte new-york do shadcn.

- [ ] **Step 2: Verificar criação**

Run: `npm run typecheck:web`
Expected: PASS (os novos componentes compilam). Erros pré-existentes da RequirementsScreen são esperados (resolvidos na Task 11).

- [ ] **Step 3: Adicionar alias `@` ao vitest**

Substitua todo o conteúdo de `vitest.config.ts`:
```ts
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
      '@renderer': resolve(__dirname, 'src/renderer/src')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
})
```

- [ ] **Step 4: Verificar que os testes ainda passam**

Run: `npm test`
Expected: PASS (os testes existentes do main + DeploymentScreen continuam verdes).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/ui vitest.config.ts package.json package-lock.json
git commit -m "feat: add shadcn badge/progress/scroll-area/alert/separator and vitest alias"
```

---

### Task 7: Stepper + WizardShell

**Files:**
- Create: `src/renderer/src/components/Stepper.tsx`
- Create: `src/renderer/src/components/WizardShell.tsx`
- Test: `src/renderer/src/components/WizardShell.test.tsx`

**Interfaces:**
- Consumes: `cn` de `@/lib/utils`.
- Produces:
  - `interface WizardStepDef { id: string; label: string }`
  - `Stepper({ steps, currentId }: { steps: WizardStepDef[]; currentId: string })`
  - `WizardShell({ currentStep, children }: { currentStep: string; children: React.ReactNode })` — usa STEPS internos `[{id:'requirements',label:'Requisitos'},{id:'config',label:'Pasta'},{id:'deploy',label:'Deploy'}]`

- [ ] **Step 1: Write the failing test**

`src/renderer/src/components/WizardShell.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WizardShell } from './WizardShell'

describe('WizardShell', () => {
  it('renders the three step labels and the children', () => {
    render(
      <WizardShell currentStep="config">
        <div>conteúdo do passo</div>
      </WizardShell>
    )
    expect(screen.getByText('Requisitos')).toBeDefined()
    expect(screen.getByText('Pasta')).toBeDefined()
    expect(screen.getByText('Deploy')).toBeDefined()
    expect(screen.getByText('conteúdo do passo')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/src/components/WizardShell.test.tsx`
Expected: FAIL — `Cannot find module './WizardShell'`.

- [ ] **Step 3: Write minimal implementation**

`src/renderer/src/components/Stepper.tsx`:
```tsx
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WizardStepDef {
  id: string
  label: string
}

interface Props {
  steps: WizardStepDef[]
  currentId: string
}

export function Stepper({ steps, currentId }: Props) {
  const currentIndex = steps.findIndex((s) => s.id === currentId)

  return (
    <nav className="flex flex-col gap-1">
      {steps.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'upcoming'
        return (
          <div
            key={step.id}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              state === 'active' ? 'bg-primary/10 text-foreground' : 'text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                state === 'done' && 'border-primary bg-primary text-primary-foreground',
                state === 'active' && 'border-primary text-primary',
                state === 'upcoming' && 'border-border'
              )}
            >
              {state === 'done' ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className="font-medium">{step.label}</span>
          </div>
        )
      })}
    </nav>
  )
}
```

`src/renderer/src/components/WizardShell.tsx`:
```tsx
import { ReactNode } from 'react'
import { Stepper, WizardStepDef } from './Stepper'

const STEPS: WizardStepDef[] = [
  { id: 'requirements', label: 'Requisitos' },
  { id: 'config', label: 'Pasta' },
  { id: 'deploy', label: 'Deploy' }
]

interface Props {
  currentStep: string
  children: ReactNode
}

export function WizardShell({ currentStep, children }: Props) {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card/40 p-6 backdrop-blur-xl">
        <div className="mb-8 flex items-center gap-2 text-foreground">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="text-base font-semibold">Darvin Installer</span>
        </div>
        <Stepper steps={STEPS} currentId={currentStep} />
      </aside>
      <main className="flex flex-1 items-center justify-center overflow-y-auto p-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/src/components/WizardShell.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/Stepper.tsx src/renderer/src/components/WizardShell.tsx src/renderer/src/components/WizardShell.test.tsx
git commit -m "feat: add persistent wizard shell with stepper"
```

---

### Task 8: Refatorar `App.tsx` (porta de login + casco do wizard)

**Files:**
- Modify: `src/renderer/src/App.tsx`
- Test: `src/renderer/src/App.test.tsx`

**Interfaces:**
- Consumes: `LoginScreen`, `RequirementsScreen`, `ConfigScreen`, `DeploymentScreen`, `WizardShell`.
- Produces: nada para outras tasks (componente raiz).

- [ ] **Step 1: Write the failing test**

`src/renderer/src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'

beforeEach(() => {
  window.api = {
    loginAzure: vi.fn().mockResolvedValue(true),
    checkRequirements: vi.fn().mockResolvedValue([]),
    checkRequirement: vi.fn(),
    installRequirement: vi.fn(),
    onInstallLog: vi.fn(),
    runRequirementAction: vi.fn(),
    runInstallerStep: vi.fn(),
    onLogReceived: vi.fn(),
    selectDirectory: vi.fn(),
    pathExists: vi.fn().mockResolvedValue(false),
    platform: 'win32'
  } as unknown as Window['api']
})

describe('App', () => {
  it('shows the login screen first (auth gate)', () => {
    render(<App />)
    expect(screen.getByText('Conectar com Azure')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/src/App.test.tsx`
Expected: FAIL — texto pode não bater até a Task 9, mas a estrutura de gate deve existir. (Se `LoginScreen` ainda for a versão antiga, o texto "Conectar com Azure" já existe — então o teste pode passar parcialmente; o objetivo aqui é travar a estrutura do App.)

- [ ] **Step 3: Write minimal implementation**

Substitua todo o conteúdo de `src/renderer/src/App.tsx`:
```tsx
import { useState } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { RequirementsScreen } from './components/RequirementsScreen'
import { ConfigScreen } from './components/ConfigScreen'
import { DeploymentScreen } from './components/DeploymentScreen'
import { WizardShell } from './components/WizardShell'

type WizardStep = 'requirements' | 'config' | 'deploy'

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [step, setStep] = useState<WizardStep>('requirements')
  const [installPath, setInstallPath] = useState('')

  if (!authenticated) {
    return <LoginScreen onLoginSuccess={() => setAuthenticated(true)} />
  }

  return (
    <WizardShell currentStep={step}>
      {step === 'requirements' && <RequirementsScreen onNext={() => setStep('config')} />}
      {step === 'config' && (
        <ConfigScreen
          onNext={(path) => {
            setInstallPath(path)
            setStep('deploy')
          }}
        />
      )}
      {step === 'deploy' && <DeploymentScreen cwd={installPath} />}
    </WizardShell>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/src/App.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/App.tsx src/renderer/src/App.test.tsx
git commit -m "feat: app auth gate plus wizard shell routing"
```

---

### Task 9: Migrar `LoginScreen` para shadcn

**Files:**
- Modify: `src/renderer/src/components/LoginScreen.tsx`

Verificação via `npm test -- src/renderer/src/App.test.tsx` (continua achando "Conectar com Azure") + `npm run build`.

- [ ] **Step 1: Reescrever o componente**

Substitua todo o conteúdo de `src/renderer/src/components/LoginScreen.tsx`:
```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

interface Props {
  onLoginSuccess: () => void
}

export function LoginScreen({ onLoginSuccess }: Props) {
  const [loading, setLoading] = useState(false)

  const handleLogin = async (): Promise<void> => {
    setLoading(true)
    const success = await window.api.loginAzure()
    if (success) onLoginSuccess()
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md border-border bg-card/60 backdrop-blur-xl">
        <CardHeader className="items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <CardTitle className="text-2xl">Darvin Installer</CardTitle>
          <CardDescription>Autentique-se para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" size="lg" onClick={handleLogin} disabled={loading}>
            {loading ? 'Conectando...' : 'Conectar com Azure'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

Run: `npm test -- src/renderer/src/App.test.tsx`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/LoginScreen.tsx
git commit -m "style: migrate LoginScreen to shadcn"
```

---

### Task 10: Migrar `ConfigScreen` para shadcn

**Files:**
- Modify: `src/renderer/src/components/ConfigScreen.tsx`

Verificação via `npm run build`.

- [ ] **Step 1: Reescrever o componente**

Substitua todo o conteúdo de `src/renderer/src/components/ConfigScreen.tsx`:
```tsx
import { useState } from 'react'
import { Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

interface Props {
  onNext: (path: string) => void
}

export function ConfigScreen({ onNext }: Props) {
  const [selectedPath, setSelectedPath] = useState<string>('')

  const handleSelect = async (): Promise<void> => {
    const path = await window.api.selectDirectory()
    if (path) setSelectedPath(path)
  }

  return (
    <Card className="w-full max-w-2xl border-border bg-card/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Diretório de Instalação</CardTitle>
        <CardDescription>Selecione uma pasta vazia onde o projeto será clonado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="secondary" onClick={handleSelect}>
          Escolher Pasta
        </Button>
        {selectedPath && (
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="mb-2 text-sm text-muted-foreground">Pasta selecionada:</p>
            <div className="flex items-center gap-2 break-all rounded-md bg-background/60 p-3 font-mono text-sm">
              <Folder className="h-4 w-4 shrink-0 text-primary" />
              {selectedPath}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" size="lg" disabled={!selectedPath} onClick={() => onNext(selectedPath)}>
          Avançar
        </Button>
      </CardFooter>
    </Card>
  )
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: build conclui (a RequirementsScreen ainda usa tipos antigos — se `typecheck` falhar só nela, prossiga; será resolvida na Task 11).

> Se o `npm run build` falhar por causa da RequirementsScreen, faça as Tasks 11 e 12 antes de rodar o build completo; o commit deste passo pode ser feito assim mesmo, pois o componente está correto isoladamente.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/ConfigScreen.tsx
git commit -m "style: migrate ConfigScreen to shadcn"
```

---

### Task 11: Reconstruir `RequirementsScreen` (instalação por item + logs ao vivo)

**Files:**
- Modify: `src/renderer/src/components/RequirementsScreen.tsx`
- Test: `src/renderer/src/components/RequirementsScreen.test.tsx`

**Interfaces:**
- Consumes: `window.api.checkRequirements/checkRequirement/installRequirement/onInstallLog/runRequirementAction/platform`; `Card*`, `Button`, `Badge`, `Alert*`, `ScrollArea` de `@/components/ui/*`.
- Produces: `RequirementsScreen({ onNext }: { onNext: () => void })`.

- [ ] **Step 1: Write the failing test**

`src/renderer/src/components/RequirementsScreen.test.tsx`:
```tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RequirementsScreen } from './RequirementsScreen'

beforeEach(() => {
  window.api = {
    checkRequirements: vi.fn().mockResolvedValue([
      { name: 'Git', status: 'ok', installed: true, version: 'git 2.40' },
      { name: 'Docker', status: 'missing', installed: false }
    ]),
    checkRequirement: vi.fn().mockResolvedValue({ name: 'Docker', status: 'ok', installed: true }),
    installRequirement: vi.fn().mockResolvedValue({ status: 'success' }),
    onInstallLog: vi.fn(),
    runRequirementAction: vi.fn().mockResolvedValue(true),
    platform: 'win32'
  } as unknown as Window['api']
})

describe('RequirementsScreen', () => {
  it('lists requirements after checking', async () => {
    render(<RequirementsScreen onNext={vi.fn()} />)
    expect(await screen.findByText('Git')).toBeDefined()
    expect(screen.getByText('Docker')).toBeDefined()
  })

  it('installs a missing requirement when its Instalar button is clicked', async () => {
    render(<RequirementsScreen onNext={vi.fn()} />)
    const installBtn = await screen.findByRole('button', { name: /instalar/i })
    fireEvent.click(installBtn)
    await waitFor(() => {
      expect(window.api.installRequirement).toHaveBeenCalledWith('Docker', { elevated: false })
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/src/components/RequirementsScreen.test.tsx`
Expected: FAIL — assinaturas antigas / botão por item não existe.

- [ ] **Step 3: Write minimal implementation**

Substitua todo o conteúdo de `src/renderer/src/components/RequirementsScreen.tsx`:
```tsx
import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronDown } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'

interface RequirementResult {
  name: string
  status: 'ok' | 'missing' | 'needs-action'
  installed: boolean
  version?: string
  message?: string
  actionId?: string
  actionLabel?: string
}

interface InstallResult {
  status: 'success' | 'error' | 'needs-action'
  message?: string
}

interface Props {
  onNext: () => void
}

export function RequirementsScreen({ onNext }: Props) {
  const [reqs, setReqs] = useState<RequirementResult[]>([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState<Record<string, boolean>>({})
  const [logs, setLogs] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const logsRef = useRef<Record<string, string>>({})

  useEffect(() => {
    window.api.onInstallLog(({ name, chunk }) => {
      logsRef.current[name] = (logsRef.current[name] ?? '') + chunk
      setLogs({ ...logsRef.current })
    })
  }, [])

  useEffect(() => {
    window.api.checkRequirements().then((results) => {
      setReqs(results)
      setLoading(false)
    })
  }, [])

  const updateReq = (next: RequirementResult): void => {
    setReqs((prev) => prev.map((r) => (r.name === next.name ? next : r)))
  }

  const handleInstall = async (name: string, elevated = false): Promise<void> => {
    setErrors((prev) => ({ ...prev, [name]: '' }))
    logsRef.current[name] = ''
    setLogs({ ...logsRef.current })
    setExpanded((prev) => ({ ...prev, [name]: true }))
    setInstalling((prev) => ({ ...prev, [name]: true }))

    const result: InstallResult = await window.api.installRequirement(name, { elevated })
    if (result.status === 'error' && result.message) {
      setErrors((prev) => ({ ...prev, [name]: result.message as string }))
    }
    const rechecked = await window.api.checkRequirement(name)
    updateReq(rechecked)
    setInstalling((prev) => ({ ...prev, [name]: false }))
  }

  const handleAction = async (req: RequirementResult): Promise<void> => {
    if (!req.actionId) return
    setInstalling((prev) => ({ ...prev, [req.name]: true }))
    await window.api.runRequirementAction(req.actionId)
    await new Promise((r) => setTimeout(r, 1500))
    const rechecked = await window.api.checkRequirement(req.name)
    updateReq(rechecked)
    setInstalling((prev) => ({ ...prev, [req.name]: false }))
  }

  const allMet = reqs.length > 0 && reqs.every((r) => r.status === 'ok')
  const isWindows = window.api.platform === 'win32'

  const renderBadge = (req: RequirementResult, busy: boolean): React.ReactNode => {
    if (busy) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Instalando
        </Badge>
      )
    }
    if (req.status === 'ok') {
      return (
        <Badge className="gap-1 bg-success text-success-foreground">
          <CheckCircle2 className="h-3 w-3" /> Instalado
        </Badge>
      )
    }
    if (req.status === 'needs-action') {
      return (
        <Badge className="gap-1 bg-warning text-warning-foreground">
          <AlertTriangle className="h-3 w-3" /> Ação necessária
        </Badge>
      )
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" /> Faltando
      </Badge>
    )
  }

  return (
    <Card className="w-full max-w-2xl border-border bg-card/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Requisitos do Sistema</CardTitle>
        <CardDescription>Verificando as dependências necessárias para o ambiente.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Verificando seu sistema...</p>
        ) : (
          <ul className="space-y-3">
            {reqs.map((req) => {
              const busy = !!installing[req.name]
              const err = errors[req.name]
              return (
                <li key={req.name} className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="font-medium text-foreground">{req.name}</span>
                      {req.version && (
                        <span className="ml-2 text-sm text-muted-foreground">{req.version}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {renderBadge(req, busy)}
                      {!busy && req.status === 'missing' && (
                        <Button size="sm" onClick={() => handleInstall(req.name)}>
                          Instalar
                        </Button>
                      )}
                      {!busy && req.status === 'needs-action' && req.actionLabel && (
                        <Button size="sm" onClick={() => handleAction(req)}>
                          {req.actionLabel}
                        </Button>
                      )}
                      {(logs[req.name] || busy) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setExpanded((prev) => ({ ...prev, [req.name]: !prev[req.name] }))
                          }
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${expanded[req.name] ? 'rotate-180' : ''}`}
                          />
                        </Button>
                      )}
                    </div>
                  </div>

                  {req.status === 'needs-action' && req.message && (
                    <Alert className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{req.message}</AlertDescription>
                    </Alert>
                  )}

                  {err && (
                    <Alert variant="destructive" className="mt-3">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription className="space-y-2">
                        <p>{err}</p>
                        {isWindows && (
                          <Button size="sm" variant="outline" onClick={() => handleInstall(req.name, true)}>
                            Tentar como administrador
                          </Button>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {expanded[req.name] && logs[req.name] && (
                    <ScrollArea className="mt-3 h-40 rounded-md border border-border bg-black/60 p-3">
                      <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                        {logs[req.name]}
                      </pre>
                    </ScrollArea>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" size="lg" disabled={!allMet || loading} onClick={onNext}>
          Avançar
        </Button>
      </CardFooter>
    </Card>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/src/components/RequirementsScreen.test.tsx`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/RequirementsScreen.tsx src/renderer/src/components/RequirementsScreen.test.tsx
git commit -m "feat: per-item requirement install with live logs and guided actions"
```

---

### Task 12: Migrar `DeploymentScreen` para shadcn + scroll-area

**Files:**
- Modify: `src/renderer/src/components/DeploymentScreen.tsx`
- Modify: `src/renderer/src/components/DeploymentScreen.test.tsx`

**Interfaces:**
- Consumes: `Card*`, `Button`, `Badge`, `ScrollArea`; mantém `window.api.runInstallerStep/onLogReceived/pathExists`.
- Produces: `DeploymentScreen({ cwd }: { cwd: string })` (inalterado).

- [ ] **Step 1: Reescrever o componente preservando a lógica**

Substitua o JSX de retorno e os imports de `src/renderer/src/components/DeploymentScreen.tsx`, mantendo o array `STEPS`, os hooks e `startInstall`/`copyLogs` exatamente como estão. Topo do arquivo:
```tsx
import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
```

Substitua o bloco `return ( ... )` por:
```tsx
  return (
    <Card className="flex w-full max-w-3xl flex-col border-border bg-card/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Instalação do Hybris</CardTitle>
        <CardDescription className="flex items-center gap-2">
          Status geral: <Badge variant="secondary">{status}</Badge>
          {currentStepName && (
            <span className="text-muted-foreground">
              Etapa atual: <em>{currentStepName}</em>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={startInstall} disabled={status === 'running'}>
            {status === 'running' ? 'Instalando...' : 'Iniciar Instalação'}
          </Button>
          <Button variant="secondary" onClick={copyLogs}>
            Copiar Logs
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-black">
          <div className="flex gap-1.5 border-b border-border bg-zinc-900 px-3 py-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
          </div>
          <ScrollArea className="h-96 p-3">
            <div className="whitespace-pre-wrap font-mono text-xs text-zinc-300">
              {logs.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
```

- [ ] **Step 2: Atualizar o mock do teste**

Em `src/renderer/src/components/DeploymentScreen.test.tsx`, substitua o objeto `window.api` por (acrescentando os métodos novos para satisfazer o tipo):
```tsx
window.api = {
  runInstallerStep: vi.fn().mockResolvedValue(0),
  onLogReceived: vi.fn(),
  pathExists: vi.fn().mockResolvedValue(false),
  checkRequirements: vi.fn(),
  checkRequirement: vi.fn(),
  installRequirement: vi.fn(),
  onInstallLog: vi.fn(),
  runRequirementAction: vi.fn(),
  loginAzure: vi.fn(),
  selectDirectory: vi.fn(),
  platform: 'win32'
} as unknown as Window['api']
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npm test -- src/renderer/src/components/DeploymentScreen.test.tsx`
Expected: PASS (2 testes — botão "Iniciar Instalação" e chamada de `runInstallerStep`).

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/DeploymentScreen.tsx src/renderer/src/components/DeploymentScreen.test.tsx
git commit -m "style: migrate DeploymentScreen terminal to shadcn scroll-area"
```

---

### Task 13: Remover CSS legado e validação final

**Files:**
- Modify: `src/renderer/src/assets/main.css`
- Modify: `src/renderer/src/assets/base.css`

- [ ] **Step 1: Remover blocos legados do `main.css`**

Em `src/renderer/src/assets/main.css`, remova tudo a partir do bloco `code { ... }` até o final do arquivo (inclui `.logo`, `.creator`, `.text`, `.react`, `.ts`, `.actions`, `.action`, `.versions`, os `@media`, `.app-container`, `.card`, `.card-title`, `.card-subtitle`, `.btn-primary`, `@keyframes fadeIn`, `.terminal-*`, `.dot-*`). Mantenha apenas: o `@import "tailwindcss"`, o `@theme`, os dois `@layer base`, o `@import './base.css'` e o `body { ... }` (refinado na Task 5).

- [ ] **Step 2: Limpar variáveis `--darvin-*` não usadas do `base.css`**

Em `src/renderer/src/assets/base.css`, remova o segundo bloco `:root` inteiro (linhas com `--color-background`, `--darvin-*`). Mantenha o primeiro `:root` (`--ev-c-*`), o reset (`*`, `ul`) e o `body { ... }` com o font-family Inter (ajuste `color`/`background` do body do base.css para não conflitar — remova as linhas `color: var(--darvin-text-main);` e `background: var(--darvin-bg);` do `body` do base.css, já que a cor/bg agora vêm dos tokens em main.css).

- [ ] **Step 3: Garantir que nada referencia classes/vars removidas**

Run: `npx grep -rn "darvin-\|app-container\|btn-primary\|terminal-wrapper" src/renderer/src` (ou use a busca do editor)
Expected: nenhum resultado em arquivos `.tsx`. Se houver, é resíduo de migração — corrija.

- [ ] **Step 4: Validação final completa**

Run: `npm run typecheck`
Expected: PASS.

Run: `npm test`
Expected: PASS (todos os testes).

Run: `npm run lint`
Expected: PASS (sem erros).

Run: `npm run build`
Expected: build conclui sem erro.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/assets/main.css src/renderer/src/assets/base.css
git commit -m "chore: remove legacy CSS after shadcn migration"
```

---

## Self-Review

**1. Spec coverage:**
- Visual dark sóbrio + accent contido → Task 5 (tokens). ✔
- Migração de todas as telas para Tailwind/shadcn → Login (T9), Config (T10), Requirements (T11), Deployment (T12); limpeza (T13). ✔
- Wizard/stepper persistente + Login como gate → Tasks 7 e 8. ✔
- Instalação por item + logs ao vivo → Tasks 3 (streaming), 4 (IPC `install-log`), 11 (UI). ✔
- Detectar e guiar (Docker daemon, "Abrir Docker Desktop") → Tasks 1, 2, 4, 11. ✔
- Elevação no Windows → Task 3 (`installElevatedWindows`) + 11 ("Tentar como administrador"). ✔
- macOS sudo askpass mantido → Task 3. ✔
- `checkRequirement` por item → Task 2. ✔
- Validar IDs de pacote winget/brew → nota na Task 3. ✔
- Testes atualizados (requirements, installer, executor, componentes) → Tasks 2, 3, 7, 8, 11, 12. `executor.ts` não muda, logo seu teste permanece válido (sem alteração necessária). ✔
- Fora de escopo (comandos de deploy, auth) → respeitado. ✔

**2. Placeholder scan:** Sem "TBD/TODO"; todo passo de código traz o código completo; comandos com saída esperada. ✔

**3. Type consistency:** `RequirementResult`/`InstallResult` definidos identicamente em `requirements.ts`, `installer.ts`, `preload/index.d.ts` e nos componentes; `installRequirement(name, { elevated }, onLog)` consistente entre main/preload/UI; `onInstallLog` payload `{ name, chunk }` consistente entre IPC e UI; `actionId: 'open-docker'` consistente entre `requirements.ts` e o handler `run-requirement-action`. ✔
