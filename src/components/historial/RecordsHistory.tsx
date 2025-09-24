import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Download } from "lucide-react";
import RecordsTable from "./RecordsTable";

import RecordsFilters from "./RecordsFilters";





export default function RecordsHistory() {
  const [tab, setTab] = useState("all");

  const [filters, setFilters] = useState({});

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
        <TabsContent value="all">
            <RecordsFilters onFilterChange={(f) => console.log("Filtros:", f)} />
            <RecordsTable filters={filters} />
        </TabsContent>
      <div className="container mx-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Encabezado */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Historial de Registros
                </CardTitle>
                <div className="flex gap-3">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Registro
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Tabs para organizar vistas */}
          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="today">Hoy</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <RecordsTable filters={filters} />
            </TabsContent>

            <TabsContent value="today">
              <RecordsTable filters={filters} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
