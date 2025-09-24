import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { AttendanceRecord } from "@/lib/attendance-cosmos";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

type AddRecordModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Worker = {
  id: string;
  name: string;
  document: string;
};

export default function AddRecordModal({ isOpen, onClose }: AddRecordModalProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [eventType, setEventType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 🔹 Cargar trabajadores en tiempo real
  useEffect(() => {
    const q = query(collection(db, "workers"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Worker, "id">),
      })) as Worker[];
      setWorkers(data);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!workerId || !eventType || !date || !time) {
      toast.error("Complete todos los campos requeridos");
      return;
    }

    setIsSaving(true);
    try {
      const worker = workers.find((w) => w.id === workerId);
      if (!worker) {
        toast.error("Trabajador no encontrado");
        return;
      }

      const timestamp = new Date(`${date}T${time}:00`).toISOString();

      await addDoc(collection(db, "attendance"), {
        workerId,
        workerName: worker.name,
        workerDocument: worker.document,
        eventType,
        date,
        timestamp,
        location: "Oficina Principal", // 🔹 Ubicación fija
      } as AttendanceRecord);

      toast.success("Registro creado exitosamente");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Error al crear registro");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar Registro</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trabajador */}
          <div>
            <Label>Trabajador</Label>
            <Select
              value={workerId}
              onValueChange={setWorkerId}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar trabajador" />
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

          {/* Evento */}
          <div>
            <Label>Evento</Label>
            <Select
              value={eventType}
              onValueChange={setEventType}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar evento" />
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

          {/* Fecha */}
          <div>
            <Label>Fecha</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Hora */}
          <div>
            <Label>Hora</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Ubicación (fija) */}
          <div>
            <Label>Ubicación</Label>
            <Input value="Oficina Principal" disabled />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
