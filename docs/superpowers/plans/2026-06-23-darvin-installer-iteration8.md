# Darvin Installer - Iteration 8 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the UI/UX with a premium dark mode, gradients, and micro-animations without altering the existing Electron logic.

**Architecture:**
- Pure CSS implementation using `base.css` and `main.css`.
- React components augmented with utility classes for layout, buttons, and animations.

## Global Constraints
- Do NOT change backend IPC logic.
- Frequent commits.

---

### Task 1: Global Styles & Theme Variables

**Files:**
- Modify: `src/renderer/src/assets/base.css`
- Modify: `src/renderer/src/assets/main.css`

- [ ] **Step 1: CSS Variables in base.css**
Modify `base.css` to add Darvin theme variables:
```css
:root {
  --darvin-bg: #0f172a;
  --darvin-card-bg: rgba(30, 41, 59, 0.7);
  --darvin-card-border: rgba(255, 255, 255, 0.1);
  --darvin-gradient: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  --darvin-gradient-hover: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  --darvin-text-main: #f8fafc;
  --darvin-text-muted: #94a3b8;
  --darvin-success: #10b981;
  --darvin-error: #ef4444;
}

body {
  background: var(--darvin-bg);
  color: var(--darvin-text-main);
  /* keep font family */
}
```

- [ ] **Step 2: Utility Classes in main.css**
Append to `main.css`:
```css
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-image: radial-gradient(circle at 50% -20%, #312e81 0%, transparent 50%);
}

.card {
  background: var(--darvin-card-bg);
  border: 1px solid var(--darvin-card-border);
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  animation: fadeIn 0.4s ease-out forwards;
}

.card-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: var(--darvin-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.card-subtitle {
  color: var(--darvin-text-muted);
  margin-bottom: 2rem;
}

.btn-primary {
  background: var(--darvin-gradient);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  margin-top: 1rem;
}

.btn-primary:hover {
  background: var(--darvin-gradient-hover);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Mac Console style */
.terminal-wrapper {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
}

.terminal-header {
  background: #1e1e1e;
  padding: 8px 12px;
  display: flex;
  gap: 6px;
  border-bottom: 1px solid #333;
}

.terminal-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.dot-red { background: #ff5f56; }
.dot-yellow { background: #ffbd2e; }
.dot-green { background: #27c93f; }
```

- [ ] **Step 3: Commit**
```bash
git add src/renderer/src/assets/base.css src/renderer/src/assets/main.css
git commit -m "style: add global theme variables and utility classes"
```

---

### Task 2: Login & Config Screens Polish

**Files:**
- Modify: `src/renderer/src/components/LoginScreen.tsx`
- Modify: `src/renderer/src/components/ConfigScreen.tsx`

- [ ] **Step 1: Polish LoginScreen**
Wrap the component in `<div className="app-container">` and `<div className="card">`. Use `.card-title`, `.card-subtitle`, and `.btn-primary`.

- [ ] **Step 2: Polish ConfigScreen**
Wrap in `.app-container` and `.card`. Add an icon or styled box to show the selected path with a muted background.

- [ ] **Step 3: Commit**
```bash
git add src/renderer/src/components/LoginScreen.tsx src/renderer/src/components/ConfigScreen.tsx
git commit -m "style: apply premium styles to login and config screens"
```

---

### Task 3: Requirements & Deployment Screens Polish

**Files:**
- Modify: `src/renderer/src/components/RequirementsScreen.tsx`
- Modify: `src/renderer/src/components/DeploymentScreen.tsx`

- [ ] **Step 1: Polish RequirementsScreen**
Wrap in `.app-container` and `.card`. Style the requirements list item by item with flexbox, aligning the checkmark/cross to the right.

- [ ] **Step 2: Polish DeploymentScreen**
Wrap in `.app-container` and `.card`. 
Add `.terminal-wrapper` and `.terminal-header` around the existing terminal `div`. 
Style the terminal `div` to remove its existing inline `marginTop` and `borderRadius` since the wrapper handles it.

- [ ] **Step 3: Commit**
```bash
git add src/renderer/src/components/RequirementsScreen.tsx src/renderer/src/components/DeploymentScreen.tsx
git commit -m "style: apply premium styles to requirements and deployment screens"
```
