import KP_TEMPLATES from '../../config/kpTemplates.json' with { type: 'json' }

const FILTER_ALL = 'all'

const SORT = {
  DEFAULT: 'default',
  OLDEST: 'oldest',
  NEWEST: 'newest',
}

class DocsListControls {
  #activeType = FILTER_ALL
  #sort = SORT.DEFAULT

  constructor({ filtersContainer, sortSelect, listContainer, createButton }) {
    this.filtersContainer = filtersContainer
    this.sortSelect = sortSelect
    this.listContainer = listContainer
    this.createButton = createButton

    this.#renderFilters()
    this.#bindEvents()
  }

  apply() {
    const cards = [...this.listContainer.querySelectorAll('.card:not(.card--create)')]
    const visibleCards = cards
      .filter((card) => this.#matchesType(card))
      .sort((a, b) => this.#compareCards(a, b))

    cards.forEach((card) => {
      card.hidden = true
    })

    visibleCards.forEach((card) => {
      card.hidden = false
      this.listContainer.insertBefore(card, this.createButton)
    })
  }

  #renderFilters() {
    if (!this.filtersContainer) {
      return
    }

    const filters = [
      { type: FILTER_ALL, name: 'Все' },
      ...KP_TEMPLATES.map(({ type, name, color }) => ({ type, name, color })),
    ]

    this.filtersContainer.innerHTML = filters
      .map(({ type, name, color }) => {
        const isActive = type === this.#activeType
        const accent = color ? ` style="--filter-accent: ${color}"` : ''

        return `
          <button
            class="docs-toolbar__filter${isActive ? ' is-active' : ''}"
            type="button"
            role="tab"
            aria-selected="${isActive}"
            data-filter-type="${type}"${accent}
          >
            ${name}
          </button>
        `
      })
      .join('')
  }

  #bindEvents() {
    this.filtersContainer?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter-type]')

      if (!button) {
        return
      }

      this.#setActiveType(button.dataset.filterType)
      this.apply()
    })

    this.sortSelect?.addEventListener('change', () => {
      this.#sort = this.sortSelect.value
      this.apply()
    })
  }

  #setActiveType(type) {
    this.#activeType = type

    this.filtersContainer
      ?.querySelectorAll('[data-filter-type]')
      .forEach((button) => {
        const isActive = button.dataset.filterType === type
        button.classList.toggle('is-active', isActive)
        button.setAttribute('aria-selected', String(isActive))
      })
  }

  #matchesType(card) {
    if (this.#activeType === FILTER_ALL) {
      return true
    }

    return card.getAttribute('data-kp-type') === this.#activeType
  }

  #compareCards(a, b) {
    const createdA = Number(a.dataset.createdAt) || 0
    const createdB = Number(b.dataset.createdAt) || 0
    const updatedA = Number(a.dataset.updatedAt) || 0
    const updatedB = Number(b.dataset.updatedAt) || 0

    switch (this.#sort) {
      case SORT.OLDEST:
        return createdA - createdB
      case SORT.NEWEST:
        return createdB - createdA
      case SORT.DEFAULT:
      default:
        return updatedB - updatedA
    }
  }
}

export default DocsListControls
