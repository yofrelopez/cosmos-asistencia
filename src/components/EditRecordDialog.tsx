import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AttendanceRecord } from '@/lib/attendance-cosmos';
import { WORKERS } from '@/lib/auth';

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
  onCancel
}: EditRecordDialogProps) {
  const [formData, setFormData] = useState<Partial<AttendanceRecord>>({});

  useEffect(() => {
    if (record) {
      setFormData({
        ...record,
        timestamp: new Date(record.timestamp).toISOString().slice(0, 16)
      });
    }
  }, [record]);

  const handleSave = () => {
    if (!formData.id || !formData.timestamp) return;

    const updatedRecord: AttendanceRecord = {
      ...formData as AttendanceRecord,
      timestamp: new Date(formData.timestamp!).toISOString(),
      date: new Date(formData.timestamp!).toISOString().split('T')[0]
    };

    onSave(updatedRecord);
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Registro de Asistencia</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="worker">Trabajador</Label>
            <Select 
              value={formData.workerId} 
              onValueChange={(value) => {
                const worker = WORKERS.find(w => w.id === value);
                if (worker) {
                  setFormData(prev => ({
                    ...prev,
                    workerId: worker.id,
                    workerName: worker.name,
                    workerDocument: worker.document
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORKERS.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="eventType">Tipo de Evento</Label>
            <Select 
              value={formData.eventType} 
              onValueChange={(value: AttendanceRecord['eventType']) => setFormData(prev => ({ ...prev, eventType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTRADA">ENTRADA</SelectItem>
                <SelectItem value="REFRIGERIO">REFRIGERIO</SelectItem>
                <SelectItem value="TERMINO_REFRIGERIO">TÉRMINO DE REFRIGERIO</SelectItem>
                <SelectItem value="SALIDA">SALIDA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timestamp">Fecha y Hora</Label>
            <Input
              id="timestamp"
              type="datetime-local"
              value={formData.timestamp}
              onChange={(e) => setFormData(prev => ({ ...prev, timestamp: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Oficina Principal"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}