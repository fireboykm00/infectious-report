import Dexie, { Table } from 'dexie';

export interface OfflineCaseReport {
  id?: string;
  clientLocalId: string;
  reportDate: string;
  diseaseCode: string;
  ageGroup: string;
  gender: string;
  symptoms: string;
  facility: string;
  district: string;
  notes?: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncError?: string;
  createdAt: string;
}

class OfflineDatabase extends Dexie {
  caseReports!: Table<OfflineCaseReport>;

  constructor() {
    super('IDSROfflineDB');
    this.version(1).stores({
      caseReports: '++id, clientLocalId, syncStatus, createdAt'
    });
  }
}

export const offlineDb = new OfflineDatabase();