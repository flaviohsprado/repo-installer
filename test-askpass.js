const { exec } = require('child_process');
exec(`osascript -e 'Tell application "System Events" to display dialog "Darvin Installer precisa da sua senha do Mac para instalar o Java." default answer "" with hidden answer with title "Permissão Necessária"' -e 'text returned of result'`, (err, stdout, stderr) => {
  console.log("Stdout:", stdout);
  console.log("Stderr:", stderr);
});
