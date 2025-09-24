import React, { useEffect, useMemo, useState } from "react";


import { useNavigate } from "react-router-dom"; // 🔹 importa esto


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Settings,
  History,
} from "lucide-react";
import { clearSession } from "@/lib/auth";
import { toast } from "sonner";
import CompanyHeader from "./CompanyHeader";
import WorkerManagement from "./WorkerManagement";
import { SessionProps } from "@/lib/types";

// 🔹 Modelo unificado de asistencia
import type { AttendanceRecord } from "@/lib/attendance-cosmos";
import { EVENT_TYPES } from "@/lib/attendance-cosmos";

// 🔹 Firestore en tiempo real
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export default function AdminDashboard({ session, onLogout }: SessionProps) {

  const navigate = useNavigate(); // 🔹 inicializa el hook

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // 🔸 Suscripción en tiempo real a Firestore (attendance)
  useEffect(() => {
    const q = query(collection(db, "attendance"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ ...(d.data() as AttendanceRecord) }));
        setRecords(rows);
        setLastSyncTime(new Date());
      },
      (err) => {
        console.error("Error listening attendance:", err);
        toast.error("Error al cargar registros desde Firestore");
      }
    );
    return () => unsub();
  }, []);

  // 🔸 Stats calculadas desde records
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const thisMonth = today.substring(0, 7); // YYYY-MM
    const total = records.length;
    const todayCount = records.filter((r) => r.date === today).length;
    const monthCount = records.filter((r) => r.date?.startsWith(thisMonth)).length;
    const byEventType = {
      ENTRADA: records.filter((r) => r.eventType === EVENT_TYPES.ENTRADA).length,
      REFRIGERIO: records.filter((r) => r.eventType === EVENT_TYPES.REFRIGERIO).length,
      TERMINO_REFRIGERIO: records.filter((r) => r.eventType === EVENT_TYPES.TERMINO_REFRIGERIO).length,
      SALIDA: records.filter((r) => r.eventType === EVENT_TYPES.SALIDA).length,
    };
    return { total, today: todayCount, thisMonth: monthCount, byEventType };
  }, [records]);

  // 🔸 Estado “similar” al de sync con Sheets, adaptado a Firestore
  const syncStatus = useMemo(() => {
    return {
      totalRecords: records.length,
      failedSyncs: 0,
      lastSyncAttempt: lastSyncTime ? lastSyncTime.toISOString() : null,
    };
  }, [records.length, lastSyncTime]);

  // ========== Acciones de UI ==========
  const handleLogout = () => {
    clearSession();
    onLogout();
    toast.info("Sesión de administrador cerrada");
  };

  const handleExportData = () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        totalRecords: records.length,
        records,
      };
      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `asistencia-cosmos-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Datos exportados correctamente");
    } catch (error) {
      toast.error("Error al exportar datos");
      console.error("Export error:", error);
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setLastSyncTime(new Date());
      toast.info("Firestore ya sincroniza en tiempo real");
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleRetryFailedSyncs = async () => {
    toast.info("No hay pendientes: Firestore en tiempo real");
  };

  const refreshData = () => {
    setLastSyncTime(new Date());
    toast.success("Datos actualizados (tiempo real)");
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
                        {syncStatus.failedSyncs === 0 ? "Tiempo real" : `${syncStatus.failedSyncs} pendientes`}
                      </span>
                    </div>
                  </div>
                  <Settings className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Firestore Sync Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sincronización (Firestore en tiempo real)
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
                  <p className="text-sm text-gray-600">Última Actualización</p>
                  <p className="text-sm text-green-600">
                    {lastSyncTime ? lastSyncTime.toLocaleString("es-PE") : "Automática"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={handleManualSync} disabled={isManualSyncing} className="gap-2">
                  {isManualSyncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isManualSyncing ? "Sincronizando..." : "Sincronizar Todo"}
                </Button>

                <Button onClick={handleRetryFailedSyncs} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reintentar Fallidos
                </Button>

                <Button onClick={handleExportData} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar Datos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="workers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history" className="gap-2">
                <Clock className="h-4 w-4" />
                Registros de Asistencia
              </TabsTrigger>
              <TabsTrigger value="workers" className="gap-2">
                <Users className="h-4 w-4" />
                Gestión de Trabajadores
              </TabsTrigger>
            </TabsList>

            {/* 🔹 Botón para ir al historial completo */}
            <TabsContent value="history">
              <Card className="shadow-lg">
                <CardContent className="p-6 text-center">
                  <p className="mb-4 text-gray-700">
                    Ahora puedes consultar y gestionar los registros en una pantalla exclusiva.
                  </p>
                <Button onClick={() => navigate("/history")} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Ver Historial Completo
                </Button>
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
