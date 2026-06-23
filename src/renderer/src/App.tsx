import { useState } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { RequirementsScreen } from './components/RequirementsScreen'
import { ConfigScreen } from './components/ConfigScreen'
import { DeploymentScreen } from './components/DeploymentScreen'
import { WizardShell } from './components/WizardShell'

type WizardStep = 'requirements' | 'config' | 'deploy'

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [step, setStep] = useState<WizardStep>('requirements')
  const [installPath, setInstallPath] = useState('')

  if (!authenticated) {
    return <LoginScreen onLoginSuccess={() => setAuthenticated(true)} />
  }

  return (
    <WizardShell currentStep={step}>
      {step === 'requirements' && <RequirementsScreen onNext={() => setStep('config')} />}
      {step === 'config' && (
        <ConfigScreen
          onNext={(path) => {
            setInstallPath(path)
            setStep('deploy')
          }}
        />
      )}
      {step === 'deploy' && <DeploymentScreen cwd={installPath} />}
    </WizardShell>
  )
}
