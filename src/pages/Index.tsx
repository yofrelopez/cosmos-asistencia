import React, { useState, useEffect } from 'react';
import { getSession, isSessionValid, AuthSession } from '@/lib/auth';
import MasterPinEntry from '@/components/MasterPinEntry';
import LoginPage from '@/components/LoginPage';
import AdminLogin from '@/components/AdminLogin';
import AttendanceSystem from '@/components/AttendanceSystem';
import AdminDashboard from '@/components/AdminDashboard';

export default function Index() {
  const [currentView, setCurrentView] = useState<'master-pin' | 'login' | 'admin-login' | 'worker-system' | 'admin-dashboard'>('master-pin');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [masterPinVerified, setMasterPinVerified] = useState(false);

  useEffect(() => {
    // Check for existing session
    if (isSessionValid()) {
      const existingSession = getSession();
      if (existingSession) {
        setSession(existingSession);
        setMasterPinVerified(true);
        setCurrentView(existingSession.userType === 'admin' ? 'admin-dashboard' : 'worker-system');
      }
    }
    setIsLoading(false);
  }, []);

  const handleMasterPinSuccess = () => {
    setMasterPinVerified(true);
    setCurrentView('login');
  };

  const handleLogin = (newSession: AuthSession) => {
    setSession(newSession);
    setCurrentView(newSession.userType === 'admin' ? 'admin-dashboard' : 'worker-system');
  };

  const handleLogout = () => {
    setSession(null);
    setMasterPinVerified(false);
    setCurrentView('master-pin');
  };

  const handleAdminAccess = () => {
    setCurrentView('admin-login');
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando sistema V&D COMOS...</p>
        </div>
      </div>
    );
  }

  // Show master PIN entry if not verified
  if (!masterPinVerified) {
    return <MasterPinEntry onSuccess={handleMasterPinSuccess} />;
  }

  switch (currentView) {
    case 'login':
      return (
        <LoginPage 
          onLogin={handleLogin} 
          onAdminAccess={handleAdminAccess}
        />
      );
    
    case 'admin-login':
      return (
        <AdminLogin 
          onLogin={handleLogin} 
          onBack={handleBackToLogin}
        />
      );
    
    case 'worker-system':
      return session ? (
        <AttendanceSystem 
          session={session} 
          onLogout={handleLogout}
        />
      ) : null;
    
    case 'admin-dashboard':
      return session ? (
        <AdminDashboard 
          session={session} 
          onLogout={handleLogout}
        />
      ) : null;
    
    default:
      return <div>Error: Vista no encontrada</div>;
  }
}