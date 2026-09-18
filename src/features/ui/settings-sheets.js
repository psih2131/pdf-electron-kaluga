import { SheetsSettings } from '../../backend/db.js'
import SystemNotifications from '../notifications/SystemNotifications.js'
import Preloader from './preloader.js'

const spreadsheetInput = document.getElementById('settings-sheets-spreadsheet-id')
const sheetNameInput = document.getElementById('settings-sheets-sheet-name')
const saveBtn = document.getElementById('settings-sheets-save-btn')
const testBtn = document.getElementById('settings-sheets-btn')

const readForm = () => ({
  spreadsheetId: spreadsheetInput?.value ?? '',
  sheetName: sheetNameInput?.value ?? '',
})

const applyToForm = (record) => {
  if (spreadsheetInput && record?.spreadsheetId) {
    spreadsheetInput.value = record.spreadsheetId
  }

  if (sheetNameInput && record?.sheetName) {
    sheetNameInput.value = record.sheetName
  }
}

saveBtn?.addEventListener('click', async () => {
  const settings = readForm()
  saveBtn.disabled = true
  const label = saveBtn.textContent

  try {
    if (typeof window.kaluga?.saveSheetsSettings !== 'function') {
      throw new Error('Сохранение настроек недоступно')
    }

    await window.kaluga.saveSheetsSettings(settings)
    await new SheetsSettings(settings).save()

    new SystemNotifications('success', 'Настройки сохранены').CreateNotification()

    window.setTimeout(() => {
      saveBtn.textContent = label
    }, 1500)
  } catch (error) {
    console.error(error)
    new SystemNotifications('error', 'Ошибка при сохранении настроек').CreateNotification()

    window.setTimeout(() => {
      saveBtn.textContent = label
    }, 1500)
  } finally {
    saveBtn.disabled = false
  }
})

testBtn?.addEventListener('click', async () => {
  const preloader = new Preloader()
  preloader.startPreloader()

  try {
    await window.kaluga.updateSheetData({ field: 'F7', value: 5 })
    const data = await window.kaluga.getSheetData('D7:Q7')
    console.log(data)
  } finally {
    preloader.endPreloader()
  }
})

const boot = async () => {
  try {
    if (typeof window.kaluga?.getSheetsSettings === 'function') {
      const record = await window.kaluga.getSheetsSettings()

      if (record?.spreadsheetId || record?.sheetName) {
        applyToForm(record)
        return
      }
    }

    const legacy = await new SheetsSettings({}).get()
    applyToForm(legacy)

    if (legacy?.spreadsheetId || legacy?.sheetName) {
      await window.kaluga?.saveSheetsSettings?.({
        spreadsheetId: legacy.spreadsheetId,
        sheetName: legacy.sheetName,
      })
    }
  } catch (error) {
    console.error(error)
  }
}

boot()
