class SystemNotifications {
  constructor(type = 'info', message = '') {
    this.type = type
    this.message = message
  }

  CreateNotification() {
    if (this.type === 'info') {
      this.InfoNotification(this.message)
    }

    if (this.type === 'success') {
      this.SuccessNotification(this.message)
    }

    if (this.type === 'error') {
      this.ErrorNotification(this.message)
    }
  }

  #createBackdrop() {
    const backdrop = document.createElement('div')
    backdrop.className = 'notification-backdrop'
    backdrop.setAttribute('aria-hidden', 'true')
    return backdrop
  }

  #mount(notification, backdrop) {
    const close = () => {
      notification.remove()
      backdrop.remove()
    }

    backdrop.addEventListener('click', close)
    notification.querySelector('.notification__close').addEventListener('click', (event) => {
      event.stopPropagation()
      close()
    })

    document.body.append(backdrop, notification)
    return notification
  }

  InfoNotification(message) {
    const backdrop = this.#createBackdrop()
    const notification = document.createElement('div')
    notification.className = 'notification notification--info'
    notification.setAttribute('role', 'alert')
    notification.innerHTML = `
      <div class="notification__icon">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
          <path d="M12 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="8" r="1.25" fill="currentColor"/>
        </svg>
      </div>
      <div class="notification__message">
        ${message}
      </div>
      <button class="notification__close" type="button" aria-label="Закрыть">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `
    return this.#mount(notification, backdrop)
  }

  SuccessNotification(message) {
    const backdrop = this.#createBackdrop()
    const notification = document.createElement('div')
    notification.className = 'notification notification--success'
    notification.setAttribute('role', 'alert')
    notification.innerHTML = `
      <div class="notification__icon">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
          <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="notification__message">
        ${message}
      </div>
      <button class="notification__close" type="button" aria-label="Закрыть">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `
    return this.#mount(notification, backdrop)
  }

  ErrorNotification(message) {
    const backdrop = this.#createBackdrop()
    const notification = document.createElement('div')
    notification.className = 'notification notification--error'
    notification.setAttribute('role', 'alert')
    notification.innerHTML = `
      <div class="notification__icon">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
          <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="notification__message">
        ${message}
      </div>
      <button class="notification__close" type="button" aria-label="Закрыть">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `
    return this.#mount(notification, backdrop)
  }
}

export default SystemNotifications
