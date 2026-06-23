import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DeploymentScreen } from './DeploymentScreen'

// Mock the window.api
window.api = {
  runInstallerStep: vi.fn().mockResolvedValue(0),
  onLogReceived: vi.fn()
} as any

describe('DeploymentScreen', () => {
  it('renders a start button and a terminal area', () => {
    render(<DeploymentScreen />)
    expect(screen.getByText('Iniciar Instalação')).toBeDefined()
  })

  it('calls runInstallerStep when button is clicked', () => {
    render(<DeploymentScreen />)
    fireEvent.click(screen.getByText('Iniciar Instalação'))
    expect(window.api.runInstallerStep).toHaveBeenCalledWith('git-clone')
  })
})
