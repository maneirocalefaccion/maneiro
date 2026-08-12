'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatMoney } from '@/lib/utils';
import { clienteService } from '@/services/clienteService';

type ModalHistorialClienteProps = {
  clienteId: number | null;
  onClose: () => void;
};

export default function ModalHistorialCliente({ clienteId, onClose }: ModalHistorialClienteProps) {
  const [historialCliente, setHistorialCliente] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [direccionSeleccionadaId, setDireccionSeleccionadaId] = useState<string>('todas');

  useEffect(() => {
    if (!clienteId) return;
    const cargar = async () => {
      setLoading(true);
      setDireccionSeleccionadaId('todas');
      try {
        const fullHist = await clienteService.getHistorialCliente(clienteId);
        setHistorialCliente(fullHist);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [clienteId]);

  return (
    <Modal
      isOpen={!!clienteId}
      onClose={onClose}
      title={`📋 Pasaporte Técnico & Historial: ${historialCliente?.nombre || 'Cliente'}`}
      size="lg"
      footer={<button className="btn btn-primary" onClick={onClose}>Cerrar Ficha</button>}
    >
      {loading ? (
        <div className="empty-state p-8"><p className="text-muted">Cargando historial técnico y equipos...</p></div>
      ) : historialCliente ? (
        <div className="flex flex-col gap-4">
          {/* Header del Cliente */}
          <div className="bg-surface-hover p-4 rounded-md border border-border flex flex-col gap-2">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-base text-primary">{historialCliente.nombre}</h3>
                <span className="text-xs text-muted">
                  {historialCliente.cuit ? `CUIT: ${historialCliente.cuit} — ` : ''}{historialCliente.condIva}
                </span>
              </div>
              {historialCliente.telefono && (
                <span className="text-sm font-semibold">📞 {historialCliente.telefono}</span>
              )}
            </div>

            {/* Selector de Dirección de Servicio */}
            <div className="mt-2 flex flex-col gap-1">
              <label className="font-bold text-xs text-primary flex items-center gap-1">
                📍 Seleccionar Dirección de Servicio / Propiedad para Filtrar:
              </label>
              <select
                className="form-select font-bold text-sm"
                value={direccionSeleccionadaId}
                onChange={(e) => setDireccionSeleccionadaId(e.target.value)}
              >
                <option value="todas">🏢 Todas las ubicaciones (Visión General del Cliente)</option>
                {historialCliente.direcciones?.map((dir: any) => (
                  <option key={dir.id} value={dir.id.toString()}>
                    📍 {dir.nombre} — {dir.direccion || 'Sin calle'} ({dir.ciudad || 'Coronel Suárez'}) [{dir.km} km]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resumen & KPIs filtrados por dirección */}
          {(() => {
            const ordsFiltradas = direccionSeleccionadaId === 'todas'
              ? (historialCliente.ordenes || [])
              : (historialCliente.ordenes || []).filter((o: any) => o.direccionId === parseInt(direccionSeleccionadaId));

            const equiposFiltrados = direccionSeleccionadaId === 'todas'
              ? (historialCliente.equipoItems || [])
              : (historialCliente.equipoItems || []).filter((e: any) => e.direccionId === parseInt(direccionSeleccionadaId));

            const totalFact = ordsFiltradas.reduce((acc: number, o: any) => acc + (o.totalFinal || 0), 0);

            return (
              <>
                <div className="stats-grid bg-surface-hover p-4 rounded-md">
                  <div>
                    <span className="text-xs text-muted font-bold block">INTERVENCIONES</span>
                    <div className="text-xl font-bold text-primary">{ordsFiltradas.length} trabajo(s)</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted font-bold block">EQUIPOS COLOCADOS</span>
                    <div className="text-xl font-bold text-info">{equiposFiltrados.length} equipo(s)</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted font-bold block">FACTURACIÓN ACUMULADA</span>
                    <div className="text-xl font-bold text-success">{formatMoney(totalFact)}</div>
                  </div>
                </div>

                {/* Equipos Instalados en esta Dirección */}
                <div className="mt-2">
                  <h3 className="font-bold text-primary text-sm mb-2 flex items-center gap-1">
                    ⚙️ Equipos Instalados en esta Ubicación ({equiposFiltrados.length})
                  </h3>
                  {equiposFiltrados.length === 0 ? (
                    <div className="p-3 bg-surface-hover rounded-md text-xs text-muted">
                      No hay equipos registrados como colocados en esta ubicación.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {equiposFiltrados.map((item: any) => {
                        const hoy = new Date();
                        const finGarantia = item.fechaFinGarantia ? new Date(item.fechaFinGarantia) : null;
                        const estaVigente = finGarantia ? finGarantia >= hoy : null;

                        return (
                          <div key={item.id} className="p-3 border border-border rounded-md bg-surface flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                              <strong className="font-bold text-sm">{item.nombre}</strong>
                              {item.numeroSerie && (
                                <span className="bg-surface-hover px-2 py-0.5 rounded text-xs font-mono">
                                  N°: {item.numeroSerie}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted">
                              📍 {item.direccion?.nombre ? `${item.direccion.nombre} — ` : ''}{item.ubicacion}
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                              {finGarantia ? (
                                <span className={`badge ${estaVigente ? 'badge-success' : 'badge-danger'}`}>
                                  🛡️ {estaVigente ? 'Garantía Vigente' : 'Garantía Vencida'} ({finGarantia.toLocaleDateString('es-AR')})
                                </span>
                              ) : (
                                <span className="text-xs text-muted">Sin fecha de garantía</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Historial de Intervenciones & Trabajos */}
                <div className="mt-4">
                  <h3 className="font-bold text-primary text-sm mb-2 flex items-center gap-1">
                    📋 Historial Cronológico de Órdenes & Servicios ({ordsFiltradas.length})
                  </h3>
                  {ordsFiltradas.length === 0 ? (
                    <div className="p-3 bg-surface-hover rounded-md text-xs text-muted">
                      No hay órdenes registradas en esta ubicación.
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="table w-full">
                        <thead>
                          <tr>
                            <th>Orden & Fecha</th>
                            <th>Ubicación</th>
                            <th>Servicio / Detalle</th>
                            <th>Técnicos & Repuestos</th>
                            <th>Total ($)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ordsFiltradas.map((ord: any) => (
                            <tr key={ord.id}>
                              <td>
                                <strong className="font-bold text-primary">#{ord.numero}</strong>
                                <br />
                                <span className="text-xs text-muted">
                                  {new Date(ord.createdAt).toLocaleDateString('es-AR')}
                                </span>
                              </td>
                              <td className="text-xs">
                                {ord.direccion?.nombre ? (
                                  <span className="font-bold">{ord.direccion.nombre}</span>
                                ) : (
                                  <span className="text-muted">General</span>
                                )}
                              </td>
                              <td>
                                <div className="text-sm font-semibold">{ord.descripcion || 'Servicio técnico'}</div>
                                <span className="badge badge-info mt-1">{ord.estado}</span>
                              </td>
                              <td className="text-xs">
                                {ord.lineasManoObra?.length > 0 && (
                                  <div>
                                    👨‍🔧 <strong>Técnicos:</strong> {ord.lineasManoObra.map((l: any) => l.empleadoNombre).join(', ')}
                                  </div>
                                )}
                                {ord.lineasRepuesto?.length > 0 && (
                                  <div className="mt-1 text-muted">
                                    🔩 <strong>Materiales:</strong> {ord.lineasRepuesto.map((r: any) => `${r.descripcion} (x${r.cantidad || 1})`).join(', ')}
                                  </div>
                                )}
                              </td>
                              <td className="font-bold text-primary">
                                {formatMoney(ord.totalFinal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      ) : null}
    </Modal>
  );
}
