import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, CheckCircle, LogOutIcon } from 'lucide-react';
import { EVENT_TYPES, type AttendanceRecord, generateId, getButtonStates } from '@/lib/attendance-cosmos';
import { getWorkerById, clearSession, type Worker } from '@/lib/auth';
import { getAllRecords } from '@/lib/storage';
import { saveRecord } from '@/lib/storage';
/* import { retryPendingSync } from '@/lib/storage'; // opcional, si usas el botón de reintento */

import { toast } from 'sonner';
import CompanyHeader from './CompanyHeader';
import ConfirmationDialog from './ConfirmationDialog';
import { SessionProps } from '@/lib/types';

export default function AttendanceSystem({ session, onLogout }: SessionProps) {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [buttonStates, setButtonStates] = useState<Record<string, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    eventType: string;
  }>({
    isOpen: false,
    eventType: ''
  });

  // Load worker data with real-time updates
  useEffect(() => {
    const loadWorkerData = () => {
      const workerData = getWorkerById(session.userId);
      if (workerData) {
        setWorker(workerData);
      } else {
        toast.error('Trabajador no encontrado');
        onLogout();
      }
    };

    loadWorkerData();

    // Listen for worker updates
    const handleWorkersUpdate = () => {
      loadWorkerData();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cosmos_workers') {
        loadWorkerData();
      }
    };

    window.addEventListener('workersUpdated', handleWorkersUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('workersUpdated', handleWorkersUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [session.userId, onLogout]);

  useEffect(() => {
    const records = getAllRecords();
    const userRecords = records.filter(r => r.workerId === session.userId);
    const recentUserRecords = userRecords.slice(0, 5);
    setRecentRecords(recentUserRecords);

    // Get last record to determine button states
    const lastRecord = userRecords.length > 0 ? userRecords[0] : null;
    const states = getButtonStates(lastRecord);
    setButtonStates(states);
  }, [session.userId]);

  const handleEventClick = (eventType: keyof typeof EVENT_TYPES) => {
    setConfirmDialog({
      isOpen: true,
      eventType: EVENT_TYPES[eventType]
    });
  };

  const handleConfirmEvent = async () => {
    if (!worker) return;

    setIsLoading(true);
    
    const now = new Date();
    const record: AttendanceRecord = {
      id: generateId(),
      workerId: worker.id,
      workerName: worker.name,
      workerDocument: worker.document,
      eventType: confirmDialog.eventType as AttendanceRecord['eventType'],
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
      location: 'Oficina Principal'
    };

    try {
      // Save with automatic Google Sheets sync
      await saveRecord(record);
      
      setRecentRecords(prev => [record, ...prev.slice(0, 4)]);
      
      // Update button states based on new record
      const newStates = getButtonStates(record);
      setButtonStates(newStates);
      
      toast.success(`${confirmDialog.eventType} registrada correctamente`, {
        description: `${worker.name} - ${now.toLocaleTimeString('es-PE')} - Sincronizado con Google Sheets`,
        icon: <CheckCircle className="h-4 w-4" />
      });
    } catch (error) {
      console.error('Error:', error);
      
      // Show different messages based on error type
      if (error instanceof Error && error.message.includes('failed to sync')) {
        toast.warning('Registro guardado localmente', {
          description: 'Se sincronizará con Google Sheets cuando haya conexión'
        });
      } else {
        toast.error('Error al registrar el evento');
      }
    } finally {
      setIsLoading(false);
      setConfirmDialog({ isOpen: false, eventType: '' });
    }
  };

  const handleCancelEvent = () => {
    setConfirmDialog({ isOpen: false, eventType: '' });
  };

  const handleLogout = () => {
    clearSession();
    onLogout();
    toast.info('Sesión cerrada correctamente');
  };

  const getButtonColor = (eventType: string, isEnabled: boolean) => {
    const baseColor = (() => {
      switch (eventType) {
        case 'ENTRADA': return 'bg-green-600 hover:bg-green-700';
        case 'REFRIGERIO': return 'bg-orange-600 hover:bg-orange-700';
        case 'TERMINO_REFRIGERIO': return 'bg-blue-600 hover:bg-blue-700';
        case 'SALIDA': return 'bg-red-600 hover:bg-red-700';
        default: return 'bg-gray-600 hover:bg-gray-700';
      }
    })();

    return isEnabled 
      ? `${baseColor} text-white` 
      : 'bg-gray-300 text-gray-500 cursor-not-allowed';
  };

  if (!worker) {
    return <div>Error: Usuario no encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <CompanyHeader />
      
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Usuario actual */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    {worker.photo ? (
                      <img
                        src={worker.photo}
                        alt={worker.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xl font-bold">
                                ${worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xl font-bold">
                        {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{worker.name}</h2>
                    <Badge variant="secondary" className="mb-1">{worker.position}</Badge>
                    <p className="text-sm text-gray-500">DNI: {worker.document}</p>
                  </div>
                </div>
                <Button onClick={handleLogout} variant="outline" className="gap-2">
                  <LogOutIcon className="h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Botones de registro */}
          <Card className="shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Clock className="h-6 w-6" />
                Registro de Asistencia
              </CardTitle>
              <p className="text-blue-100">
                Seleccione el evento a registrar
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 gap-6">
                <Button
                  onClick={() => handleEventClick('ENTRADA')}
                  disabled={isLoading || !buttonStates.ENTRADA}
                  className={`h-24 text-xl font-semibold transition-all duration-200 ${getButtonColor('ENTRADA', buttonStates.ENTRADA)}`}
                >
                  ENTRADA
                </Button>
                
                <Button
                  onClick={() => handleEventClick('REFRIGERIO')}
                  disabled={isLoading || !buttonStates.REFRIGERIO}
                  className={`h-24 text-xl font-semibold transition-all duration-200 ${getButtonColor('REFRIGERIO', buttonStates.REFRIGERIO)}`}
                >
                  REFRIGERIO
                </Button>
                
                <Button
                  onClick={() => handleEventClick('TERMINO_REFRIGERIO')}
                  disabled={isLoading || !buttonStates.TERMINO_REFRIGERIO}
                  className={`h-24 text-xl font-semibold transition-all duration-200 ${getButtonColor('TERMINO_REFRIGERIO', buttonStates.TERMINO_REFRIGERIO)}`}
                >
                  TÉRMINO REFRIGERIO
                </Button>
                
                <Button
                  onClick={() => handleEventClick('SALIDA')}
                  disabled={isLoading || !buttonStates.SALIDA}
                  className={`h-24 text-xl font-semibold transition-all duration-200 ${getButtonColor('SALIDA', buttonStates.SALIDA)}`}
                >
                  SALIDA
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg mt-6">
                <Clock className="h-4 w-4 inline mr-1" />
                Hora actual: {new Date().toLocaleTimeString('es-PE')}
              </div>

              {/* Estado actual */}
              {recentRecords.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-blue-700">
                    Último registro: <span className="font-semibold">{recentRecords[0].eventType}</span>
                    {' '}a las {new Date(recentRecords[0].timestamp).toLocaleTimeString('es-PE')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registros recientes */}
          {recentRecords.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Mis Últimos Registros
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {recentRecords.map((record, index) => (
                    <div
                      key={record.id}
                      className={`flex justify-between items-center p-4 hover:bg-gray-50 transition-colors ${
                        index === 0 ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          record.eventType === 'ENTRADA' ? 'bg-green-500' :
                          record.eventType === 'REFRIGERIO' ? 'bg-orange-500' :
                          record.eventType === 'TERMINO_REFRIGERIO' ? 'bg-blue-500' :
                          'bg-red-500'
                        }`}></div>
                        <div>
                          <span className="font-medium text-gray-900">{record.eventType}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {record.location}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 font-mono">
                        {new Date(record.timestamp).toLocaleString('es-PE')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        eventType={confirmDialog.eventType}
        workerName={worker.name}
        onConfirm={handleConfirmEvent}
        onCancel={handleCancelEvent}
      />
    </div>
  );
}