import type { ReactNode } from 'react'
import { SapIcon } from './icons/sap'
import { Stepper, type WizardStepDef } from './Stepper'

const STEPS: WizardStepDef[] = [
   { id: 'requirements', label: 'Requisitos' },
   { id: 'config', label: 'Pasta' },
   { id: 'deploy', label: 'Deploy' }
]

interface Props {
   currentStep: string
   children: ReactNode
}

export function WizardShell({ currentStep, children }: Props) {
   return (
      <div className="flex min-h-screen w-full">
         <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card/40 p-6 backdrop-blur-xl">
            <div className="pb-8 flex items-center justify-center gap-2 text-foreground text-center">
               <SapIcon className="size-10" />
               <span className="text-xl font-bold">Hybris Installer</span>
            </div>

            <Stepper steps={STEPS} currentId={currentStep} />
         </aside>
         <main className="flex flex-1 items-center justify-center overflow-y-auto p-8">
            {children}
         </main>
      </div>
   )
}
