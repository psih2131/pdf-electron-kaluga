import { KpDatabase } from './backend/db.js'

const KP_PAGES = {
  'kks-kp-1': 'offers/kks-kp-1.html'
}

const createBtn = document.getElementById('create-btn')
const modal = document.getElementById('template-modal')
const docs = document.querySelector('.docs')
const countLabel = document.querySelector('.header__count')

const openModal = () => {
  modal.hidden = false
}

const closeModal = () => {
  modal.hidden = true
}

const formatDocsCount = (count) => {
  const abs = Math.abs(count) % 100
  const last = abs % 10

  if (abs > 10 && abs < 20) {
    return `${count} документов`
  }

  if (last === 1) {
    return `${count} документ`
  }

  if (last > 1 && last < 5) {
    return `${count} документа`
  }

  return `${count} документов`
}

const getKpName = (record) => {
  const name = String(record?.data?.['kp-name'] ?? '').trim()
  return name || 'Без названия'
}

const getKpHref = (record) => {
  const page = KP_PAGES[record.type] ?? 'offers/kks-kp-1.html'
  return `${page}?id=${encodeURIComponent(record.id)}`
}

const createKpCard = (record) => {
  const card = document.createElement('a')
  card.className = 'card'
  card.href = getKpHref(record)
  card.innerHTML = `
    <div class="card__preview" aria-hidden="true">
      <span class="card__line"></span>
      <span class="card__line card__line--short"></span>
      <span class="card__line"></span>
      <span class="card__line card__line--mid"></span>
    </div>
    <h2 class="card__name"></h2>
  `
  card.querySelector('.card__name').textContent = getKpName(record)
  return card
}

const renderKpList = async () => {
  const records = await new KpDatabase('', {}).getAll()

  docs.querySelectorAll('a.card').forEach((card) => card.remove())

  records
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    .forEach((record) => {
      docs.insertBefore(createKpCard(record), createBtn)
    })

  if (countLabel) {
    countLabel.textContent = formatDocsCount(records.length)
  }
}

createBtn.addEventListener('click', openModal)

modal.addEventListener('click', (event) => {
  const template = event.target.closest('[data-template]')

  if (template) {
    window.location.href = template.dataset.template
    return
  }

  if (event.target.closest('[data-close-modal]')) {
    closeModal()
  }
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.hidden) {
    closeModal()
  }
})

renderKpList()
