import React, { useState } from "react";
import RecordsFilters from "@/components/historial/RecordsFilters";
import RecordsTable from "@/components/historial/RecordsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
import AddRecordModal from "@/components/historial/AddRecordModal";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";







export default function RecordsHistoryPage() {
  const [filters, setFilters] = useState({});
  const [isAddOpen, setIsAddOpen] = useState(false);


  const navigate = useNavigate();


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <div className="container mx-auto p-6">
        
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Encabezado */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <Button
                    onClick={() => navigate("/dashboard")}
                    variant="outline"
                    className="gap-2"
                    >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al Dashboard
                    </Button>
              <CardTitle className="flex items-center gap-2 text-2xl text-gray-900">
                <History className="h-6 w-6 text-blue-600" />
                Historial de Registros de Asistencia
              </CardTitle>
              <p className="text-gray-600 text-sm">
                Filtra, busca y administra todos los registros de asistencia
              </p>

            <Button
             onClick={() => setIsAddOpen(true)} className="gap-2 bg-green-500 hover:bg-green-600 text-white">
            + Nuevo Registro
            </Button>

            </CardHeader>
          </Card>

          {/* Filtros */}
          <Card className="shadow-md">
            <CardContent className="p-6">
              <RecordsFilters onFilterChange={setFilters} />
            </CardContent>
          </Card>

          {/* Tabla paginada */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <RecordsTable filters={filters} />
            </CardContent>
          </Card>


          <AddRecordModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />



        </div>
      </div>
    </div>
  );
}
