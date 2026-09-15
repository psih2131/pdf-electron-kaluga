import KP_TEMPLATES from '../../config/kpTemplates.json' with { type: 'json' }

class SelectTypeModal {
    constructor() {}

    Render() {
        const modal = document.createElement('div')
        modal.className = 'modal'
        modal.id = 'template-modal'
        // modal.setAttribute('hidden', 'true')
        modal.innerHTML = `
            <div class="modal__backdrop data-close-modal" ></div>
            <div
                class="modal__dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <header class="modal__header">
                <h2 class="modal__title" id="modal-title">Новый документ</h2>
                <button class="modal__close data-close-modal" type="button"  aria-label="Закрыть">
                    ×
                </button>
                </header>
                <div class="modal__body">
                ${KP_TEMPLATES.map(({ name, link, preview, color, type }) => `
                <a href="${link}?type=${type}" class="template card" data-template="${link}?type=${type}" style="--template-accent: ${color}">
                    <div class="card__blur-bg"></div>
                    <span class="card__btn-open-btn template__open-btn" aria-hidden="true">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.2929 3.29289C16.6834 2.90237 17.3166 2.90237 17.7071 3.29289L20.7071 6.29289C21.0976 6.68342 21.0976 7.31658 20.7071 7.70711L11.7071 16.7071C11.5196 16.8946 11.2652 17 11 17H8C7.44772 17 7 16.5523 7 16V13C7 12.7348 7.10536 12.4804 7.29289 12.2929L16.2929 3.29289ZM9 13.4142V15H10.5858L18.5858 7L17 5.41421L9 13.4142ZM3 7C3 5.89543 3.89543 5 5 5H10C10.5523 5 11 5.44772 11 6C11 6.55228 10.5523 7 10 7H5V19H17V14C17 13.4477 17.4477 13 18 13C18.5523 13 19 13.4477 19 14V19C19 20.1046 18.1046 21 17 21H5C3.89543 21 3 20.1046 3 19V7Z" fill="currentColor"/>
                        </svg>
                    </span>
                    <div class="card__preview" aria-hidden="true">
                        <img class="card__file" src="${preview}" alt="" />
                    </div>
                    <h2 class="card__name">${name}</h2>
                </a>
                `).join('')}
                </div>
            </div>
        `
        modal.querySelector('.modal__close').addEventListener('click', () => {
            modal.remove()
        })
        modal.querySelector('.data-close-modal').addEventListener('click', () => {
            modal.remove()
        })
        document.body.appendChild(modal)
        return modal
    }
}

export { SelectTypeModal }