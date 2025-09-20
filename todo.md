# Control de Asistencia - MVP Todo List

## Archivos a crear/modificar:

### 1. **src/pages/Index.tsx** - Página principal con interfaz de registro
- Botones para los 4 eventos: ENTRADA, REFRIGERIO, TÉRMINO DE REFRIGERIO, SALIDA
- Selector de usuario (máximo 3 usuarios)
- Captura automática de fecha y hora
- Interfaz limpia y profesional

### 2. **src/components/AttendanceForm.tsx** - Componente del formulario de registro
- Botones de eventos con estados visuales
- Selector de usuario
- Confirmación de acciones
- Feedback visual al registrar eventos

### 3. **src/components/AdminPanel.tsx** - Panel de administración
- Tabla con todos los registros
- Filtros por usuario y fecha
- Cálculo de horas trabajadas (excluyendo refrigerio)
- Reporte diario por trabajador

### 4. **src/lib/attendance.ts** - Lógica de manejo de datos
- Tipos TypeScript para los registros
- Funciones para calcular horas trabajadas
- Utilidades para formateo de fechas y tiempos

### 5. **src/pages/api/attendance.ts** - API Route para registros
- POST: Guardar nuevo registro
- GET: Obtener registros con filtros
- Almacenamiento local en JSON
- Integración con Google Sheets API

### 6. **src/pages/api/google-sheets.ts** - API Route para Google Sheets
- Configuración de Google Sheets API
- Sincronización automática de datos
- Manejo de errores de conexión

### 7. **src/lib/googleSheets.ts** - Cliente de Google Sheets
- Configuración de autenticación
- Funciones para escribir en la hoja de cálculo
- Formato de datos para Google Sheets

### 8. **public/data/attendance.json** - Archivo de respaldo local
- Estructura JSON para almacenar registros
- Sistema de respaldo automático

## Estructura de datos:
```typescript
interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  eventType: 'ENTRADA' | 'REFRIGERIO' | 'TERMINO_REFRIGERIO' | 'SALIDA';
  timestamp: string;
  date: string;
}

interface DailyReport {
  userId: string;
  userName: string;
  date: string;
  entrada?: string;
  refrigerio?: string;
  terminoRefrigerio?: string;
  salida?: string;
  horasTrabajadas: number;
}
```

## Flujo de la aplicación:
1. Usuario selecciona su nombre y presiona botón de evento
2. Se captura timestamp automáticamente
3. Se guarda en archivo local JSON
4. Se sincroniza con Google Sheets
5. Se muestra confirmación al usuario
6. Panel admin permite ver reportes y filtrar datos

## Prioridades MVP:
- Funcionalidad básica de registro ✓
- Almacenamiento local ✓
- Panel de visualización básico ✓
- Cálculo de horas trabajadas ✓
- Integración Google Sheets (opcional para MVP inicial)