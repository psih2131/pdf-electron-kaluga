import { KpDefaults } from '../../backend/db.js'

const KP_TYPE = 'kks-kp-1'

const form = document.querySelector('.kp-form')
const termRows = document.getElementById('term-rows')

const STATIC_KEYS = [
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
  'note',
  'footer-banner',
  'footer-phone',
  'footer-contacts',
  'sign-role',
  'sign-name'
]

const TERM_KEYS = ['term-label', 'term-value']

const createEmptyDefaults = () => {
  const data = {}

  for (const key of STATIC_KEYS) {
    data[key] = ''
  }

  data['term-count'] = 1
  data['term-label-1'] = ''
  data['term-value-1'] = ''

  return data
}

const defaultsData = createEmptyDefaults()

const getFileExt = (file) => {
  const name = file?.name ?? ''
  const dot = name.lastIndexOf('.')

  if (dot > 0 && dot < name.length - 1) {
    return name.slice(dot)
  }

  return ''
}

const hasValue = (value) => String(value ?? '').trim() !== ''

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

const readDefaultsFromForm = () => {
  const data = createEmptyDefaults()
  const termRowList = [...termRows.querySelectorAll(':scope > .kp-form__row')]

  for (const key of STATIC_KEYS) {
    const field = form.querySelector(`[name="${key}"]`)

    if (!field || field.closest('#term-rows')) {
      continue
    }

    data[key] = field.type === 'file' ? defaultsData[key] ?? '' : field.value
  }

  data['term-count'] = termRowList.length

  termRowList.forEach((row, index) => {
    const n = index + 1

    for (const key of TERM_KEYS) {
      data[`${key}-${n}`] = row.querySelector(`[name="${key}"]`)?.value ?? ''
    }
  })

  return data
}

const renderFileNameHints = () => {
  document.querySelectorAll('[data-file-name]').forEach((node) => {
    const name = defaultsData[node.dataset.fileName] ?? ''
    node.textContent = hasValue(name) ? name : ''
  })
}

const syncDefaults = () => {
  const next = readDefaultsFromForm()

  for (const key of Object.keys(defaultsData)) {
    if (!(key in next)) {
      delete defaultsData[key]
    }
  }

  Object.assign(defaultsData, next)
  renderFileNameHints()
}

const setFieldValue = (name, value) => {
  const field = form.querySelector(`[name="${name}"]`)

  if (!field || field.closest('#term-rows') || field.type === 'file') {
    return
  }

  field.value = value ?? ''
}

const applyDefaults = (data) => {
  for (const key of STATIC_KEYS) {
    setFieldValue(key, data[key] ?? '')
  }

  const termCount = Number(data['term-count']) || 1

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

  defaultsData['manager-photo'] = data['manager-photo'] ?? ''
  syncDefaults()
}

document.getElementById('add-term-btn')?.addEventListener('click', () => {
  termRows?.appendChild(createTermRow())
  syncDefaults()
})

termRows?.addEventListener('click', (event) => {
  const removeBtn = event.target.closest('.kp-form__remove')

  if (!removeBtn || !termRows.contains(removeBtn)) {
    return
  }

  const rows = termRows.querySelectorAll(':scope > .kp-form__row')

  if (rows.length < 2) {
    return
  }

  removeBtn.closest('.kp-form__row')?.remove()
  syncDefaults()
})

form?.addEventListener('input', () => {
  syncDefaults()
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

  defaultsData[field.name] = name
  field.value = ''
  syncDefaults()
})

const saveBtn = document.getElementById('save-defaults-btn')

saveBtn?.addEventListener('click', async () => {
  syncDefaults()
  saveBtn.disabled = true

  const label = saveBtn.querySelector('.header__btn-text')

  try {
    await new KpDefaults(KP_TYPE, { ...defaultsData }).save()

    if (label) {
      label.textContent = 'Сохранено'
    }

    window.setTimeout(() => {
      if (label) {
        label.textContent = 'Сохранить'
      }
    }, 1500)
  } catch (error) {
    console.error(error)

    if (label) {
      label.textContent = 'Ошибка'
    }
  } finally {
    saveBtn.disabled = false
  }
})

const boot = async () => {
  try {
    const record = await new KpDefaults(KP_TYPE, {}).get()

    if (record?.data) {
      applyDefaults(record.data)
      return
    }
  } catch (error) {
    console.error(error)
  }

  applyDefaults(createEmptyDefaults())
}

boot()
