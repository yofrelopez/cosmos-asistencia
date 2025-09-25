import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Clock, User, CheckCircle } from 'lucide-react';
import { EVENT_TYPES, type AttendanceRecord, generateId, getCurrentDate, getCurrentTimestamp, getCurrentLocation } from '@/lib/attendance-cosmos';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { saveRecord } from '@/lib/storage';

interface AttendanceFormProps {
  onRecordAdded: (record: AttendanceRecord) => void;
}

interface Worker {
  id: string;
  name: string;
  document: string;
  photo?: string;
  position?: string;
}

export default function AttendanceForm({ onRecordAdded }: AttendanceFormProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 🔹 Cargar lista de trabajadores desde Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'workers'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      setWorkers(data);
    });

    return () => unsub();
  }, []);

  const handleEventClick = async (eventType: keyof typeof EVENT_TYPES) => {
    if (!selectedWorker) {
      toast.error('Por favor selecciona un trabajador');
      return;
    }

    setIsLoading(true);
    const worker = workers.find(w => w.id === selectedWorker);
    if (!worker) {
      toast.error('Trabajador no encontrado');
      setIsLoading(false);
      return;
    }

    const record: AttendanceRecord = {
      id: generateId(),
      workerId: worker.id,
      workerName: worker.name,
      workerDocument: worker.document,
      eventType: EVENT_TYPES[eventType],
      timestamp: getCurrentTimestamp(),
      date: getCurrentDate(),
      location: getCurrentLocation(),
    };

    try {
      await saveRecord(record);
      onRecordAdded(record);
      toast.success(`${eventType} registrado correctamente`, {
        description: `${worker.name} - ${new Date(record.timestamp).toLocaleTimeString('es-PE')}`,
        icon: <CheckCircle className="h-4 w-4" />
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al registrar el evento');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonColor = (eventType: string) => {
    switch (eventType) {
      case 'ENTRADA': return 'bg-green-600 hover:bg-green-700 text-white';
      case 'REFRIGERIO': return 'bg-orange-600 hover:bg-orange-700 text-white';
      case 'TERMINO_REFRIGERIO': return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'SALIDA': return 'bg-red-600 hover:bg-red-700 text-white';
      default: return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Clock className="h-6 w-6" />
          Control de Asistencia
        </CardTitle>
        <p className="text-blue-100">Registra tu entrada, refrigerio y salida</p>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        
        {/* 🔹 Selector de trabajador */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Seleccionar Trabajador
          </label>
          <Select value={selectedWorker} onValueChange={setSelectedWorker}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecciona un trabajador" />
            </SelectTrigger>
            <SelectContent>
              {workers.map((worker) => (
                <SelectItem key={worker.id} value={worker.id}>
                  {worker.name} ({worker.document})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 🔹 Botones de eventos */}
        <div className="grid grid-cols-2 gap-4">
          {Object.keys(EVENT_TYPES).map((event) => (
            <Button
              key={event}
              onClick={() => handleEventClick(event as keyof typeof EVENT_TYPES)}
              disabled={!selectedWorker || isLoading}
              className={`h-20 text-lg font-semibold transition-all duration-200 ${getButtonColor(event)}`}
            >
              {event.replace('_', ' ')}
            </Button>
          ))}
        </div>

        {/* 🔹 Hora actual */}
        <div className="text-center text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
          <Clock className="h-4 w-4 inline mr-1" />
          Hora actual: {new Date().toLocaleTimeString('es-PE')}
        </div>
      </CardContent>
    </Card>
  );
}
