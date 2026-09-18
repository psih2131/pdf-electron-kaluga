const trashModal = document.getElementById('trash-modal')
const trashBtn = document.querySelector('.deleted-bin')

const openTrash = () => {
  if (!trashModal) {
    return
  }

  trashModal.hidden = false
  requestAnimationFrame(() => {
    trashModal.classList.add('is-open')
    trashBtn?.classList.add('deleted-bin--active')
  })
}

const closeTrash = () => {
  if (!trashModal) {
    return
  }

  trashModal.classList.remove('is-open')
  trashBtn?.classList.remove('deleted-bin--active')

  trashModal.addEventListener(
    'transitionend',
    () => {
      if (!trashModal.classList.contains('is-open')) {
        trashModal.hidden = true
      }
    },
    { once: true }
  )

  setTimeout(() => {
    if (!trashModal.classList.contains('is-open')) {
      trashModal.hidden = true
    }
  }, 300)
}

trashBtn?.addEventListener('click', () => {
  if (trashModal?.hidden) {
    openTrash()
    return
  }

  closeTrash()
})

trashModal?.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-trash]')) {
    closeTrash()
  }
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && trashModal && !trashModal.hidden) {
    closeTrash()
  }
})
