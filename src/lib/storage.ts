import type { AttendanceRecord } from './attendance-cosmos';


// NUEVO: endpoint del backend que maneja Google Sheets
// NUEVO: endpoint base del backend (desde env o fallback local)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const SYNC_API_URL = `${API_BASE}/api/sync`;
const SYNC_ALL_API_URL = `${API_BASE}/api/sync-all`;




// NUEVO: clave para cola de sincronización pendiente
const PENDING_KEY = 'cosmos_pending_sync';

// Helper para obtener lista desde localStorage
function getArray<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') as T[]; }
  catch { return []; }
}
function setArray<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}




const STORAGE_KEY = 'cosmos_attendance_records';

export function getAllRecords(): AttendanceRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading records from localStorage:', error);
    return [];
  }
}

export function saveRecord(record: AttendanceRecord): void {
  try {
    const records = getAllRecords();
    records.unshift(record); 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    localStorage.setItem('last_record_save', new Date().toISOString());
    console.log('Record saved to localStorage:', record.eventType, record.workerName);

    // NUEVO: intento de sincronización inmediata
    syncNow(record).catch(() => {
      // si falla, guardar en cola pendiente
      const pending = getArray<AttendanceRecord>(PENDING_KEY);
      pending.push(record);
      setArray(PENDING_KEY, pending);
      console.warn('Sync failed, record queued for retry:', record.id);
    });

  } catch (error) {
    console.error('Error saving record to localStorage:', error);
    throw error;
  }
}


export function saveRecords(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    localStorage.setItem('last_records_update', new Date().toISOString());
    console.log(`Saved ${records.length} records to localStorage`);
  } catch (error) {
    console.error('Error saving records to localStorage:', error);
    throw error;
  }
}

export function getRecordsByWorker(workerId: string): AttendanceRecord[] {
  return getAllRecords().filter(record => record.workerId === workerId);
}

export function getRecordsByDate(date: string): AttendanceRecord[] {
  return getAllRecords().filter(record => record.date === date);
}

export function getRecordsByDateRange(startDate: string, endDate: string): AttendanceRecord[] {
  return getAllRecords().filter(record => 
    record.date >= startDate && record.date <= endDate
  );
}

export function deleteRecord(recordId: string): boolean {
  try {
    const records = getAllRecords();
    const filteredRecords = records.filter(record => record.id !== recordId);
    
    if (filteredRecords.length === records.length) {
      return false; // Record not found
    }
    
    saveRecords(filteredRecords);
    return true;
  } catch (error) {
    console.error('Error deleting record:', error);
    return false;
  }
}

export function updateRecord(recordId: string, updates: Partial<AttendanceRecord>): boolean {
  try {
    const records = getAllRecords();
    const recordIndex = records.findIndex(record => record.id === recordId);
    
    if (recordIndex === -1) {
      return false; // Record not found
    }
    
    records[recordIndex] = { ...records[recordIndex], ...updates };
    saveRecords(records);
    return true;
  } catch (error) {
    console.error('Error updating record:', error);
    return false;
  }
}

// Get statistics
export function getRecordsStatistics() {
  const records = getAllRecords();
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7); // YYYY-MM format
  
  return {
    total: records.length,
    today: records.filter(r => r.date === today).length,
    thisMonth: records.filter(r => r.date.startsWith(thisMonth)).length,
    byEventType: {
      ENTRADA: records.filter(r => r.eventType === 'ENTRADA').length,
      REFRIGERIO: records.filter(r => r.eventType === 'REFRIGERIO').length,
      TERMINO_REFRIGERIO: records.filter(r => r.eventType === 'TERMINO_REFRIGERIO').length,
      SALIDA: records.filter(r => r.eventType === 'SALIDA').length
    }
  };
}

// Export data for backup
export function exportRecordsAsJSON(): string {
  const records = getAllRecords();
  const exportData = {
    exportDate: new Date().toISOString(),
    totalRecords: records.length,
    records: records
  };
  return JSON.stringify(exportData, null, 2);
}

// Import data from backup
export function importRecordsFromJSON(jsonData: string): boolean {
  try {
    const importData = JSON.parse(jsonData);
    
    if (!importData.records || !Array.isArray(importData.records)) {
      throw new Error('Invalid import data format');
    }
    
    // Validate record structure
    const validRecords = importData.records.filter((record: any) => 
      record.id && record.workerId && record.eventType && record.timestamp
    );
    
    if (validRecords.length !== importData.records.length) {
      console.warn(`Filtered ${importData.records.length - validRecords.length} invalid records`);
    }
    
    // Merge with existing records, avoiding duplicates
    const existingRecords = getAllRecords();
    const existingIds = new Set(existingRecords.map(r => r.id));
    
    const newRecords = validRecords.filter((record: AttendanceRecord) => 
      !existingIds.has(record.id)
    );
    
    const mergedRecords = [...existingRecords, ...newRecords];
    
    // Sort by timestamp (newest first)
    mergedRecords.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    saveRecords(mergedRecords);
    
    console.log(`Imported ${newRecords.length} new records, ${validRecords.length - newRecords.length} duplicates skipped`);
    return true;
  } catch (error) {
    console.error('Error importing records:', error);
    return false;
  }
}

// Clear all records (with confirmation)
export function clearAllRecords(confirmationText: string): boolean {
  if (confirmationText !== 'CONFIRMAR_BORRAR_TODO') {
    return false;
  }
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem('records_cleared_at', new Date().toISOString());
    console.log('All records cleared from localStorage');
    return true;
  } catch (error) {
    console.error('Error clearing records:', error);
    return false;
  }
}

// Get storage info
export function getStorageInfo() {
  const records = getAllRecords();
  const dataSize = new Blob([JSON.stringify(records)]).size;
  const lastSave = localStorage.getItem('last_record_save');
  const lastUpdate = localStorage.getItem('last_records_update');
  
  return {
    recordCount: records.length,
    dataSizeBytes: dataSize,
    dataSizeKB: Math.round(dataSize / 1024 * 100) / 100,
    lastSave: lastSave ? new Date(lastSave) : null,
    lastUpdate: lastUpdate ? new Date(lastUpdate) : null
  };
}

// 🔹 NUEVO: función para reintentar sincronización manual
export async function retryPendingSync() {
  const pending = getArray<AttendanceRecord>(PENDING_KEY);
  if (!pending.length) return { ok: true, count: 0 };

  try {
    const res = await fetch(SYNC_ALL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pending),
    });
    if (!res.ok) throw new Error('sync-all failed');
    setArray(PENDING_KEY, []); // limpia cola
    console.log(`Synced ${pending.length} pending records`);
    return { ok: true, count: pending.length };
  } catch (err) {
    console.error('Error syncing pending records:', err);
    return { ok: false, count: pending.length };
  }
}

// 🔹 NUEVO: función interna de sync inmediato
async function syncNow(record: AttendanceRecord) {
  const res = await fetch(SYNC_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error('sync failed');
}



// --- funciones de sync manual y estado ---



export async function manualSyncAllRecords(): Promise<void> {
  const records = getAllRecords();
  try {
    const res = await fetch('/api/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records),
    });
    if (res.ok) {
      console.log('Todos los registros sincronizados manualmente');
    }
  } catch (err) {
    console.error('Error en sync manual:', err);
  }
}

export function getSyncStatus() {
  const all = getAllRecords();
  const pending = JSON.parse(localStorage.getItem('cosmos_pending_sync') || '[]');
  return {
    totalRecords: all.length,
    failedSyncs: pending.length,
    lastSyncAttempt: localStorage.getItem('last_record_save') || null,
  };
}
