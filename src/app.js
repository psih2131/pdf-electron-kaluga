import { KpDatabase } from './backend/db.js'
import DocumentService from './features/documents/DocumentService.js'
import KpCard from './features/documents/KpCard.js'
import {SelectTypeModal} from './features/ui/SelectTypeModal.js'


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


const renderKpList = async () => {

  // Получаем все записи из базы данных
  const records = await new KpDatabase('', {}).getAll()

  console.log( 'records', records)
  
  // Удаляем все карточки (очищаем список)
  docs.querySelectorAll('div.card').forEach((card) => card.remove())
  
  // Рендерим все карточки (создаем новый список)
  records
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    .forEach((record) => {

      // Создаем сервис для работы с документами
      const documentService = new DocumentService()

      // Создаем карточку для КП
      const KpCardItem = new KpCard(record, {

        onDownload: async () => {
          await documentService.DownloadDocument(record.id)
        },

        onCopy: async () => {
          await documentService.CopyDocument(record.id)
          await renderKpList()   // ← Обновляем список после копирования
        },

        onDelete: async (id) => {
          await documentService.DeleteDocument(id)
          await renderKpList()   // ← Обновляем список после удаления
        }
        
      })
      
      // Вставляем карточку в список
      docs.insertBefore(
        KpCardItem.KpCardRender(), 
        createBtn
      )
    })

  if (countLabel) {
    countLabel.textContent = `Документов: ${records.length}`
  }
}

const selectTypeModal = new SelectTypeModal()

createBtn.addEventListener('click', () => selectTypeModal.Render())

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
