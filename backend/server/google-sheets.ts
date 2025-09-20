// src/server/google-sheets.ts
import { google } from 'googleapis';

/** === Tipos que usa el backend === */
export interface AttendanceRecord {
  id: string;
  workerName: string;
  eventType: 'ENTRADA' | 'REFRIGERIO' | 'TERMINO_REFRIGERIO' | 'SALIDA';
  timestamp: number;           // ms epoch
  location: string;
  notes?: string;
}

/** === Config === */
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
];

const FOLDER_NAME = 'ASISTENCIA-COSMOS';
const DETAILED_PREFIX = 'Registros_Detallados_';
const SUNAFIL_PREFIX  = 'Reporte_SUNAFIL_';

// Si quieres fijar IDs manualmente, ponlos en .env
// GOOGLE_DRIVE_FOLDER_ID=xxxxx
// GOOGLE_DETAILED_SHEET_ID=xxxxx
// GOOGLE_SUNAFIL_SHEET_ID=yyyyy

/** === Autenticación === */
function getAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL!;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Faltan GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY en .env');
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });
}

async function getApis() {
  const auth = getAuth();
  await auth.authorize();
  return {
    drive: google.drive({ version: 'v3', auth }),
    sheets: google.sheets({ version: 'v4', auth }),
  };
}

/** === Utilidades de Drive/Sheets === */
async function getOrCreateFolder(name: string): Promise<string> {
  // Si definiste la carpeta en .env, úsala siempre
  const fixedId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (fixedId) return fixedId;

  const { drive } = await getApis();
  const q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
  const list = await drive.files.list({
    q,
    fields: 'files(id,name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (list.data.files?.[0]) return list.data.files[0].id!;

  const res = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder' },
    fields: 'id',
    supportsAllDrives: true,
  });
  return res.data.id!;
}

async function listSpreadsheetByName(
  folderId: string,
  title: string
): Promise<string | null> {
  const { drive } = await getApis();
  const q = `'${folderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.spreadsheet' and name='${title}'`;
  const list = await drive.files.list({
    q,
    fields: 'files(id,name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return list.data.files?.[0]?.id ?? null;
}

async function createSpreadsheetInFolder(
  folderId: string,
  title: string
): Promise<string> {
  const { drive } = await getApis();

  // Crear el archivo (Spreadsheet) directamente dentro de la carpeta
  const created = await drive.files.create({
    requestBody: {
      name: title,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [folderId],
    },
    fields: 'id',
    supportsAllDrives: true,
  });

  return created.data.id!;
}

async function ensureSheetTab(
  sheetsApi: ReturnType<typeof google.sheets>['spreadsheets'],
  spreadsheetId: string,
  tabName: string
) {
  // Lee propiedades del spreadsheet para ver si existe la pestaña
  const meta = await sheetsApi.get({ spreadsheetId });
  const exists = meta.data.sheets?.some(s => s.properties?.title === tabName);

  if (!exists) {
    await sheetsApi.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }],
      },
    });
  }
}

async function ensureHeaders(
  sheetsApi: ReturnType<typeof google.sheets>['spreadsheets'],
  spreadsheetId: string,
  tabName: string,
  headers: string[]
) {
  // Asegura la pestaña
  await ensureSheetTab(sheetsApi, spreadsheetId, tabName);

  // ¿Hay cabeceras ya?
  const row1 = await sheetsApi.values.get({
    spreadsheetId,
    range: `${tabName}!1:1`,
  }).catch(() => ({ data: {} as any }));

  const hasHeaders =
    row1.data?.values && Array.isArray(row1.data.values[0]) && row1.data.values[0].length > 0;

  if (!hasHeaders) {
    await sheetsApi.values.update({
      spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
  }
}

/** === Ensure de archivos del año (usando .env si está configurado) === */
export async function ensureSheets(year: number): Promise<{ detailedId: string; sunafilId: string; }> {
  // Si definiste IDs fijos en .env, úsalos y solo garantiza pestañas/cabeceras.
  const detailedFixed = process.env.GOOGLE_DETAILED_SHEET_ID;
  const sunafilFixed  = process.env.GOOGLE_SUNAFIL_SHEET_ID;

  const { sheets } = await getApis();

  if (detailedFixed && sunafilFixed) {
    // Asegurar pestañas + cabeceras
    await ensureHeaders(sheets.spreadsheets, detailedFixed, 'DETALLE',
      ['ID','Fecha','Hora','Trabajador','Evento','Ubicación','Notas']);
    await ensureHeaders(sheets.spreadsheets, sunafilFixed, 'SUNAFIL',
      ['Trabajador','Timestamp','Fecha','Hora','Evento','Ubicación','ID evento']);
    return { detailedId: detailedFixed, sunafilId: sunafilFixed };
  }

  // Flujo automático (crea si no existen)
  const folderId = await getOrCreateFolder(FOLDER_NAME);

  const detailedTitle = `${DETAILED_PREFIX}${year}`;
  const sunafilTitle  = `${SUNAFIL_PREFIX}${year}`;

  let detailedId = await listSpreadsheetByName(folderId, detailedTitle);
  if (!detailedId) detailedId = await createSpreadsheetInFolder(folderId, detailedTitle);

  let sunafilId = await listSpreadsheetByName(folderId, sunafilTitle);
  if (!sunafilId) sunafilId = await createSpreadsheetInFolder(folderId, sunafilTitle);

  // Garantiza pestañas + cabeceras
  await ensureHeaders(sheets.spreadsheets, detailedId, 'DETALLE',
    ['ID','Fecha','Hora','Trabajador','Evento','Ubicación','Notas']);
  await ensureHeaders(sheets.spreadsheets, sunafilId, 'SUNAFIL',
    ['Trabajador','Timestamp','Fecha','Hora','Evento','Ubicación','ID evento']);

  return { detailedId, sunafilId };
}


/** === API principal que usa el backend === */
export async function syncRecordToGoogleSheets(record: AttendanceRecord): Promise<void> {
  try {
    const year = new Date(record.timestamp).getFullYear();
    const { sheets } = await getApis();
    const { detailedId, sunafilId } = await ensureSheets(year);

    // Formatos de fecha/hora
    const d = new Date(record.timestamp);
    const fecha = d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const hora = d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const isoTs = d.toISOString();

    // 1) Guardar en DETALLE
    await sheets.spreadsheets.values.append({
      spreadsheetId: detailedId,
      range: "DETALLE!A1:G1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          record.id,
          fecha,
          hora,
          record.workerName,
          record.eventType,
          record.location,
          record.notes ?? ""
        ]],
      },
    });

    // 2) Guardar en SUNAFIL
    await sheets.spreadsheets.values.append({
      spreadsheetId: sunafilId,
      range: "SUNAFIL!A1:G1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          record.workerName, // A: Trabajador
          isoTs,             // B: Timestamp ISO
          fecha,             // C: Fecha
          hora,              // D: Hora
          record.eventType,  // E: Evento
          record.location,   // F: Ubicación
          record.id          // G: ID evento
        ]],
      },
    });

    console.log(`✅ Registro sincronizado en DETALLE y SUNAFIL [${record.id}]`);
  } catch (err: any) {
    console.error("❌ Error al sincronizar registro:", err.message);
    throw err;
  }
}




export async function manualSyncAllRecords(pending: AttendanceRecord[]): Promise<{ ok: number; fail: number; }> {
  let ok = 0, fail = 0;
  for (const r of pending) {
    try {
      await syncRecordToGoogleSheets(r);
      ok++;
    } catch (e) {
      // No detenemos el lote si uno falla
      fail++;
    }
  }
  return { ok, fail };
}
