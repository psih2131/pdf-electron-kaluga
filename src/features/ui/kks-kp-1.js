import { KpDatabase, KpDefaults } from '../../backend/db.js'
import { KP_SEED } from '../../backend/kp-seed.js'
import { getDocument, GlobalWorkerOptions } from '../../assets/vendor/pdfjs/pdf.min.mjs'
import DocumentService from '../documents/DocumentService.js'
import SystemNotifications from '../notifications/SystemNotifications.js'
import {
  KpPriceTable,
  ITEM_KEYS_ROW,
  isTableKey,
  isAutoTableKey,
  seedEmptyAutoTableData,
  hasValue,
} from './kp-price-table.js'

GlobalWorkerOptions.workerSrc = new URL(
  '../../assets/vendor/pdfjs/pdf.worker.min.mjs',
  import.meta.url
).href

const KP_TYPE = new URLSearchParams(window.location.search).get('type') ?? 'kks-kp-1'

document.getElementById('print-btn')?.addEventListener('click', () => {
  if (typeof window.kaluga?.printKp !== 'function') {
    window.print()
    return
  }

  window.kaluga.printKp()
})

const form = document.querySelector('.kp-form')
const tableRows = document.getElementById('table-rows')
const termRows = document.getElementById('term-rows')

const STATIC_KEYS = [
  'kp-name',
  'company',
  'inn-kpp',
  'okpo-ogrn',
  'address',
  'phone',
  'email',
  'product-title',
  'product-sub',
  'manager-name',
  'manager-photo',
  'doc-number',
  'doc-date',
  'doc-client',
  'total',
  'note',
  'footer-banner',
  'footer-phone',
  'footer-contacts',
  'sign-role',
  'sign-name'
]

const TERM_KEYS = ['term-label', 'term-value']

const isDefaultsSkipKey = (key) => isTableKey(key) || isAutoTableKey(key) || key === 'kp-name'

const createEmptyKpData = () => {
  const data = {}

  for (const key of STATIC_KEYS) {
    data[key] = ''
  }

  data['item-count'] = 1
  data['term-count'] = 1

  for (const key of ITEM_KEYS_ROW) {
    data[`${key}-1`] = ''
  }

  for (const key of TERM_KEYS) {
    data[`${key}-1`] = ''
  }

  seedEmptyAutoTableData(data, 1)

  return data
}

const kpData = createEmptyKpData()
window.kpData = kpData

const priceTable = new KpPriceTable({
  variant: 'row',
  tableRows,
  form,
  kpData,
})

const createTermRow = () => {
  const row = document.createElement('div')
  row.className = 'kp-form__row kp-form__row--term'
  row.innerHTML = `
    <label class="kp-form__field">
      <span>Название</span>
      <input type="text" name="term-label" />
    </label>
    <label class="kp-form__field">
      <span>Значение</span>
      <input type="text" name="term-value" />
    </label>
    <button class="kp-form__remove" type="button" aria-label="Удалить строку">×</button>
  `
  return row
}

const getFileExt = (file) => {
  const name = file?.name ?? ''
  const dot = name.lastIndexOf('.')

  if (dot > 0 && dot < name.length - 1) {
    return name.slice(dot)
  }

  return ''
}

const readKpDataFromForm = () => {
  const data = createEmptyKpData()
  const itemRowList = priceTable.getFormItemRows()
  const termRowList = [...termRows.querySelectorAll(':scope > .kp-form__row')]

  for (const key of STATIC_KEYS) {
    const field = form.querySelector(`[name="${key}"]`)

    if (!field || field.closest('#table-rows, #term-rows')) {
      continue
    }

    data[key] = field.type === 'file' ? kpData[key] ?? '' : field.value
  }

  data['term-count'] = termRowList.length

  priceTable.readItemsInto(data, itemRowList)
  priceTable.readAutoTableInto(data)

  termRowList.forEach((row, index) => {
    const n = index + 1

    for (const key of TERM_KEYS) {
      data[`${key}-${n}`] = row.querySelector(`[name="${key}"]`)?.value ?? ''
    }
  })

  return data
}

const escapeHtml = (value) => {
  const box = document.createElement('div')
  box.textContent = value ?? ''
  return box.innerHTML
}

const setHidden = (node, hidden) => {
  if (node) {
    node.hidden = hidden
  }
}

const renderFileNameHints = () => {
  document.querySelectorAll('[data-file-name]').forEach((node) => {
    const name = kpData[node.dataset.fileName] ?? ''
    node.textContent = hasValue(name) ? name : ''
  })
}

