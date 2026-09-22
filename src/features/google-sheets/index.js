import { google } from 'googleapis'
import { GoogleCredentialsStore } from './GoogleCredentialsStore.js'
import { SheetsSettingsStore } from './SheetsSettingsStore.js'


async function initGoogleSheets() {

  const keyFile = GoogleCredentialsStore.getFilePath()


  const auth = new google.auth.GoogleAuth({
    keyFile: keyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  // Create client instance for auth
  const client = await auth.getClient()

  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: 'v4', auth: client })

  const settings = await SheetsSettingsStore.get()
  const spreadsheetId = settings.spreadsheetId
  const sheetName = settings.sheetName

  return { googleSheets, spreadsheetId, sheetName }

}



async function getSheetData(range = 'D7:R7') {
  
  const { googleSheets, spreadsheetId, sheetName } = await initGoogleSheets()


  const { data } = await googleSheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!${range}`,
  })

  console.log('getSheetData', data)

  return {
    raw: data,
  }
}


async function updateSheetData(field = 'F7', value) {
 
  const { googleSheets, spreadsheetId, sheetName } = await initGoogleSheets()

  const result = await googleSheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!${field}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[value]],
    },
  })
  console.log('updateSheetData', result)
}


async function updateSheetDeliveryPrices(value) {
 
  const { googleSheets, spreadsheetId, sheetName } = await initGoogleSheets()

  const result = await googleSheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!G42`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[value]],
    },
  })

  console.log('updateSheetDeliveryPrices', result)
}

async function clearSheetColumnsDAndQ() {
  const { googleSheets, spreadsheetId, sheetName } = await initGoogleSheets()

  const { data } = await googleSheets.spreadsheets.values.batchClear({
    spreadsheetId,
    requestBody: {
      ranges: [
        `${sheetName}!D7:D36`,
        `${sheetName}!F7:F36`,
        `${sheetName}!J7:J36`,
        `${sheetName}!Q7:Q36`,
        `${sheetName}!G42`,
      ],
    },
  })

  console.log('clearSheetColumnsDAndQ', data)

  return { ok: true, data }
}

export {
  initGoogleSheets,
  getSheetData,
  updateSheetData,
  updateSheetDeliveryPrices,
  clearSheetColumnsDAndQ,
}
