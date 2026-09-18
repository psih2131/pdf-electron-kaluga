import { app } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SETTINGS_FILE_NAME = 'sheets-settings.json'

export class SheetsSettingsStore {
  static getFilePath() {
    if (app.isPackaged) {
      return path.join(app.getPath('userData'), 'config', SETTINGS_FILE_NAME)
    }

    return path.join(__dirname, '../../config', SETTINGS_FILE_NAME)
  }

  static normalize(data = {}) {
    return {
      spreadsheetId: String(data.spreadsheetId ?? '').trim(),
      sheetName: String(data.sheetName ?? '').trim(),
    }
  }

  static async get() {
    try {
      const text = await fs.readFile(this.getFilePath(), 'utf8')
      const parsed = JSON.parse(text)
      return this.normalize(parsed)
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return this.normalize({})
      }

      throw error
    }
  }

  static async save(data) {
    const settings = this.normalize(data)
    const filePath = this.getFilePath()

    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(
      filePath,
      `${JSON.stringify({ ...settings, updatedAt: Date.now() }, null, 2)}\n`,
      'utf8'
    )

    return settings
  }
}
