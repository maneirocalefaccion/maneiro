'use client';

import { Modal } from '@/components/ui/Modal';
import { formatMoney } from '@/lib/utils';

type ModalDetalleItemProps = {
  item: any | null;
  onClose: () => void;
};

export default function ModalDetalleItem({ item, onClose }: ModalDetalleItemProps) {
  if (!item) return null;

  const hoy = new Date();
  const finGarantia = item.fechaFinGarantia ? new Date(item.fechaFinGarantia) : null;
  const estaVigente = finGarantia ? finGarantia >= hoy : null;

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title={`🔍 Ficha Técnica & Documentación: ${item.nombre}`}
      size="md"
      footer={<button className="btn btn-primary" onClick={onClose}>Cerrar Ficha</button>}
    >
      <div className="flex flex-col gap-4">
        <div className="bg-surface-hover p-4 rounded-md border border-border flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-base text-primary">{item.nombre}</h3>
            <span className="badge badge-info">{item.tipo?.toUpperCase() || 'EQUIPO'}</span>
          </div>
          {item.numeroSerie && (
            <span className="bg-surface px-2 py-1 rounded border border-border text-xs font-mono">
              S/N: {item.numeroSerie}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-muted block">PROVEEDOR ORIGEN</span>
            <strong className="font-bold">{item.proveedor || 'No especificado'}</strong>
          </div>
          <div>
            <span className="text-xs text-muted block">UBICACIÓN ACTUAL</span>
            <strong className="font-bold">{item.ubicacion || 'Depósito Principal'}</strong>
          </div>
          <div>
            <span className="text-xs text-muted block">PRECIO DE COMPRA (COSTO)</span>
            <strong className="font-bold text-primary">{formatMoney(item.precioCompra || 0)}</strong>
          </div>
          <div>
            <span className="text-xs text-muted block">PRECIO DE VENTA SUGERIDO</span>
            <strong className="font-bold text-success">{formatMoney(item.precioVentaSugerido || 0)}</strong>
          </div>
        </div>

        {/* Garantía */}
        <div className="p-3 border border-border rounded-md bg-surface flex justify-between items-center">
          <div>
            <span className="text-xs text-muted block font-bold">ESTADO DE GARANTÍA DE FÁBRICA</span>
            {finGarantia ? (
              <span className={`badge ${estaVigente ? 'badge-success' : 'badge-danger'} mt-1`}>
                🛡️ {estaVigente ? 'Vigente hasta' : 'Vencida el'} {finGarantia.toLocaleDateString('es-AR')}
              </span>
            ) : (
              <span className="text-xs text-muted">Sin datos de garantía registrados</span>
            )}
          </div>
        </div>

        {/* Documentos */}
        <div className="border-t border-border pt-3 flex flex-col gap-2">
          <span className="font-bold text-xs text-primary">📄 Documentos e Imágenes Adjuntas</span>
          <div className="flex flex-col gap-2">
            {item.facturaCompraUrl && (
              <a href={item.facturaCompraUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm justify-between">
                <span>🧾 Factura de Compra</span>
                <span className="text-xs">Abrir PDF / Imagen ↗</span>
              </a>
            )}
            {item.facturaVentaUrl && (
              <a href={item.facturaVentaUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm justify-between">
                <span>🧾 Factura de Venta</span>
                <span className="text-xs">Abrir PDF / Imagen ↗</span>
              </a>
            )}
            {item.remitoUrl && (
              <a href={item.remitoUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm justify-between">
                <span>📦 Remito de Entrega</span>
                <span className="text-xs">Abrir PDF / Imagen ↗</span>
              </a>
            )}
            {!item.facturaCompraUrl && !item.facturaVentaUrl && !item.remitoUrl && (
              <span className="text-xs text-muted">No hay documentos cargados.</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