const renderManagerPhoto = () => {
  const photo = document.querySelector('.kp-manager__photo')
  const name = kpData['manager-photo']

  if (!photo) {
    return false
  }

  photo.replaceChildren()

  if (!hasValue(name) || typeof window.kaluga?.imageSrc !== 'function') {
    setHidden(photo, true)
    return false
  }

  const image = document.createElement('img')
  image.src = window.kaluga.imageSrc(name)
  photo.append(image)
  setHidden(photo, false)
  return true
}

const renderTermsPreview = () => {
  const list = document.querySelector('.kp-pages > .kp:not(.kp--clone) .kp-terms')

  if (!list) {
    return
  }

  list.replaceChildren()
  const count = Number(kpData['term-count']) || 0
  let shown = 0

  for (let n = 1; n <= count; n += 1) {
    const label = kpData[`term-label-${n}`]
    const value = kpData[`term-value-${n}`]

    if (![label, value].some(hasValue)) {
      continue
    }

    shown += 1
    const term = document.createElement('div')
    term.className = 'kp-term'
    term.innerHTML = `
      <span class="kp-term__label">${escapeHtml(label)}</span>
      <div class="kp-term__value">
        <div class="kp-term__value-inner">${escapeHtml(value)}</div>
      </div>
    `
    list.append(term)
  }

  setHidden(list, shown === 0)
}

const renderPreview = () => {
  priceTable.resetKpPages()

  const title = document.querySelector('.header__title')

  if (title) {
    title.textContent = hasValue(kpData['kp-name']) ? kpData['kp-name'] : 'ККС_КП-1'
  }

  document.querySelectorAll('[data-kp]').forEach((node) => {
    const key = node.dataset.kp

    if (key === 'total') {
      return
    }

    const value = kpData[key] ?? ''
    node.textContent = value
    setHidden(node, !hasValue(value))
  })

  renderFileNameHints()

  const hasPhoto = renderManagerPhoto()

  setHidden(
    document.querySelector('.kp-head__info'),
    !['company', 'inn-kpp', 'okpo-ogrn', 'address'].some((key) => hasValue(kpData[key]))
  )
  setHidden(document.querySelector('.kp-hero__title'), !hasValue(kpData['product-title']))
  setHidden(document.querySelector('.kp-hero__sub'), !hasValue(kpData['product-sub']))
  setHidden(
    document.querySelector('.kp-manager'),
    !hasValue(kpData['manager-name']) && !hasPhoto
  )
  setHidden(
    document.querySelector('.kp-meta'),
    !['doc-number', 'doc-date', 'doc-client'].some((key) => hasValue(kpData[key]))
  )
  setHidden(
    document.querySelector('.kp-foot__contacts'),
    !['footer-phone', 'footer-contacts'].some((key) => hasValue(kpData[key]))
  )
  setHidden(
    document.querySelector('.kp-sign'),
    !['sign-role', 'sign-name'].some((key) => hasValue(kpData[key]))
  )
  setHidden(
    document.querySelector('.kp-foot'),
    !['footer-banner', 'footer-phone', 'footer-contacts', 'sign-role', 'sign-name'].some(
      (key) => hasValue(kpData[key])
    )
  )

  priceTable.renderTablePreview()
  renderTermsPreview()
  priceTable.scheduleKpLayout()
}

const syncKpData = () => {
  const next = readKpDataFromForm()
  priceTable.fillItemSums(next)

  for (const key of Object.keys(kpData)) {
    if (!(key in next)) {
      delete kpData[key]
    }
  }

  Object.assign(kpData, next)
  renderPreview()
}

priceTable.onSync = syncKpData

const setFieldValue = (name, value) => {
  const field = form.querySelector(`[name="${name}"]`)

  if (!field || field.closest('#table-rows, #term-rows') || field.type === 'file') {
    return
  }

  field.value = value ?? ''
}

const applyKpData = (data) => {
  for (const key of STATIC_KEYS) {
    setFieldValue(key, data[key] ?? '')
  }

  const termCount = Number(data['term-count']) || 1

  priceTable.applyItemsFrom(data)
  priceTable.applyAutoTableFrom(data)
  termRows.replaceChildren()

  for (let n = 1; n <= termCount; n += 1) {
    const row = createTermRow()

    for (const key of TERM_KEYS) {
      const input = row.querySelector(`[name="${key}"]`)

      if (input) {
        input.value = data[`${key}-${n}`] ?? ''
      }
    }

    termRows.append(row)
  }

  form.querySelectorAll('input[type="file"]').forEach((input) => {
    input.value = ''
  })

  kpData['manager-photo'] = data['manager-photo'] ?? ''
  syncKpData()
}

