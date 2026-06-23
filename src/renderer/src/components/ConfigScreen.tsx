import { Button } from '@/components/ui/button'
import { Folder } from 'lucide-react'
import { useState } from 'react'

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
      <div className="flex w-full max-w-2xl flex-col gap-4">
         <div className="flex flex-col gap-2">
            <span className="text-2xl font-bold">Diretório de Instalação</span>
            <span className="text-sm text-muted-foreground">
               Selecione uma pasta vazia onde o projeto será clonado.
            </span>
         </div>

         <div className="flex flex-col gap-2">
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
         </div>

         <Button
            className="w-full"
            size="lg"
            disabled={!selectedPath}
            onClick={() => onNext(selectedPath)}
         >
            Avançar
         </Button>
      </div>
   )
}
