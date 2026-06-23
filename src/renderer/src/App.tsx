import { useState } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { RequirementsScreen } from './components/RequirementsScreen'
import { DeploymentScreen } from './components/DeploymentScreen'

export default function App() {
  const [step, setStep] = useState(1)

  return (
    <div>
      {step === 1 && <LoginScreen onLoginSuccess={() => setStep(2)} />}
      {step === 2 && <RequirementsScreen onNext={() => setStep(3)} />}
      {step === 3 && <DeploymentScreen />}
    </div>
  )
}
