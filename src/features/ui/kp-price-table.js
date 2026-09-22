import Preloader from '../ui/preloader.js'
import SystemNotifications from '../notifications/SystemNotifications.js'

export const ITEM_KEYS_ROW = ['item-name', 'item-unit', 'item-qty', 'item-price', 'item-sum']
export const ITEM_KEYS_ENTRY = [
  'item-name',
  'item-unit',
  'item-qty',
  'item-price',
  'item-sum',
  'item-extra',
]

export const AUTO_ITEM_KEYS_ROW = [
  'auto-item-name',
  'auto-item-unit',
  'auto-item-qty',
  'auto-item-price',
  'auto-item-sum',
  'auto-item-pricelist',
  'auto-item-margin',
  'auto-item-tech',
]

export const AUTO_EDIT_KEYS = [
  'auto-edit-title',
  'auto-edit-qty',
  'auto-edit-discount',
  'auto-edit-article',
]

export const isTableKey = (key) =>
  key === 'item-count' || key.startsWith('item-') || key === 'total'

export const isAutoTableKey = (key) =>
  key === 'autoCount' ||
  key === 'auto-item-count' ||
  key === 'auto-total' ||
  key === 'auto-profitability' ||
  key === 'auto-net-profit' ||
  key === 'auto-order-mass' ||
  key === 'auto-delivery-cost' ||
  key.startsWith('auto-item-') ||
  key.startsWith('auto-edit-')

export const hasValue = (value) => String(value ?? '').trim() !== ''

const formatAutoOrderMassDisplay = (value) => {
  const text = String(value ?? '').trim()

  if (!hasValue(text)) {
    return '—'
  }

  if (/\s*кг\.?\s*$/i.test(text)) {
    return text
  }

  return `${text} кг`
}

/** @param {Record<string, unknown>} data @param {number} [itemCount] */
export const seedEmptyAutoTableData = (data, itemCount = 1) => {
  data.autoCount = false
  data['auto-item-count'] = itemCount
  data['auto-total'] = ''
  data['auto-profitability'] = ''
  data['auto-net-profit'] = ''
  data['auto-order-mass'] = ''
  data['auto-delivery-cost'] = ''

  for (let n = 1; n <= itemCount; n += 1) {
    for (const key of AUTO_ITEM_KEYS_ROW) {
      data[`${key}-${n}`] = ''
    }

    for (const key of AUTO_EDIT_KEYS) {
      data[`${key}-${n}`] = ''
    }
  }
}

const readonlyDisplayText = (root, selector) => {
  const text = root.querySelector(selector)?.textContent?.trim() ?? ''

  return text === '—' ? '' : text
}

const setReadonlyDisplay = (root, selector, value) => {
  const node = root.querySelector(selector)

  if (node) {
    node.textContent = hasValue(value) ? value : '—'
  }
}

/**
 * Проверяет, что во всех авто-строках заполнены наименование и количество.
 * @param {NodeListOf<Element> | Element[]} items
 * @returns {boolean} true — всё заполнено, false — хотя бы одно поле пустое
 */
export const validateAutoTableRowsFilled = (items) => {
  const list = items?.length != null ? [...items] : []

  if (list.length === 0) {
    return false
  }

  for (const item of list) {
    const title = item.querySelector('[name="auto-item-title"]')?.value ?? ''
    const qty = item.querySelector('[name="auto-item-qty"]')?.value ?? ''

    if (!hasValue(title) || !hasValue(qty)) {
      return false
    }
  }

  return true
}

/**
 * @param {Element} item `.kp-form__auto-item`
 * @param {string[]} rowValues строка из Google Sheets (D…R)
 */
export const fillAutoReadonlyRowFromSheet = (item, rowValues) => {
  if (!item || !rowValues?.length) {
    return
  }

  const pick = (index) => String(rowValues[index] ?? '').trim()

  const set = (selector, text) => {
    const node = item.querySelector(selector)

    if (node) {
      node.textContent = text || '—'
    }
  }

  set('[data-auto-out-name]', pick(0))
  set('[data-auto-out-unit]', pick(1))
  set('[data-auto-out-qty]', pick(2))
  set('[data-auto-out-price]', pick(11))
  set('[data-auto-out-sum]', pick(12))
  set('[data-auto-out-pricelist]', pick(4))
  set('[data-auto-out-margin]', pick(9))
  set('[data-auto-out-tech]', pick(14))
}

