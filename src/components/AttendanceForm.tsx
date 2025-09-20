import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Clock, User, CheckCircle } from 'lucide-react';
import { USERS, EVENT_TYPES, type AttendanceRecord, generateId } from '@/lib/attendance';
import { saveRecord } from '@/lib/storage';

interface AttendanceFormProps {
  onRecordAdded: (record: AttendanceRecord) => void;
}

export default function AttendanceForm({ onRecordAdded }: AttendanceFormProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEventClick = async (eventType: keyof typeof EVENT_TYPES) => {
    if (!selectedUser) {
      toast.error('Por favor selecciona un usuario');
      return;
    }

    setIsLoading(true);
    
    const now = new Date();
    const record: AttendanceRecord = {
      id: generateId(),
      userId: selectedUser,
      userName: USERS.find(u => u.id === selectedUser)?.name || '',
      eventType: EVENT_TYPES[eventType],
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0]
    };

    try {
      saveRecord(record);
      onRecordAdded(record);
      toast.success(`${eventType} registrada correctamente`, {
        description: `${record.userName} - ${now.toLocaleTimeString('es-ES')}`,
        icon: <CheckCircle className="h-4 w-4" />
      });
    } catch (error) {
      toast.error('Error al registrar el evento');
      console.error('Error:', error);
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
        <p className="text-blue-100">
          Registra tu entrada, refrigerio y salida
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Seleccionar Usuario
          </label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecciona tu nombre" />
            </SelectTrigger>
            <SelectContent>
              {USERS.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleEventClick('ENTRADA')}
            disabled={!selectedUser || isLoading}
            className={`h-20 text-lg font-semibold transition-all duration-200 ${getButtonColor('ENTRADA')}`}
          >
            ENTRADA
          </Button>
          
          <Button
            onClick={() => handleEventClick('REFRIGERIO')}
            disabled={!selectedUser || isLoading}
            className={`h-20 text-lg font-semibold transition-all duration-200 ${getButtonColor('REFRIGERIO')}`}
          >
            REFRIGERIO
          </Button>
          
          <Button
            onClick={() => handleEventClick('TERMINO_REFRIGERIO')}
            disabled={!selectedUser || isLoading}
            className={`h-20 text-lg font-semibold transition-all duration-200 ${getButtonColor('TERMINO_REFRIGERIO')}`}
          >
            TÉRMINO REFRIGERIO
          </Button>
          
          <Button
            onClick={() => handleEventClick('SALIDA')}
            disabled={!selectedUser || isLoading}
            className={`h-20 text-lg font-semibold transition-all duration-200 ${getButtonColor('SALIDA')}`}
          >
            SALIDA
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
          <Clock className="h-4 w-4 inline mr-1" />
          Hora actual: {new Date().toLocaleTimeString('es-ES')}
        </div>
      </CardContent>
    </Card>
  );
}