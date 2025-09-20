export interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  workerDocument: string;
  eventType: 'ENTRADA' | 'REFRIGERIO' | 'TERMINO_REFRIGERIO' | 'SALIDA';
  timestamp: string;
  date: string;
  location: string;
}

export interface DailyReport {
  workerId: string;
  workerName: string;
  workerDocument: string;
  date: string;
  entrada?: string;
  refrigerio?: string;
  terminoRefrigerio?: string;
  salida?: string;
  horasTrabajadas: number;
  horasNetas: number;
}

export interface SunafilReport {
  empresa: string;
  ruc: string;
  periodo: string;
  trabajador: string;
  documento: string;
  diasTrabajados: number;
  horasTotales: number;
  horasRegulares: number;
  horasExtras: number;
}

export const EVENT_TYPES = {
  ENTRADA: 'ENTRADA',
  REFRIGERIO: 'REFRIGERIO',
  TERMINO_REFRIGERIO: 'TERMINO_REFRIGERIO',
  SALIDA: 'SALIDA'
} as const;

export const COMPANY_INFO = {
  name: 'V&D COMOS S.R.L.',
  ruc: '20609799090',
  logo: '/assets/logo-cosmos.png'
};

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function formatTime(timestamp: string): string {
  try {
    if (!timestamp || typeof timestamp !== 'string') {
      return '--:--:--';
    }
    return new Date(timestamp).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '--:--:--';
  }
}

export function formatDate(dateString: string): string {
  try {
    if (!dateString || typeof dateString !== 'string') {
      return '--/--/----';
    }
    return new Date(dateString).toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '--/--/----';
  }
}

export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function getCurrentLocation(): string {
  return 'Oficina Principal - V&D COMOS S.R.L.';
}

export function calculateWorkingHours(entrada?: string, salida?: string): number {
  if (!entrada || !salida) return 0;
  
  try {
    const entradaTime = new Date(entrada);
    const salidaTime = new Date(salida);
    
    if (isNaN(entradaTime.getTime()) || isNaN(salidaTime.getTime())) {
      return 0;
    }
    
    const diffMs = salidaTime.getTime() - entradaTime.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours
  } catch (error) {
    console.error('Error calculating working hours:', error);
    return 0;
  }
}

export function calculateNetHours(
  entrada?: string, 
  salida?: string, 
  refrigerio?: string, 
  terminoRefrigerio?: string
): number {
  const totalHours = calculateWorkingHours(entrada, salida);
  
  if (refrigerio && terminoRefrigerio) {
    try {
      const refrigerioTime = new Date(refrigerio);
      const terminoTime = new Date(terminoRefrigerio);
      
      if (!isNaN(refrigerioTime.getTime()) && !isNaN(terminoTime.getTime())) {
        const breakHours = (terminoTime.getTime() - refrigerioTime.getTime()) / (1000 * 60 * 60);
        return Math.max(0, totalHours - Math.max(0, breakHours));
      }
    } catch (error) {
      console.error('Error calculating break time:', error);
    }
  }
  
  return totalHours;
}

export function generateDailyReport(
  records: AttendanceRecord[], 
  date: string, 
  workers: { id: string; name: string; document: string; }[]
): DailyReport[] {
  if (!date || !Array.isArray(records) || !Array.isArray(workers)) {
    return [];
  }

  const dayRecords = records.filter(r => r && r.date === date);
  
  return workers.map(worker => {
    const workerRecords = dayRecords.filter(r => r && r.workerId === worker.id);
    
    const entrada = workerRecords.find(r => r && r.eventType === 'ENTRADA');
    const refrigerio = workerRecords.find(r => r && r.eventType === 'REFRIGERIO');
    const terminoRefrigerio = workerRecords.find(r => r && r.eventType === 'TERMINO_REFRIGERIO');
    const salida = workerRecords.find(r => r && r.eventType === 'SALIDA');
    
    const horasTrabajadas = calculateWorkingHours(
      entrada?.timestamp, 
      salida?.timestamp
    );
    
    const horasNetas = calculateNetHours(
      entrada?.timestamp,
      salida?.timestamp,
      refrigerio?.timestamp,
      terminoRefrigerio?.timestamp
    );
    
    return {
      workerId: worker.id,
      workerName: worker.name || '',
      workerDocument: worker.document || '',
      date,
      entrada: entrada ? formatTime(entrada.timestamp) : undefined,
      refrigerio: refrigerio ? formatTime(refrigerio.timestamp) : undefined,
      terminoRefrigerio: terminoRefrigerio ? formatTime(terminoRefrigerio.timestamp) : undefined,
      salida: salida ? formatTime(salida.timestamp) : undefined,
      horasTrabajadas,
      horasNetas
    };
  });
}

