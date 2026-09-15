import {KpDatabase} from '../../backend/db.js'
import SystemNotifications from '../notifications/SystemNotifications.js'

class DocumentService {
    constructor() {
        this.db = new KpDatabase( '', {} )
    }

    async AddDocument(type, data) {
        const db = new KpDatabase(type, data)
        const id = await db.add()

        new SystemNotifications('success', 'Документ успешно добавлен').CreateNotification()

        await this.SavePdfDocument(id)

        return id
    }

    async GetDocument(id) {
        return this.db.get(id)
    }

    async UpdateDocument(type, data, id) {
        const db = new KpDatabase(type, data)
        await db.update(id)
        await this.SavePdfDocument(id)
        new SystemNotifications('success', 'Документ успешно обновлен').CreateNotification()
    }
    
    async CopyDocument(id) {
        console.log( 'Копируем документ', id)
        const result = await this.db.copy(id)
        console.log( 'Результат копирования', result)
        const copyNotification = new SystemNotifications('success', 'Документ скопирован')
        copyNotification.CreateNotification()
    }

    async DownloadDocument(id) {
        if (typeof window.kaluga?.downloadPdf !== 'function') {
            new SystemNotifications('error', 'Скачивание недоступно').CreateNotification()
            return false
        }

        const exists = await this.ExistsPdfDocument(id)

        if (!exists) {
            new SystemNotifications('error', 'PDF файл не найден, убедитесь что документ был сохранен после создания или копирования').CreateNotification()
            return false
        }

        try {
            const saved = await window.kaluga.downloadPdf({ id })

            if (saved) {
                new SystemNotifications('success', 'Документ успешно сохранён на вашем устройстве').CreateNotification()
            }

            return saved
        } catch (error) {
            console.error('Не удалось скачать документ', error)
            new SystemNotifications('error', 'Не удалось скачать документ').CreateNotification()
            return false
        }
    }

    async DeleteDocument(id) {
        console.log( 'Удаляем документ', id)
        const result = await this.db.delete(id)
        console.log( 'Результат удаления', result)
        const deleteNotification = new SystemNotifications('success', 'Документ удален')
        await this.DeletePdfDocument(id)
        deleteNotification.CreateNotification()
    }

    async SavePdfDocument(id) {

        const exists = await this.ExistsPdfDocument(id)

        if (exists) {
            await this.DeletePdfDocument(id)
        }


        if (typeof window.kaluga?.savePdf !== 'function') {
            return null
        }

        try {
            const pdfPath = await window.kaluga.savePdf(id)
            console.log( 'PDF сохранен', pdfPath)
            return pdfPath
        } catch (error) {
            console.error('Не удалось сохранить PDF', error)
            new SystemNotifications('error', 'Не удалось сохранить PDF').CreateNotification()
            return null
        }
    }

    async ExistsPdfDocument(id) {
        if (typeof window.kaluga?.pdfExists !== 'function') {
            return false
        }
        console.log( 'Проверяем наличие PDF', id)
        return await window.kaluga.pdfExists(id)
    }

    async DeletePdfDocument(id) {
        if (typeof window.kaluga?.deletePdf !== 'function') {
            return false
        }
        console.log( 'Удаляем PDF', id)
        return await window.kaluga.deletePdf(id)
    }
    
}

export default DocumentService;