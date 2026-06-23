import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { AzureIcon } from './icons/azure'

interface Props {
   onLoginSuccess: () => void
}

export function LoginScreen({ onLoginSuccess }: Props) {
   const [loading, setLoading] = useState(false)

   const handleLogin = async (): Promise<void> => {
      setLoading(true)
      const success = await window.api.loginAzure()
      if (success) onLoginSuccess()
      setLoading(false)
   }

   return (
      <div className="flex min-h-screen w-full items-center justify-center p-8">
         <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AzureIcon className="size-10" />
            <span className="text-2xl font-bold">Darvin Installer</span>
            <span className="text-sm text-muted-foreground">
               Autentique-se com sua conta Azure para continuar
            </span>

            <Button className="w-full" size="lg" onClick={handleLogin} disabled={loading}>
               {loading ? 'Conectando...' : 'Conectar com sua conta Azure'}
            </Button>
         </div>
      </div>
   )
}
