import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Edit, Trash2, Upload, Camera, X } from 'lucide-react';
import { WORKERS, createWorker, updateWorkerPin, type Worker } from '@/lib/auth';
import { hashPin } from '@/lib/security';
import { toast } from 'sonner';

interface WorkerFormData {
  name: string;
  pin: string;
  position: string;
  document: string;
  photo?: File | string;
}

// Dispatch custom event to notify other components of worker updates
const notifyWorkersUpdated = () => {
  window.dispatchEvent(new CustomEvent('workersUpdated'));
};

export default function WorkerManagement() {
  const [workers, setWorkers] = useState<Worker[]>(WORKERS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState<WorkerFormData>({
    name: '',
    pin: '',
    position: '',
    document: '',
    photo: undefined
  });
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = () => {
    try {
      const storedWorkers = localStorage.getItem('cosmos_workers');
      if (storedWorkers) {
        const parsed = JSON.parse(storedWorkers);
        setWorkers(parsed);
      } else {
        // Initialize with default workers
        const defaultWorkers = [
          {
            id: '1',
            name: 'Juan Carlos Pérez',
            pinHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMF98X8.Rb7qvTG',
            photo: '/assets/workers/worker1.jpg',
            position: 'Técnico Senior',
            document: '12345678'
          },
          {
            id: '2',
            name: 'María Elena García',
            pinHash: '$2b$12$8k1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMF98X8.Rb7qvTH',
            photo: '/assets/workers/worker2.jpg',
            position: 'Especialista en Sistemas',
            document: '87654321'
          },
          {
            id: '3',
            name: 'Carlos Antonio López',
            pinHash: '$2b$12$9m2yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMF98X8.Rb7qvTI',
            photo: '/assets/workers/worker3.jpg',
            position: 'Coordinador de Proyectos',
            document: '11223344'
          }
        ];
        setWorkers(defaultWorkers);
        localStorage.setItem('cosmos_workers', JSON.stringify(defaultWorkers));
      }
    } catch (error) {
      console.error('Error loading workers:', error);
      setWorkers([]);
    }
  };

  const saveWorkers = (updatedWorkers: Worker[]) => {
    try {
      localStorage.setItem('cosmos_workers', JSON.stringify(updatedWorkers));
      setWorkers(updatedWorkers);
      // Notify other components that workers have been updated
      notifyWorkersUpdated();
    } catch (error) {
      console.error('Error saving workers:', error);
      toast.error('Error al guardar los datos');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      pin: '',
      position: '',
      document: '',
      photo: undefined
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
      pin: '', // Don't show existing PIN
      position: worker.position,
      document: worker.document,
      photo: worker.photo
    });
    setPhotoPreview(worker.photo);
    setIsDialogOpen(true);
  };

  const handleDeleteWorker = (workerId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este trabajador?')) {
      try {
        const updatedWorkers = workers.filter(w => w.id !== workerId);
        saveWorkers(updatedWorkers);
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor seleccione un archivo de imagen válido');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoPreview(result);
        setFormData(prev => ({ ...prev, photo: file }));
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
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      if (imageFile.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotoPreview(result);
        setFormData(prev => ({ ...prev, photo: imageFile }));
      };
      reader.readAsDataURL(imageFile);
    } else {
      toast.error('Por favor seleccione un archivo de imagen válido');
    }
  };

  const removePhoto = () => {
    setPhotoPreview('');
    setFormData(prev => ({ ...prev, photo: undefined }));
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

    // Check for duplicate document
    const existingWorker = workers.find(w => 
      w.document === formData.document && w.id !== editingWorker?.id
    );
    if (existingWorker) {
      toast.error('Ya existe un trabajador con este documento');
      return false;
    }

    return true;
  };

  const handleSaveWorker = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let photoData = formData.photo;
      
      // Convert File to base64 string for storage
      if (formData.photo instanceof File) {
        const reader = new FileReader();
        photoData = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(formData.photo as File);
        });
      }

      if (editingWorker) {
        // Update existing worker
        const updatedWorker: Worker = {
          ...editingWorker,
          name: formData.name.trim(),
          position: formData.position.trim(),
          document: formData.document.trim(),
          photo: photoData as string || editingWorker.photo
        };

        // Update PIN if provided
        if (formData.pin.trim()) {
          updatedWorker.pinHash = await hashPin(formData.pin.trim());
        }

        const updatedWorkers = workers.map(w => 
          w.id === editingWorker.id ? updatedWorker : w
        );
        
        saveWorkers(updatedWorkers);
        toast.success('Trabajador actualizado correctamente');
      } else {
        // Create new worker
        const hashedPin = await hashPin(formData.pin.trim());
        const newWorker: Worker = {
          id: Date.now().toString(),
          name: formData.name.trim(),
          pinHash: hashedPin,
          position: formData.position.trim(),
          document: formData.document.trim(),
          photo: photoData as string || '/assets/workers/default-avatar.png'
        };

        const updatedWorkers = [...workers, newWorker];
        saveWorkers(updatedWorkers);
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
                          {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
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
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG hasta 5MB
                    </p>
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
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Juan Carlos Pérez"
              />
            </div>

            {/* Document */}
            <div>
              <Label htmlFor="document">DNI *</Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) => setFormData(prev => ({ ...prev, document: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                placeholder="••••"
                maxLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Entre 4 y 6 dígitos numéricos
              </p>
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
            <Button 
              onClick={handleSaveWorker}
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : (editingWorker ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}