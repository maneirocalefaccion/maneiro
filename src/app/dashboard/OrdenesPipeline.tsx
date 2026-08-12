import React from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/utils';
import { enviarWhatsApp } from '@/lib/whatsapp';

type OrdenesPipelineProps = {
  ordenes: any[];
  loading: boolean;
  onVerDetalle: (ord: any) => void;
  onCambiarEstado: (id: number, estado: string) => void;
};

const getBadgeClass = (estado: string) => {
  switch (estado) {
    case 'solicitada':
    case 'presupuesto':
    case 'presupuestado':
      return 'badge-info';
    case 'aprobada':
    case 'cobrado':
      return 'badge-success';
    case 'en_ejecucion':
      return 'badge-primary';
    case 'completado':
      return 'badge-warning';
    case 'pagado_parcial':
      return 'badge-warning-outline';
    case 'facturado':
      return 'badge-info-outline';
    case 'rechazado':
      return 'badge-danger';
    case 'borrador':
      return 'badge-warning-outline';
    case 'adicion_pendiente':
      return 'badge-warning';
    default:
      return 'badge-neutral';
  }
};

const getEstadoLabel = (estado: string) => {
  const map: Record<string, string> = {
    solicitada: "1. Presupuesto",
    presupuesto: "1. Presupuesto",
    presupuestado: "1. Presupuesto",
    aprobada: "2. Aprobada",
    en_ejecucion: "3. Orden Abierta",
    adicion_pendiente: "3b. Adición",
    completado: "4. Trabajo Cerrado",
    pagado_parcial: "4b. Pagado Parcial",
    facturado: "5. Facturado",
    cobrado: "6. Saldada & Cerrada",
    rechazado: "❌ Rechazado",
    borrador: "Borrador",
  };
  return map[estado] || estado;
};

export default function OrdenesPipeline({ ordenes, loading, onVerDetalle, onCambiarEstado }: OrdenesPipelineProps) {
  const recientes = ordenes.slice(0, 8);

  return (
    <div className="table-container">
      <div className="table-header">
        <span className="table-title">Órdenes de Servicio Recientes (Hacé clic en cualquier fila)</span>
        <Link href="/ordenes" className="btn btn-outline btn-sm">
          Ver todas las órdenes →
        </Link>
      </div>

      {loading ? (
        <div className="empty-state">
          Cargando órdenes operativas...
        </div>
      ) : recientes.length === 0 ? (
        <div className="empty-state">
          No hay órdenes registradas aún. Hacé clic en "⚡ Nueva Orden" para comenzar.
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              <th>N° Orden</th>
              <th>Cliente / Ubicación</th>
              <th>Tipo</th>
              <th>Monto Total</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {recientes.map(ord => (
              <tr
                key={ord.id}
                className="clickable-row"
                onClick={() => onVerDetalle(ord)}
              >
                <td>
                  <strong className="text-primary underline">
                    #{ord.numero}
                  </strong>
                </td>
                <td>
                  <strong>{ord.cliente?.nombre}</strong>
                  <br />
                  <span className="text-muted text-sm">
                    {ord.direccion?.nombre || "Sin ubicación"}
                  </span>
                </td>
                <td className="capitalize">{ord.tipo}</td>
                <td className="text-primary font-bold">
                  {formatMoney((ord.totalFinal || 0) * 100)}
                </td>
                <td>
                  <span className={`badge ${getBadgeClass(ord.estado)}`}>
                    {getEstadoLabel(ord.estado)}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onVerDetalle(ord);
                      }}
                    >
                      🔍 Visualizar
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        enviarWhatsApp(ord);
                      }}
                    >
                      📲 WhatsApp
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
