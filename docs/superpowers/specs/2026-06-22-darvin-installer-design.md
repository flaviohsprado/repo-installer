# Darvin Installer App - Design Spec

## Goal
Build a 3-click Electron application (Darvin) to simplify the installation of a Java environment, Hybris 6.7, and SAP Commerce. The app will replace a manual, complex terminal-based process with a streamlined, error-resilient GUI.

## Architecture
The application follows an Orchestrator pattern using Electron:
- **Main Process (Node.js):** Acts as the orchestrator. It executes shell commands (`child_process.spawn`), manages the Azure OAuth login window, and stores execution state securely. It streams `stdout` and `stderr` back to the frontend.
- **Renderer Process (React + TypeScript + Vite):** Acts as the user interface, issuing high-level commands to the Main process and updating the UI based on real-time IPC events.
- **Communication (IPC):** Strictly typed IPC bridges the Main and Renderer processes (e.g., `startStep`, `onLogReceived`).

## Flow & Components

### 1. LoginScreen (Click 1)
- **UI:** Minimalist design with a "Conectar com Azure" button.
- **Behavior:** Triggers an Azure OAuth popup. Upon successful authentication, securely stores the token for future DB/script access.

### 2. RequirementsScreen (Click 2)
- **UI:** A checklist table showing required dependencies (Git 2.39+, Docker, Java JDK 8, Taskfile).
- **Behavior:** On load, silently pings the Main process to check versions (`java -version`, `git --version`, etc.). If dependencies are missing, a "Instalar Pendências" button appears to automate their installation via OS package managers (Homebrew/Winget).

### 3. DeploymentScreen (Click 3)
- **UI:** Split view. Left side: Vertical step-by-step checklist. Right side: Real-time terminal log viewer.
- **Steps:**
  1. Clone Repository (`git clone`)
  2. Prepare Database
  3. Prepare Hybris (`task commerce:hy67:prepare`)
  4. Build (`task commerce:hy67:ant:clean:all`)
  5. Update System (`task commerce:hy67:update:system`)
  6. Start Server (`task commerce:hy67:start`)
- **Error Handling:** If any step fails (non-zero exit code, e.g., "Java returned: 255"), execution halts. The UI marks the step as failed and presents a "Tentar Novamente" button for that specific step, preserving prior progress.

## Out of Scope
- Direct manual editing of Hybris configurations inside the app.
- Full IDE features; this is strictly an installation and environment setup orchestrator.
