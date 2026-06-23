import { useState, useEffect, useRef, type ReactNode } from 'react'
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
