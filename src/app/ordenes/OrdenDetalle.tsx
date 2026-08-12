"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { formatMoney } from "@/lib/utils";

interface OrdenDetalleProps {
  isOpen: boolean;
  orden: any;
  onClose: () => void;
  onEditar?: (orden: any) => void;
  onWhatsApp?: (orden: any) => void;
  onCambiarEstado?: (id: number, nuevoEstado: string) => void;
  onEliminar?: (orden: { id: number; numero: string }) => void;
}

export default function OrdenDetalle({
  isOpen,
  orden,
  onClose,
  onEditar,
  onWhatsApp,
  onCambiarEstado,
  onEliminar,
}: OrdenDetalleProps) {
  if (!orden) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Orden de Servicio #${orden.numero}`}
      size="lg"
      footer={
        <div className="flex justify-between items-center w-full flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap">
            {onWhatsApp && (
              <button
                className="btn btn-outline border-whatsapp text-whatsapp font-bold"
                onClick={() => {
                  onClose();
                  onWhatsApp(orden);
                }}
              >
                📲 Enviar por WhatsApp
              </button>
            )}

            {onEditar && (
              <button
                className="btn btn-outline"
                onClick={() => {
                  onClose();
                  onEditar(orden);
                }}
              >
                ✎ Editar Orden
              </button>
            )}

            {/* ACCIONES DE AVANCE Y REVERSIS DE ESTADO */}
            {onCambiarEstado && ["solicitada", "presupuestado", "presupuesto", "borrador"].includes(orden.estado) && (
              <>
                <button
                  className="btn btn-success font-bold"
                  onClick={() => {
                    if (confirm(`¿Marcar presupuesto #${orden.numero} como APROBADO e iniciar Trabajo?`)) {
                      onClose();
                      onCambiarEstado(orden.id, "en_ejecucion");
                    }
                  }}
                >
                  👍 Aprobar Presupuesto
                </button>
                <button
                  className="btn btn-danger font-bold"
                  onClick={() => {
                    if (confirm(`¿Marcar presupuesto #${orden.numero} como RECHAZADO?`)) {
                      onClose();
                      onCambiarEstado(orden.id, "rechazado");
                    }
                  }}
                >
                  👎 Rechazar
                </button>
              </>
            )}

            {onCambiarEstado && ["en_ejecucion", "adicion_pendiente", "aprobada"].includes(orden.estado) && (
              <>
                <button
                  className="btn btn-success font-bold"
                  onClick={() => {
                    if (confirm(`¿Cerrar trabajo de la orden #${orden.numero} y pasar a pendientes de cobro?`)) {
                      onClose();
                      onCambiarEstado(orden.id, "completado");
                    }
                  }}
                >
                  🔒 Cerrar Trabajo
                </button>
                <button
                  className="btn btn-outline border-warning text-warning-dark font-bold text-xs"
                  onClick={() => {
                    if (confirm(`¿Revertir orden #${orden.numero} al estado PRESUPUESTO?`)) {
                      onClose();
                      onCambiarEstado(orden.id, "presupuesto");
                    }
                  }}
                >
                  ⏪ Volver a Presupuesto
                </button>
              </>
            )}

            {onCambiarEstado && orden.estado === "completado" && (
              <>
                <button
                  className="btn btn-outline border-purple text-purple font-bold"
                  onClick={() => {
                    if (confirm(`¿Pasar orden #${orden.numero} a Facturación?`)) {
                      onClose();
                      onCambiarEstado(orden.id, "facturado");
                    }
                  }}
                >
                  🧾 Pasar a Facturación
                </button>
                <button
                  className="btn btn-success font-bold"
                  onClick={() => {
                    if (confirm(`¿Registrar cobro total de la orden #${orden.numero}?`)) {
                      onClose();
                      onCambiarEstado(orden.id, "cobrado");
                    }
                  }}
                >
                  💰 Registrar Cobro Total
                </button>
                <button
                  className="btn btn-outline border-warning text-warning-dark font-bold text-xs"
                  onClick={() => {
                    if (confirm(`¿Reabrir orden #${orden.numero} y volver a EN EJECUCIÓN?`)) {
                      onClose();
                      onCambiarEstado(orden.id, "en_ejecucion");
                    }
                  }}
                >
                  ⏪ Reabrir Trabajo
                </button>
              </>
            )}

            {onCambiarEstado && (orden.estado === "facturado" || orden.estado === "pagado_parcial") && (
              <>
                <button
                  className="btn btn-success font-bold"
                  onClick={() => {
                    if (confirm(`¿Registrar cobro total de la orden #${orden.numero}?`)) {
                      onClose();
                      onCambiarEstado(orden.id, "cobrado");
                    }
                  }}
                >
                  💰 Registrar Cobro Total
                </button>
                <button
                  className="btn btn-outline border-warning text-warning-dark font-bold text-xs"
                  onClick={() => {
                    if (confirm(`¿Revertir orden #${orden.numero} a TRABAJO CERRADO / EN EJECUCIÓN?`)) {
                      onClose();
                      onCambiarEstado(orden.id, "completado");
                    }
                  }}
                >
                  ⏪ Volver a Trabajo Cerrado
                </button>
              </>
            )}

            {onCambiarEstado && orden.estado === "cobrado" && (
              <button
                className="btn btn-outline border-warning text-warning-dark font-bold text-xs"
                onClick={() => {
                  if (confirm(`¿Revertir cobro total de la orden #${orden.numero} y volver a TRABAJO CERRADO?`)) {
                    onClose();
                    onCambiarEstado(orden.id, "completado");
                  }
                }}
              >
                ⏪ Revertir Cobro (Volver a Trabajo Cerrado)
              </button>
            )}

            {onCambiarEstado && orden.estado === "rechazado" && (
              <button
                className="btn btn-outline border-primary text-primary font-bold text-xs"
                onClick={() => {
                  if (confirm(`¿Reabrir presupuesto de la orden #${orden.numero}?`)) {
                    onClose();
                    onCambiarEstado(orden.id, "presupuesto");
                  }
                }}
              >
                ⏪ Reabrir Presupuesto
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {onEliminar && (
              <button
                className="btn btn-outline border-danger text-danger"
                onClick={() => {
                  onClose();
                  onEliminar({ id: orden.id, numero: orden.numero });
                }}
              >
                🗑️ Eliminar
              </button>
            )}
            <button className="btn btn-outline" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      }
    >
      <div className="orden-detalle flex flex-col gap-4">
        <div className="detalle-header grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-hover p-4 rounded-md border border-border">
          <div>
            <p className="text-xs font-bold text-muted uppercase">CLIENTE</p>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-bold text-base text-primary">{orden.cliente?.nombre || "Sin Cliente"}</p>
              {orden.cliente?.id && (
                <a
                  href={`/clientes?historialId=${orden.cliente.id}`}
                  className="btn btn-outline btn-sm text-xs font-semibold text-primary py-0.5 px-2"
                  title="Ver historial técnico completo del cliente"
                >
                  📋 Ver Historial Cliente
                </a>
              )}
            </div>
            {orden.cliente?.cuit && <p className="text-xs text-muted">CUIT/DNI: {orden.cliente.cuit}</p>}
            <p className="text-xs text-muted">Cond. IVA: {orden.cliente?.condIva || "Consumidor Final"}</p>
            {orden.cliente?.telefono && <p className="text-xs font-semibold mt-1">📞 Tel: {orden.cliente.telefono}</p>}
          </div>

          <div>
            <p className="text-xs font-bold text-muted uppercase">📍 UBICACIÓN Y LUGAR DE TRABAJO</p>
            <p className="font-bold text-sm text-primary">
              {orden.direccion?.nombre || "Dirección Principal"}
            </p>
            {orden.direccion?.direccion && (
              <p className="text-xs text-muted">Calle / Indicaciones: {orden.direccion.direccion}</p>
            )}
            <p className="text-xs text-muted">
              Localidad: {orden.direccion?.ciudad || "Coronel Suárez"} — Distancia: {orden.direccion?.km || 0} km desde Suárez
            </p>

            {orden.descripcion && (
              <p className="text-xs italic text-muted mt-2 bg-surface p-2 rounded border">
                "{orden.descripcion}"
              </p>
            )}
          </div>
        </div>

        {orden.fechaFinGarantia && (
          <div className="p-3 bg-success-light border border-success rounded-md text-xs text-success font-bold flex items-center gap-2">
            🛡️ Cobertura de Garantía Activa: Hasta el {new Date(orden.fechaFinGarantia).toLocaleDateString("es-AR")}
          </div>
        )}

        <table className="table w-full">
          <thead>
            <tr>
              <th>Concepto</th>
              <th className="text-center">Cant.</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const totalMO = orden.lineasManoObra?.reduce((acc: number, l: any) => acc + (l.subtotal || 0), 0) || 0;
              if (totalMO === 0) return null;
              return (
                <tr>
                  <td>Servicio Técnico / Mano de Obra</td>
                  <td className="text-center">Global</td>
                  <td className="text-right font-bold">{formatMoney(totalMO)}</td>
                </tr>
              );
            })()}
            {orden.viatico && (
              <tr>
                <td>Viáticos & Traslado ({orden.viatico.km} km)</td>
                <td className="text-center">1 viaje</td>
                <td className="text-right font-bold">{formatMoney(orden.viatico.total)}</td>
              </tr>
            )}
            {orden.lineasRepuesto?.map((r: any, i: number) => (
              <tr key={`rp-${i}`}>
                <td>Repuesto / Material: {r.descripcion}</td>
                <td className="text-center">{r.cantidad || 1} Un.</td>
                <td className="text-right font-bold">{formatMoney(r.subtotal || r.costo || 0)}</td>
              </tr>
            ))}
            {orden.lineasOtroCosto?.map((o: any, i: number) => (
              <tr key={`oc-${i}`}>
                <td>{o.descripcion}</td>
                <td className="text-center">—</td>
                <td className="text-right font-bold">{formatMoney(o.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 flex flex-col gap-1 bg-surface-hover p-3 rounded-md border border-border">
            <div className="flex justify-between text-xs">
              <span>Subtotal sin IVA:</span>
              <span className="font-bold">{formatMoney(orden.totalSinIva)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>IVA:</span>
              <span>{formatMoney(orden.ivaMontoMonto)}</span>
            </div>
            <hr className="my-1 border-t border-border" />
            <div className="flex justify-between text-base font-bold text-primary">
              <span>TOTAL FINAL:</span>
              <span>{formatMoney(orden.totalFinal)}</span>
            </div>
            {orden.estado === "pagado_parcial" && (
              <div className="mt-2 text-xs font-bold text-orange flex justify-between border-t pt-1">
                <span>Cobrado: {formatMoney(orden.montoCobrado || 0)}</span>
                <span>Falta: {formatMoney((orden.totalFinal || 0) - (orden.montoCobrado || 0))}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
