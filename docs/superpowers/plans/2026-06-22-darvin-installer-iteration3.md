# Darvin Installer - Iteration 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the actual Azure login functionality using the Azure CLI (`az login`).

**Architecture:** 
- `src/main/auth.ts` uses `child_process.exec` to run `az login` which opens the system browser.
- `src/main/requirements.ts` adds `az --version` to ensure the Azure CLI is available.

## Global Constraints
- Tests must be written for all logic.
- Frequent commits.

---

### Task 1: Add Azure CLI Requirement

**Files:**
- Modify: `src/main/requirements.ts`
- Modify: `src/main/requirements.test.ts`

- [ ] **Step 1: Write failing test**
Update `src/main/requirements.test.ts` to expect 5 items, and include 'Azure CLI' in the names array.

- [ ] **Step 2: Verify test fails**
Run: `npm run test`

- [ ] **Step 3: Update implementation**
Modify `src/main/requirements.ts`: Add `checkCommand('Azure CLI', 'az --version')` to the `checks` array.

- [ ] **Step 4: Verify test passes**
Run: `npm run test`

- [ ] **Step 5: Commit**
```bash
git add src/main/requirements.ts src/main/requirements.test.ts
git commit -m "feat: add azure cli to requirements checker"
```

---

### Task 2: Implement Azure CLI Auth

**Files:**
- Modify: `src/main/auth.ts`
- Create: `src/main/auth.test.ts`

- [ ] **Step 1: Write failing test**
Create `src/main/auth.test.ts`: mock `child_process.exec` and test that `loginAzure()` returns true on success, false on error.

- [ ] **Step 2: Verify test fails**
Run: `npm run test`

- [ ] **Step 3: Update implementation**
Modify `src/main/auth.ts`: 
```typescript
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function loginAzure(): Promise<boolean> {
  try {
    await execAsync('az login')
    return true
  } catch (error) {
    console.error('Azure login failed:', error)
    return false
  }
}
```

- [ ] **Step 4: Verify test passes**
Run: `npm run test`

- [ ] **Step 5: Commit**
```bash
git add src/main/auth.ts src/main/auth.test.ts
git commit -m "feat: implement azure cli login"
```
