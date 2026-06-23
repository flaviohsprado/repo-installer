import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Requirement {
  name: string;
  installed: boolean;
  version?: string;
}

interface Props {
  onNext: () => void;
}

export function RequirementsScreen({ onNext }: Props) {
  const [reqs, setReqs] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState(false)
  const [installingName, setInstallingName] = useState('')

  const handleInstallMissing = async () => {
    setInstalling(true)
    const missing = reqs.filter(r => !r.installed)
    for (const req of missing) {
      setInstallingName(req.name)
      await window.api.installRequirement(req.name)
    }
    setInstallingName('')
    // Delay for macOS cache
    await new Promise(r => setTimeout(r, 2000))
    // Re-check
    setLoading(true)
    const results = await window.api.checkRequirements()
    setReqs(results)
    setLoading(false)
    setInstalling(false)
  }

  useEffect(() => {
    window.api.checkRequirements().then(results => {
      setReqs(results)
      setLoading(false)
    })
  }, [])

  const allMet = reqs.length > 0 && reqs.every(r => r.installed)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-950 via-background to-background">
      <Card className="w-full max-w-2xl border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl text-indigo-400">Requisitos do Sistema</CardTitle>
          <CardDescription className="text-base text-indigo-200/60">Verificando dependências necessárias</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Verificando seu sistema...</p>
          ) : (
            <ul className="space-y-3">
              {reqs.map(r => (
                <li key={r.name} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 transition-colors hover:bg-white/10">
                  <span className="font-medium text-foreground">{r.name} <span className="text-muted-foreground ml-2">{r.version ? `(${r.version})` : ''}</span></span>
                  <span className="text-xl">{r.installed ? '✅' : '❌'}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {!allMet && !loading && (
            <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white" onClick={handleInstallMissing} disabled={installing}>
              {installing ? `Instalando ${installingName}...` : 'Instalar Pendências'}
            </Button>
          )}
          <Button size="lg" variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white border-0" onClick={onNext} disabled={!allMet || loading || installing}>
            Avançar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
