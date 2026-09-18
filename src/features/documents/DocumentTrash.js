import {KpTrashTable} from '../../backend/db.js'
import SystemNotifications from '../notifications/SystemNotifications.js'
import DocumentService from './DocumentService.js'

export default class DocumentTrash {
    constructor() {
        this.db = new KpTrashTable( '', {} )
        this.documentService = new DocumentService()
    }

    async AddDocument(type, data) {

        console.log('добавляем документ в корзину', type, data)
        const result = await this.db.add(type, data)
        console.log('документ добавлен', result)
        return result
    }

    async GetAllDocuments() {
        const result = await this.db.getAll()
        console.log('все документы получены', result)
        return result
    }

    async GetDocumentById(id) {
        const document = await this.db.get(id)
        console.log('документ получен', document)
        return document
    }

    async RestoreDocument(id) {
        const documentItem = await this.GetDocumentById(id)

        await this.documentService.AddDocument(documentItem.type, documentItem.data)
        console.log('документ восстановлен', id)
        await this.db.delete(id)
    }

    async DeleteDocument(id,notify = true) {
        const result = await this.db.delete(id)
        if (notify) {
            new SystemNotifications('success', 'Документ успешно удален').CreateNotification()
        }
        console.log('документ удален', id)
    }

    async ClearTrash() {
        await this.db.deleteAll()
        new SystemNotifications('success', 'Корзина очищена').CreateNotification()
    }

    async RestoreAllDocuments() {
        const documents = [...await this.GetAllDocuments()]

        for (const item of documents) {
            await this.RestoreDocument(item.id)
        }

        new SystemNotifications('success', 'Все документы восстановлены').CreateNotification()
    }
}