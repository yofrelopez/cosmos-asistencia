import { AttendanceRecord } from './attendance-cosmos';

// Google Sheets configuration from environment variables
const GOOGLE_SERVICE_ACCOUNT_EMAIL = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = import.meta.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_PROJECT_ID = import.meta.env.VITE_GOOGLE_PROJECT_ID;

interface GoogleSheetsConfig {
  spreadsheetId?: string;
  sheetName: string;
}

interface GoogleCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export class SecureGoogleSheetsService {
  private config: GoogleSheetsConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: GoogleSheetsConfig = { sheetName: 'Asistencia_COSMOS' }) {
    this.config = config;
  }

  private isConfigured(): boolean {
    return !!(GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY && GOOGLE_PROJECT_ID);
  }

  private async getAccessToken(): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets credentials not configured in environment variables');
    }

    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const jwt = await this.createJWT();
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${data.error_description || data.error}`);
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 1 minute early
      
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  private async createJWT(): Promise<string> {
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      throw new Error('Missing Google service account credentials');
    }

    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Note: In a real implementation, you would use a proper JWT library like 'jsonwebtoken'
    // For this demo, we'll use a simplified approach
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    // This is a placeholder - in production, use proper JWT signing
    return `${encodedHeader}.${encodedPayload}.signature_placeholder`;
  }

  async createSpreadsheet(): Promise<string> {
    if (!this.isConfigured()) {
      console.warn('Google Sheets not configured. Skipping spreadsheet creation.');
      return '';
    }

    try {
      const token = await this.getAccessToken();
      
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: `V&D COMOS - Control de Asistencia - ${new Date().toISOString().split('T')[0]}`,
          },
          sheets: [{
            properties: {
              title: this.config.sheetName,
            },
          }],
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to create spreadsheet: ${data.error?.message}`);
      }

      this.config.spreadsheetId = data.spreadsheetId;
      
      // Initialize headers
      await this.initializeHeaders();
      
      return data.spreadsheetId;
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }

  private async initializeHeaders(): Promise<void> {
    if (!this.config.spreadsheetId) return;

    const headers = [
      'ID',
      'Fecha',
      'Trabajador ID',
      'Nombre Trabajador',
      'DNI',
      'Tipo de Evento',
      'Hora',
      'Ubicación',
      'Timestamp',
      'Fecha Creación'
    ];

    await this.appendRows([headers]);
  }

  async appendRecord(record: AttendanceRecord): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('Google Sheets not configured. Skipping sync.');
      return;
    }

    if (!this.config.spreadsheetId) {
      console.warn('No spreadsheet configured. Skipping Google Sheets sync.');
      return;
    }

    const row = [
      record.id,
      record.date,
      record.workerId,
      record.workerName,
      record.workerDocument,
      record.eventType,
      new Date(record.timestamp).toLocaleTimeString('es-PE'),
      record.location,
      record.timestamp,
      new Date().toISOString()
    ];

    await this.appendRows([row]);
  }

  private async appendRows(rows: string[][]): Promise<void> {
    if (!this.config.spreadsheetId || !this.isConfigured()) return;

    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${this.config.sheetName}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: rows,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to append rows: ${error.error?.message}`);
      }
    } catch (error) {
      console.error('Error appending rows to Google Sheets:', error);
      // Don't throw error to prevent breaking the app
    }
  }

  async syncAllRecords(records: AttendanceRecord[]): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('Google Sheets not configured. Skipping sync.');
      return;
    }

    if (!this.config.spreadsheetId) {
      // Create spreadsheet if it doesn't exist
      await this.createSpreadsheet();
    }

    // Clear existing data (except headers)
    await this.clearSheet();
    await this.initializeHeaders();

    // Add all records in batches
    const batchSize = 100;
    const rows = records.map(record => [
      record.id,
      record.date,
      record.workerId,
      record.workerName,
      record.workerDocument,
      record.eventType,
      new Date(record.timestamp).toLocaleTimeString('es-PE'),
      record.location,
      record.timestamp,
      new Date().toISOString()
    ]);

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await this.appendRows(batch);
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < rows.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  private async clearSheet(): Promise<void> {
    if (!this.config.spreadsheetId || !this.isConfigured()) return;

    try {
      const token = await this.getAccessToken();
      
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${this.config.sheetName}:clear`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Error clearing sheet:', error);
    }
  }

  getSpreadsheetUrl(): string | null {
    if (!this.config.spreadsheetId) return null;
    return `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}/edit`;
  }

  isEnabled(): boolean {
    return this.isConfigured();
  }
}

// Singleton instance
export const secureGoogleSheetsService = new SecureGoogleSheetsService();

// Helper function to save record with Google Sheets sync
export async function saveRecordWithSecureSync(record: AttendanceRecord): Promise<void> {
  try {
    // Save to localStorage first (primary storage)
    const { saveRecord } = await import('./storage');
    saveRecord(record);
    
    // Sync to Google Sheets (secondary storage) if configured
    if (secureGoogleSheetsService.isEnabled()) {
      await secureGoogleSheetsService.appendRecord(record);
    }
  } catch (error) {
    console.error('Error syncing record:', error);
    // Record is still saved locally, so don't throw error
  }
}