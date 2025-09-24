import { hashPin, verifyPin } from './security';
import { db } from './firebase';
import { doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, collection } from 'firebase/firestore';

import {  query, where, limit } from "firebase/firestore";



export interface Worker {
  id: string;
  name: string;
  pinHash: string;
  photo: string;
  position: string;
  document: string;
}

export type Admin = {
  id: string;
  name: string;
  pin: string;   // texto plano
  role: string;
};

export interface AuthSession {
  userId: string;
  userType: 'worker' | 'admin';
  userName: string;
  loginTime: string;
  expiresAt: string;
}

// 🔹 Admins siguen siendo locales
/* export const ADMINS: Admin[] = [
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
]; */

// 🔹 Obtener todos los trabajadores desde Firestore
export async function getCurrentWorkers(): Promise<Worker[]> {
  try {
    const snapshot = await getDocs(collection(db, 'workers'));
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Worker[];
  } catch (error) {
    console.error('Error loading workers:', error);
    return [];
  }
}

// 🔹 Validar PIN de trabajador contra Firestore
export async function validateWorkerPin(workerId: string, pin: string): Promise<boolean> {
  try {
    const ref = doc(db, 'workers', workerId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;

    const worker = snap.data() as Worker;
    return await verifyPin(pin, worker.pinHash);
  } catch (error) {
    console.error('Error validating worker PIN:', error);
    return false;
  }
}

// 🔹 Validar PIN de administrador 
export async function validateAdminPin(pin: string): Promise<Admin | null> {
  try {
    const snapshot = await getDocs(collection(db, "admins"));
    for (const docSnap of snapshot.docs) {
      const admin = docSnap.data() as Admin;
      if (admin.pin === pin) {
        return { id: docSnap.id, ...admin };
      }
    }
    return null;
  } catch (error) {
    console.error("Error validating admin PIN:", error);
    return null;
  }
}

// 🔹 Sesiones (siguen en localStorage)
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

// 🔹 Obtener un trabajador por ID desde Firestore
export async function getWorkerById(id: string): Promise<Worker | null> {
  try {
    const ref = doc(db, 'workers', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Worker;
  } catch (error) {
    console.error('Error obteniendo worker por id:', error);
    return null;
  }
}

// 🔹 Actualizar PIN en Firestore
export async function updateWorkerPin(workerId: string, newPin: string): Promise<boolean> {
  try {
    const hashedPin = await hashPin(newPin);
    const ref = doc(db, 'workers', workerId);
    await updateDoc(ref, { pinHash: hashedPin });
    return true;
  } catch (error) {
    console.error('Error updating worker PIN:', error);
    return false;
  }
}

// 🔹 Crear trabajador en Firestore
export async function createWorker(workerData: Omit<Worker, 'id' | 'pinHash'> & { pin: string }): Promise<Worker | null> {
  try {
    const hashedPin = await hashPin(workerData.pin);
    const newWorker = {
      ...workerData,
      pinHash: hashedPin,
    };
    const docRef = await addDoc(collection(db, 'workers'), newWorker);
    return { id: docRef.id, ...newWorker };
  } catch (error) {
    console.error('Error creating worker:', error);
    return null;
  }
}

// 🔹 Actualizar trabajador en Firestore
export async function updateWorker(workerId: string, updates: Partial<Omit<Worker, 'id' | 'pinHash'>>): Promise<boolean> {
  try {
    const ref = doc(db, 'workers', workerId);
    await updateDoc(ref, updates);
    return true;
  } catch (error) {
    console.error('Error updating worker:', error);
    return false;
  }
}

// 🔹 Eliminar trabajador en Firestore
export async function deleteWorker(workerId: string): Promise<boolean> {
  try {
    const ref = doc(db, 'workers', workerId);
    await deleteDoc(ref);
    return true;
  } catch (error) {
    console.error('Error deleting worker:', error);
    return false;
  }
}
