'use client';

import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatMoney, parseNum } from '@/lib/utils';
import { vencimientoService } from '@/services/vencimientoService';
import ModalPagoVencimiento from '@/components/ModalPagoVencimiento';

export default function AgendaVencimientos() {
  const [vencimientos, setVencimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('pendientes');

  // Modal Nuevo Vencimiento
  const [isModalNuevoOpen, setIsModalNuevoOpen] = useState<boolean>(false);
  const [formServicio, setFormServicio] = useState<string>('');
  const [formMonto, setFormMonto] = useState<string>('');
  const [formFecha, setFormFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState<boolean>(false);

  // Modal Pagar
  const [vencimientoAPagar, setVencimientoAPagar] = useState<any | null>(null);

  const { success, error, warning } = useToast();

  const cargarVencimientos = async () => {
    try {
      setLoading(true);
      const data = await vencimientoService.getVencimientos(filtroEstado);
      setVencimientos(data);
    } catch {
      error('Error al cargar la agenda de vencimientos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVencimientos();
  }, [filtroEstado]);

  const kpis = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let totalPendiente = 0;
    let cantVencidos = 0;
    let cantProximos = 0;

    vencimientos.forEach(v => {
      if (!v.pagado) {
        totalPendiente += v.monto || 0;
        const fVenc = new Date(v.fechaVencimiento);
        fVenc.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((fVenc.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
        if (diffDays < 0) cantVencidos++;
        else if (diffDays <= 7) cantProximos++;
      }
    });

    return { totalPendiente, cantVencidos, cantProximos };
  }, [vencimientos]);

  const handleCrearVencimiento = async () => {
    if (!formServicio.trim() || !formMonto) return warning('Completá el servicio y el monto.');
    setSaving(true);
    try {
      const payload = {
        servicio: formServicio,
        monto: parseNum(formMonto),
        fechaVencimiento: formFecha,
        pagado: false,
      };

      await vencimientoService.crearVencimiento(payload);
      success('Vencimiento registrado en la agenda');
      setFormServicio(''); setFormMonto('');
      setIsModalNuevoOpen(false);
      cargarVencimientos();
    } catch {
      error('Error al guardar el vencimiento');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar este vencimiento de la agenda?')) return;
    try {
      await vencimientoService.eliminarVencimiento(id);
      success('Vencimiento eliminado');
      cargarVencimientos();
    } catch {
      error('Error al eliminar');
    }
  };

  return (
    <div className="card p-5 border border-border flex flex-col gap-4 shadow-sm">
      {/* Header de la Agenda */}
      <div className="flex justify-between items-center flex-wrap gap-2 border-b border-border pb-3">
        <div>
          <h2 className="font-bold text-lg text-primary flex items-center gap-2">
            📅 Agenda de Vencimientos & Impuestos
          </h2>
          <p className="text-xs text-secondary mb-0">Servicios públicos, AFIP/ARBA, alquileres y compromisos</p>
        </div>

        <button className="btn btn-primary btn-sm font-semibold" onClick={() => setIsModalNuevoOpen(true)}>
          + Cargar Vencimiento
        </button>
      </div>

      {/* Mini Bar con 3 KPIs limpios */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-md bg-surface border border-border flex flex-col">
          <span className="text-xs font-semibold text-secondary">PENDIENTES</span>
          <span className="text-lg font-bold text-danger mt-1">{formatMoney(kpis.totalPendiente)}</span>
        </div>
        <div className="p-3 rounded-md bg-surface border border-border flex flex-col">
          <span className="text-xs font-semibold text-secondary">VENCIDOS SIN PAGAR</span>
          <span className="text-lg font-bold text-danger mt-1">{kpis.cantVencidos} servicio(s)</span>
        </div>
        <div className="p-3 rounded-md bg-surface border border-border flex flex-col">
          <span className="text-xs font-semibold text-secondary">A VENCER (7 DÍAS)</span>
          <span className="text-lg font-bold text-warning mt-1">{kpis.cantProximos} servicio(s)</span>
        </div>
      </div>

      {/* Tabs Filtro Elegante */}
      <div className="flex justify-between items-center text-xs border-b border-border pb-2">
        <div className="flex gap-2">
          <button
            className={`btn btn-xs ${filtroEstado === 'pendientes' ? 'btn-primary font-bold' : 'btn-ghost'}`}
            onClick={() => setFiltroEstado('pendientes')}
          >
            Pendientes
          </button>
          <button
            className={`btn btn-xs ${filtroEstado === 'pagados' ? 'btn-primary font-bold' : 'btn-ghost'}`}
            onClick={() => setFiltroEstado('pagados')}
          >
            Histórico Pagados
          </button>
          <button
            className={`btn btn-xs ${filtroEstado === 'todos' ? 'btn-primary font-bold' : 'btn-ghost'}`}
            onClick={() => setFiltroEstado('todos')}
          >
            Ver Todos
          </button>
        </div>
      </div>

      {/* Lista / Tabla de Vencimientos */}
      {loading ? (
        <div className="empty-state p-4"><p className="text-muted">Cargando agenda...</p></div>
      ) : vencimientos.length === 0 ? (
        <div className="empty-state p-6 text-center">
          <p className="text-muted text-sm">No hay vencimientos pendientes registrados actualmente.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Servicio / Impuesto</th>
                <th>Vencimiento</th>
                <th>Monto ($)</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vencimientos.map((v) => {
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const fVenc = new Date(v.fechaVencimiento);
                fVenc.setHours(0, 0, 0, 0);

                const diffDays = Math.ceil((fVenc.getTime() - hoy.getTime()) / (1000 * 3600 * 24));

                let badgeClass = 'badge-success';
                let badgeText = 'Al Día / Pagado';

                if (!v.pagado) {
                  if (diffDays < 0) {
                    badgeClass = 'badge-danger';
                    badgeText = `VENCIDO (${Math.abs(diffDays)}d)`;
                  } else if (diffDays <= 7) {
                    badgeClass = 'badge-warning';
                    badgeText = `Próximo (${diffDays}d)`;
                  } else {
                    badgeClass = 'badge-info';
                    badgeText = `En ${diffDays} días`;
                  }
                }

                return (
                  <tr key={v.id}>
                    <td><span className={`badge ${badgeClass}`}>{badgeText}</span></td>
                    <td className="font-bold text-primary">{v.servicio}</td>
                    <td className="text-sm font-semibold">{fVenc.toLocaleDateString('es-AR')}</td>
                    <td className="font-bold text-primary">{formatMoney(v.monto)}</td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        {!v.pagado && (
                          <button
                            className="btn btn-success btn-xs font-bold"
                            onClick={() => setVencimientoAPagar(v)}
                          >
                            ✓ Pagar
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-xs text-danger"
                          onClick={() => handleEliminar(v.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nuevo Vencimiento */}
      <Modal
        isOpen={isModalNuevoOpen}
        onClose={() => setIsModalNuevoOpen(false)}
        title="📅 Cargar Nuevo Vencimiento / Impuesto"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button className="btn btn-outline" onClick={() => setIsModalNuevoOpen(false)} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleCrearVencimiento} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Vencimiento'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="form-group">
            <label className="form-label">Servicio / Impuesto *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Edes Electricidad, Camuzzi Gas, Monotributo AFIP..."
              value={formServicio}
              onChange={(e) => setFormServicio(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Monto Estimado ($) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="45000"
                value={formMonto}
                onChange={(e) => setFormMonto(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de Vencimiento *</label>
              <input
                type="date"
                className="form-input"
                value={formFecha}
                onChange={(e) => setFormFecha(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Liquidar Pago */}
      <ModalPagoVencimiento
        vencimiento={vencimientoAPagar}
        onClose={() => setVencimientoAPagar(null)}
        onSuccess={cargarVencimientos}
      />
    </div>
  );
}
