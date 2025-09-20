import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Clock, 
  Calendar, 
  FileText, 
  Download, 
  Upload,
  RefreshCw,
  LogOutIcon,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { clearSession } from '@/lib/auth';
import { getAllRecords, getRecordsStatistics, exportRecordsAsJSON } from '@/lib/storage';
import { manualSyncAllRecords, retryPendingSync, getSyncStatus } from "@/lib/storage";
import { toast } from 'sonner';
import CompanyHeader from './CompanyHeader';
import WorkerManagement from './WorkerManagement';
import { SessionProps } from '@/lib/types';

export default function AdminDashboard({ session, onLogout }: SessionProps) {
  const [records, setRecords] = useState(getAllRecords());
  const [stats, setStats] = useState(getRecordsStatistics());
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      setRecords(getAllRecords());
      setStats(getRecordsStatistics());
      setSyncStatus(getSyncStatus());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    clearSession();
    onLogout();
    toast.info('Sesión de administrador cerrada');
  };

  const handleExportData = () => {
    try {
      const jsonData = exportRecordsAsJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asistencia-cosmos-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Datos exportados correctamente');
    } catch (error) {
      toast.error('Error al exportar datos');
      console.error('Export error:', error);
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    
    try {
      await manualSyncAllRecords();
      setLastSyncTime(new Date());
      setSyncStatus(getSyncStatus());
      toast.success('Sincronización manual completada', {
        description: 'Todos los registros se han sincronizado con Google Sheets'
      });
    } catch (error) {
      console.error('Manual sync error:', error);
      toast.error('Error en la sincronización manual', {
        description: 'Algunos registros pueden no haberse sincronizado'
      });
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleRetryFailedSyncs = async () => {
    try {
      await retryPendingSync();
      setSyncStatus(getSyncStatus());
      toast.success('Reintento de sincronización completado');
    } catch (error) {
      console.error('Retry failed syncs error:', error);
      toast.error('Error al reintentar sincronización');
    }
  };

  const refreshData = () => {
    setRecords(getAllRecords());
    setStats(getRecordsStatistics());
    setSyncStatus(getSyncStatus());
    toast.success('Datos actualizados');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <CompanyHeader />
      
      <div className="container mx-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                  <p className="text-gray-600">Bienvenido, {session.userName}</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={refreshData} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Actualizar
                  </Button>
                  <Button onClick={handleLogout} variant="outline" className="gap-2">
                    <LogOutIcon className="h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Registros</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Registros Hoy</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Este Mes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sincronización</p>
                    <div className="flex items-center gap-2">
                      {syncStatus.failedSyncs === 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="text-sm">
                        {syncStatus.failedSyncs === 0 ? 'Sincronizado' : `${syncStatus.failedSyncs} pendientes`}
                      </span>
                    </div>
                  </div>
                  <Settings className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Google Sheets Sync Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sincronización con Google Sheets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total de Registros</p>
                  <p className="text-xl font-bold text-blue-600">{syncStatus.totalRecords}</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Pendientes de Sincronizar</p>
                  <p className="text-xl font-bold text-yellow-600">{syncStatus.failedSyncs}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Última Sincronización</p>
                  <p className="text-sm text-green-600">
                    {lastSyncTime ? lastSyncTime.toLocaleString('es-PE') : 'Automática'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={handleManualSync}
                  disabled={isManualSyncing}
                  className="gap-2"
                >
                  {isManualSyncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isManualSyncing ? 'Sincronizando...' : 'Sincronizar Todo'}
                </Button>

                {syncStatus.failedSyncs > 0 && (
                  <Button 
                    onClick={handleRetryFailedSyncs}
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reintentar Fallidos
                  </Button>
                )}

                <Button 
                  onClick={handleExportData}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar Datos
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <p><strong>Nota:</strong> Los registros se sincronizan automáticamente con Google Sheets.</p>
                <p>Carpeta: <strong>ASISTENCIA-COSMOS</strong> | Archivos: <strong>Registros_Detallados_2024</strong> y <strong>Reporte_SUNAFIL_2024</strong></p>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="attendance" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="attendance" className="gap-2">
                <Clock className="h-4 w-4" />
                Registros de Asistencia
              </TabsTrigger>
              <TabsTrigger value="workers" className="gap-2">
                <Users className="h-4 w-4" />
                Gestión de Trabajadores
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attendance">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Registros de Asistencia ({records.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {records.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No hay registros de asistencia disponibles
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {records.slice(0, 10).map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className={`w-3 h-3 rounded-full ${
                                record.eventType === 'ENTRADA' ? 'bg-green-500' :
                                record.eventType === 'REFRIGERIO' ? 'bg-orange-500' :
                                record.eventType === 'TERMINO_REFRIGERIO' ? 'bg-blue-500' :
                                'bg-red-500'
                              }`}></div>
                              <div>
                                <p className="font-medium">{record.workerName}</p>
                                <p className="text-sm text-gray-500">{record.eventType}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-sm">{new Date(record.timestamp).toLocaleString('es-PE')}</p>
                              <p className="text-xs text-gray-500">{record.location}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workers">
              <WorkerManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}