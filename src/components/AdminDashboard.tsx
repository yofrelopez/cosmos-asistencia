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
import { getTodayStats, getMonthlyStats } from "@/lib/attendance-cosmos";


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


  const todayStats = useMemo(() => getTodayStats(records), [records]);
const monthlyStats = useMemo(() => getMonthlyStats(records), [records]);


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

    <div className="container mx-auto p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <Card className="shadow-md">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Panel de Administración
              </h1>
              <p className="text-gray-600 text-sm">Bienvenido, {session.userName}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="gap-2 w-full sm:w-auto">
              <LogOutIcon className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>

        {/* Stats Hoy */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Presentes Hoy</p>
                <p className="text-xl font-bold text-green-600">{todayStats.presentes}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Ausentes Hoy</p>
                <p className="text-xl font-bold text-red-600">{todayStats.ausentes}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-red-500" />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Tardanzas</p>
                <p className="text-xl font-bold text-yellow-600">{todayStats.tardanzas}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-500" />
            </CardContent>
          </Card>
        </div>

        {/* Stats Mensuales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Asistencias (Mes)</p>
                <p className="text-xl font-bold text-blue-600">{monthlyStats.total}</p>
              </div>
              <Calendar className="h-6 w-6 text-blue-500" />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Promedio Horas Trabajadas</p>
                <p className="text-xl font-bold text-purple-600">
                  {monthlyStats.promedioHoras.toFixed(1)}h
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="history" className="space-y-4">
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

          <TabsContent value="history">
            <Card className="shadow-md">
              <CardContent className="p-6 text-center">
                <p className="mb-4 text-gray-700">
                  Consulta y gestiona los registros en la pantalla de historial completo.
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
