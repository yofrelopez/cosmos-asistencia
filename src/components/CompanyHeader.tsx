import React from 'react';
import { COMPANY_INFO } from '@/lib/attendance-cosmos';
import logoCosmos from '../../public/assets/logo-cosmos.png';


export default function CompanyHeader() {
  // Safe date formatting with fallbacks
  const getCurrentDate = () => {
    try {
      return new Date().toLocaleDateString('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return new Date().toLocaleDateString();
    }
  };

  const getCurrentTime = () => {
    try {
      return new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return new Date().toLocaleTimeString();
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-red-600 text-white shadow-lg">
      <div className="container mx-auto p-4 lg:p-6">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-4">

            <div className="h-12 lg:h-16 w-20 lg:w-24 bg-white rounded-lg p-1 flex items-center justify-center flex-shrink-0">
            <img
              src={logoCosmos}
              alt="Logo Cosmos"
              className="max-h-full max-w-full object-contain"
            />
          </div>



            <div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-wide">
                {COMPANY_INFO?.name || 'V&D COMOS S.R.L.'}
              </h1>
              <p className="text-blue-100 text-sm">
                RUC: {COMPANY_INFO?.ruc || '20609799090'}
              </p>
              <p className="text-blue-200 text-xs">
                Sistema de Control de Asistencia
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-blue-100">
              {getCurrentDate()}
            </div>
            <div className="text-lg font-mono">
              {getCurrentTime()}
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-4">
          {/* Top row: Logo and Company name */}
          <div className="flex items-center gap-3">


          <div className="h-10 w-14 bg-white rounded-lg p-1 flex items-center justify-center flex-shrink-0">
            <img
              src={logoCosmos}
              alt="Logo Cosmos"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold tracking-wide truncate">
                {COMPANY_INFO?.name || 'V&D COMOS S.R.L.'}
              </h1>
              <p className="text-blue-100 text-xs">
                RUC: {COMPANY_INFO?.ruc || '20609799090'}
              </p>
            </div>
          </div>

          {/* Bottom row: Date, time and subtitle */}
          <div className="flex items-center justify-between">
            <div className="text-blue-200 text-xs">
              Sistema de Control de Asistencia
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-100">
                {new Date().toLocaleDateString('es-PE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </div>
              <div className="text-sm font-mono">
                {new Date().toLocaleTimeString('es-PE', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}