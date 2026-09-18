import { app } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CREDENTIALS_FILE_NAME = 'credentials.json'

export class GoogleCredentialsStore {
  static getFilePath() {
    if (app.isPackaged) {
      return path.join(app.getPath('userData'), 'config', CREDENTIALS_FILE_NAME)
    }

    return path.join(__dirname, '../../config', CREDENTIALS_FILE_NAME)
  }

  static async exists() {
    try {
      await fs.access(this.getFilePath())
      return true
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return false
      }

      throw error
    }
  }

  static parseJsonText(jsonText) {
    const text = String(jsonText ?? '').trim()

    if (!text) {
      throw new Error('Файл пустой')
    }

    try {
      const parsed = JSON.parse(text)

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('JSON должен быть объектом')
      }

      return parsed
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Файл не является корректным JSON')
      }

      throw error
    }
  }

  static async read() {
    if (!(await this.exists())) {
      return null
    }

    const text = await fs.readFile(this.getFilePath(), 'utf8')
    return this.parseJsonText(text)
  }

  static async save(jsonText) {
    const parsed = this.parseJsonText(jsonText)
    const filePath = this.getFilePath()

    await fs.mkdir(path.dirname(filePath), { recursive: true })

    try {
      await fs.unlink(filePath)
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error
      }
    }

    await fs.writeFile(filePath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8')

    return parsed
  }

  static async getForRenderer() {
    const content = await this.read()

    if (!content) {
      return { exists: false, content: null }
    }

    return { exists: true, content }
  }

  static async delete() {
    if (!(await this.exists())) {
      return { exists: false, content: null, deleted: false }
    }

    await fs.unlink(this.getFilePath())

    return { exists: false, content: null, deleted: true }
  }
}
