import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldIcon, KeyIcon, ArrowLeftIcon } from 'lucide-react';
import { validateAdminPin, createSession } from '@/lib/auth';
import { toast } from 'sonner';
import CompanyHeader from './CompanyHeader';
import { AdminLoginProps } from '@/lib/types';

export default function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      toast.error('Ingrese un PIN válido');
      return;
    }

    setIsLoading(true);

    try {
      const admin = validateAdminPin(pin);
      if (admin) {
        const session = createSession(admin.id, 'admin', admin.name);
        toast.success(`Bienvenido/a, ${admin.name}`);
        onLogin(session);
      } else {
        toast.error('PIN de administrador incorrecto');
        setPin('');
      }
    } catch (error) {
      toast.error('Error al iniciar sesión');
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      <CompanyHeader />
      
      <div className="container mx-auto p-6">
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl border-2 border-red-200">
            <CardHeader className="text-center bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
              <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                <ShieldIcon className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl">
                Acceso de Administrador
              </CardTitle>
              <p className="text-red-100 text-sm">
                Solo personal autorizado
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <KeyIcon className="h-4 w-4" />
                  PIN de Administrador
                </label>
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyPress={handlePinKeyPress}
                  placeholder="••••••"
                  className="text-center text-2xl tracking-widest h-14"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handlePinSubmit}
                  disabled={pin.length < 4 || isLoading}
                  className="w-full h-12 bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? 'Verificando...' : 'Acceder al Panel'}
                </Button>
                
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="w-full h-12 gap-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Volver al Login
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500 border-t pt-4">
                <p>Acceso restringido para:</p>
                <p>• Administrador Principal</p>
                <p>• Contador SUNAFIL</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}