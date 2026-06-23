import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WizardStepDef {
  id: string
  label: string
}

interface Props {
  steps: WizardStepDef[]
  currentId: string
}

export function Stepper({ steps, currentId }: Props) {
  const currentIndex = steps.findIndex((s) => s.id === currentId)

  return (
    <nav className="flex flex-col gap-1">
      {steps.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'upcoming'
        return (
          <div
            key={step.id}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              state === 'active' ? 'bg-primary/10 text-foreground' : 'text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                state === 'done' && 'border-primary bg-primary text-primary-foreground',
                state === 'active' && 'border-primary text-primary',
                state === 'upcoming' && 'border-border'
              )}
            >
              {state === 'done' ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className="font-medium">{step.label}</span>
          </div>
        )
      })}
    </nav>
  )
}
