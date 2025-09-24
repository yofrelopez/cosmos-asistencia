import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserIcon, ShieldIcon, KeyIcon } from 'lucide-react';
import { validateWorkerPin, createSession, type Worker } from '@/lib/auth';
import { toast } from 'sonner';
import CompanyHeader from './CompanyHeader';
import { LoginProps } from '@/lib/types';

// Firestore
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function LoginPage({ onLogin, onAdminAccess }: LoginProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);








// Cargar trabajadores en tiempo real desde Firestore
useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, 'workers'),
    (snapshot) => {
      const workersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Worker[];
      setWorkers(workersData);
    },
    (error) => {
      console.error('Error cargando trabajadores:', error);
      setWorkers([]);
      toast.error('Error al cargar trabajadores');
    }
  );

  return () => unsubscribe();
}, []);










  const handleWorkerSelect = (worker: Worker) => {
    setSelectedWorker(worker);
    setPin('');
  };

  const handlePinSubmit = async () => {
    if (!selectedWorker || pin.length < 4) {
      toast.error('Ingrese un PIN válido de 4-6 dígitos');
      return;
    }

    setIsLoading(true);

    try {
      const isValid = await validateWorkerPin(selectedWorker.id, pin);
      if (isValid) {
        const session = createSession(
          selectedWorker.id,
          'worker',
          selectedWorker.name
        );
        toast.success(`Bienvenido/a, ${selectedWorker.name}`);
        onLogin(session);
      } else {
        toast.error('PIN incorrecto. Intente nuevamente.');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <CompanyHeader />

      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Control de Asistencia
            </h2>
            <p className="text-gray-600">
              Seleccione su perfil e ingrese su PIN para continuar
            </p>
          </div>

          {!selectedWorker ? (
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-xl">
                  <UserIcon className="h-6 w-6" />
                  Seleccionar Trabajador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {workers.map((worker) => (
                    <Card
                      key={worker.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-blue-500"
                      onClick={() => handleWorkerSelect(worker)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="mb-4">
                          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-200">
                            {worker.photo ? (
                              <img
                                src={worker.photo}
                                alt={worker.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl font-bold">
                                        ${worker.name
                                          .split(' ')
                                          .map((n) => n[0])
                                          .join('')
                                          .slice(0, 2)}
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl font-bold">
                                {worker.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)}
                              </div>
                            )}
                          </div>
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                          {worker.name}
                        </h3>
                        <Badge variant="secondary" className="mb-2">
                          {worker.position}
                        </Badge>
                        <p className="text-sm text-gray-500">
                          DNI: {worker.document}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={onAdminAccess}
                    variant="outline"
                    className="w-full h-12 text-lg gap-2 hover:bg-red-50 hover:border-red-300"
                  >
                    <ShieldIcon className="h-5 w-5" />
                    Acceso de Administrador
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-md mx-auto shadow-xl">
              <CardHeader className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-200 mb-4">
                  {selectedWorker.photo ? (
                    <img
                      src={selectedWorker.photo}
                      alt={selectedWorker.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xl font-bold">
                              ${selectedWorker.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xl font-bold">
                      {selectedWorker.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                  )}
                </div>
                <CardTitle className="text-xl">{selectedWorker.name}</CardTitle>
                <Badge variant="secondary">{selectedWorker.position}</Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <KeyIcon className="h-4 w-4" />
                    Ingrese su PIN (4-6 dígitos)
                  </label>
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    onKeyPress={handlePinKeyPress}
                    placeholder="••••"
                    className="text-center text-2xl tracking-widest h-14"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setSelectedWorker(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Atrás
                  </Button>
                  <Button
                    onClick={handlePinSubmit}
                    disabled={pin.length < 4 || isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Verificando...' : 'Ingresar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
