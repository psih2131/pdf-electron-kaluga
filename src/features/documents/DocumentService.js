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
        return id
    }

    async GetDocument(id) {
        return this.db.get(id)
    }

    async UpdateDocument(type, data, id) {
        const db = new KpDatabase(type, data)
        await db.update(id)

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
        console.log( 'Скачиваем документ', id)
    }

    async DeleteDocument(id) {
        console.log( 'Удаляем документ', id)
        const result = await this.db.delete(id)
        console.log( 'Результат удаления', result)
        const deleteNotification = new SystemNotifications('success', 'Документ удален')
        deleteNotification.CreateNotification()
    }
    
}

export default DocumentService;