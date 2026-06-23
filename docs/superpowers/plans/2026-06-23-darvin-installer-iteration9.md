# Darvin Installer - Iteration 9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce Java 8 (1.8) for Hybris 6.7 to avoid JVM crashes during deployment.

**Architecture:**
- `checkRequirements` in `requirements.ts` parses `java -version` output and enforces `"1.8."`.
- `executeCommand` in `executor.ts` injects `JAVA_HOME` into the `env` argument of `child_process.spawn`.

## Global Constraints
- Tests must be written/updated for all logic.
- Frequent commits.

---

### Task 1: Requirements Check Updates

**Files:**
- Modify: `src/main/requirements.ts`

- [ ] **Step 1: Update checkCommand**
Modify `src/main/requirements.ts` to parse `stderr`:
```typescript
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function checkCommand(name: string, command: string, versionCheck?: (output: string) => boolean): Promise<{ name: string; installed: boolean; version?: string }> {
  try {
    const { stdout, stderr } = await execAsync(command)
    const output = stdout.trim() || stderr.trim()
    
    if (versionCheck && !versionCheck(output)) {
      return { name, installed: false }
    }

    return { name, installed: true, version: output.split('\n')[0] }
  } catch (error) {
    return { name, installed: false }
  }
}

export async function checkRequirements() {
  const checks = [
    checkCommand('Git', 'git --version'),
    checkCommand('Java (1.8)', 'java -version', (out) => out.includes('1.8.') || out.includes('1.8.0')),
    checkCommand('Docker', 'docker --version'),
    checkCommand('Taskfile', 'task --version'),
    checkCommand('Azure CLI', 'az --version')
  ]
  return Promise.all(checks)
}
```

- [ ] **Step 2: Verify typecheck**
Run: `npm run typecheck`

- [ ] **Step 3: Commit**
```bash
git add src/main/requirements.ts
git commit -m "fix: enforce java 1.8 in requirements check"
```

---

### Task 2: Executor Java 8 Enforcement

**Files:**
- Modify: `src/main/executor.ts`

- [ ] **Step 1: Add getJavaHome helper**
Modify `src/main/executor.ts` to detect Java 8 home:
```typescript
import { spawn, exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function getJava8Home(): Promise<string | undefined> {
  if (process.platform === 'darwin') {
    try {
      const { stdout } = await execAsync('/usr/libexec/java_home -v 1.8')
      return stdout.trim()
    } catch {
      // openjdk@8 might not be symlinked, try standard brew path
      return '/usr/local/opt/openjdk@8'
    }
  }
  return undefined
}
```

- [ ] **Step 2: Update executeCommand**
```typescript
export async function executeCommand(command: string, args: string[], cwd: string | undefined, onLog: (data: string) => void): Promise<number> {
  const javaHome = await getJava8Home()
  const env = { ...process.env }
  if (javaHome) {
    env.JAVA_HOME = javaHome
  }

  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: true, cwd, env })
    
    child.stdout.on('data', (data) => onLog(data.toString()))
    child.stderr.on('data', (data) => onLog(data.toString()))
    
    child.on('close', (code) => resolve(code || 0))
  })
}
```

- [ ] **Step 3: Verify tests**
Run: `npm run test`

- [ ] **Step 4: Commit**
```bash
git add src/main/executor.ts
git commit -m "fix: inject JAVA_HOME for Java 8 into command executor"
```
