'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { parseNum } from '@/lib/utils';
import { inventarioService } from '@/services/inventarioService';

type ModalItemInventarioProps = {
  isOpen: boolean;
  editingItem: any | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ModalItemInventario({ isOpen, editingItem, onClose, onSuccess }: ModalItemInventarioProps) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'equipo' | 'material' | 'insumo'>('equipo');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVentaSugerido, setPrecioVentaSugerido] = useState('');
  const [stock, setStock] = useState('1');
  const [ubicacion, setUbicacion] = useState('Depósito Principal');
  const [fechaInicioGarantia, setFechaInicioGarantia] = useState('');
  const [fechaFinGarantia, setFechaFinGarantia] = useState('');

  const [facturaCompraUrl, setFacturaCompraUrl] = useState('');
  const [facturaVentaUrl, setFacturaVentaUrl] = useState('');
  const [remitoUrl, setRemitoUrl] = useState('');

  const [uploadingFacturaCompra, setUploadingFacturaCompra] = useState(false);
  const [uploadingFacturaVenta, setUploadingFacturaVenta] = useState(false);
  const [uploadingRemito, setUploadingRemito] = useState(false);
  const [saving, setSaving] = useState(false);

  const { success, error, warning } = useToast();

  useEffect(() => {
    if (editingItem) {
      setNombre(editingItem.nombre);
      setTipo(editingItem.tipo || 'equipo');
      setNumeroSerie(editingItem.numeroSerie || '');
      setProveedor(editingItem.proveedor || '');
      setPrecioCompra(editingItem.precioCompra ? (editingItem.precioCompra / 100).toString() : '');
      setPrecioVentaSugerido(editingItem.precioVentaSugerido ? (editingItem.precioVentaSugerido / 100).toString() : '');
      setStock((editingItem.stock || 1).toString());
      setUbicacion(editingItem.ubicacion || 'Depósito Principal');
      setFechaInicioGarantia(editingItem.fechaInicioGarantia ? editingItem.fechaInicioGarantia.split('T')[0] : '');
      setFechaFinGarantia(editingItem.fechaFinGarantia ? editingItem.fechaFinGarantia.split('T')[0] : '');
      setFacturaCompraUrl(editingItem.facturaCompraUrl || '');
      setFacturaVentaUrl(editingItem.facturaVentaUrl || '');
      setRemitoUrl(editingItem.remitoUrl || '');
    } else {
      setNombre(''); setTipo('equipo'); setNumeroSerie(''); setProveedor('');
      setPrecioCompra(''); setPrecioVentaSugerido(''); setStock('1'); setUbicacion('Depósito Principal');
      setFechaInicioGarantia(''); setFechaFinGarantia('');
      setFacturaCompraUrl(''); setFacturaVentaUrl(''); setRemitoUrl('');
    }
  }, [editingItem, isOpen]);

  const handleFileUpload = async (file: File, type: 'facturaCompra' | 'facturaVenta' | 'remito') => {
    const formData = new FormData();
    formData.append('file', file);

    if (type === 'facturaCompra') setUploadingFacturaCompra(true);
    if (type === 'facturaVenta') setUploadingFacturaVenta(true);
    if (type === 'remito') setUploadingRemito(true);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al subir archivo');

      const data = await res.json();
      if (type === 'facturaCompra') setFacturaCompraUrl(data.url);
      if (type === 'facturaVenta') setFacturaVentaUrl(data.url);
      if (type === 'remito') setRemitoUrl(data.url);

      success('Documento adjuntado correctamente');
    } catch {
      error('Error al subir el archivo');
    } finally {
      if (type === 'facturaCompra') setUploadingFacturaCompra(false);
      if (type === 'facturaVenta') setUploadingFacturaVenta(false);
      if (type === 'remito') setUploadingRemito(false);
    }
  };

  const guardarItem = async () => {
    if (!nombre.trim()) {
      warning('El nombre del item es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre,
        tipo,
        numeroSerie,
        proveedor,
        precioCompra: parseNum(precioCompra),
        precioVentaSugerido: parseNum(precioVentaSugerido),
        stock: parseInt(stock || '1'),
        ubicacion,
        fechaInicioGarantia: fechaInicioGarantia || null,
        fechaFinGarantia: fechaFinGarantia || null,
        facturaCompraUrl,
        facturaVentaUrl,
        remitoUrl,
      };

      await inventarioService.guardarItem(payload, editingItem?.id);
      success(editingItem ? 'Item actualizado' : 'Item ingresado al depósito');
      onSuccess();
      onClose();
    } catch {
      error('Error al guardar el item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? `Editar Item: ${editingItem.nombre}` : 'Registrar Nuevo Item en Depósito'}
      size="md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardarItem} disabled={saving}>
            {saving ? 'Guardando...' : editingItem ? 'Guardar Cambios' : 'Ingresar al Depósito'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group col-span-2">
            <label className="form-label">Nombre del Producto / Equipo *</label>
            <input type="text" className="form-input" placeholder="Ej: Aire Acondicionado BGH 3500W" value={nombre} onChange={e => setNombre(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Tipo de Producto</label>
            <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value as any)}>
              <option value="equipo">Equipo (Unidad Principal)</option>
              <option value="material">Material / Repuesto</option>
              <option value="insumo">Insumo Consumible</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Número de Serie (SN)</label>
            <input type="text" className="form-input" placeholder="Opcional" value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Proveedor</label>
            <input type="text" className="form-input" placeholder="Distribuidor" value={proveedor} onChange={e => setProveedor(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Cantidad / Stock</label>
            <input type="number" className="form-input" value={stock} onChange={e => setStock(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Costo de Compra ($)</label>
            <input type="number" className="form-input" placeholder="0.00" value={precioCompra} onChange={e => setPrecioCompra(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Precio Venta Sugerido ($)</label>
            <input type="number" className="form-input" placeholder="0.00" value={precioVentaSugerido} onChange={e => setPrecioVentaSugerido(e.target.value)} />
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">Ubicación Física</label>
            <input type="text" className="form-input" placeholder="Depósito Principal, Estante A..." value={ubicacion} onChange={e => setUbicacion(e.target.value)} />
          </div>
        </div>

        <div className="border-t border-border pt-3 mt-2 grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">Inicio Garantía Proveedor</label>
            <input type="date" className="form-input" value={fechaInicioGarantia} onChange={e => setFechaInicioGarantia(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Vencimiento Garantía</label>
            <input type="date" className="form-input" value={fechaFinGarantia} onChange={e => setFechaFinGarantia(e.target.value)} />
          </div>
        </div>

        {/* Archivos Adjuntos */}
        <div className="border-t border-border pt-3 mt-2 flex flex-col gap-2">
          <label className="font-bold text-xs text-primary">📎 Documentación Adjunta (Facturas & Remitos)</label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="block mb-1 text-muted">Factura Compra:</span>
              <input type="file" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'facturaCompra')} className="text-xs" disabled={uploadingFacturaCompra} />
              {facturaCompraUrl && <span className="text-success block font-bold mt-1">✓ Adjuntado</span>}
            </div>
            <div>
              <span className="block mb-1 text-muted">Factura Venta:</span>
              <input type="file" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'facturaVenta')} className="text-xs" disabled={uploadingFacturaVenta} />
              {facturaVentaUrl && <span className="text-success block font-bold mt-1">✓ Adjuntado</span>}
            </div>
            <div>
              <span className="block mb-1 text-muted">Remito Entrega:</span>
              <input type="file" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'remito')} className="text-xs" disabled={uploadingRemito} />
              {remitoUrl && <span className="text-success block font-bold mt-1">✓ Adjuntado</span>}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
