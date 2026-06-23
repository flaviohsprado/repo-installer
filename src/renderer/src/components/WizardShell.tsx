import { ReactNode } from 'react'
import { Stepper, WizardStepDef } from './Stepper'

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
        <div className="mb-8 flex items-center gap-2 text-foreground">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="text-base font-semibold">Darvin Installer</span>
        </div>
        <Stepper steps={STEPS} currentId={currentStep} />
      </aside>
      <main className="flex flex-1 items-center justify-center overflow-y-auto p-8">{children}</main>
    </div>
  )
}
