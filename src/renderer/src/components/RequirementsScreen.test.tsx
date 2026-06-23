import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RequirementsScreen } from './RequirementsScreen'

beforeEach(() => {
  window.api = {
    checkRequirements: vi.fn().mockResolvedValue([
      { name: 'Git', status: 'ok', installed: true, version: 'git 2.40' },
      { name: 'Docker', status: 'missing', installed: false }
    ]),
    checkRequirement: vi.fn().mockResolvedValue({ name: 'Docker', status: 'ok', installed: true }),
    installRequirement: vi.fn().mockResolvedValue({ status: 'success' }),
    onInstallLog: vi.fn(),
    runRequirementAction: vi.fn().mockResolvedValue(true),
    platform: 'win32'
  } as unknown as Window['api']
})

describe('RequirementsScreen', () => {
  it('lists requirements after checking', async () => {
    render(<RequirementsScreen onNext={vi.fn()} />)
    expect(await screen.findByText('Git')).toBeDefined()
    expect(screen.getByText('Docker')).toBeDefined()
  })

  it('installs a missing requirement when its Instalar button is clicked', async () => {
    render(<RequirementsScreen onNext={vi.fn()} />)
    const installBtn = await screen.findByRole('button', { name: /instalar/i })
    fireEvent.click(installBtn)
    await waitFor(() => {
      expect(window.api.installRequirement).toHaveBeenCalledWith('Docker', { elevated: false })
    })
  })
})
