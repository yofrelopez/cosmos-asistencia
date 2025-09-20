export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  eventType: 'ENTRADA' | 'REFRIGERIO' | 'TERMINO_REFRIGERIO' | 'SALIDA';
  timestamp: string;
  date: string;
}

export interface DailyReport {
  userId: string;
  userName: string;
  date: string;
  entrada?: string;
  refrigerio?: string;
  terminoRefrigerio?: string;
  salida?: string;
  horasTrabajadas: number;
}

export interface User {
  id: string;
  name: string;
}

export const USERS: User[] = [
  { id: '1', name: 'Juan Pérez' },
  { id: '2', name: 'María García' },
  { id: '3', name: 'Carlos López' }
];

export const EVENT_TYPES = {
  ENTRADA: 'ENTRADA',
  REFRIGERIO: 'REFRIGERIO',
  TERMINO_REFRIGERIO: 'TERMINO_REFRIGERIO',
  SALIDA: 'SALIDA'
} as const;

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function calculateWorkedHours(records: AttendanceRecord[]): number {
  const entrada = records.find(r => r.eventType === 'ENTRADA');
  const salida = records.find(r => r.eventType === 'SALIDA');
  const refrigerio = records.find(r => r.eventType === 'REFRIGERIO');
  const terminoRefrigerio = records.find(r => r.eventType === 'TERMINO_REFRIGERIO');

  if (!entrada || !salida) return 0;

  const entradaTime = new Date(entrada.timestamp).getTime();
  const salidaTime = new Date(salida.timestamp).getTime();
  
  let totalMinutes = (salidaTime - entradaTime) / (1000 * 60);

  // Restar tiempo de refrigerio si ambos eventos existen
  if (refrigerio && terminoRefrigerio) {
    const refrigerioTime = new Date(refrigerio.timestamp).getTime();
    const terminoRefrigerioTime = new Date(terminoRefrigerio.timestamp).getTime();
    const refrigerioMinutes = (terminoRefrigerioTime - refrigerioTime) / (1000 * 60);
    totalMinutes -= refrigerioMinutes;
  }

  return Math.max(0, totalMinutes / 60); // Convertir a horas
}

export function generateDailyReport(records: AttendanceRecord[], date: string): DailyReport[] {
  const userRecords = USERS.map(user => {
    const userDayRecords = records.filter(r => 
      r.userId === user.id && r.date === date
    );

    const entrada = userDayRecords.find(r => r.eventType === 'ENTRADA');
    const refrigerio = userDayRecords.find(r => r.eventType === 'REFRIGERIO');
    const terminoRefrigerio = userDayRecords.find(r => r.eventType === 'TERMINO_REFRIGERIO');
    const salida = userDayRecords.find(r => r.eventType === 'SALIDA');

    return {
      userId: user.id,
      userName: user.name,
      date,
      entrada: entrada ? formatTime(entrada.timestamp) : undefined,
      refrigerio: refrigerio ? formatTime(refrigerio.timestamp) : undefined,
      terminoRefrigerio: terminoRefrigerio ? formatTime(terminoRefrigerio.timestamp) : undefined,
      salida: salida ? formatTime(salida.timestamp) : undefined,
      horasTrabajadas: calculateWorkedHours(userDayRecords)
    };
  });

  return userRecords;
}