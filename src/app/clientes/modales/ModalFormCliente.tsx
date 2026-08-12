'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { clienteService } from '@/services/clienteService';

type Direccion = {
  id?: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  km: string;
};

type ModalFormClienteProps = {
  isOpen: boolean;
  editingCliente: any | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ModalFormCliente({ isOpen, editingCliente, onClose, onSuccess }: ModalFormClienteProps) {
  const [nombre, setNombre] = useState('');
  const [cuit, setCuit] = useState('');
  const [condIva, setCondIva] = useState('Consumidor Final');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direcciones, setDirecciones] = useState<Direccion[]>([
    { nombre: 'Principal', direccion: '', ciudad: 'Coronel Suárez', km: '0' },
  ]);
  const [saving, setSaving] = useState(false);

  const { success, error, warning } = useToast();

  useEffect(() => {
    if (editingCliente) {
      setNombre(editingCliente.nombre);
      setCuit(editingCliente.cuit || '');
      setCondIva(editingCliente.condIva || 'Consumidor Final');
      setTelefono(editingCliente.telefono || '');
      setEmail(editingCliente.email || '');
      if (editingCliente.direcciones && editingCliente.direcciones.length > 0) {
        setDirecciones(editingCliente.direcciones.map((d: any) => ({
          id: d.id,
          nombre: d.nombre,
          direccion: d.direccion || '',
          ciudad: d.ciudad || 'Coronel Suárez',
          km: d.km.toString(),
        })));
      } else {
        setDirecciones([{ nombre: 'Principal', direccion: '', ciudad: 'Coronel Suárez', km: '0' }]);
      }
    } else {
      setNombre(''); setCuit(''); setCondIva('Consumidor Final'); setTelefono(''); setEmail('');
      setDirecciones([{ nombre: 'Principal', direccion: '', ciudad: 'Coronel Suárez', km: '0' }]);
    }
  }, [editingCliente, isOpen]);

  const agregarDireccion = () => {
    setDirecciones([...direcciones, { nombre: `Ubicación ${direcciones.length + 1}`, direccion: '', ciudad: 'Coronel Suárez', km: '0' }]);
  };

  const eliminarDireccion = (index: number) => {
    if (direcciones.length === 1) return;
    setDirecciones(direcciones.filter((_, i) => i !== index));
  };

  const actualizarDireccion = (index: number, campo: 'nombre' | 'direccion' | 'ciudad' | 'km', valor: string) => {
    const nuevas = [...direcciones];
    nuevas[index][campo] = valor;
    setDirecciones(nuevas);
  };

  const guardarCliente = async () => {
    if (!nombre.trim()) {
      warning('El nombre o razón social es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre,
        cuit,
        condIva,
        telefono,
        email,
        direcciones: direcciones.map(d => ({
          nombre: d.nombre || 'Principal',
          direccion: d.direccion,
          ciudad: d.ciudad || 'Coronel Suárez',
          km: parseFloat(d.km || '0'),
        })),
      };

      await clienteService.guardarCliente(payload, editingCliente?.id);
      success(editingCliente ? 'Cliente actualizado exitosamente' : 'Cliente registrado exitosamente');
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Error al guardar cliente: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCliente ? `Editar Cliente: ${editingCliente.nombre}` : 'Registrar Nuevo Cliente'}
      size="md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardarCliente} disabled={saving}>
            {saving ? 'Guardando...' : editingCliente ? 'Guardar Cambios' : 'Guardar Cliente'}
          </button>
        </div>
      }
    >
      <div className="flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group col-span-2">
            <label className="form-label">Nombre / Razón Social *</label>
            <input type="text" className="form-input" placeholder="Ej: Juan Pérez" value={nombre} onChange={e => setNombre(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">CUIT / DNI</label>
            <input type="text" className="form-input" placeholder="Sin guiones" value={cuit} onChange={e => setCuit(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Condición frente al IVA</label>
            <select className="form-select" value={condIva} onChange={e => setCondIva(e.target.value)}>
              <option value="Consumidor Final">Consumidor Final</option>
              <option value="Responsable Inscripto">Responsable Inscripto</option>
              <option value="Monotributo">Monotributo</option>
              <option value="Exento">Exento</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono (WhatsApp)</label>
            <input type="tel" className="form-input" placeholder="+54 9 2926..." value={telefono} onChange={e => setTelefono(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 mt-4">
          <div>
            <h3 className="font-bold text-primary">Ubicaciones / Propiedades</h3>
            <p className="text-xs text-muted">Cada ubicación puede tener su propia distancia en km</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={agregarDireccion}>
            + Agregar Dirección
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {direcciones.map((dir, index) => (
            <div key={index} className="p-4 border rounded-md bg-surface-hover relative">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm text-primary">Ubicación {index + 1}</span>
                {direcciones.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => eliminarDireccion(index)} aria-label="Eliminar dirección">×</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group col-span-2">
                  <label className="form-label">Nombre de la Propiedad</label>
                  <input type="text" className="form-input" placeholder="Ej: Casa en Suárez, Campo Lote 42" value={dir.nombre} onChange={e => actualizarDireccion(index, 'nombre', e.target.value)} />
                </div>
                <div className="form-group col-span-2">
                  <label className="form-label">Dirección / Indicaciones</label>
                  <input type="text" className="form-input" placeholder="Calle, número o Ruta y km" value={dir.direccion} onChange={e => actualizarDireccion(index, 'direccion', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ciudad / Localidad</label>
                  <input type="text" className="form-input" placeholder="Coronel Suárez" value={dir.ciudad} onChange={e => actualizarDireccion(index, 'ciudad', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Distancia desde Suárez (km)</label>
                  <input type="number" className="form-input" placeholder="0" value={dir.km} onChange={e => actualizarDireccion(index, 'km', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
