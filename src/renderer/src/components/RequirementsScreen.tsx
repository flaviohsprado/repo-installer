import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

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
   const [refreshing, setRefreshing] = useState(false)
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

   // No macOS, logo após instalar, o binário pode demorar a aparecer (PATH/cache,
   // app ainda sendo copiado). Re-checa algumas vezes antes de desistir.
   const recheckWithRetry = async (name: string): Promise<RequirementResult> => {
      let result = await window.api.checkRequirement(name)
      for (let attempt = 0; attempt < 3 && result.status !== 'ok'; attempt++) {
         await new Promise((r) => setTimeout(r, 1500))
         result = await window.api.checkRequirement(name)
      }
      return result
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
      const rechecked = await recheckWithRetry(name)
      updateReq(rechecked)
      setInstalling((prev) => ({ ...prev, [name]: false }))
   }

   const handleAction = async (req: RequirementResult): Promise<void> => {
      if (!req.actionId) return
      setInstalling((prev) => ({ ...prev, [req.name]: true }))
      await window.api.runRequirementAction(req.actionId)
      const rechecked = await recheckWithRetry(req.name)
      updateReq(rechecked)
      setInstalling((prev) => ({ ...prev, [req.name]: false }))
   }

   // Re-verifica todas as dependências do zero. Saída de emergência caso algum
   // refetch por item não tenha detectado o estado real.
   const handleRefresh = async (): Promise<void> => {
      setRefreshing(true)
      const results = await window.api.checkRequirements()
      setReqs(results)
      setRefreshing(false)
   }

   const allMet = reqs.length > 0 && reqs.every((r) => r.status === 'ok')
   const isWindows = window.api.platform === 'win32'

   const renderBadge = (req: RequirementResult, busy: boolean): ReactNode => {
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
      <div className="flex w-full max-w-2xl flex-col gap-4">
         <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
               <span className="text-2xl font-bold">Requisitos do Sistema</span>
               <span className="text-sm text-muted-foreground">
                  Verificando as dependências necessárias para o ambiente.
               </span>
            </div>
            <Button
               size="sm"
               variant="outline"
               className="gap-2"
               onClick={handleRefresh}
               disabled={loading || refreshing}
            >
               <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
               Atualizar
            </Button>
         </div>

         <div>
            {loading ? (
               <p className="py-8 text-center text-muted-foreground">Verificando seu sistema...</p>
            ) : (
               <ul className="w-full flex flex-col gap-4">
                  {reqs.map((req) => {
                     const busy = !!installing[req.name]
                     const err = errors[req.name]
                     return (
                        <li
                           key={req.name}
                           className="rounded-xl border border-border bg-background/40 p-4"
                        >
                           <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0 flex items-center gap-4">
                                 <span className="font-medium text-foreground">{req.name}</span>
                                 {req.version && (
                                    <span className="ml-2 text-sm text-muted-foreground">
                                       {req.version}
                                    </span>
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
                                          setExpanded((prev) => ({
                                             ...prev,
                                             [req.name]: !prev[req.name]
                                          }))
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
                                       <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleInstall(req.name, true)}
                                       >
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
         </div>

         <Button className="w-full" size="lg" disabled={!allMet || loading} onClick={onNext}>
            Avançar
         </Button>
      </div>
   )
}
