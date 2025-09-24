import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { AttendanceRecord } from "@/lib/attendance-cosmos";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

type RecordActionsProps = {
  record: AttendanceRecord;
  onEdit: (record: AttendanceRecord) => void;
  onDelete?: (record: AttendanceRecord) => void; // opcional, para enganchar al padre si quieres
};

export default function RecordActions({ record, onEdit, onDelete }: RecordActionsProps) {
  const handleDelete = () => {
    toast.warning(`¿Eliminar el registro de ${record.workerName}?`, {
      description: `${record.eventType} - ${new Date(record.timestamp).toLocaleString("es-PE")}`,
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            const ref = doc(db, "attendance", record.id);
            await deleteDoc(ref);
            toast.success("Registro eliminado correctamente");
            if (onDelete) onDelete(record);
          } catch (e) {
            console.error(e);
            toast.error("Error al eliminar el registro");
          }
        },
      },
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(record)}
        className="flex items-center gap-1"
      >
        <Pencil className="h-4 w-4" />
        
      </Button>

      <Button
        
        size="sm"
        onClick={handleDelete}
        className="flex items-center gap-1 bg-red-300"
      >
        <Trash2 className="h-4 w-4" />
        
      </Button>
    </div>
  );
}
