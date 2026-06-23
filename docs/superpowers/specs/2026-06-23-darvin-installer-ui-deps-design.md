# Darvin Installer — Repaginada visual + dependências robustas

**Data:** 2026-06-23
**Status:** Aprovado (design), aguardando plano de implementação

## Contexto

O Darvin Installer é um app Electron (React 19 + TypeScript + electron-vite) que
funciona como uma interface melhor para instalar o ambiente SAP Commerce (Hybris).
O fluxo tem 4 telas: Login (Azure) → Requisitos → Pasta de instalação → Deploy.

Estado atual:

- Tailwind v4 + shadcn estão configurados, mas **só a tela de Requisitos** usa esse
  stack. Login, Config e Deployment ainda usam CSS legado em `main.css`
  (`.app-container`, `.card`, `.btn-primary`, `.terminal-*`).
- A verificação de dependências (`src/main/requirements.ts`) checa: Git, Java 1.8,
  Docker, Taskfile, Azure CLI.
- A instalação (`src/main/installer.ts`) usa `brew` no macOS e `winget` no Windows,
  via `execAsync` (bloqueante, **sem logs em tempo real**).
- O deploy (`src/main/executor.ts`) já transmite logs ao vivo via `spawn` + streaming.

## Objetivos

1. **Visual:** terminar a migração de todas as telas para Tailwind/shadcn, num
   visual dark **refinado e sóbrio** ("enterprise"), com estrutura de wizard e
   indicador de etapas.
2. **Dependências:** tornar a verificação e instalação robustas e transparentes, de
   forma que dependências faltantes sejam instaláveis "só clicando", com tratamento
   claro dos casos que exigem ação manual.

Plataformas-alvo: **Windows e macOS** (ambos de primeira classe).

## Decisões de design

| Tema | Decisão |
|------|---------|
| Direção visual | Dark refinado e sóbrio (menos indigo saturado, accent único contido) |
| Estrutura | Wizard com **stepper persistente** |
| Posição do Login | **Porta de entrada** (tela cheia, branded); stepper envolve as 3 etapas seguintes |
| UX de instalação | **Por item** (botão individual) + **logs ao vivo** por dependência |
| Casos especiais | **Detectar e guiar** (ex: Docker instalado mas daemon parado → botão "Abrir Docker Desktop") |

## Arquitetura

### Frontend (renderer)

- **`WizardShell`** — casco persistente com stepper lateral (etapas: Requisitos,
  Pasta, Deploy) mostrando estado concluída/atual/pendente. `App.tsx` ergue o estado
  do passo e renderiza: `LoginScreen` (gate) quando não autenticado; caso contrário
  o `WizardShell` com a tela do passo atual.
- **`LoginScreen`** — tela cheia branded, fora do stepper.
- **Sistema de tokens** — refinar as variáveis `oklch` em `main.css`: dark neutro,
  um accent contido (azul/teal apagado), bordas/raios/sombras/tipografia
  padronizados. Glassmorphism mais sutil. Remover CSS legado conforme migração.

### Componentes shadcn a adicionar

`badge`, `progress`, `scroll-area`, `alert`, `separator` (hoje só existem `button` e
`card`), via shadcn padrão.

### Tela de Requisitos — máquina de estados por item

Cada dependência é uma linha com nome, versão, **badge de status**, **botão "Instalar"
individual** e **log ao vivo expansível**. Estados por requisito:

- `checking` — verificando
- `ok` — instalado e adequado
- `missing` — faltando
- `installing` — instalando (com logs ao vivo)
- `error` — falhou (mensagem de erro visível)
- `needs-action` — instalado mas requer passo manual (ex: Docker daemon parado)

O botão "Avançar" só habilita quando todos estão `ok`.

### Backend (processo main)

- **`installRequirement(name, onLog)`** — refatorado para usar `spawn` + streaming
  (mesma infra do `executor.ts`), emitindo logs por IPC com `tag` do requisito.
  Retorno **estruturado**: `{ status: 'success' | 'error' | 'needs-action', message?: string }`.
- **`checkRequirement(name)`** — re-checagem de **um** item após instalar (em vez de
  re-checar todos).
- **Detecção "instalar e guiar":**
  - **Docker:** distinguir *instalado* (`docker --version`) de *daemon rodando*
    (`docker info`). Instalado mas parado → `needs-action` + ação "Abrir Docker Desktop".
  - **Windows/admin:** detectar quando o `winget` precisa de elevação; oferecer
    relançar elevado (UAC). macOS mantém o `sudo askpass` existente.
  - **Validar IDs de pacote** atuais (`ojdkbuild.openjdk.8`, `zulu@8`, `GoTask.GoTask`,
    etc.) contra winget/brew; corrigir os desatualizados.
- **Java 1.8** — checagem robusta nos dois SOs (manter `java_home -v 1.8` no macOS).

### IPC / preload

Novos/atualizados métodos: `installRequirement` (com callback de log),
`checkRequirement(name)`, `openExternalApp` (abrir Docker), `onInstallLog`,
`isElevated` / `relaunchElevated` (Windows).

### Migração das telas restantes

Reescrever `LoginScreen`, `ConfigScreen` e `DeploymentScreen` em Tailwind/shadcn no
novo sistema visual. O terminal do Deployment mantém a estética (dots do macOS) porém
via Tailwind + `scroll-area`.

## Fluxo de dados (instalação de um item)

1. Usuário clica "Instalar" na linha da dependência → estado `installing`.
2. Renderer chama `installRequirement(name)`; main faz `spawn` do comando
   (`brew`/`winget`) e transmite stdout/stderr via `onInstallLog` (tagged).
3. Renderer anexa os logs ao painel daquele item em tempo real.
4. Ao concluir, main retorna resultado estruturado.
5. Renderer chama `checkRequirement(name)` e atualiza o badge para `ok`,
   `error` ou `needs-action`.
6. Em `needs-action`, exibe `alert` com a ação (ex: botão "Abrir Docker Desktop").

## Tratamento de erros

- Falha de instalação → estado `error` com a mensagem de erro do processo visível no
  log do item; o usuário pode tentar de novo.
- Permissão/elevação (Windows) → detectar e oferecer relançar elevado.
- Daemon do Docker parado → `needs-action`, não `error`.

## Testes

- Atualizar testes vitest existentes (`requirements`, `installer`, `executor`) para o
  retorno estruturado.
- Adicionar cobertura da nova detecção: daemon do Docker, estados `needs-action`,
  re-checagem por item.
- Testes de componente (testing-library) para os estados da tela de Requisitos.

## Fora de escopo (YAGNI)

- Sem novas etapas no wizard.
- Sem alterar os comandos de deploy em si (`task commerce:hy67:*`).
- Sem mudar a lógica de autenticação além do visual.
