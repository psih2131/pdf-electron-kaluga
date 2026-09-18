class GoogleCredentialsClient {
  static #assertApi() {
    if (typeof window.kaluga?.getGoogleCredentials !== 'function') {
      throw new Error('Загрузка credentials недоступна в этом окне')
    }

    if (typeof window.kaluga?.saveGoogleCredentials !== 'function') {
      throw new Error('Сохранение credentials недоступно в этом окне')
    }
  }

  static isJsonFile(file) {
    const name = String(file?.name ?? '').toLowerCase()

    return name.endsWith('.json')
  }

  formatContent(content) {
    if (!content) {
      return ''
    }

    return JSON.stringify(content, null, 2)
  }

  async load() {
    GoogleCredentialsClient.#assertApi()
    return window.kaluga.getGoogleCredentials()
  }

  async saveFromFile(file) {
    GoogleCredentialsClient.#assertApi()

    if (!file) {
      throw new Error('Файл не выбран')
    }

    if (!GoogleCredentialsClient.isJsonFile(file)) {
      throw new Error('Допускается загрузка только JSON-файлов')
    }

    const jsonText = await file.text()
    return window.kaluga.saveGoogleCredentials(jsonText)
  }

  async deleteFile() {
    if (typeof window.kaluga?.deleteGoogleCredentials !== 'function') {
      throw new Error('Удаление credentials недоступно в этом окне')
    }

    return window.kaluga.deleteGoogleCredentials()
  }
}

export default GoogleCredentialsClient
