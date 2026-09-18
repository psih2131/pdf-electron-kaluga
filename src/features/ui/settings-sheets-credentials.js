import GoogleCredentialsClient from '../google-sheets/GoogleCredentialsClient.js'
import SystemNotifications from '../notifications/SystemNotifications.js'

const credentialsClient = new GoogleCredentialsClient()
const uploadBtn = document.getElementById('settings-sheets-credentials-upload-btn')
const deleteBtn = document.getElementById('settings-sheets-credentials-delete-btn')
const fileInput = document.getElementById('settings-sheets-credentials-file')
const preview = document.getElementById('settings-sheets-credentials-preview')
const block = document.getElementById('settings-sheets-credentials-block')

const notify = (type, message) => {
  new SystemNotifications(type, message).CreateNotification()
}

const renderPreview = (content) => {
  if (!preview || !block) {
    return
  }

  if (!content) {
    block.hidden = true
    preview.textContent = ''
    if (deleteBtn) {
      deleteBtn.hidden = true
    }
    return
  }

  block.hidden = false
  preview.textContent = credentialsClient.formatContent(content)
  if (deleteBtn) {
    deleteBtn.hidden = false
  }
}

const boot = async () => {
  try {
    const { exists, content } = await credentialsClient.load()

    if (exists && content) {
      renderPreview(content)
    }
  } catch (error) {
    console.error(error)
  }
}

uploadBtn?.addEventListener('click', () => {
  fileInput?.click()
})

fileInput?.addEventListener('change', async () => {
  const file = fileInput.files?.[0]
  fileInput.value = ''

  if (!file) {
    return
  }

  uploadBtn.disabled = true

  try {
    const { content } = await credentialsClient.saveFromFile(file)
    renderPreview(content)
    notify('success', 'Файл credentials.json сохранён')
  } catch (error) {
    console.error(error)
    notify('error', error?.message ?? 'Не удалось сохранить файл')
  } finally {
    uploadBtn.disabled = false
  }
})

deleteBtn?.addEventListener('click', async () => {
  deleteBtn.disabled = true
  uploadBtn.disabled = true

  try {
    await credentialsClient.deleteFile()
    renderPreview(null)
    notify('success', 'Файл credentials.json удалён')
  } catch (error) {
    console.error(error)
    notify('error', error?.message ?? 'Не удалось удалить файл')
  } finally {
    deleteBtn.disabled = false
    uploadBtn.disabled = false
  }
})

boot()