/** @param {NodeListOf<Element> | Element[]} items @param {string[][]} sheetValues */
export const fillAutoReadonlyRowsFromSheet = (items, sheetValues) => {
  const rows = sheetValues ?? []

  for (let i = 0; i < items.length; i += 1) {
    fillAutoReadonlyRowFromSheet(items[i], rows[i])
  }
}

export const parseMoney = (value) => {
  const normalized = String(value ?? '')
    .replace(/\s/g, '')
    .replace(',', '.')
  const num = Number(normalized)

  return Number.isFinite(num) ? num : 0
}

export const formatMoney = (value) => {
  const rounded = Math.round(value * 100) / 100
  const [intPart, frac] = rounded.toFixed(2).split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  if (frac === '00') {
    return `${grouped} руб.`
  }

  return `${grouped},${frac} руб.`
}

export const formatRowSum = (value) => {
  const rounded = Math.round(value * 100) / 100
  const [intPart, frac] = rounded.toFixed(2).split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  if (frac === '00') {
    return grouped
  }

  return `${grouped},${frac}`
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

/** @param {{ raw?: { values?: unknown[][] } } | null | undefined} response */
const firstSheetCellText = (response) => {
  const cell = response?.raw?.values?.[0]?.[0]

  return cell != null ? String(cell).trim() : ''
}

const pageBody = (page) => page.querySelector('.kp-body')

/** @param {HTMLInputElement} field @param {'int' | 'decimal'} mode */
const restrictNumericField = (field, mode) => {
  field.value =
    mode === 'int' ? field.value.replace(/\D/g, '') : field.value.replace(/[^\d.,]/g, '')
}

export class KpPriceTable {
  #layoutFrame = 0
  #tableMode = 'manual'
  #tableModeReady = false

  /**
   * @param {{ variant: 'row' | 'entry', tableRows: HTMLElement, form: HTMLElement, kpData: Record<string, string>, onSync?: () => void }} options
   */
  constructor({ variant, tableRows, form, kpData, onSync }) {
    this.variant = variant
    this.tableRows = tableRows
    this.form = form
    this.kpData = kpData
    this.onSync = onSync ?? (() => {})

    this.itemKeys = variant === 'entry' ? ITEM_KEYS_ENTRY : ITEM_KEYS_ROW
    this.pieceClass = variant === 'entry' ? 'kp-table__entry' : 'kp-table__row'
    this.formRowSelector =
      variant === 'entry' ? ':scope > .kp-form__item' : ':scope > .kp-form__row'
    this.removeClosestSelector = variant === 'entry' ? '.kp-form__item' : '.kp-form__row'
    this.autoTableRows = null
    this.manualPanel = null
    this.autoPanel = null
  }

  createTableRow() {
    if (this.variant === 'entry') {
      const row = document.createElement('div')
      row.className = 'kp-form__item'
      row.innerHTML = `
    <div class="kp-form__row">
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
    </div>
    <label class="kp-form__field kp-form__field--extra">
      <span>Доп. информация</span>
      <textarea name="item-extra" rows="4" placeholder="- пункт 1&#10;- пункт 2"></textarea>
    </label>
  `
      return row
    }

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

  createAutoTableRow() {
    const item = document.createElement('div')
    item.className = 'kp-form__auto-item'
    item.innerHTML = `
    <div class="kp-form__row kp-form__row--readonly">
      <label class="kp-form__field">
        <span>Наименование</span>
        <span class="kp-form__readonly" data-auto-out-name>—</span>
      </label>
      <label class="kp-form__field">
        <span>Ед. изм.</span>
        <span class="kp-form__readonly" data-auto-out-unit>—</span>
      </label>
      <label class="kp-form__field">
        <span>Кол-во</span>
        <span class="kp-form__readonly" data-auto-out-qty>—</span>
      </label>
      <label class="kp-form__field">
        <span>Цена за ед.</span>
        <span class="kp-form__readonly" data-auto-out-price>—</span>
      </label>
      <label class="kp-form__field">
        <span>Цена итого</span>
        <span class="kp-form__readonly" data-auto-out-sum>—</span>
      </label>
      <button class="kp-form__remove" type="button" aria-label="Удалить строку">×</button>
    </div>
    <div class="kp-form__row kp-form__row--readonly kp-form__row--readonly-meta">
      <label class="kp-form__field">
        <span>Стоимость по прайсу</span>
        <span class="kp-form__readonly" data-auto-out-pricelist>—</span>
      </label>
      <label class="kp-form__field">
        <span>Маржа</span>
        <span class="kp-form__readonly" data-auto-out-margin>—</span>
      </label>
      <label class="kp-form__field kp-form__field--wide">
        <span>Тех. пол</span>
        <span class="kp-form__readonly" data-auto-out-tech>—</span>
      </label>
    </div>
    <div class="kp-form__auto-editor">
      <label class="kp-form__field">
        <span>Наименование товара</span>
        <input
          type="text"
          name="auto-item-title"
          autocomplete="off"
          placeholder="Ролик конвейерный 127х310х350 мм. Подшипник: 305"
        />
      </label>
      <label class="kp-form__field">
        <span>Количество</span>
        <input class="js-num" type="text" inputmode="decimal" name="auto-item-qty" autocomplete="off" />
      </label>
      <label class="kp-form__field">
        <span>Скидка</span>
        <input class="js-num" type="text" inputmode="decimal" name="auto-item-discount" autocomplete="off" placeholder="%" />
      </label>
      <label class="kp-form__field">
        <span>Текстовый артикул</span>
        <input type="text" name="auto-item-article" autocomplete="off" placeholder="3А-2В" />
      </label>
    </div>
  `
    return item
  }

  #ensureAutoRowsSeed() {
    if (!this.autoTableRows || this.autoTableRows.children.length > 0) {
      return
    }

    this.autoTableRows.appendChild(this.createAutoTableRow())
  }

  getTableMode() {
    return this.#tableMode
  }

  #setTableMode(mode, { sync = false } = {}) {
    this.#tableMode = mode
    const isManual = mode === 'manual'

    this.manualPanel?.toggleAttribute('hidden', !isManual)
    this.autoPanel?.toggleAttribute('hidden', isManual)

    this.tableRows?.closest('.kp-table-block')?.querySelectorAll('[data-table-mode]').forEach((btn) => {
      const active = btn.getAttribute('data-table-mode') === mode
      btn.classList.toggle('is-active', active)
      btn.setAttribute('aria-pressed', active ? 'true' : 'false')
    })

    if (!isManual) {
      this.#ensureAutoRowsSeed()
    }

    if (sync) {
      this.onSync()
    }
  }

  #initTableModeUI() {
    if (this.#tableModeReady) {
      return
    }

    const block = this.tableRows?.closest('.kp-table-block')

    if (!block) {
      return
    }

    this.#tableModeReady = true
    this.manualPanel = block.querySelector('[data-table-mode-panel="manual"]')
    this.autoPanel = block.querySelector('[data-table-mode-panel="auto"]')
    this.autoTableRows = block.querySelector('#table-rows-auto')

    block.querySelectorAll('[data-table-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-table-mode')

        if (mode === 'manual' || mode === 'auto') {
          this.#setTableMode(mode, { sync: true })
        }
      })
    })

    block.querySelector('#add-auto-row-btn')?.addEventListener('click', () => {
      this.autoTableRows?.appendChild(this.createAutoTableRow())
    })
    


    // TODO: Добавить расчёт стоимости доставки в Google Sheets
    block.querySelector('#auto-calc-run-btn')?.addEventListener('click', async () => {

      const preloader = new Preloader()
      // Ролик конвейерный 127х310х350 мм. Подшипник: 305

      try {
        const items = this.autoTableRows?.querySelectorAll(':scope > .kp-form__auto-item') ?? []
        const START_ROW = 7
        const END_ROW = items.length > 0 ? items.length + START_ROW - 1 : START_ROW

        if (!validateAutoTableRowsFilled(items)) {
          new SystemNotifications(
            'error',
            'Заполните наименование товара и количество во всех строках'
          ).CreateNotification()
          return
        }

        preloader.startPreloader()
        await window.kaluga.clearSheetColumnsDAndQ()
        console.log('Очистка столбцов D, F, J, Q (7–36) и G42')

        // Заполнение столбцов D, F, J, Q
        for (let i = 0; i < items.length; i += 1) {
          const item = items[i]
          const sheetRow = String(START_ROW + i)
          const title = item.querySelector('[name="auto-item-title"]')?.value ?? ''
          const qty = item.querySelector('[name="auto-item-qty"]')?.value ?? ''
          const discount = item.querySelector('[name="auto-item-discount"]')?.value ?? ''
          const article = item.querySelector('[name="auto-item-article"]')?.value ?? ''

          await window.kaluga.updateSheetData({ field: `D${sheetRow}`, value: title })
          await window.kaluga.updateSheetData({ field: `F${sheetRow}`, value: qty })

          if (discount) {
            await window.kaluga.updateSheetData({ field: `J${sheetRow}`, value: discount })
          }

          if (article) {
            await window.kaluga.updateSheetData({ field: `Q${sheetRow}`, value: article })
          }
        }

        const deliveryCost = this.#readAutoDeliveryCost()

        this.kpData['auto-delivery-cost'] = deliveryCost

        if (deliveryCost && parseMoney(deliveryCost) > 0) {
          await window.kaluga.updateSheetDeliveryPrices(deliveryCost)
        }

        const googleGetData = await window.kaluga.getSheetData(`D${START_ROW}:R${END_ROW}`)
        console.log('Получение данных из Google Sheets для колонок', googleGetData)


        const totalSumResponse = await window.kaluga.getSheetData('P37:P38')
        console.log('Получение общей стоимости из колонки P37:P38', totalSumResponse)

        const profitabilityResponse = await window.kaluga.getSheetData('G46:G46')
        console.log('Получение рентабельности из колонки G46', profitabilityResponse)

        const netProfitResponse = await window.kaluga.getSheetData('G47:G47')
        console.log('Получение чистой прибыли из колонки G47', netProfitResponse)

        const orderMassResponse = await window.kaluga.getSheetData('G41:G41')
        console.log('Получение общей массы из колонки G41', orderMassResponse)

        const sheetRows = googleGetData?.raw?.values ?? []
        fillAutoReadonlyRowsFromSheet(items, sheetRows)

        const totalText = firstSheetCellText(totalSumResponse)

        if (totalText) {
          this.kpData['auto-total'] = totalText
        }

        const profitabilityText = firstSheetCellText(profitabilityResponse)

        if (profitabilityText) {
          this.kpData['auto-profitability'] = profitabilityText
        }

        const netProfitText = firstSheetCellText(netProfitResponse)

        if (netProfitText) {
          this.kpData['auto-net-profit'] = netProfitText
        }

        const orderMassText = firstSheetCellText(orderMassResponse)

        if (orderMassText) {
          this.kpData['auto-order-mass'] = orderMassText
        }

        this.#syncAutoSummaryDisplay()
        this.readAutoTableInto(this.kpData)
        this.onSync()

      } catch (error) {
        console.error(error)
        preloader.endPreloader()
      }
      finally{
        preloader.endPreloader()
      }
    })

    this.autoPanel?.addEventListener('input', (event) => {
      const field = event.target

      if (!(field instanceof HTMLInputElement)) {
        return
      }

      if (field.classList.contains('js-num-int')) {
        restrictNumericField(field, 'int')
        return
      }

      if (field.classList.contains('js-num')) {
        restrictNumericField(field, 'decimal')
      }

      if (field.name === 'auto-delivery-cost') {
        this.kpData['auto-delivery-cost'] = field.value.trim()
        this.onSync()
      }
    })

    this.autoTableRows?.addEventListener('click', (event) => {
      const removeBtn = event.target.closest('.kp-form__remove')

      if (!removeBtn || !this.autoTableRows.contains(removeBtn)) {
        return
      }

      const items = this.autoTableRows.querySelectorAll(':scope > .kp-form__auto-item')

      if (items.length < 2) {
        return
      }

      removeBtn.closest('.kp-form__auto-item')?.remove()
    })

    this.#setTableMode('manual')
  }

  getFormItemRows() {
    return [...this.tableRows.querySelectorAll(this.formRowSelector)]
  }

  readItemsInto(data, itemRowList = this.getFormItemRows()) {
    data['item-count'] = itemRowList.length

    itemRowList.forEach((row, index) => {
      const n = index + 1

      for (const key of this.itemKeys) {
        if (key === 'item-sum') {
          continue
        }

        data[`${key}-${n}`] = row.querySelector(`[name="${key}"]`)?.value ?? ''
      }
    })
  }

  #readAutoDeliveryCost() {
    const block = this.tableRows?.closest('.kp-table-block')

    return block?.querySelector('[name="auto-delivery-cost"]')?.value?.trim() ?? ''
  }

  #syncAutoSummaryDisplay() {
    const block = this.tableRows?.closest('.kp-table-block')

    if (!block) {
      return
    }

    const pairs = [
      ['[data-auto-out-total]', 'auto-total'],
      ['[data-auto-out-profitability]', 'auto-profitability'],
      ['[data-auto-out-net-profit]', 'auto-net-profit'],
      ['[data-auto-out-order-mass]', 'auto-order-mass'],
    ]

    for (const [selector, dataKey] of pairs) {
      const node = block.querySelector(selector)
      const text = String(this.kpData[dataKey] ?? '').trim()

      if (node) {
        node.textContent =
          dataKey === 'auto-order-mass'
            ? formatAutoOrderMassDisplay(text)
            : hasValue(text)
              ? text
              : '—'
      }
    }
  }

  readAutoTableInto(data) {
    const items = this.autoTableRows?.querySelectorAll(':scope > .kp-form__auto-item') ?? []
    const deliveryCost = this.#readAutoDeliveryCost()

    data.autoCount = this.getTableMode() === 'auto'
    data['auto-item-count'] = items.length
    data['auto-delivery-cost'] = deliveryCost
    this.kpData['auto-delivery-cost'] = deliveryCost

    data['auto-total'] = this.kpData['auto-total'] ?? ''
    data['auto-profitability'] = this.kpData['auto-profitability'] ?? ''
    data['auto-net-profit'] = this.kpData['auto-net-profit'] ?? ''
    data['auto-order-mass'] = this.kpData['auto-order-mass'] ?? ''

    items.forEach((item, index) => {
      const n = index + 1

      data[`auto-item-name-${n}`] = readonlyDisplayText(item, '[data-auto-out-name]')
      data[`auto-item-unit-${n}`] = readonlyDisplayText(item, '[data-auto-out-unit]')
      data[`auto-item-qty-${n}`] = readonlyDisplayText(item, '[data-auto-out-qty]')
      data[`auto-item-price-${n}`] = readonlyDisplayText(item, '[data-auto-out-price]')
      data[`auto-item-sum-${n}`] = readonlyDisplayText(item, '[data-auto-out-sum]')
      data[`auto-item-pricelist-${n}`] = readonlyDisplayText(item, '[data-auto-out-pricelist]')
      data[`auto-item-margin-${n}`] = readonlyDisplayText(item, '[data-auto-out-margin]')
      data[`auto-item-tech-${n}`] = readonlyDisplayText(item, '[data-auto-out-tech]')

      data[`auto-edit-title-${n}`] = item.querySelector('[name="auto-item-title"]')?.value ?? ''
      data[`auto-edit-qty-${n}`] = item.querySelector('[name="auto-item-qty"]')?.value ?? ''
      data[`auto-edit-discount-${n}`] =
        item.querySelector('[name="auto-item-discount"]')?.value ?? ''
      data[`auto-edit-article-${n}`] =
        item.querySelector('[name="auto-item-article"]')?.value ?? ''
    })
  }

  applyAutoTableFrom(data) {
    const itemCount = Number(data['auto-item-count']) || 1

    this.autoTableRows?.replaceChildren()

    for (let n = 1; n <= itemCount; n += 1) {
      const row = this.createAutoTableRow()

      setReadonlyDisplay(row, '[data-auto-out-name]', data[`auto-item-name-${n}`])
      setReadonlyDisplay(row, '[data-auto-out-unit]', data[`auto-item-unit-${n}`])
      setReadonlyDisplay(row, '[data-auto-out-qty]', data[`auto-item-qty-${n}`])
      setReadonlyDisplay(row, '[data-auto-out-price]', data[`auto-item-price-${n}`])
      setReadonlyDisplay(row, '[data-auto-out-sum]', data[`auto-item-sum-${n}`])
      setReadonlyDisplay(row, '[data-auto-out-pricelist]', data[`auto-item-pricelist-${n}`])
      setReadonlyDisplay(row, '[data-auto-out-margin]', data[`auto-item-margin-${n}`])
      setReadonlyDisplay(row, '[data-auto-out-tech]', data[`auto-item-tech-${n}`])

      const title = row.querySelector('[name="auto-item-title"]')
      const qty = row.querySelector('[name="auto-item-qty"]')
      const discount = row.querySelector('[name="auto-item-discount"]')
      const article = row.querySelector('[name="auto-item-article"]')

      if (title) {
        title.value = data[`auto-edit-title-${n}`] ?? ''
      }

      if (qty) {
        qty.value = data[`auto-edit-qty-${n}`] ?? ''
      }

      if (discount) {
        discount.value = data[`auto-edit-discount-${n}`] ?? ''
      }

      if (article) {
        article.value = data[`auto-edit-article-${n}`] ?? ''
      }

      this.autoTableRows?.append(row)
    }

    const delivery = this.form.querySelector('[name="auto-delivery-cost"]')

    const deliveryValue = data['auto-delivery-cost'] ?? ''

    if (delivery) {
      delivery.value = deliveryValue
    }

    this.kpData['auto-delivery-cost'] = deliveryValue
    this.kpData['auto-total'] = data['auto-total'] ?? ''
    this.kpData['auto-profitability'] = data['auto-profitability'] ?? ''
    this.kpData['auto-net-profit'] = data['auto-net-profit'] ?? ''
    this.kpData['auto-order-mass'] = data['auto-order-mass'] ?? ''
    this.#syncAutoSummaryDisplay()

    if (!this.#tableModeReady) {
      this.#initTableModeUI()
    }

    this.#setTableMode(data.autoCount === true || data.autoCount === 'true' ? 'auto' : 'manual')
  }

  fillItemSums(data) {
    const count = Number(data['item-count']) || 0
    const rows = this.getFormItemRows()

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

  sumItemTotals() {
    const count = Number(this.kpData['item-count']) || 0
    let total = 0

    for (let n = 1; n <= count; n += 1) {
      total += parseMoney(this.kpData[`item-sum-${n}`])
    }

    return total
  }

  applyItemsFrom(data) {
    const itemCount = Number(data['item-count']) || 1

    this.tableRows.replaceChildren()

    for (let n = 1; n <= itemCount; n += 1) {
      const row = this.createTableRow()

      for (const key of this.itemKeys) {
        if (key === 'item-sum') {
          continue
        }

        const input = row.querySelector(`[name="${key}"]`)

        if (input) {
          input.value = data[`${key}-${n}`] ?? ''
        }
      }

      this.tableRows.append(row)
    }
  }

  bindAddRow(addBtn) {
    this.#initTableModeUI()

    addBtn?.addEventListener('click', () => {
      this.tableRows?.appendChild(this.createTableRow())
      this.onSync()
    })

    this.tableRows?.addEventListener('click', (event) => {
      const removeBtn = event.target.closest('.kp-form__remove')

      if (!removeBtn || !this.tableRows.contains(removeBtn)) {
        return
      }

      const rows = this.tableRows.querySelectorAll(this.formRowSelector)

      if (rows.length < 2) {
        return
      }

      removeBtn.closest(this.removeClosestSelector)?.remove()
      this.onSync()
    })
  }

  #renderRowPreview(wrap, shown, name, unit, qty, price, sum) {
    const row = document.createElement('div')
    row.className = shown % 2 === 0 ? 'kp-table__row kp-table__row--alt' : 'kp-table__row'
    row.innerHTML = `
      <div>${shown}</div>
      <div class="kp-table__name">${escapeHtml(name)}</div>
      <div>${escapeHtml(unit)}</div>
      <div>${escapeHtml(qty)}</div>
      <div>${escapeHtml(hasValue(price) ? formatRowSum(parseMoney(price)) : '')}</div>
      <div>${escapeHtml(sum)}</div>
    `
    wrap?.append(row)
  }

  #renderEntryPreview(wrap, shown, name, unit, qty, price, sum, extra) {
    const entry = document.createElement('div')
    entry.className = 'kp-table__entry'
    entry.innerHTML = `
      <div class="kp-table__row">
        <div>${shown}</div>
        <div class="kp-table__name">${escapeHtml(name)}</div>
        <div>${escapeHtml(unit)}</div>
        <div>${escapeHtml(qty)}</div>
        <div>${escapeHtml(hasValue(price) ? formatRowSum(parseMoney(price)) : '')}</div>
        <div>${escapeHtml(sum)}</div>
      </div>
      ${
        hasValue(extra)
          ? `<div class="kp-table__row-extra">${escapeHtml(extra)}</div>`
          : ''
      }
    `
    wrap?.append(entry)
  }

  #renderAutoRowPreview(wrap, shown, name, unit, qty, price, sum) {
    const row = document.createElement('div')
    row.className = shown % 2 === 0 ? 'kp-table__row kp-table__row--alt' : 'kp-table__row'
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

  renderTablePreview() {
    const wrap = document.querySelector('.kp-pages > .kp:not(.kp--clone) .kp-table__wrap')
    const useAuto = Boolean(this.kpData.autoCount)
    let shown = 0

    wrap?.querySelectorAll(`.${this.pieceClass}`).forEach((node) => node.remove())

    if (useAuto) {
      const count = Number(this.kpData['auto-item-count']) || 0

      for (let n = 1; n <= count; n += 1) {
        const name = this.kpData[`auto-item-name-${n}`]
        const unit = this.kpData[`auto-item-unit-${n}`]
        const qty = this.kpData[`auto-item-qty-${n}`]
        const price = this.kpData[`auto-item-price-${n}`]
        const sum = this.kpData[`auto-item-sum-${n}`]

        if (![name, unit, qty, price, sum].some(hasValue)) {
          continue
        }

        shown += 1

        if (this.variant === 'entry') {
          this.#renderEntryPreview(wrap, shown, name, unit, qty, price, sum, '')
        } else {
          this.#renderAutoRowPreview(wrap, shown, name, unit, qty, price, sum)
        }
      }

      const autoTotalText = this.kpData['auto-total'] ?? ''
      const totalField = this.form.querySelector('[name="total"]')
      const totalView = document.querySelector('.kp-total__value')

      if (totalField) {
        totalField.value = autoTotalText
      }

      if (totalView) {
        totalView.textContent = hasValue(autoTotalText) ? autoTotalText : formatMoney(0)
      }

      return
    }

    const count = Number(this.kpData['item-count']) || 0

    for (let n = 1; n <= count; n += 1) {
      const name = this.kpData[`item-name-${n}`]
      const unit = this.kpData[`item-unit-${n}`]
      const qty = this.kpData[`item-qty-${n}`]
      const price = this.kpData[`item-price-${n}`]
      const sum = this.kpData[`item-sum-${n}`]

      if (![name, unit, qty, price, sum].some(hasValue)) {
        continue
      }

      shown += 1

      if (this.variant === 'entry') {
        const extra = this.kpData[`item-extra-${n}`]
        this.#renderEntryPreview(wrap, shown, name, unit, qty, price, sum, extra)
      } else {
        this.#renderRowPreview(wrap, shown, name, unit, qty, price, sum)
      }
    }

    const itemsTotal = this.sumItemTotals()
    this.kpData.total = String(itemsTotal)

    const totalField = this.form.querySelector('[name="total"]')
    const totalView = document.querySelector('.kp-total__value')

    if (totalField) {
      totalField.value = itemsTotal ? String(itemsTotal) : ''
    }

    if (totalView) {
      totalView.textContent = formatMoney(itemsTotal)
    }
  }

  #getFirstKpPage() {
    return document.querySelector('.kp-pages > .kp:not(.kp--clone)')
  }

  resetKpPages() {
    const first = this.#getFirstKpPage()

    if (!first) {
      return first
    }

    const wrap = first.querySelector('.kp-table__wrap')
    const table = first.querySelector('.kp-table')
    const body = pageBody(first)
    const pieceSelector = `.${this.pieceClass}`

    document.querySelectorAll('.kp--clone').forEach((clone) => {
      clone.querySelectorAll(pieceSelector).forEach((piece) => {
        wrap?.append(piece)
      })

      const total = clone.querySelector('.kp-total')

      if (total) {
        if (first.querySelector('.kp-total')) {
          total.remove()
        } else {
          table?.append(total)
        }
      }

      const after = clone.querySelector('.kp-after')

      if (after) {
        if (first.querySelector('.kp-after')) {
          after.remove()
        } else {
          body?.append(after)
        }
      }

      clone.remove()
    })

    return first
  }

  #pageOverflows(page) {
    const body = pageBody(page)

    if (!body) {
      return false
    }

    void page.offsetHeight

    return body.scrollHeight > body.clientHeight + 1
  }

  #lastMovablePiece(page) {
    const after = page.querySelector('.kp-after')

    if (after && !after.hidden) {
      const note = after.querySelector('.kp-note')
      const hasNote = Boolean(note && !note.hidden)
      const hasTerms = Boolean(after.querySelector('.kp-term'))

      if (hasNote || hasTerms) {
        return after
      }
    }

    const total = page.querySelector('.kp-total')

    if (total) {
      return total
    }

    const pieces = [...page.querySelectorAll(`.${this.pieceClass}`)]

    return pieces.at(-1) ?? null
  }

  #placePieceOnPage(page, piece) {
    if (piece.classList.contains(this.pieceClass)) {
      const table = page.querySelector('.kp-table')
      const wrap = page.querySelector('.kp-table__wrap')
      const firstPiece = wrap?.querySelector(`.${this.pieceClass}`)

      setHidden(table, false)

      if (firstPiece) {
        wrap.insertBefore(piece, firstPiece)
      } else {
        wrap?.append(piece)
      }

      return
    }

    if (piece.classList.contains('kp-total')) {
      const table = page.querySelector('.kp-table')
      setHidden(table, false)
      table?.append(piece)
      return
    }

    if (piece.classList.contains('kp-after')) {
      pageBody(page)?.append(piece)
    }
  }

  #makeContinuedPage(source) {
    const page = source.cloneNode(true)
    const pieceSelector = `.${this.pieceClass}`

    page.classList.add('kp--clone', 'kp--continued')
    page.querySelectorAll(pieceSelector).forEach((piece) => piece.remove())
    page.querySelector('.kp-total')?.remove()
    page.querySelector('.kp-after')?.remove()

    return page
  }

  #finishKpPages() {
    const pages = [...document.querySelectorAll('.kp-pages .kp')]
    const pieceSelector = `.${this.pieceClass}`

    pages.forEach((page, index) => {
      const isLast = index === pages.length - 1
      const table = page.querySelector('.kp-table')
      const after = page.querySelector('.kp-after')
      const terms = page.querySelector('.kp-terms')
      const hasRows = Boolean(page.querySelector(pieceSelector))
      const hasTotal = Boolean(page.querySelector('.kp-total'))
      const hasTerms = Boolean(page.querySelector('.kp-term'))
      const note = page.querySelector('.kp-note')
      const hasNote = Boolean(note && !note.hidden)

      setHidden(table, page.classList.contains('kp--continued') && !hasRows && !hasTotal)
      setHidden(terms, !hasTerms)
      setHidden(after, !hasNote && !hasTerms)

      const sign = page.querySelector('.kp-sign')

      if (sign) {
        setHidden(
          sign,
          !isLast ||
            !['sign-role', 'sign-name'].some((key) => hasValue(this.kpData[key]))
        )
      }
    })
  }

  layoutKpPages() {
    const first = this.resetKpPages()

    if (!first) {
      return
    }

    let current = first
    let guard = 0
    const pieceSelector = `${this.pieceClass}, .kp-total, .kp-after`

    while (guard < 30) {
      guard += 1

      if (!this.#pageOverflows(current)) {
        const next = current.nextElementSibling

        if (next?.classList.contains('kp--clone') && this.#pageOverflows(next)) {
          current = next
          continue
        }

        break
      }

      let next = current.nextElementSibling

      if (!next?.classList.contains('kp--clone')) {
        next = this.#makeContinuedPage(first)
        current.after(next)
      }

      const piece = this.#lastMovablePiece(current)

      if (!piece) {
        break
      }

      this.#placePieceOnPage(next, piece)

      const nextPieces = next.querySelectorAll(pieceSelector)

      if (this.#pageOverflows(next) && nextPieces.length <= 1) {
        break
      }
    }

    this.#finishKpPages()
  }

  scheduleKpLayout() {
    this.#layoutFrame += 1
    const frame = this.#layoutFrame

    requestAnimationFrame(() => {
      if (frame === this.#layoutFrame) {
        this.layoutKpPages()
      }
    })
  }
}
