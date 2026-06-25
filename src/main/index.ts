import * as fs from 'node:fs'
import { join } from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import icon from '../../resources/icon.png?asset'
import { loginAzure } from './auth'
import { openDockerDesktop } from './docker'
import { executeCommand } from './executor'
import { fixPath } from './fix-path'
import { installRequirement } from './installer'
import { checkRequirement, checkRequirements } from './requirements'

// Garante que comandos de shell (brew, task, az, docker) sejam encontrados
// quando o app é aberto pelo Finder/Dock no macOS/Linux. No-op no Windows.
fixPath()

function createWindow(): void {
   // Create the browser window.
   const mainWindow = new BrowserWindow({
      width: 900,
      height: 670,
      show: false,
      autoHideMenuBar: true,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
         preload: join(__dirname, '../preload/index.js'),
         sandbox: false
      }
   })

   mainWindow.on('ready-to-show', () => {
      mainWindow.show()
   })

   mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
   })

   // HMR for renderer base on electron-vite cli.
   // Load the remote URL for development or the local html file for production.
   if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
   } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
   }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
   ipcMain.handle('select-directory', async () => {
      const result = await dialog.showOpenDialog({
         properties: ['openDirectory']
      })
      if (result.canceled) return null
      return result.filePaths[0]
   })

   ipcMain.handle(
      'run-installer-step',
      async (event, command: string, args: string[], cwd?: string) => {
         const webContents = event.sender
         const onLog = (log: string) => {
            webContents.send('log-received', log)
         }

         return await executeCommand(command, args, cwd, onLog)
      }
   )

   // Set app user model id for windows
   electronApp.setAppUserModelId('com.vivo.darvin-installer')

   // Default open or close DevTools by F12 in development
   // and ignore CommandOrControl + R in production.
   // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
   app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
   })

   // IPC test
   ipcMain.on('ping', () => console.log('pong'))

   ipcMain.handle('login-azure', () => loginAzure())
   ipcMain.handle('check-requirements', () => checkRequirements())
   ipcMain.handle('check-requirement', (_, name: string) => checkRequirement(name))

   ipcMain.handle(
      'install-requirement',
      async (event, name: string, options?: { elevated?: boolean }) => {
         const webContents = event.sender
         const onLog = (chunk: string) => webContents.send('install-log', { name, chunk })
         return installRequirement(name, options ?? {}, onLog)
      }
   )

   ipcMain.handle('run-requirement-action', async (_, actionId: string) => {
      if (actionId === 'open-docker') {
         await openDockerDesktop()
         return true
      }
      return false
   })

   ipcMain.handle('path-exists', (_, pathStr) => fs.existsSync(pathStr))

   createWindow()

   app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
   })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
   if (process.platform !== 'darwin') {
      app.quit()
   }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
