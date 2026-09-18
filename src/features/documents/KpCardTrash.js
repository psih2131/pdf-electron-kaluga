class KpCardTrash {
    constructor(record, {
        onRestore,
        onDelete
    }) {
        this.record = record
        this.onRestore = onRestore
        this.onDelete = onDelete
    }

    // Получаем название КП
    #getKpName = (record) => {
        const name = String(record?.data?.['kp-name'] ?? '').trim()
        return name || 'Без названия'
    }

    renderCard(){
        const card = document.createElement('div')
        card.className = 'trash-item'
        card.innerHTML = `

        <div class="trash-item__thumb" aria-hidden="true">
        <span></span><span></span><span></span>
        </div>
        <div class="trash-item__content">
        <p class="trash-item__name"></p>
        <p class="trash-item__meta">ККС_КП-1 · 15 сен 2026</p>
        </div>
        <button class="trash-item__restore" type="button" aria-label="Восстановить">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
            fill="currentColor"
            d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8Z"
            />
        </svg>
        </button>
        <button class="trash-item__delete" type="button" aria-label="Удалить навсегда">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
            fill="currentColor"
            d="M7 4C7 2.9 7.9 2 9 2h6c1.1 0 2 .9 2 2v2h3c.6 0 1 .4 1 1s-.4 1-1 1h-1.1L18.1 20c-.1 1-1 1.9-2.1 1.9H7.9c-1.1 0-2-.9-2.1-1.9L4.1 8H3c-.6 0-1-.4-1-1s.4-1 1-1h3V4Zm2 2h6V4H9v2ZM6.1 8l.9 12h10l.9-12H6.1Z"
            />
        </svg>
        </button>
       
        `
        card.querySelector('.trash-item__name').innerHTML = this.#getKpName(this.record)
        card.querySelector('.trash-item__restore').addEventListener('click', () => this.onRestore(this.record.id))
        card.querySelector('.trash-item__delete').addEventListener('click', () => this.onDelete(this.record.id))
        return card
    }
}

export default KpCardTrash