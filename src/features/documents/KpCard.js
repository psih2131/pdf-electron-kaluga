import KP_TEMPLATES from '../../config/kpTemplates.json' with { type: 'json' }

class KpCard {
    constructor(record, {
        onDownload,
        onCopy,
        onDelete
    }) {
        this.record = record
        this.onDownload = onDownload
        this.onCopy = onCopy
        this.onDelete = onDelete
    }
    
    // Получаем название КП
    #getKpName = (record) => {
        const name = String(record?.data?.['kp-name'] ?? '').trim()
        return name || 'Без названия'
    }
    
    // Получаем ссылку на КП
    #getKpHref = (record) => {
        const page = KP_TEMPLATES.find((template) => template.type === record.type)?.link ?? 'offers/kks-kp-1.html'
        return `${page}?id=${encodeURIComponent(record.id)}`
    }

    #getKpPreview = (record) => {
        const preview = KP_TEMPLATES.find((template) => template.type === record.type)?.preview ?? 'assets/images/card-file-preview.svg'
        return preview
    }

    // Рендерим КП
    KpCardRender() {
        const card = document.createElement('div')
        card.className = 'card'
        card.innerHTML = `

            <div class="card__blur-bg"></div>
            <a href="${this.#getKpHref(this.record)}" class="card__btn-open-btn" title="Открыть">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 4C6.68629 4 4 6.68629 4 10C4 13.3137 6.68629 16 10 16C13.3137 16 16 13.3137 16 10C16 6.68629 13.3137 4 10 4ZM2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 11.8487 17.3729 13.551 16.3199 14.9056L21.7071 20.2929C22.0976 20.6834 22.0976 21.3166 21.7071 21.7071C21.3166 22.0976 20.6834 22.0976 20.2929 21.7071L14.9056 16.3199C13.551 17.3729 11.8487 18 10 18C5.58172 18 2 14.4183 2 10ZM10 7C10.5523 7 11 7.44772 11 8V9H12C12.5523 9 13 9.44772 13 10C13 10.5523 12.5523 11 12 11H11V12C11 12.5523 10.5523 13 10 13C9.44772 13 9 12.5523 9 12V11H8C7.44772 11 7 10.5523 7 10C7 9.44772 7.44772 9 8 9H9V8C9 7.44772 9.44772 7 10 7Z" fill="#8B8F9A"/>
                </svg>
            </a>

            <div class="card__controls-wrapper">
                <div class="card__btn-control card__download-btn" title="Скачать">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C12.5523 2 13 2.44772 13 3V13.5858L15.2929 11.2929C15.6834 10.9024 16.3166 10.9024 16.7071 11.2929C17.0976 11.6834 17.0976 12.3166 16.7071 12.7071L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L7.29289 12.7071C6.90237 12.3166 6.90237 11.6834 7.29289 11.2929C7.68342 10.9024 8.31658 10.9024 8.70711 11.2929L11 13.5858V3C11 2.44772 11.4477 2 12 2ZM5 17C5.55228 17 6 17.4477 6 18V20H18V18C18 17.4477 18.4477 17 19 17C19.5523 17 20 17.4477 20 18V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V18C4 17.4477 4.44772 17 5 17Z" fill="#8B8F9A"/>
                </svg>
                </div>

                <div class="card__btn-control card__copy-btn" title="Копировать">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 4C2 2.89543 2.89543 2 4 2H14C15.1046 2 16 2.89543 16 4V8H20C21.1046 8 22 8.89543 22 10V20C22 21.1046 21.1046 22 20 22H10C8.89543 22 8 21.1046 8 20V16H4C2.89543 16 2 15.1046 2 14V4ZM10 16V20H20V10H16V14C16 15.1046 15.1046 16 14 16H10ZM14 14V4L4 4V14H14Z" fill="#8B8F9A"/>
                </svg>
                </div>

                <div class="card__btn-control card__delete-btn" title="Удалить">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V6H18.9897C18.9959 5.99994 19.0021 5.99994 19.0083 6H21C21.5523 6 22 6.44772 22 7C22 7.55228 21.5523 8 21 8H19.9311L19.0638 20.1425C18.989 21.1891 18.1182 22 17.0689 22H6.93112C5.88184 22 5.01096 21.1891 4.9362 20.1425L4.06888 8H3C2.44772 8 2 7.55228 2 7C2 6.44772 2.44772 6 3 6H4.99174C4.99795 5.99994 5.00414 5.99994 5.01032 6H7V4ZM9 6H15V4H9V6ZM6.07398 8L6.93112 20H17.0689L17.926 8H6.07398Z" fill="#8B8F9A"/>
                </svg>

                </div>
            </div>

            <div class="card__preview" aria-hidden="true">
            <img class="card__file" src="${this.#getKpPreview(this.record)}" alt="" />
            </div>
            <h2 class="card__name"></h2>
        `
        card.querySelector('.card__name').textContent = this.#getKpName(this.record)
        card.querySelector('.card__download-btn').addEventListener('click', () => this.onDownload(this.record.id))
        card.querySelector('.card__copy-btn').addEventListener('click', () => this.onCopy(this.record.id))
        card.querySelector('.card__delete-btn').addEventListener('click', () => this.onDelete(this.record.id))
        return card
    }
}

export default KpCard;