import { app, BrowserWindow, dialog, ipcMain, protocol } from 'electron'
import { watch } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import electronUpdater from 'electron-updater'

const { autoUpdater } = electronUpdater

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const getUploadsDir = () => {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'uploads')
  }

  return path.join(__dirname, 'uploads')
}

const getPdfDir = () => {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'files')
  }

  return path.join(__dirname, 'files')
}

const sanitizeDocumentId = (id) => {
  const safeId = String(id ?? '').replace(/[^\w-]/g, '')

  if (!safeId) {
    throw new Error('Invalid document id')
  }

  return safeId
}

const getPdfFilePath = (id) => {
  const safeId = sanitizeDocumentId(id)

  return path.join(getPdfDir(), `${safeId}.pdf`)
}

const sanitizeFileName = (name) => {
  const trimmed = String(name ?? '').trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')

  return trimmed.slice(0, 120)
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

ipcMain.handle('save-pdf', async (event, id) => {
  const win = BrowserWindow.fromWebContents(event.sender)

  if (!win) {
    throw new Error('Window not found')
  }

  const safeId = sanitizeDocumentId(id)
  const pdf = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4'
  })

  const dir = getPdfDir()
  const fileName = `${safeId}.pdf`
  const filePath = path.join(dir, fileName)

  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(filePath, pdf)

  return fileName
})

ipcMain.handle('pdf-exists', async (_event, id) => {
  try {
    await fs.access(getPdfFilePath(id))
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false
    }

    throw error
  }
})

ipcMain.handle('delete-pdf', async (_event, id) => {
  try {
    await fs.unlink(getPdfFilePath(id))
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false
    }

    throw error
  }
})

ipcMain.handle('download-pdf', async (event, payload) => {
  const id = payload?.id
  const sourcePath = getPdfFilePath(id)

  try {
    await fs.access(sourcePath)
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error('PDF not found')
    }

    throw error
  }

  const win = BrowserWindow.fromWebContents(event.sender)
  const safeId = sanitizeDocumentId(id)
  const baseName = sanitizeFileName(payload?.defaultName) || safeId
  const defaultPath = baseName.toLowerCase().endsWith('.pdf') ? baseName : `${baseName}.pdf`
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })

  if (canceled || !filePath) {
    return false
  }

  await fs.copyFile(sourcePath, filePath)

  return true
})

ipcMain.handle('save-image', async (_event, payload) => {
  const ext = normalizeExt(payload?.ext, payload?.mime)
  const name = randomImageName(ext)
  const dir = getUploadsDir()

  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, name), Buffer.from(payload?.buffer ?? []))

  return name
})

const setupAutoUpdater = () => {
  if (!app.isPackaged) {
    return
  }

  autoUpdater.autoDownload = true

  autoUpdater.on('update-available', () => {
    console.log('[updater] Доступно обновление')
  })

  autoUpdater.on('download-progress', (progress) => {
    console.log('[updater]', `${Math.round(progress.percent)}%`)
  })

  autoUpdater.on('update-downloaded', async () => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    const { response } = await dialog.showMessageBox(win, {
      type: 'info',
      title: 'Обновление Kaluga',
      message: 'Обновление скачано. Перезапустить приложение?',
      buttons: ['Перезапустить', 'Позже'],
      defaultId: 0,
      cancelId: 1
    })

    if (response === 0) {
      autoUpdater.quitAndInstall()
    }
  })

  autoUpdater.on('error', (error) => {
    console.error('[updater]', error)
  })

  autoUpdater.checkForUpdates()
}

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
  setupAutoUpdater()
  watchDevFiles()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
