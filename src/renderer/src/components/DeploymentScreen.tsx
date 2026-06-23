import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEffect, useRef, useState } from 'react'

const STEPS = [
   {
      id: 'clone',
      name: 'Clonando Repositório',
      command: 'git',
      args: [
         'clone',
         'https://telefonica-vivo-brasil@dev.azure.com/telefonica-vivo-brasil/ECMC%20-%20Ecomm%20Cloud%20B2C/_git/src-devops-darvin-hybris-67-dev',
         '.'
      ]
   },
   { id: 'prepare', name: 'Preparando Ambiente', command: 'task', args: ['commerce:hy67:prepare'] },
   {
      id: 'clean',
      name: 'Limpando Build Anterior',
      command: 'task',
      args: ['commerce:hy67:ant:clean:all']
   },
   {
      id: 'update',
      name: 'Atualizando Sistema',
      command: 'task',
      args: ['commerce:hy67:update:system']
   },
   { id: 'start', name: 'Iniciando Servidor', command: 'task', args: ['commerce:hy67:start'] }
]

interface Props {
   cwd: string
}

export function DeploymentScreen({ cwd }: Props) {
   const [logs, setLogs] = useState<string[]>([])
   const [status, setStatus] = useState<string>('idle')
   const [currentStepName, setCurrentStepName] = useState<string>('')
   const bottomRef = useRef<HTMLDivElement>(null)

   useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
   }, [])

   useEffect(() => {
      window.api.onLogReceived((newLog: string) => {
         setLogs((prev) => [...prev, newLog])
      })
   }, [])

   const startInstall = async () => {
      setStatus('running')
      setLogs(['--- Iniciando Deploy Automático ---'])

      const hasTaskfile = await window.api.pathExists(`${cwd}/Taskfile.yml`)

      for (const step of STEPS) {
         if (step.id === 'clone' && hasTaskfile) {
            setLogs((prev) => [
               ...prev,
               '\n>>> Repositório já clonado (Taskfile.yml encontrado), pulando clone.'
            ])
            continue
         }

         setCurrentStepName(step.name)
         setLogs((prev) => [
            ...prev,
            `\n>>> Executando: ${step.name} (${step.command} ${step.args.join(' ')})`
         ])

         const code = await window.api.runInstallerStep(step.command, step.args, cwd)

         if (code !== 0) {
            setStatus('failed')
            setLogs((prev) => [
               ...prev,
               `\n[ERRO] O passo "${step.name}" falhou com código ${code}. Instalação abortada.`
            ])
            setCurrentStepName('')
            return
         }
      }

      setStatus('success')
      setCurrentStepName('')
      setLogs((prev) => [...prev, '\n✅ Instalação concluída com sucesso!'])
   }

   const copyLogs = () => {
      navigator.clipboard.writeText(logs.join('\n'))
   }

   return (
      <div className="flex w-full h-full flex-col gap-4">
         <div className="flex flex-col gap-2">
            <span className="text-2xl font-bold">Instalação do Hybris</span>
            <span className="text-sm text-muted-foreground">
               Status geral: <Badge variant="secondary">{status}</Badge>
               {currentStepName && (
                  <span className="text-muted-foreground">
                     Etapa atual: <em>{currentStepName}</em>
                  </span>
               )}
            </span>
         </div>

         <div className="flex gap-2">
            <Button onClick={startInstall} disabled={status === 'running'}>
               {status === 'running' ? 'Instalando...' : 'Iniciar Instalação'}
            </Button>
            <Button variant="secondary" onClick={copyLogs}>
               Copiar Logs
            </Button>
         </div>

         <div className="overflow-hidden rounded-lg border border-border bg-black">
            <ScrollArea className="h-[calc(100vh-200px)] p-3">
               <div className="whitespace-pre-wrap font-mono text-xs text-zinc-300">
                  {logs.map((log) => (
                     <div key={log}>{log}</div>
                  ))}
                  <div ref={bottomRef} />
               </div>
            </ScrollArea>
         </div>
      </div>
   )
}
