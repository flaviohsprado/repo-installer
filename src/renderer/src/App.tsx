import { useState } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { RequirementsScreen } from './components/RequirementsScreen'
import { ConfigScreen } from './components/ConfigScreen'
import { DeploymentScreen } from './components/DeploymentScreen'

export default function App() {
  const [step, setStep] = useState(1)
  const [installPath, setInstallPath] = useState('')

  return (
    <div>
      {step === 1 && <LoginScreen onLoginSuccess={() => setStep(2)} />}
      {step === 2 && <RequirementsScreen onNext={() => setStep(3)} />}
      {step === 3 && <ConfigScreen onNext={(path) => { setInstallPath(path); setStep(4); }} />}
      {step === 4 && <DeploymentScreen cwd={installPath} />}
    </div>
  )
}
