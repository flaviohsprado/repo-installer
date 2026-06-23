import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WizardShell } from './WizardShell'

describe('WizardShell', () => {
  it('renders the three step labels and the children', () => {
    render(
      <WizardShell currentStep="config">
        <div>conteúdo do passo</div>
      </WizardShell>
    )
    expect(screen.getByText('Requisitos')).toBeDefined()
    expect(screen.getByText('Pasta')).toBeDefined()
    expect(screen.getByText('Deploy')).toBeDefined()
    expect(screen.getByText('conteúdo do passo')).toBeDefined()
  })
})
