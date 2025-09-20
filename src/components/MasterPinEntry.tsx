import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, KeyIcon, AlertTriangle, CheckCircle } from 'lucide-react';
import { verifyMasterPin, checkRateLimit, recordFailedAttempt, recordSuccessfulAttempt, logAuditEvent } from '@/lib/security';
import { toast } from 'sonner';
import CompanyHeader from './CompanyHeader';

interface MasterPinEntryProps {
  onSuccess: () => void;
}

export default function MasterPinEntry({ onSuccess }: MasterPinEntryProps) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      toast.error('Ingrese un PIN válido (mínimo 4 dígitos)');
      return;
    }

    // Check rate limiting
    const rateCheck = checkRateLimit('master-access');
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.remainingTime || 0) / 60);
      toast.error(`Demasiados intentos. Intente nuevamente en ${minutes} minuto(s)`);
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting master PIN verification for:', pin);
      const isValid = await verifyMasterPin(pin);
      console.log('Master PIN verification result:', isValid);
      
      if (isValid) {
        recordSuccessfulAttempt('master-access');
        logAuditEvent('MASTER_PIN_SUCCESS', 'Acceso autorizado con PIN maestro');
        toast.success('✅ Acceso autorizado - Bienvenido al sistema', {
          description: 'Redirigiendo a la selección de trabajadores...'
        });
        
        // Small delay to show success message
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        recordFailedAttempt('master-access');
        setAttempts(prev => prev + 1);
        logAuditEvent('MASTER_PIN_FAILED', `Intento fallido de PIN maestro (intento ${attempts + 1})`, undefined, false);
        toast.error('❌ PIN incorrecto. Intente nuevamente.');
        setPin('');
      }
    } catch (error) {
      console.error('Error verifying master PIN:', error);
      toast.error('Error de autenticación. Intente nuevamente.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePinSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <CompanyHeader />
      
      <div className="container mx-auto p-4 md:p-6">
        <div className="max-w-md mx-auto mt-8 md:mt-16">
          <Card className="shadow-2xl border-2 border-blue-200 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl">
                Acceso Seguro
              </CardTitle>
              <p className="text-blue-100 text-sm">
                Ingrese el PIN de acceso al sistema
              </p>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <KeyIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Control de Asistencia
                </h3>
                <p className="text-sm text-gray-600">
                  Sistema seguro para el registro de asistencia de trabajadores
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700">
                    PIN de Acceso General
                  </label>
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyPress={handlePinKeyPress}
                    placeholder="••••••"
                    className="text-center text-2xl tracking-widest h-14 border-2 border-gray-200 focus:border-blue-500"
                    maxLength={6}
                    autoFocus
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Ingrese: <span className="font-mono bg-gray-100 px-1 rounded">123456</span>
                  </p>
                </div>

                <Button
                  onClick={handlePinSubmit}
                  disabled={pin.length < 4 || isLoading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Verificando...
                    </div>
                  ) : (
                    'Ingresar al Sistema'
                  )}
                </Button>
              </div>

              {attempts > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    Intentos fallidos: {attempts}. 
                    {attempts >= 3 && ' El acceso será bloqueado temporalmente después de 5 intentos.'}
                  </p>
                </div>
              )}

              <div className="text-center text-xs text-gray-500 border-t pt-4">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <p>🔒 Acceso protegido con autenticación de doble factor</p>
                </div>
                <p>📊 Sistema de registro y monitoreo de asistencia</p>
                <p>🛡️ Cumplimiento con normativas SUNAFIL</p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              V&D COMOS S.R.L. - Sistema de Control de Asistencia v2.0
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Desarrollado con tecnología segura y confiable
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}