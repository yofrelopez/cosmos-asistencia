import { AuthSession } from './auth';
import { AttendanceRecord } from './attendance-cosmos';

export interface SessionProps {
  session: AuthSession;
  onLogout: () => void;
}

export interface LoginProps {
  onLogin: (session: AuthSession) => void;
  onAdminAccess: () => void;
}

export interface AdminLoginProps {
  onLogin: (session: AuthSession) => void;
  onBack: () => void;
}

export interface ButtonState {
  ENTRADA: boolean;
  REFRIGERIO: boolean;
  TERMINO_REFRIGERIO: boolean;
  SALIDA: boolean;
}

export interface ConfirmationDialogProps {
  isOpen: boolean;
  eventType: string;
  workerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface EditRecordDialogProps {
  isOpen: boolean;
  record: AttendanceRecord | null;
  onSave: (record: AttendanceRecord) => void;
  onCancel: () => void;
}

export interface WorkerFormData {
  name: string;
  pin: string;
  position: string;
  document: string;
  photo?: File;
}

export interface GoogleCredentials {
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