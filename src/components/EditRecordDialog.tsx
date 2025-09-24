import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AttendanceRecord } from "@/lib/attendance-cosmos";

// 🔹 Cargamos trabajadores desde Firestore (en vez de WORKERS de auth.ts)
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

type SimpleWorker = { id: string; name: string; document?: string };

interface EditRecordDialogProps {
  isOpen: boolean;
  record: AttendanceRecord | null;
  onSave: (record: AttendanceRecord) => void;
  onCancel: () => void;
}

export default function EditRecordDialog({
  isOpen,
  record,
  onSave,
  onCancel,
}: EditRecordDialogProps) {
  const [formData, setFormData] = useState<Partial<AttendanceRecord>>({});
  const [workers, setWorkers] = useState<SimpleWorker[]>([]);

  // 🔸 Suscripción en tiempo real a la colección "workers"
  useEffect(() => {
    const q = query(collection(db, "workers"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...(d.data() as Omit<SimpleWorker, "id">),
          } as SimpleWorker)
      );
      setWorkers(rows);
    });
    return () => unsub();
  }, []);

  // 🔸 Pre-cargar el formulario con el registro seleccionado
  useEffect(() => {
    if (record) {
      setFormData({
        ...record,
        // datetime-local requiere formato "YYYY-MM-DDTHH:mm"
        timestamp: new Date(record.timestamp).toISOString().slice(0, 16),
      });
    }
  }, [record]);

  const handleSave = () => {
    if (!formData?.id || !formData?.timestamp) return;

    const iso = new Date(formData.timestamp as string).toISOString();

    const updatedRecord: AttendanceRecord = {
      ...(formData as AttendanceRecord),
      timestamp: iso,
      date: iso.split("T")[0],
    };

    onSave(updatedRecord); // El padre actualiza Firestore (updateDoc)
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Registro de Asistencia</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trabajador */}
          <div>
            <Label htmlFor="worker">Trabajador</Label>
            <Select
              value={formData.workerId ?? ""}
              onValueChange={(value) => {
                const w = workers.find((x) => x.id === value);
                if (w) {
                  setFormData((prev) => ({
                    ...prev,
                    workerId: w.id,
                    workerName: w.name,
                    workerDocument: w.document ?? "",
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un trabajador" />
              </SelectTrigger>
              <SelectContent>
                {workers.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de evento */}
          <div>
            <Label htmlFor="eventType">Tipo de Evento</Label>
            <Select
              value={formData.eventType ?? ""}
              onValueChange={(value: AttendanceRecord["eventType"]) =>
                setFormData((prev) => ({ ...prev, eventType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTRADA">ENTRADA</SelectItem>
                <SelectItem value="REFRIGERIO">REFRIGERIO</SelectItem>
                <SelectItem value="TERMINO_REFRIGERIO">
                  TÉRMINO DE REFRIGERIO
                </SelectItem>
                <SelectItem value="SALIDA">SALIDA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fecha y hora */}
          <div>
            <Label htmlFor="timestamp">Fecha y Hora</Label>
            <Input
              id="timestamp"
              type="datetime-local"
              value={(formData.timestamp as string) ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, timestamp: e.target.value }))
              }
            />
          </div>

          {/* Ubicación */}
          <div>
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              value={formData.location ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="Oficina Principal"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
