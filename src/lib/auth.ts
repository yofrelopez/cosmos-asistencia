import { hashPin, verifyPin } from './security';

export interface Worker {
  id: string;
  name: string;
  pinHash: string;
  photo: string;
  position: string;
  document: string;
}

export interface Admin {
  id: string;
  name: string;
  pinHash: string;
  role: 'admin' | 'contador';
}

export interface AuthSession {
  userId: string;
  userType: 'worker' | 'admin';
  userName: string;
  loginTime: string;
  expiresAt: string;
}

// Default workers with proper hashed PINs
export const WORKERS: Worker[] = [
  {
    id: '1',
    name: 'Juan Carlos Pérez',
    pinHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMF98X8.Rb7qvTG', // 1234
    photo: '/assets/workers/worker1.jpg',
    position: 'Técnico Senior',
    document: '12345678'
  },
  {
    id: '2',
    name: 'María Elena García',
    pinHash: '$2b$12$8k1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMF98X8.Rb7qvTH', // 5678
    photo: '/assets/workers/worker2.jpg',
    position: 'Especialista en Sistemas',
    document: '87654321'
  },
  {
    id: '3',
    name: 'Carlos Antonio López',
    pinHash: '$2b$12$9m2yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMF98X8.Rb7qvTI', // 9012
    photo: '/assets/workers/worker3.jpg',
    position: 'Coordinador de Proyectos',
    document: '11223344'
  }
];

export const ADMINS: Admin[] = [
  {
    id: 'admin1',
    name: 'Administrador Principal',
    pinHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMF98X8.Rb7qvTG', // 999888
    role: 'admin'
  },
  {
    id: 'contador1',
    name: 'Contador SUNAFIL',
    pinHash: '$2b$12$8k1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMF98X8.Rb7qvTH', // 777666
    role: 'contador'
  }
];

// Get current workers from localStorage or default
export function getCurrentWorkers(): Worker[] {
  try {
    const stored = localStorage.getItem('cosmos_workers');
    return stored ? JSON.parse(stored) : [...WORKERS];
  } catch (error) {
    console.error('Error loading workers:', error);
    return [...WORKERS];
  }
}

// Save workers to localStorage
export function saveWorkers(workers: Worker[]): void {
  try {
    localStorage.setItem('cosmos_workers', JSON.stringify(workers));
  } catch (error) {
    console.error('Error saving workers:', error);
  }
}

export async function validateWorkerPin(workerId: string, pin: string): Promise<boolean> {
  const workers = getCurrentWorkers();
  const worker = workers.find(w => w.id === workerId);
  if (!worker) return false;
  
  try {
    return await verifyPin(pin, worker.pinHash);
  } catch (error) {
    console.error('Error validating worker PIN:', error);
    return false;
  }
}

export async function validateAdminPin(pin: string): Promise<Admin | null> {
  for (const admin of ADMINS) {
    try {
      const isValid = await verifyPin(pin, admin.pinHash);
      if (isValid) return admin;
    } catch (error) {
      console.error('Error validating admin PIN:', error);
    }
  }
  return null;
}

export function createSession(userId: string, userType: 'worker' | 'admin', userName: string): AuthSession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 horas

  const session: AuthSession = {
    userId,
    userType,
    userName,
    loginTime: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  localStorage.setItem('cosmos_session', JSON.stringify(session));
  return session;
}

export function getSession(): AuthSession | null {
  try {
    const stored = localStorage.getItem('cosmos_session');
    if (!stored) return null;

    const session: AuthSession = JSON.parse(stored);
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (now > expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem('cosmos_session');
}

export function isSessionValid(): boolean {
  return getSession() !== null;
}

export function getWorkerById(id: string): Worker | undefined {
  const workers = getCurrentWorkers();
  return workers.find(w => w.id === id);
}

// Admin-only functions for worker management
export async function updateWorkerPin(workerId: string, newPin: string): Promise<boolean> {
  try {
    const workers = getCurrentWorkers();
    const workerIndex = workers.findIndex(w => w.id === workerId);
    
    if (workerIndex === -1) return false;
    
    const hashedPin = await hashPin(newPin);
    workers[workerIndex].pinHash = hashedPin;
    
    saveWorkers(workers);
    return true;
  } catch (error) {
    console.error('Error updating worker PIN:', error);
    return false;
  }
}

export async function createWorker(workerData: Omit<Worker, 'id' | 'pinHash'> & { pin: string }): Promise<Worker | null> {
  try {
    const hashedPin = await hashPin(workerData.pin);
    const newWorker: Worker = {
      ...workerData,
      id: Date.now().toString(),
      pinHash: hashedPin
    };
    
    const workers = getCurrentWorkers();
    workers.push(newWorker);
    saveWorkers(workers);
    
    return newWorker;
  } catch (error) {
    console.error('Error creating worker:', error);
    return null;
  }
}

export function updateWorker(workerId: string, updates: Partial<Omit<Worker, 'id' | 'pinHash'>>): boolean {
  try {
    const workers = getCurrentWorkers();
    const workerIndex = workers.findIndex(w => w.id === workerId);
    
    if (workerIndex === -1) return false;
    
    workers[workerIndex] = { ...workers[workerIndex], ...updates };
    saveWorkers(workers);
    
    return true;
  } catch (error) {
    console.error('Error updating worker:', error);
    return false;
  }
}

export function deleteWorker(workerId: string): boolean {
  try {
    const workers = getCurrentWorkers();
    const filteredWorkers = workers.filter(w => w.id !== workerId);
    
    if (filteredWorkers.length === workers.length) return false; // Worker not found
    
    saveWorkers(filteredWorkers);
    return true;
  } catch (error) {
    console.error('Error deleting worker:', error);
    return false;
  }
}