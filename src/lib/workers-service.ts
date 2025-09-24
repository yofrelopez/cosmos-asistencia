// src/lib/workers-service.ts
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import { hashPin } from "./security";

// Definición del tipo Worker
export interface Worker {
  id: string;
  name: string;
  document: string;
  position: string;
  pinHash: string;
  photo: string;
}

// Referencia a la colección
const workersCol = collection(db, "workers");

// Obtener todos los trabajadores
export const getWorkers = async (): Promise<Worker[]> => {
  const snapshot = await getDocs(workersCol);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  })) as Worker[];
};

// Crear nuevo trabajador
export const addWorker = async (worker: Omit<Worker, "id" | "pinHash"> & { pin: string }) => {
  const hashedPin = await hashPin(worker.pin);
  const newWorker = {
    name: worker.name,
    document: worker.document,
    position: worker.position,
    pinHash: hashedPin,
    photo: worker.photo || "/assets/workers/default-avatar.png"
  };
  const docRef = await addDoc(workersCol, newWorker);
  return { id: docRef.id, ...newWorker };
};

// Actualizar trabajador
export const updateWorker = async (id: string, updates: Partial<Omit<Worker, "id">> & { pin?: string }) => {
  const workerRef = doc(db, "workers", id);
  let dataToUpdate: any = { ...updates };

  // Si actualiza el PIN, hay que hashearlo
  if (updates.pin) {
    dataToUpdate.pinHash = await hashPin(updates.pin);
    delete dataToUpdate.pin;
  }

  await updateDoc(workerRef, dataToUpdate);
};

// Eliminar trabajador
export const deleteWorker = async (id: string) => {
  const workerRef = doc(db, "workers", id);
  await deleteDoc(workerRef);
};
