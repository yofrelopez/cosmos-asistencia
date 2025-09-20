import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, UserIcon, ClockIcon, DownloadIcon } from 'lucide-react';
import { USERS, type AttendanceRecord, type DailyReport, generateDailyReport, formatTime, formatDate } from '@/lib/attendance';

interface AdminPanelProps {
  records: AttendanceRecord[];
}

export default function AdminPanel({ records }: AdminPanelProps) {
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>(records);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);

  useEffect(() => {
    let filtered = records;

    if (selectedUser !== 'all') {
      filtered = filtered.filter(record => record.userId === selectedUser);
    }

    if (selectedDate !== 'all') {
      filtered = filtered.filter(record => record.date === selectedDate);
    }

    setFilteredRecords(filtered);

    // Generate daily reports for selected date
    if (selectedDate !== 'all') {
      const reports = generateDailyReport(records, selectedDate);
      setDailyReports(reports);
    } else {
      setDailyReports([]);
    }
  }, [records, selectedUser, selectedDate]);

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'ENTRADA': return 'bg-green-100 text-green-800';
      case 'REFRIGERIO': return 'bg-orange-100 text-orange-800';
      case 'TERMINO_REFRIGERIO': return 'bg-blue-100 text-blue-800';
      case 'SALIDA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Fecha', 'Usuario', 'Evento', 'Hora'].join(','),
      ...filteredRecords.map(record => [
        record.date,
        record.userName,
        record.eventType,
        formatTime(record.timestamp)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencia_${selectedDate !== 'all' ? selectedDate : 'todos'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uniqueDates = [...new Set(records.map(r => r.date))].sort().reverse();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Panel de Administración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium mb-2 block">Filtrar por Usuario</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {USERS.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium mb-2 block">Filtrar por Fecha</label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  {uniqueDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {formatDate(date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={exportToCSV} variant="outline" className="gap-2">
                <DownloadIcon className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedDate !== 'all' && dailyReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Reporte Diario - {formatDate(selectedDate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Refrigerio</TableHead>
                  <TableHead>Término Refrigerio</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Horas Trabajadas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyReports.map((report) => (
                  <TableRow key={report.userId}>
                    <TableCell className="font-medium">{report.userName}</TableCell>
                    <TableCell>{report.entrada || '-'}</TableCell>
                    <TableCell>{report.refrigerio || '-'}</TableCell>
                    <TableCell>{report.terminoRefrigerio || '-'}</TableCell>
                    <TableCell>{report.salida || '-'}</TableCell>
                    <TableCell className="font-semibold">
                      {report.horasTrabajadas > 0 ? `${report.horasTrabajadas.toFixed(2)}h` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Registros de Asistencia ({filteredRecords.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay registros para mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell className="font-medium">{record.userName}</TableCell>
                    <TableCell>
                      <Badge className={getEventBadgeColor(record.eventType)}>
                        {record.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatTime(record.timestamp)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}