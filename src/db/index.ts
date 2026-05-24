import Dexie, { type Table } from 'dexie'
import type { EssayRecord } from '../types'

class EssayDatabase extends Dexie {
  essays!: Table<EssayRecord, number>

  constructor() {
    super('essay-app-db')
    this.version(1).stores({
      essays: '++id, topicId, createdAt',
    })
  }
}

export const db = new EssayDatabase()
