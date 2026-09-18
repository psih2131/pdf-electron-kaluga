const DB_NAME = 'kaluga'
const DB_VERSION = 5
const STORE_NAME = 'kps'
const TRASH_STORE_NAME = 'kps_trash'
const DEFAULTS_STORE = 'defaults'
const SHEETS_SETTINGS_STORE = 'sheets_settings'
const SHEETS_SETTINGS_ID = 'google-sheets-tab'

const createKpStore = (db, storeName) => {
  if (!db.objectStoreNames.contains(storeName)) {
    const store = db.createObjectStore(storeName, { keyPath: 'id' })
    store.createIndex('type', 'type', { unique: false })
  }
}

const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      createKpStore(db, STORE_NAME)
      createKpStore(db, TRASH_STORE_NAME)

      if (!db.objectStoreNames.contains(DEFAULTS_STORE)) {
        db.createObjectStore(DEFAULTS_STORE, { keyPath: 'type' })
      }

      if (!db.objectStoreNames.contains(SHEETS_SETTINGS_STORE)) {
        db.createObjectStore(SHEETS_SETTINGS_STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

const runStore = async (storeName, mode, handler) => {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    let result
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const request = handler(store)

    request.onsuccess = () => {
      result = request.result
    }
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('Транзакция прервана'))
  })
}

export class KpDatabase {
  constructor(type, data = {}) {
    this.type = type
    this.data = data
  }

  async add() {
    const record = {
      id: crypto.randomUUID(),
      type: this.type,
      data: { ...this.data },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    await runStore(STORE_NAME, 'readwrite', (store) => store.add(record))
    return record.id
  }

  async get(id) {
    return runStore(STORE_NAME, 'readonly', (store) => store.get(id))
  }

  async getAll() {
    const records = await runStore(STORE_NAME, 'readonly', (store) => store.getAll())
    return records ?? []
  }

  async update(id) {
    const current = await this.get(id)

    if (!current) {
      throw new Error(`КП с id ${id} не найден`)
    }

    const record = {
      ...current,
      type: this.type,
      data: { ...this.data },
      updatedAt: Date.now()
    }

    await runStore(STORE_NAME, 'readwrite', (store) => store.put(record))
    return record.id
  }

  async delete(id) {
    const result = await runStore(STORE_NAME, 'readwrite', (store) => store.delete(id))
    return result
  }

  async copy(id) {
    const current = await this.get(id)
    if (!current) {
      throw new Error(`КП с id ${id} не найден`)
    }

    const copyDataObject = { ...current.data }
    console.log( 'copyDataObject', copyDataObject)
    copyDataObject['kp-name'] = copyDataObject['kp-name'] + ' (копия)'
    

    const record = {
      id: crypto.randomUUID(),
      type: current.type,
      data: copyDataObject,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await runStore(STORE_NAME, 'readwrite', (store) => store.add(record))
  }

}

export class KpTrashTable {
  constructor(type, data = {}) {
    this.type = type
    this.data = data
  }

  async add(type, data) {
    const record = {
      id: crypto.randomUUID(),
      type: type,
      data: { ...data },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    await runStore(TRASH_STORE_NAME, 'readwrite', (store) => store.add(record))
    return record.id
  }


  async getAll() {
    const records = await runStore(TRASH_STORE_NAME, 'readonly', (store) => store.getAll())
    return records ?? []
  }

  async get(id) {
    return runStore(TRASH_STORE_NAME, 'readonly', (store) => store.get(id))
  }

  async deleteAll() {
    const records = await runStore(TRASH_STORE_NAME, 'readwrite', (store) => store.clear())
    return records ?? []
  }

  async delete(id) {
    const result = await runStore(TRASH_STORE_NAME, 'readwrite', (store) => store.delete(id))
    return result
  }


}

export class KpDefaults {
  constructor(type, data = {}) {
    this.type = type
    this.data = data
  }

  async get() {
    return runStore(DEFAULTS_STORE, 'readonly', (store) => store.get(this.type))
  }

  async save() {
    const record = {
      type: this.type,
      data: { ...this.data },
      updatedAt: Date.now()
    }

    await runStore(DEFAULTS_STORE, 'readwrite', (store) => store.put(record))
    return this.type
  }
}

export class SheetsSettings {
  constructor(data = {}) {
    this.spreadsheetId = String(data.spreadsheetId ?? '').trim()
    this.sheetName = String(data.sheetName ?? '').trim()
  }

  async get() {
    return runStore(SHEETS_SETTINGS_STORE, 'readonly', (store) => store.get(SHEETS_SETTINGS_ID))
  }

  async save() {
    const record = {
      id: SHEETS_SETTINGS_ID,
      spreadsheetId: this.spreadsheetId,
      sheetName: this.sheetName,
      updatedAt: Date.now()
    }

    await runStore(SHEETS_SETTINGS_STORE, 'readwrite', (store) => store.put(record))
    return record
  }
}
