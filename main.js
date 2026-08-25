import { app, BrowserWindow, ipcMain, protocol, net } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const getUploadsDir = () => {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'uploads')
  }

  return path.join(__dirname, 'uploads')
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'kp-img',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
])

const normalizeExt = (ext, mime = '') => {
  const fromName = String(ext ?? '').toLowerCase().replace(/[^\w.]/g, '')
  const withDot = fromName
    ? fromName.startsWith('.')
      ? fromName
      : `.${fromName}`
    : ''

  if (withDot && withDot.length <= 8) {
    return withDot
  }

  const fromMime = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg'
  }

  return fromMime[mime] ?? '.img'
}

const randomImageName = (ext) => `${randomBytes(8).toString('hex')}${ext}`

ipcMain.on('print-kp', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)

  if (!win) {
    return
  }

  win.webContents.print({
    silent: false,
    printBackground: true,
    pageSize: 'A4'
  })
})

ipcMain.handle('save-image', async (_event, payload) => {
  const ext = normalizeExt(payload?.ext, payload?.mime)
  const name = randomImageName(ext)
  const dir = getUploadsDir()

  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, name), Buffer.from(payload?.buffer ?? []))

  return name
})

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1800,
    height: 1000,
    fullscreenable: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.setMenuBarVisibility(false)
  win.setTitle('Kaluga')
  win.loadFile('src/index.html')
}

app.whenReady().then(() => {
  protocol.handle('kp-img', (request) => {
    const url = new URL(request.url)
    const name = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
    const safeName = path.basename(name)
    const filePath = path.join(getUploadsDir(), safeName)

    return net.fetch(pathToFileURL(filePath).href)
  })

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
