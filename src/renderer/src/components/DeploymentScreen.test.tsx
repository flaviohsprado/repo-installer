import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DeploymentScreen } from './DeploymentScreen'

window.api = {
   runInstallerStep: vi.fn().mockResolvedValue(0),
   onLogReceived: vi.fn(),
   pathExists: vi.fn().mockResolvedValue(false),
   checkRequirements: vi.fn(),
   checkRequirement: vi.fn(),
   installRequirement: vi.fn(),
   onInstallLog: vi.fn(),
   runRequirementAction: vi.fn(),
   loginAzure: vi.fn(),
   selectDirectory: vi.fn(),
   platform: 'win32'
} as unknown as Window['api']

window.HTMLElement.prototype.scrollIntoView = vi.fn()

describe('DeploymentScreen', () => {
   it('renders a start button and a terminal area', () => {
      render(<DeploymentScreen cwd="/fake/path" />)
      expect(screen.getByText('Iniciar Instalação')).toBeDefined()
   })

   it('calls runInstallerStep when button is clicked', async () => {
      render(<DeploymentScreen cwd="/fake/path" />)
      fireEvent.click(screen.getByText('Iniciar Instalação'))
      await waitFor(() => {
         expect(window.api.runInstallerStep).toHaveBeenCalledWith(
            'git',
            [
               'clone',
               'https://telefonica-vivo-brasil@dev.azure.com/telefonica-vivo-brasil/ECMC%20-%20Ecomm%20Cloud%20B2C/_git/src-devops-darvin-hybris-67-dev',
               '.'
            ],
            '/fake/path'
         )
      })
   })
})
