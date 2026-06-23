import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'

beforeEach(() => {
  window.api = {
    loginAzure: vi.fn().mockResolvedValue(true),
    checkRequirements: vi.fn().mockResolvedValue([]),
    checkRequirement: vi.fn(),
    installRequirement: vi.fn(),
    onInstallLog: vi.fn(),
    runRequirementAction: vi.fn(),
    runInstallerStep: vi.fn(),
    onLogReceived: vi.fn(),
    selectDirectory: vi.fn(),
    pathExists: vi.fn().mockResolvedValue(false),
    platform: 'win32'
  } as unknown as Window['api']
})

describe('App', () => {
  it('shows the login screen first (auth gate)', () => {
    render(<App />)
    expect(screen.getByText('Conectar com Azure')).toBeDefined()
  })
})