const bindRepeater = (root, addBtn, createItem) => {
  addBtn?.addEventListener('click', () => {
    root?.appendChild(createItem())
    syncKpData()
  })

  root?.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('.kp-form__remove')

    if (!removeBtn || !root.contains(removeBtn)) {
      return
    }

    const rows = root.querySelectorAll(':scope > .kp-form__row')

    if (rows.length < 2) {
      return
    }

    removeBtn.closest('.kp-form__row')?.remove()
    syncKpData()
  })
}

priceTable.bindAddRow(document.getElementById('add-row-btn'))
bindRepeater(termRows, document.getElementById('add-term-btn'), createTermRow)

form?.addEventListener('input', (event) => {
  const field = event.target

  if (field instanceof HTMLInputElement && field.classList.contains('js-num')) {
    field.value = field.value.replace(/[^\d.,]/g, '')
  }

  syncKpData()
})

form?.addEventListener('change', async (event) => {
  const field = event.target

  if (!(field instanceof HTMLInputElement) || field.type !== 'file') {
    return
  }

  const file = field.files?.[0]

  if (!file || typeof window.kaluga?.saveImage !== 'function') {
    return
  }

  const name = await window.kaluga.saveImage({
    buffer: new Uint8Array(await file.arrayBuffer()),
    ext: getFileExt(file),
    mime: file.type
  })

  kpData[field.name] = name
  field.value = ''
  syncKpData()
})

document.getElementById('load-defaults-btn')?.addEventListener('click', async () => {
  const record = await new KpDefaults(KP_TYPE, {}).get()
  const defaults = record?.data ?? KP_SEED
  const next = { ...createEmptyKpData(), ...defaults }

  for (const key of Object.keys(kpData)) {
    if (isDefaultsSkipKey(key)) {
      next[key] = kpData[key]
    }
  }

  applyKpData(next)
})

document.getElementById('clear-fields-btn')?.addEventListener('click', () => {
  applyKpData(createEmptyKpData())
})

const getQueryParams = () => new URLSearchParams(window.location.search)

document.getElementById('save-btn')?.addEventListener('click', async () => {
  syncKpData()

  const documentService = new DocumentService()
  const params = getQueryParams()
  const id = params.get('id')

  if (!id) {
    const newId = await documentService.AddDocument(KP_TYPE, { ...kpData })
    params.set('id', newId)
    history.replaceState(null, '', `${window.location.pathname}?${params}`)
    return
  }

  await documentService.UpdateDocument(KP_TYPE, { ...kpData }, id)
})

document.getElementById('download-btn')?.addEventListener('click', async () => {
  const id = getQueryParams().get('id')

  if (!id) {
    new SystemNotifications('error', 'Сначала сохраните документ').CreateNotification()
    return
  }

  await new DocumentService().DownloadDocument(id)
})

const renderInsertPdf = async () => {
  const canvas = document.querySelector('.kp-insert__canvas')

  if (!canvas) {
    return
  }

  try {
    const pdf = await getDocument({
      url: new URL('../../assets/pdf/add-v1.pdf', import.meta.url).href,
      verbosity: 0
    }).promise
    const page = await pdf.getPage(1)
    const base = page.getViewport({ scale: 1 })
    const scale = ((210 / 25.4) * 220) / base.width
    const viewport = page.getViewport({ scale })
    const context = canvas.getContext('2d')

    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({
      canvas,
      canvasContext: context,
      viewport
    }).promise
  } catch (error) {
    console.error('Не удалось отрисовать буклет', error)

    const frame = document.createElement('iframe')
    frame.className = 'kp-insert__pdf'
    frame.title = 'Рекламный буклет'
    frame.src = `${new URL('../../assets/pdf/add-v1.pdf', import.meta.url).href}#toolbar=0&navpanes=0&scrollbar=0`
    canvas.replaceWith(frame)
  }
}

const boot = async () => {
  const id = getQueryParams().get('id')

  if (id) {
    const record = await new KpDatabase(KP_TYPE, {}).get(id)

    if (record?.data) {
      applyKpData(record.data)
      await renderInsertPdf()
      return
    }
  }

  syncKpData()
  await renderInsertPdf()
}

boot()
