import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Edit, Trash2, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import { hashPin } from '@/lib/security';

// Firestore
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';

export interface Worker {
  id: string;
  name: string;
  document: string;
  position: string;
  photo: string;
  pinHash: string;
}

interface WorkerFormData {
  name: string;
  pin: string;
  position: string;
  document: string;
  photo?: File | string;
}

export default function WorkerManagement() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState<WorkerFormData>({
    name: '',
    pin: '',
    position: '',
    document: '',
    photo: undefined,
  });
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 🔄 Escuchar cambios en Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'workers'), (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Worker, 'id'>),
      }));
      setWorkers(data);
    });
    return unsubscribe;
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      pin: '',
      position: '',
      document: '',
      photo: undefined,
    });
    setPhotoPreview('');
    setEditingWorker(null);
  };

  const handleAddWorker = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditWorker = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      pin: '',
      position: worker.position,
      document: worker.document,
      photo: worker.photo,
    });
    setPhotoPreview(worker.photo);
    setIsDialogOpen(true);
  };

  const handleDeleteWorker = async (workerId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este trabajador?')) {
      try {
        await deleteDoc(doc(db, 'workers', workerId));
        toast.success('Trabajador eliminado correctamente');
      } catch (error) {
        toast.error('Error al eliminar trabajador');
        console.error('Error deleting worker:', error);
      }
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor seleccione un archivo de imagen válido');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoPreview(result);
        setFormData((prev) => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith('image/'));

    if (imageFile) {
      if (imageFile.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotoPreview(result);
        setFormData((prev) => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(imageFile);
    } else {
      toast.error('Por favor seleccione un archivo de imagen válido');
    }
  };

  const removePhoto = () => {
    setPhotoPreview('');
    setFormData((prev) => ({ ...prev, photo: undefined }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return false;
    }
    if (!formData.document.trim()) {
      toast.error('El documento es obligatorio');
      return false;
    }
    if (!formData.position.trim()) {
      toast.error('El cargo es obligatorio');
      return false;
    }
    if (!editingWorker && !formData.pin.trim()) {
      toast.error('El PIN es obligatorio para nuevos trabajadores');
      return false;
    }
    if (formData.pin && (formData.pin.length < 4 || formData.pin.length > 6)) {
      toast.error('El PIN debe tener entre 4 y 6 dígitos');
      return false;
    }
    return true;
  };

  const handleSaveWorker = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const workerData: Omit<Worker, 'id'> = {
        name: formData.name.trim(),
        document: formData.document.trim(),
        position: formData.position.trim(),
        photo: (formData.photo as string) || '/assets/workers/default-avatar.png',
        pinHash: editingWorker && !formData.pin
          ? editingWorker.pinHash
          : await hashPin(formData.pin.trim()),
      };

      if (editingWorker) {
        await updateDoc(doc(db, 'workers', editingWorker.id), workerData);
        toast.success('Trabajador actualizado correctamente');
      } else {
        await addDoc(collection(db, 'workers'), workerData);
        toast.success('Trabajador creado correctamente');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Error al guardar trabajador');
      console.error('Error saving worker:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Gestión de Trabajadores
            </CardTitle>
            <Button onClick={handleAddWorker} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Agregar Trabajador
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foto</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                      {worker.photo ? (
                        <img
                          src={worker.photo}
                          alt={worker.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/workers/default-avatar.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          {worker.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{worker.name}</TableCell>
                  <TableCell>{worker.document}</TableCell>
                  <TableCell>{worker.position}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Activo
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditWorker(worker)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteWorker(worker.id)}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {workers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay trabajadores registrados. Agregue el primer trabajador.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Worker Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorker ? 'Editar Trabajador' : 'Agregar Nuevo Trabajador'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Photo Upload */}
            <div>
              <Label>Foto del Trabajador</Label>
              <div className="mt-2">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover mx-auto"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('photo-upload')?.click()}
                  >
                    <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Arrastra una imagen aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG hasta 5MB</p>
                  </div>
                )}
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ej: Juan Carlos Pérez"
              />
            </div>

            {/* Document */}
            <div>
              <Label htmlFor="document">DNI *</Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    document: e.target.value.replace(/\D/g, '').slice(0, 8),
                  }))
                }
                placeholder="12345678"
                maxLength={8}
              />
            </div>

            {/* Position */}
            <div>
              <Label htmlFor="position">Cargo *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, position: e.target.value }))
                }
                placeholder="Ej: Técnico Senior"
              />
            </div>

            {/* PIN */}
            <div>
              <Label htmlFor="pin">
                PIN de Acceso {editingWorker ? '(dejar vacío para mantener actual)' : '*'}
              </Label>
              <Input
                id="pin"
                type="password"
                value={formData.pin}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pin: e.target.value.replace(/\D/g, '').slice(0, 6),
                  }))
                }
                placeholder="••••"
                maxLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Entre 4 y 6 dígitos numéricos</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveWorker} disabled={isLoading}>
              {isLoading
                ? 'Guardando...'
                : editingWorker
                ? 'Actualizar'
                : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
