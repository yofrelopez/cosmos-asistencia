import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

type RecordsFiltersProps = {
  onFilterChange: (filters: {
    workerId?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
};

type Worker = { id: string; name: string };

export default function RecordsFilters({ onFilterChange }: RecordsFiltersProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filters, setFilters] = useState({
    workerId: "",
    eventType: "",
    startDate: "",
    endDate: "",
  });

  // 🔹 Suscripción en tiempo real a trabajadores
  useEffect(() => {
    const q = query(collection(db, "workers"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...(d.data() as Omit<Worker, "id">),
          } as Worker)
      );
      setWorkers(data);
    });
    return () => unsub();
  }, []);

  // 🔹 Emitir cambios hacia el padre
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);


  const handleFilterChange = (val: string) => {
  setFilters((f) => ({ ...f, eventType: val === "all" ? null : val }));
};

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 border rounded-lg shadow-sm">
      {/* Trabajador */}
      <div>
        <Label>Trabajador</Label>
        <Select
          value={filters.workerId}
          onValueChange={(val) =>
    setFilters((f) => ({ ...f, workerId: val === "all" ? "" : val }))
  }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {workers.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tipo de evento */}
      <div>
        <Label>Evento</Label>
        <Select
          value={filters.eventType}
          onValueChange={handleFilterChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ENTRADA">ENTRADA</SelectItem>
            <SelectItem value="REFRIGERIO">REFRIGERIO</SelectItem>
            <SelectItem value="TERMINO_REFRIGERIO">
              TÉRMINO DE REFRIGERIO
            </SelectItem>
            <SelectItem value="SALIDA">SALIDA</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fecha inicio */}
      <div>
        <Label>Desde</Label>
        <Input
          type="date"
          value={filters.startDate}
          onChange={(e) =>
            setFilters((f) => ({ ...f, startDate: e.target.value }))
          }
        />
      </div>

      {/* Fecha fin */}
      <div>
        <Label>Hasta</Label>
        <Input
          type="date"
          value={filters.endDate}
          onChange={(e) =>
            setFilters((f) => ({ ...f, endDate: e.target.value }))
          }
        />
      </div>

      {/* Reset */}
      <div className="md:col-span-4 flex justify-end">
        <Button
          variant="outline"
          onClick={() =>
            setFilters({ workerId: "", eventType: "", startDate: "", endDate: "" })
          }
        >
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
}
