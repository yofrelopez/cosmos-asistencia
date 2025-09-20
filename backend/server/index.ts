// backend/server/index.ts
import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// Cargar variables desde la raíz del proyecto
dotenv.config({ path: './.env' });

import { 
  syncRecordToGoogleSheets, 
  manualSyncAllRecords, 
  AttendanceRecord 
} from './google-sheets.js';

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",          // para desarrollo local
    "https://cosmos-asistencia.vercel.app"  // para producción en Vercel
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));


app.use(express.json());

// Health check: confirma que las credenciales estén bien cargadas
app.get('/api/health/google', (_req, res) => {
  const keyRaw = process.env.GOOGLE_PRIVATE_KEY || '';
  res.json({
    emailOk: !!process.env.GOOGLE_CLIENT_EMAIL,
    keyLen: keyRaw.length,
    hasEscapedNewlines: keyRaw.includes('\\n'),
  });
});

// Registrar un único evento
app.post('/api/sync', async (req, res) => {
  const record = req.body as AttendanceRecord;
  try {
    await syncRecordToGoogleSheets(record);
    res.json({ ok: true });
  } catch (err: any) {
    console.error('❌ sync error:', err?.message);
    res.status(500).json({ ok: false, error: 'SYNC_FAILED' });
  }
});

// Sincronizar múltiples registros
app.post('/api/sync-all', async (req, res) => {
  const records = req.body as AttendanceRecord[];
  try {
    await manualSyncAllRecords(records);
    res.json({ ok: true });
  } catch (err: any) {
    console.error('❌ sync-all error:', err?.message);
    res.status(500).json({ ok: false, error: 'SYNC_ALL_FAILED' });
  }
});

// Puerto del backend (usar 4000 por convención)
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API Sync corriendo en http://localhost:${PORT}`);
});
