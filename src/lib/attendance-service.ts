// attendance-service.ts
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import type { AttendanceRecord } from "./attendance-cosmos";

const ATTENDANCE_COL = "attendance";



/**
 * Guarda un registro en Firestore usando el id generado en frontend.
 * - Mantiene el shape actual (timestamp ISO string) para no romper lógica existente.
 * - Agrega createdAt (serverTimestamp) para ordenar en tiempo real.
 * - (Opcional) aquí puedes disparar la réplica a Google Sheets.
 */
export async function saveAttendanceRecord(record: AttendanceRecord) {
  const ref = doc(collection(db, ATTENDANCE_COL), record.id);
  const toSave: any = {
    ...record,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, toSave, { merge: true });

  // 🔁 (Opcional) réplica a Google Sheets:
  // try { await replicateToSheets(record); } catch { /* no bloquear UI */ }

  return ref.id;
}

/**
 * Escucha en tiempo real los últimos N registros del trabajador.
 * Retorna la función unsubscribe para que la llames en cleanup del componente.
 */
export function listenToUserRecords(
  workerId: string,
  cb: (records: AttendanceRecord[]) => void,
  max = 5
) {
  const q = query(
    collection(db, ATTENDANCE_COL),
    where("workerId", "==", workerId),
    orderBy("createdAt", "desc"),
    limit(max)
  );

  const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    // Mapeamos conservando el shape de AttendanceRecord
    const rows = snap.docs
      .map((d) => d.data() as AttendanceRecord)
      // Aseguramos orden por timestamp ISO (por si hay empates de createdAt)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    cb(rows);
  });

  return unsub;
}




export async function addAttendance(record: any) {
  return await addDoc(collection(db, "attendance"), record);
}

export async function getAttendance() {
  const snapshot = await getDocs(collection(db, "attendance"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}



