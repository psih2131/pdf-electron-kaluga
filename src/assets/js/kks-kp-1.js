import { KpDatabase, KpDefaults } from '../../backend/db.js'
import { KP_SEED } from '../../backend/kp-seed.js'

const KP_TYPE = 'kks-kp-1'

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

const ITEM_KEYS = ['item-name', 'item-unit', 'item-qty', 'item-price', 'item-sum']
const TERM_KEYS = ['term-label', 'term-value']

const isTableKey = (key) => key === 'item-count' || key.startsWith('item-') || key === 'total'
const isDefaultsSkipKey = (key) => isTableKey(key) || key === 'kp-name'

const createEmptyKpData = () => {
  const data = {}

  for (const key of STATIC_KEYS) {
    data[key] = ''
  }

  data['item-count'] = 1
  data['term-count'] = 1

  for (const key of ITEM_KEYS) {
    data[`${key}-1`] = ''
  }

  for (const key of TERM_KEYS) {
    data[`${key}-1`] = ''
  }

  return data
}

const kpData = createEmptyKpData()
window.kpData = kpData

const createTableRow = () => {
  const row = document.createElement('div')
  row.className = 'kp-form__row'
  row.innerHTML = `
    <label class="kp-form__field">
      <span>Наименование</span>
      <input type="text" name="item-name" />
    </label>
    <label class="kp-form__field">
      <span>Ед. изм.</span>
      <input type="text" name="item-unit" />
    </label>
    <label class="kp-form__field">
      <span>Кол-во</span>
      <input class="js-num" type="text" inputmode="numeric" name="item-qty" />
    </label>
    <label class="kp-form__field">
      <span>Цена за ед.</span>
      <input class="js-num" type="text" inputmode="decimal" name="item-price" />
    </label>
    <label class="kp-form__field">
      <span>Цена итого</span>
      <span class="kp-form__computed" data-item-sum></span>
    </label>
    <button class="kp-form__remove" type="button" aria-label="Удалить строку">×</button>
  `
  return row
}

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
  const itemRowList = [...tableRows.querySelectorAll(':scope > .kp-form__row')]
  const termRowList = [...termRows.querySelectorAll(':scope > .kp-form__row')]

  for (const key of STATIC_KEYS) {
    const field = form.querySelector(`[name="${key}"]`)

    if (!field || field.closest('#table-rows, #term-rows')) {
      continue
    }

    data[key] = field.type === 'file' ? kpData[key] ?? '' : field.value
  }

  data['item-count'] = itemRowList.length
  data['term-count'] = termRowList.length

  itemRowList.forEach((row, index) => {
    const n = index + 1

    for (const key of ITEM_KEYS) {
      if (key === 'item-sum') {
        continue
      }

      data[`${key}-${n}`] = row.querySelector(`[name="${key}"]`)?.value ?? ''
    }
  })

  termRowList.forEach((row, index) => {
    const n = index + 1

    for (const key of TERM_KEYS) {
      data[`${key}-${n}`] = row.querySelector(`[name="${key}"]`)?.value ?? ''
    }
  })

  return data
}

const hasValue = (value) => String(value ?? '').trim() !== ''

const parseMoney = (value) => {
  const normalized = String(value ?? '')
    .replace(/\s/g, '')
    .replace(',', '.')
  const num = Number(normalized)

  return Number.isFinite(num) ? num : 0
}

const formatMoney = (value) => {
  const rounded = Math.round(value * 100) / 100
  const [intPart, frac] = rounded.toFixed(2).split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  if (frac === '00') {
    return `${grouped} руб.`
  }

  return `${grouped},${frac} руб.`
}

const formatRowSum = (value) => {
  const rounded = Math.round(value * 100) / 100
  const [intPart, frac] = rounded.toFixed(2).split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  if (frac === '00') {
    return grouped
  }

  return `${grouped},${frac}`
}

