import { useState } from 'react'
import { Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

interface Props {
  onNext: (path: string) => void
}

export function ConfigScreen({ onNext }: Props) {
  const [selectedPath, setSelectedPath] = useState<string>('')

  const handleSelect = async (): Promise<void> => {
    const path = await window.api.selectDirectory()
    if (path) setSelectedPath(path)
  }

  return (
    <Card className="w-full max-w-2xl border-border bg-card/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Diretório de Instalação</CardTitle>
        <CardDescription>Selecione uma pasta vazia onde o projeto será clonado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="secondary" onClick={handleSelect}>
          Escolher Pasta
        </Button>
        {selectedPath && (
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="mb-2 text-sm text-muted-foreground">Pasta selecionada:</p>
            <div className="flex items-center gap-2 break-all rounded-md bg-background/60 p-3 font-mono text-sm">
              <Folder className="h-4 w-4 shrink-0 text-primary" />
              {selectedPath}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" size="lg" disabled={!selectedPath} onClick={() => onNext(selectedPath)}>
          Avançar
        </Button>
      </CardFooter>
    </Card>
  )
}
