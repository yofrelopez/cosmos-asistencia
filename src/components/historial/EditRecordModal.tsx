import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { AttendanceRecord } from "@/lib/attendance-cosmos";

type EditRecordModalProps = {
  isOpen: boolean;
  record: AttendanceRecord | null;
  onSave: (record: AttendanceRecord) => void;
  onCancel: () => void;
};

export default function EditRecordModal({
  isOpen,
  record,
  onSave,
  onCancel,
}: EditRecordModalProps) {
  const [form, setForm] = useState<AttendanceRecord | null>(record);

  useEffect(() => {
    setForm(record);
  }, [record]);

  if (!form) return null;

  const handleChange = (field: keyof AttendanceRecord, value: any) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSubmit = () => {
    if (form) {
      onSave(form);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Registro</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trabajador (solo lectura) */}
          <div>
            <Label>Trabajador</Label>
            <Input value={form.workerName} disabled />
          </div>

          {/* Documento (solo lectura) */}
          <div>
            <Label>Documento</Label>
            <Input value={form.workerDocument || ""} disabled />
          </div>

          {/* Evento (editable con Select) */}
          <div>
            <Label>Evento</Label>
            <Select
              value={form.eventType}
              onValueChange={(val) => handleChange("eventType", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTRADA">Entrada</SelectItem>
                <SelectItem value="REFRIGERIO">Refrigerio</SelectItem>
                <SelectItem value="TERMINO_REFRIGERIO">
                  Término de Refrigerio
                </SelectItem>
                <SelectItem value="SALIDA">Salida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fecha y Hora (editable) */}
          <div>
            <Label>Fecha y Hora</Label>
            <Input
              type="datetime-local"
              value={
                form.timestamp
                  ? new Date(form.timestamp).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                handleChange(
                  "timestamp",
                  new Date(e.target.value).toISOString()
                )
              }
            />
          </div>

          {/* Ubicación (solo lectura) */}
          <div>
            <Label>Ubicación</Label>
            <Input value={form.location || ""} disabled />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Guardar Cambios</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