const fillItemSums = (data) => {
  const count = Number(data['item-count']) || 0
  const rows = [...tableRows.querySelectorAll(':scope > .kp-form__row')]

  for (let n = 1; n <= count; n += 1) {
    const qty = data[`item-qty-${n}`]
    const price = data[`item-price-${n}`]
    const formatted =
      hasValue(qty) && hasValue(price)
        ? formatRowSum(parseMoney(qty) * parseMoney(price))
        : ''

    data[`item-sum-${n}`] = formatted

    const view = rows[n - 1]?.querySelector('[data-item-sum]')

    if (view) {
      view.textContent = formatted
    }
  }
}

const sumItemTotals = () => {
  const count = Number(kpData['item-count']) || 0
  let total = 0

  for (let n = 1; n <= count; n += 1) {
    total += parseMoney(kpData[`item-sum-${n}`])
  }

  return total
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

const renderTablePreview = () => {
  const wrap = document.querySelector('.kp-table__wrap')
  const count = Number(kpData['item-count']) || 0
  let shown = 0

  wrap?.querySelectorAll('.kp-table__row').forEach((row) => row.remove())

  for (let n = 1; n <= count; n += 1) {
    const name = kpData[`item-name-${n}`]
    const unit = kpData[`item-unit-${n}`]
    const qty = kpData[`item-qty-${n}`]
    const price = kpData[`item-price-${n}`]
    const sum = kpData[`item-sum-${n}`]

    if (![name, unit, qty, price, sum].some(hasValue)) {
      continue
    }

    shown += 1
    const row = document.createElement('div')
    row.className = 'kp-table__row'
    row.innerHTML = `
      <div>${shown}</div>
      <div class="kp-table__name">${escapeHtml(name)}</div>
      <div>${escapeHtml(unit)}</div>
      <div>${escapeHtml(qty)}</div>
      <div>${escapeHtml(price)}</div>
      <div>${escapeHtml(sum)}</div>
    `
    wrap?.append(row)
  }

  const itemsTotal = sumItemTotals()
  kpData.total = String(itemsTotal)

  const totalField = form.querySelector('[name="total"]')
  const totalView = document.querySelector('.kp-total__value')

  if (totalField) {
    totalField.value = itemsTotal ? String(itemsTotal) : ''
  }

  if (totalView) {
    totalView.textContent = formatMoney(itemsTotal)
  }
}

const renderTermsPreview = () => {
  const list = document.querySelector('.kp-terms')

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

  renderTablePreview()
  renderTermsPreview()
}

const syncKpData = () => {
  const next = readKpDataFromForm()
  fillItemSums(next)

  for (const key of Object.keys(kpData)) {
    if (!(key in next)) {
      delete kpData[key]
    }
  }

  Object.assign(kpData, next)
  renderPreview()
}

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

  const itemCount = Number(data['item-count']) || 1
  const termCount = Number(data['term-count']) || 1

  tableRows.replaceChildren()
  termRows.replaceChildren()

  for (let n = 1; n <= itemCount; n += 1) {
    const row = createTableRow()

    for (const key of ITEM_KEYS) {
      if (key === 'item-sum') {
        continue
      }

      const input = row.querySelector(`[name="${key}"]`)

      if (input) {
        input.value = data[`${key}-${n}`] ?? ''
      }
    }

    tableRows.append(row)
  }

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

bindRepeater(tableRows, document.getElementById('add-row-btn'), createTableRow)
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

const hasQueryParams = () => [...getQueryParams().keys()].length > 0

document.getElementById('save-btn')?.addEventListener('click', async () => {
  syncKpData()

  const db = new KpDatabase(KP_TYPE, { ...kpData })
  const params = getQueryParams()

  if (!hasQueryParams()) {
    const id = await db.add()
    params.set('id', id)
    history.replaceState(null, '', `${window.location.pathname}?${params}`)
    return
  }

  const id = params.get('id')

  if (id) {
    await db.update(id)
  }
})

const boot = async () => {
  const id = getQueryParams().get('id')

  if (id) {
    const record = await new KpDatabase(KP_TYPE, {}).get(id)

    if (record?.data) {
      applyKpData(record.data)
      return
    }
  }

  syncKpData()
}

boot()
