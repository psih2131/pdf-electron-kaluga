const DB_NAME = 'kaluga'
const DB_VERSION = 3
const STORE_NAME = 'kps'
const DEFAULTS_STORE = 'defaults'

const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('type', 'type', { unique: false })
      }

      if (!db.objectStoreNames.contains(DEFAULTS_STORE)) {
        db.createObjectStore(DEFAULTS_STORE, { keyPath: 'type' })
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
