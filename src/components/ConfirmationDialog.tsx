import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  eventType: string;
  workerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({
  isOpen,
  eventType,
  workerName,
  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  const getEventColor = (type: string) => {
    switch (type) {
      case 'ENTRADA': return 'text-green-600';
      case 'REFRIGERIO': return 'text-orange-600';
      case 'TERMINO_REFRIGERIO': return 'text-blue-600';
      case 'SALIDA': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirmar Registro
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <div className="text-sm text-gray-600">Trabajador:</div>
              <div className="font-semibold text-gray-900">{workerName}</div>
              <div className="text-sm text-gray-600 mt-2">Evento a registrar:</div>
              <div className={`font-bold text-lg ${getEventColor(eventType)}`}>
                {eventType}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Hora: {new Date().toLocaleTimeString('es-PE')}
              </div>
            </div>
            <p className="text-center text-sm">
              ¿Está seguro de que desea registrar este evento? Esta acción se guardará permanentemente.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onCancel}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Confirmar Registro
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}