import { app, BrowserWindow, ipcMain, protocol } from 'electron'
import { watch } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'

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

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
}

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

const watchDevFiles = () => {
  if (app.isPackaged) {
    return
  }

  let reloadTimer = 0
  let relaunchTimer = 0

  const reloadWindows = () => {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.reloadIgnoringCache()
    }
  }

  const relaunchApp = () => {
    app.relaunch()
    app.exit(0)
  }

  const onChange = (filePath = '') => {
    const name = String(filePath).replaceAll('\\', '/')

    if (!name || name.includes('uploads/')) {
      return
    }

    if (name.endsWith('main.js') || name.endsWith('preload.cjs')) {
      clearTimeout(relaunchTimer)
      relaunchTimer = setTimeout(relaunchApp, 200)
      return
    }

    clearTimeout(reloadTimer)
    reloadTimer = setTimeout(reloadWindows, 150)
  }

  watch(path.join(__dirname, 'src'), { recursive: true }, (_event, filename) => {
    onChange(filename ?? '')
  })
  watch(path.join(__dirname, 'main.js'), () => onChange('main.js'))
  watch(path.join(__dirname, 'preload.cjs'), () => onChange('preload.cjs'))
}

app.whenReady().then(() => {
  protocol.handle('kp-img', async (request) => {
    try {
      const { pathname } = new URL(request.url)
      const name = decodeURIComponent(pathname.replace(/^\/+/, ''))
      const safeName = path.basename(name)

      if (!safeName || safeName === '.' || safeName === '..') {
        return new Response('Bad request', { status: 400 })
      }

      const uploadsDir = path.resolve(getUploadsDir())
      const filePath = path.resolve(uploadsDir, safeName)

      if (filePath !== uploadsDir && !filePath.startsWith(`${uploadsDir}${path.sep}`)) {
        return new Response('Forbidden', { status: 403 })
      }

      const data = await fs.readFile(filePath)
      const ext = path.extname(safeName).toLowerCase()

      return new Response(data, {
        headers: {
          'Content-Type': MIME_BY_EXT[ext] ?? 'application/octet-stream',
          'Content-Length': String(data.length)
        }
      })
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return new Response('Not found', { status: 404 })
      }

      console.error('[kp-img]', request.url, error)
      return new Response('Error', { status: 500 })
    }
  })

  createWindow()
  watchDevFiles()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