export function generateSunafilReport(
  records: AttendanceRecord[], 
  startDate: string, 
  endDate: string
): SunafilReport[] {
  if (!startDate || !endDate || !Array.isArray(records)) {
    return [];
  }

  try {
    const filteredRecords = records.filter(r => 
      r && r.date && r.date >= startDate && r.date <= endDate
    );
    
    const workerStats = new Map<string, {
      name: string;
      document: string;
      days: Set<string>;
      totalHours: number;
    }>();
    
    // Group records by worker and date
    const workerDays = new Map<string, Map<string, AttendanceRecord[]>>();
    
    filteredRecords.forEach(record => {
      if (!record || !record.workerId || !record.date) return;
      
      if (!workerDays.has(record.workerId)) {
        workerDays.set(record.workerId, new Map());
      }
      
      const workerMap = workerDays.get(record.workerId)!;
      if (!workerMap.has(record.date)) {
        workerMap.set(record.date, []);
      }
      
      workerMap.get(record.date)!.push(record);
    });
    
    // Calculate stats for each worker
    workerDays.forEach((days, workerId) => {
      let totalHours = 0;
      const workedDays = new Set<string>();
      
      days.forEach((dayRecords, date) => {
        const entrada = dayRecords.find(r => r.eventType === 'ENTRADA');
        const salida = dayRecords.find(r => r.eventType === 'SALIDA');
        const refrigerio = dayRecords.find(r => r.eventType === 'REFRIGERIO');
        const terminoRefrigerio = dayRecords.find(r => r.eventType === 'TERMINO_REFRIGERIO');
        
        if (entrada || salida) {
          workedDays.add(date);
          const dayHours = calculateNetHours(
            entrada?.timestamp,
            salida?.timestamp,
            refrigerio?.timestamp,
            terminoRefrigerio?.timestamp
          );
          totalHours += dayHours;
        }
      });
      
      const firstRecord = Array.from(days.values())[0]?.[0];
      if (firstRecord) {
        workerStats.set(workerId, {
          name: firstRecord.workerName || '',
          document: firstRecord.workerDocument || '',
          days: workedDays,
          totalHours
        });
      }
    });
    
    // Generate SUNAFIL report
    return Array.from(workerStats.entries()).map(([workerId, stats]) => {
      const regularHours = Math.min(stats.totalHours, stats.days.size * 8);
      const extraHours = Math.max(0, stats.totalHours - regularHours);
      
      return {
        empresa: COMPANY_INFO.name,
        ruc: COMPANY_INFO.ruc,
        periodo: `${startDate} al ${endDate}`,
        trabajador: stats.name,
        documento: stats.document,
        diasTrabajados: stats.days.size,
        horasTotales: stats.totalHours,
        horasRegulares: regularHours,
        horasExtras: extraHours
      };
    });
  } catch (error) {
    console.error('Error generating SUNAFIL report:', error);
    return [];
  }
}

export function getLastEventForWorker(records: AttendanceRecord[], workerId: string, date: string): string | null {
  if (!Array.isArray(records) || !workerId || !date) {
    return null;
  }

  try {
    const workerRecords = records
      .filter(r => r && r.workerId === workerId && r.date === date)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return workerRecords.length > 0 ? workerRecords[0].eventType : null;
  } catch (error) {
    console.error('Error getting last event:', error);
    return null;
  }
}

export function getNextValidEvents(lastEvent: string | null): string[] {
  const eventFlow = {
    null: ['ENTRADA'],
    'ENTRADA': ['REFRIGERIO', 'SALIDA'],
    'REFRIGERIO': ['TERMINO_REFRIGERIO'],
    'TERMINO_REFRIGERIO': ['SALIDA'],
    'SALIDA': ['ENTRADA']
  };
  
  return eventFlow[lastEvent as keyof typeof eventFlow] || ['ENTRADA'];
}

export function getButtonStates(lastRecord: AttendanceRecord | null): Record<string, boolean> {
  if (!lastRecord) {
    return {
      ENTRADA: true,
      REFRIGERIO: false,
      TERMINO_REFRIGERIO: false,
      SALIDA: false
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const isToday = lastRecord.date === today;

  if (!isToday) {
    return {
      ENTRADA: true,
      REFRIGERIO: false,
      TERMINO_REFRIGERIO: false,
      SALIDA: false
    };
  }

  switch (lastRecord.eventType) {
    case 'ENTRADA':
      return {
        ENTRADA: false,
        REFRIGERIO: true,
        TERMINO_REFRIGERIO: false,
        SALIDA: true
      };
    case 'REFRIGERIO':
      return {
        ENTRADA: false,
        REFRIGERIO: false,
        TERMINO_REFRIGERIO: true,
        SALIDA: false
      };
    case 'TERMINO_REFRIGERIO':
      return {
        ENTRADA: false,
        REFRIGERIO: false,
        TERMINO_REFRIGERIO: false,
        SALIDA: true
      };
    case 'SALIDA':
      return {
        ENTRADA: true,
        REFRIGERIO: false,
        TERMINO_REFRIGERIO: false,
        SALIDA: false
      };
    default:
      return {
        ENTRADA: true,
        REFRIGERIO: false,
        TERMINO_REFRIGERIO: false,
        SALIDA: false
      };
  }
}