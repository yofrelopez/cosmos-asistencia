import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AttendanceRecord } from "@/lib/attendance-cosmos";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import RecordActions from "@/components/historial/RecordActions";
import EditRecordModal from "@/components/historial/EditRecordModal";

import { doc, updateDoc, deleteDoc  } from "firebase/firestore";
import { toast } from "sonner";







type RecordsTableProps = {
  filters: {
    workerId?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
  };
};

const PAGE_SIZE = 10;

export default function RecordsTable({ filters }: RecordsTableProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);


  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);


  // 🔹 Construir la query con filtros
  const buildQuery = (extra?: any) => {
    const conditions: any[] = [];

  if (filters.workerId && filters.workerId !== "all") {
  conditions.push(where("workerId", "==", filters.workerId));
}


    
   if (filters.eventType && filters.eventType !== "all") {
  conditions.push(where("eventType", "==", filters.eventType));
}
    
    if (filters.startDate) conditions.push(where("date", ">=", filters.startDate));
    if (filters.endDate) conditions.push(where("date", "<=", filters.endDate));

    return query(
      collection(db, "attendance"),
      ...conditions,
      orderBy("timestamp", "desc"),
      limit(PAGE_SIZE),
      ...(extra ? [extra] : [])
    );
  };

  // 🔹 Cargar primera página
  useEffect(() => {
    setLoading(true);
    const q = buildQuery();
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setRecords(data);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
      setLoading(false);
    });

    return () => unsub();
  }, [filters]);

  // 🔹 Cargar más registros
  const loadMore = async () => {
    if (!lastDoc) return;
    setLoading(true);

    const q = buildQuery(startAfter(lastDoc));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setRecords((prev) => [...prev, ...data]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
      setLoading(false);
    });

    return () => unsub();
  };



  const handleSaveEdit = async (updated: AttendanceRecord) => {
  try {
    // Sólo permitimos cambiar eventType y timestamp; recalculamos date desde timestamp
    const newDate = updated.timestamp
      ? new Date(updated.timestamp).toISOString().split("T")[0]
      : updated.date;

    const ref = doc(db, "attendance", updated.id);
    await updateDoc(ref, {
      eventType: updated.eventType,
      timestamp: updated.timestamp,
      date: newDate,
    });

    toast.success("Registro actualizado correctamente");
    setEditingRecord(null); // cierra modal
  } catch (e) {
    console.error(e);
    toast.error("Error al actualizar el registro");
  }
};



const handleDelete = (record: AttendanceRecord) => {
  toast.warning(`¿Eliminar el registro de ${record.workerName}?`, {
    description: `${record.eventType} - ${new Date(record.timestamp).toLocaleString("es-PE")}`,
    action: {
      label: "Eliminar",
      onClick: async () => {
        try {
          const ref = doc(db, "attendance", record.id);
          await deleteDoc(ref);
          toast.success("Registro eliminado correctamente");
        } catch (e) {
          console.error(e);
          toast.error("Error al eliminar el registro");
        }
      },
    },
  });
};





  return (
    <div className="mt-4">
      <div className="overflow-x-auto rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trabajador</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>

            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-6">
                  {loading ? "Cargando..." : "No hay registros disponibles"}
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.workerName}</TableCell>
                  <TableCell>{r.workerDocument}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        r.eventType === "ENTRADA"
                          ? "bg-green-100 text-green-800"
                          : r.eventType === "REFRIGERIO"
                          ? "bg-orange-100 text-orange-800"
                          : r.eventType === "TERMINO_REFRIGERIO"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {r.eventType}
                    </span>
                  </TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>
                    {format(new Date(r.timestamp), "HH:mm:ss", { locale: es })}
                  </TableCell>
                  <TableCell>{r.location}</TableCell>
                  <TableCell className="text-right">
                    <RecordActions
                        record={r}
                        onEdit={(rec) => setEditingRecord(rec)}
                    />
                    </TableCell>

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>



            <EditRecordModal
                record={editingRecord}
                isOpen={!!editingRecord}
                onSave={handleSaveEdit}
                onCancel={() => setEditingRecord(null)}
                />


      {/* 🔹 Paginación */}
      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button onClick={loadMore} disabled={loading}>
            {loading ? "Cargando..." : "Cargar más"}
          </Button>
        </div>
      )}
    </div>
  );
}
