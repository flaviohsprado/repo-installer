import { execSync } from 'node:child_process'

// Caminhos onde Homebrew (Intel e Apple Silicon) e ferramentas de sistema vivem.
// Servem de fallback caso a consulta ao shell de login falhe.
const UNIX_FALLBACK_PATHS = [
   '/opt/homebrew/bin',
   '/opt/homebrew/sbin',
   '/usr/local/bin',
   '/usr/local/sbin',
   '/usr/bin',
   '/bin',
   '/usr/sbin',
   '/sbin'
]

export function mergePaths(shellPath: string, currentPath: string, fallbacks: string[]): string {
   const parts = [...shellPath.split(':'), ...currentPath.split(':'), ...fallbacks].filter(Boolean)
   return [...new Set(parts)].join(':')
}

function resolveShellPath(): string {
   try {
      const shell = process.env.SHELL || '/bin/zsh'
      return execSync(`${shell} -lc 'echo -n "$PATH"'`, {
         encoding: 'utf8',
         timeout: 5000
      }).trim()
   } catch {
      return ''
   }
}

/**
 * Apps GUI no macOS/Linux não herdam o PATH do shell de login quando abertos
 * pelo Finder/Dock. Sem isso, comandos como `brew`, `task`, `az` e `docker` não
 * são encontrados (e a instalação/verificação de dependências quebra).
 *
 * Resolve o PATH real do shell e o injeta em process.env. No Windows é no-op,
 * pois o PATH já vem completo para processos GUI.
 */
export function fixPath(): void {
   if (process.platform === 'win32') return
   process.env.PATH = mergePaths(resolveShellPath(), process.env.PATH ?? '', UNIX_FALLBACK_PATHS)
}
