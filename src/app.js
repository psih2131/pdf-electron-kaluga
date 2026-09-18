import { KpDatabase } from './backend/db.js'
import DocumentService from './features/documents/DocumentService.js'
import KpCard from './features/documents/KpCard.js'
import {SelectTypeModal} from './features/ui/SelectTypeModal.js'
import './features/ui/trash.js'
import DocumentTrash from './features/documents/DocumentTrash.js'
import KpCardTrash from './features/documents/KpCardTrash.js'
import DocsListControls from './features/ui/DocsListControls.js'


const createBtn = document.getElementById('create-btn')
const modal = document.getElementById('template-modal')
const docs = document.querySelector('.docs')
const countValue = document.querySelector('.header__count-value')
const countLabel = document.querySelector('.header__count-label')

const docsListControls = new DocsListControls({
  filtersContainer: document.getElementById('docs-toolbar-filters'),
  sortSelect: document.getElementById('docs-sort-select'),
  listContainer: docs,
  createButton: createBtn,
})

const getDocumentsLabel = (count) => {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod100 >= 11 && mod100 <= 14) {
    return 'документов'
  }

  if (mod10 === 1) {
    return 'документ'
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return 'документа'
  }

  return 'документов'
}

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
  records.forEach((record) => {

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
          await renderTrashComponent() // ← Обновляем корзину после копирования
        },

        onDelete: async (id) => {
          await documentService.DeleteDocument(id)
          await renderKpList()   // ← Обновляем список после удаления
          await renderTrashComponent() // ← Обновляем корзину после удаления
        }
        
      })
      
      // Вставляем карточку в список
      docs.insertBefore(
        KpCardItem.KpCardRender(), 
        createBtn
        
      )
     

    })

  if (countValue) {
    countValue.textContent = records.length
  }

  if (countLabel) {
    countLabel.textContent = getDocumentsLabel(records.length)
  }

  docsListControls.apply()
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


async function renderTrashComponent() {
  const trashCount = document.querySelector('.deleted-bin__count')
  const trashCountLabel = document.querySelector('.trash-modal__subtitle')
  const trashDocumentsWrapper = document.querySelector('.trash-modal__list')

  const trash = new DocumentTrash()
  const trashDocuments = await trash.GetAllDocuments()

  if (trashCount) {
    trashCount.textContent = trashDocuments.length
  }

  if (trashCountLabel) {
    trashCountLabel.textContent = `${trashDocuments.length} удалённых документа`
  }

  if (!trashDocumentsWrapper) {
    return
  }

  trashDocumentsWrapper.innerHTML = ''

  for (const trashItemData of trashDocuments) {
    const trashItem = new KpCardTrash(trashItemData, {
      onRestore: async (id) => {
        await trash.RestoreDocument(id)
        await renderKpList()
        await renderTrashComponent()
      },
      onDelete: async (id) => {
        await trash.DeleteDocument(id)
        await renderTrashComponent()
      }
    })

    trashDocumentsWrapper.append(trashItem.renderCard())
  }
}

const trashDeleteAllBtn = document.getElementById('trash-delete-all-btn')
const trashRestoreAllBtn = document.getElementById('trash-restore-all-btn')

trashDeleteAllBtn?.addEventListener('click', async () => {
  const trash = new DocumentTrash()
  await trash.ClearTrash()
  await renderKpList()
  await renderTrashComponent()
})

trashRestoreAllBtn?.addEventListener('click', async () => {
  const trash = new DocumentTrash()
  await trash.RestoreAllDocuments()
  await renderKpList()
  await renderTrashComponent()
})


renderKpList()
renderTrashComponent()

