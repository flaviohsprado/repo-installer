# Roteiro de teste manual — verificação e instalação de dependências

**Objetivo:** validar, de verdade, que o Darvin Installer detecta e instala as
dependências faltantes (Git, Java 1.8, Docker, Taskfile, Azure CLI) numa máquina
**limpa**, nos dois sistemas. Os testes automatizados usam mocks e **não** cobrem isto.

> ⚠️ **Regra de ouro:** teste sempre o **app empacotado** (instalado a partir do
> `.exe`/`.dmg`), **não** o `npm run dev`. Rodando via `npm run dev` o app herda o PATH
> do terminal e mascara justamente o bug de PATH que mais quebra no mundo real (macOS).

## Como gerar o app para teste

| SO | Comando | Artefato |
|----|---------|----------|
| Windows | `npm run build:win` | `dist/darvin-installer-1.0.0-setup.exe` |
| macOS | `npm run build:mac` (numa máquina Apple) | `dist/darvin-installer-1.0.0.dmg` |

Instale a partir do artefato e abra o app **pelo Menu Iniciar / Launchpad / Finder**
(não pelo terminal) — é assim que o usuário final abre.

## Preparar a máquina "limpa"

Não precisa formatar. Basta **remover ou esconder** as dependências que quer testar:

- **Windows:** desinstale via "Aplicativos e Recursos" ou `winget uninstall <id>`.
- **macOS:** `brew uninstall --cask zulu@8`, `brew uninstall git`, etc. Para Docker,
  basta **não** ter o Docker Desktop instalado (ou tê-lo instalado mas **parado**, para
  testar o caminho "Ação necessária").

Dá para testar uma dependência por vez — não precisa zerar todas de uma vez.

## Matriz de testes

Para **cada** dependência faltante, na tela "Requisitos do Sistema":

| # | Passo | Resultado esperado |
|---|-------|--------------------|
| 1 | Abrir o app e logar | A tela de Requisitos lista as 5 dependências com badges |
| 2 | Conferir o badge da dep ausente | `Faltando` (vermelho) e um botão **Instalar** |
| 3 | Clicar em **Instalar** | Badge vira `Instalando` (spinner); o log ao vivo expande e mostra a saída do `brew`/`winget` em tempo real |
| 4 | Aguardar concluir | Badge vira `Instalado` (verde) **sem precisar clicar em nada** |
| 5 | Repetir até todas verdes | O botão **Avançar** habilita só quando **todas** estão `Instalado` |

### Casos específicos do macOS

- [ ] **PATH:** com o app **empacotado** (aberto pelo Launchpad), a verificação inicial
  encontra `brew`/`task`/`az`/`docker`? Se aparecer tudo como `Faltando` mesmo estando
  instalado, o `fixPath()` falhou — capture o log.
- [ ] **Senha (cask):** ao instalar Java (`zulu@8`) ou Docker (casks que pedem sudo),
  **aparece o diálogo pedindo a senha do Mac**? Digite e confirme que a instalação segue.
  Se o diálogo **não** aparecer e o cask travar, anote qual cask e a saída do log.
- [ ] **Re-check pós-install:** após o cask instalar, a badge fica verde **sozinha** em
  poucos segundos (o re-check tem retry de até ~4,5s)? Se ficar `Faltando` mesmo após
  instalar, use o botão **Atualizar** e veja se corrige.

### Casos específicos do Windows

- [ ] **winget sem admin:** a instalação roda direto com logs ao vivo? (caso comum)
- [ ] **Falha de permissão:** se o `winget` falhar por exigir admin, aparece o alerta de
  erro **com o botão "Tentar como administrador"**? Ao clicar, o **UAC** aparece?
  Confirmando o UAC, a instalação completa e a badge vira verde após o re-check?
- [ ] **UAC cancelado:** se você **cancelar** o UAC, o app não trava e a badge continua
  `Faltando` (o re-check detecta que não instalou)?

### Caso especial do Docker (ambos os SOs)

- [ ] Com Docker **instalado mas o daemon parado**, a badge mostra `Ação necessária`
  (amarelo) + alerta "daemon não está em execução" + botão **Abrir Docker Desktop**.
- [ ] Clicar em **Abrir Docker Desktop** abre o app. Após o daemon subir, a badge vira
  `Instalado` (o re-check roda automático; se demorar, use **Atualizar**).

### Botão "Atualizar"

- [ ] A qualquer momento, clicar em **Atualizar** (canto superior direito) re-verifica
  **todas** as dependências do zero e o ícone gira enquanto carrega.

## Critério de aprovação

O teste passa quando, numa máquina limpa, é possível sair de "tudo faltando" até o botão
**Avançar** habilitado **só clicando** dentro do app — sem abrir terminal — nos dois SOs,
com a única exceção legítima sendo: digitar a senha no Mac e confirmar o UAC no Windows.

## Como reportar uma falha

Para cada falha, registre: **SO + versão**, **dependência**, **passo da matriz**, o
**texto do log ao vivo** (botão expandir na linha da dep) e o comportamento observado vs.
esperado. Em macOS Apple Silicon, anote também se o `brew` está em `/opt/homebrew`.
