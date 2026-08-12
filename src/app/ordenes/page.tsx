"use client";

import { useState, useEffect, useMemo } from "react";
import { formatMoney } from "@/lib/utils";
import { enviarWhatsApp } from "@/lib/whatsapp";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import type { Orden, Cliente, Direccion } from "@/types";
import ModalOrdenCompleta from "@/components/ModalOrdenCompleta";
import OrdenDetalle from "./OrdenDetalle";

const ESTADO_INFO: Record<string, { label: string; color: string; bg: string }> = {
  presupuesto:        { label: "1. 📋 Presupuesto", color: "text-blue", bg: "bg-blue-light" },
  pendiente_anticipo: { label: "2. ⏳ Esp. Anticipo", color: "text-orange", bg: "bg-orange-light" },
  en_ejecucion:       { label: "3. 🚀 Orden Abierta", color: "text-indigo", bg: "bg-indigo-light" },
  adicion_pendiente:  { label: "3b. ⚠️ Cambio",     color: "text-orange-dark", bg: "bg-orange-light" },
  completado:         { label: "4. 🔒 Trabajo Cerrado", color: "text-success", bg: "bg-success-light" },
  pagado_parcial:     { label: "4b. ⚖️ Pagado Parcial", color: "text-warning-dark", bg: "bg-warning-light" },
  facturado:          { label: "5. 🧾 Facturado",color: "text-purple", bg: "bg-purple-light" },
  cobrado:            { label: "6. 💰 Saldado & Cerrado",     color: "text-green-dark", bg: "bg-success-light" },
  rechazado:          { label: "❌ Rechazado",               color: "text-danger", bg: "bg-danger-light" },
  borrador:           { label: "Borrador",                   color: "text-orange-dark", bg: "bg-orange-light" },
  aprobada:           { label: "Aprobada",                   color: "text-success", bg: "bg-success-light" },
  solicitada:         { label: "Solicitada",                 color: "text-blue", bg: "bg-blue-light" },
};

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrden, setEditingOrden] = useState<Orden | null>(null);
  
  const [ordenToView, setOrdenToView] = useState<Orden | null>(null);
  const [ordenToDelete, setOrdenToDelete] = useState<{id: number, numero: string} | null>(null);

  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");

  const cargarTodo = async () => {
    try {
      setLoading(true);
      const resOrd = await fetch("/api/ordenes");
      if (resOrd.ok) {
        const ord = await resOrd.json();
        setOrdenes(ord.data || []);
      } else {
        toast.error("Error al cargar órdenes");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const calcularRentabilidad = (ord: any) => {
    const costoRepuest = ord.lineasRepuesto?.reduce((acc: number, r: any) => {
      if (r.costo !== undefined && r.costo !== null && r.costo > 0) return acc + r.costo;
      return acc + ((r.costoUnitario || 0) * (r.cantidad || 1));
    }, 0) || 0;

    const costoOtro   = ord.lineasOtroCosto?.reduce((acc: number, o: any) => acc + (o.monto || 0), 0) || 0;
    const costoViatic = ord.viatico?.total || 0;

    const costoMO = ord.lineasManoObra?.reduce((acc: number, l: any) => {
      if (l.costoTotal) return acc + l.costoTotal;
      if (l.costoUnitario) return acc + (l.costoUnitario * (l.cantidad || 1));
      return acc + ((l.subtotal || 0) * 0.5);
    }, 0) || 0;

    const costoTotal   = costoRepuest + costoOtro + costoViatic + costoMO;
    const gananciaNeta = (ord.totalSinIva || 0) - costoTotal;
    const margenPct    = (ord.totalSinIva || 0) > 0 ? (gananciaNeta / ord.totalSinIva) * 100 : 0;

    return { costoTotal, gananciaNeta, margenPct, costoMO, costoRepuest };
  };

  const [showSaldadas, setShowSaldadas] = useState(false);

  const getStatusPriority = (estado: string) => {
    switch (estado) {
      case 'pagado_parcial': return 1; // Prioridad Máxima: Pagado parcialmente
      case 'completado': return 2;     // Trabajo cerrado / Pendiente de cobro
      case 'en_ejecucion': return 3;   // Abierta / En ejecución en terreno
      case 'aprobada': return 4;       // Aprobada por iniciar
      case 'presupuesto':
      case 'solicitada':
      case 'borrador':
      case 'presupuestado': return 5;  // Presupuestos
      case 'facturado': return 6;      // Facturado
      case 'cobrado': return 10;       // Saldada
      case 'rechazado': return 11;     // Rechazada
      default: return 99;
    }
  };

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter((ord: any) => {
      const searchLow = busqueda.toLowerCase();
      const coincideTexto = ord.numero.toLowerCase().includes(searchLow) ||
        (ord.cliente?.nombre && ord.cliente.nombre.toLowerCase().includes(searchLow)) ||
        (ord.descripcion && ord.descripcion.toLowerCase().includes(searchLow));
      
      let coincideEstado = true;
      if (filtroEstado === "en_ejecucion") coincideEstado = ord.estado === "en_ejecucion" || ord.estado === "aprobada";
      else if (filtroEstado === "completadas") coincideEstado = ord.estado === "completado";
      else if (filtroEstado === "pagado_parcial") coincideEstado = ord.estado === "pagado_parcial";
      else if (filtroEstado === "cobradas") coincideEstado = ord.estado === "cobrado";
      else if (filtroEstado === "presupuesto") coincideEstado = ["borrador","solicitada","presupuestado","presupuesto"].includes(ord.estado);
      else if (filtroEstado === "rechazado") coincideEstado = ord.estado === "rechazado";

      return coincideTexto && coincideEstado;
    });
  }, [ordenes, busqueda, filtroEstado]);

  const { ordenesActivas, ordenesSaldadasYRechazadas } = useMemo(() => {
    const activas: any[] = [];
    const saldadas: any[] = [];

    ordenesFiltradas.forEach((ord: any) => {
      if (['cobrado', 'rechazado'].includes(ord.estado)) {
        saldadas.push(ord);
      } else {
        activas.push(ord);
      }
    });

    activas.sort((a, b) => {
      const pA = getStatusPriority(a.estado);
      const pB = getStatusPriority(b.estado);
      if (pA !== pB) return pA - pB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    saldadas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { ordenesActivas: activas, ordenesSaldadasYRechazadas: saldadas };
  }, [ordenesFiltradas]);

  const abrirEdicionOrden = (ord: Orden) => {
    setEditingOrden(ord);
    setIsModalOpen(true);
  };

  const cambiarEstado = async (ordenId: number, nuevoEstado: string) => {
    const target = ordenes.find((o) => o.id === ordenId);
    if (target) {
      const cobrado = target.montoCobrado || 0;
      const totalF = target.totalFinal || 0;
      if (cobrado > 0) {
        const cobradoPesos = cobrado / 100;
        const restaPesos = Math.max(0, (totalF - cobrado) / 100);
        const confirmMsg = `⚠️ ATENCIÓN: La orden #${target.numero} posee cobros asentados por $ ${cobradoPesos.toLocaleString("es-AR")} (Falta cobrar $ ${restaPesos.toLocaleString("es-AR")}).\n\nEl cambio de estado a "${nuevoEstado}" NO borrará los movimientos registrados en el Libro Diario.\n\n¿Confirmás actualizar el estado?`;
        if (!confirm(confirmMsg)) return;
      }
    }

    try {
      const res = await fetch(`/api/ordenes/${ordenId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Estado de orden #${target?.numero || ordenId} actualizado a "${nuevoEstado}"`);
      await cargarTodo();
    } catch {
      toast.error("Error al actualizar el estado de la orden.");
    }
  };

  const eliminarOrden = async () => {
    if (!ordenToDelete) return;
    try {
      const res = await fetch(`/api/ordenes/${ordenToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Orden eliminada");
      await cargarTodo();
    } catch {
      toast.error("Error al eliminar la orden.");
    } finally {
      setOrdenToDelete(null);
    }
  };

  const renderTablaOrdenes = (lista: any[]) => (
    <table className="table w-full">
      <thead>
        <tr>
          <th>N° Orden</th>
          <th>Cliente</th>
          <th>Tipo</th>
          <th>Fecha</th>
          <th>Total ($)</th>
          <th>Rentabilidad Neta</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {lista.map((ord: any) => {
          const est = ESTADO_INFO[ord.estado] || { label: ord.estado, color: 'text-muted', bg: 'bg-slate-100' };
          const rent = calcularRentabilidad(ord);

          return (
            <tr
              key={ord.id}
              onClick={() => setOrdenToView(ord)}
              className="cursor-pointer hover:bg-surface-hover transition-colors"
            >
              <td><strong>#{ord.numero}</strong></td>
              <td>
                <strong className="font-bold text-primary">{ord.cliente?.nombre || "Sin cliente"}</strong>
              </td>
              <td className="capitalize text-xs">{ord.tipo}</td>
              <td className="text-xs text-muted">
                {new Date(ord.createdAt).toLocaleDateString('es-AR')}
              </td>
              <td className="font-bold text-primary">
                {formatMoney(ord.totalFinal)}
              </td>
              <td>
                <span className={`badge ${rent.gananciaNeta >= 0 ? 'badge-success' : 'badge-danger'}`}>
                  {rent.gananciaNeta >= 0 ? '+' : ''}{formatMoney(rent.gananciaNeta)} ({Math.round(rent.margenPct)}%)
                </span>
              </td>
              <td>
                <span className={`badge-rounded ${est.color} ${est.bg}`}>
                  {est.label}
                </span>
                {ord.estado === 'pagado_parcial' && (
                  <div className="text-[11px] font-bold text-orange mt-0.5">
                    Falta: {formatMoney((ord.totalFinal || 0) - (ord.montoCobrado || 0))}
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="page-container">
      <div className="page-header space-between align-end mb-8">
        <div>
          <h1 className="page-title">Órdenes & Presupuestos</h1>
          <p className="page-subtitle mb-0">Gestión de reparaciones, instalaciones y ventas</p>
        </div>
        <button className="btn btn-primary flex gap-2 items-center" onClick={() => { setEditingOrden(null); setIsModalOpen(true); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva Orden
        </button>
      </div>

      <div className="table-container">
        <div className="table-header space-between">
          <span className="table-title">Órdenes Activas & En Curso</span>
          <div className="flex gap-3 items-center">
            <select
              className="select"
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="presupuesto">📋 Presupuestos</option>
              <option value="en_ejecucion">🚀 Órdenes Abiertas / En Ejecución</option>
              <option value="completadas">🔒 Trabajos Cerrados / A Cobrar</option>
              <option value="pagado_parcial">⚖️ Pagados Parcialmente</option>
              <option value="cobradas">💰 Saldadas & Cerradas</option>
              <option value="rechazado">❌ Rechazados</option>
            </select>
            <input
              type="text"
              placeholder="Buscar por N° orden, cliente..."
              className="input w-220"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Cargando órdenes...</div>
        ) : ordenesActivas.length === 0 && ordenesSaldadasYRechazadas.length === 0 ? (
          <div className="empty-state">
            No hay órdenes registradas que coincidan con la búsqueda.
          </div>
        ) : (
          <>
            {ordenesActivas.length > 0 ? (
              renderTablaOrdenes(ordenesActivas)
            ) : (
              <div className="empty-state p-4 text-muted text-sm">
                No hay órdenes activas o pendientes en curso.
              </div>
            )}

            {/* Sección colapsable de Órdenes Saldadas y Rechazadas */}
            {ordenesSaldadasYRechazadas.length > 0 && (
              <div className="mt-6 border-t border-border pt-4 px-4 pb-4">
                <button
                  type="button"
                  className="btn btn-outline w-full flex justify-between items-center py-2 px-4 font-bold text-muted bg-surface-hover border border-border rounded-md"
                  onClick={() => setShowSaldadas(!showSaldadas)}
                >
                  <span className="flex items-center gap-2">
                    📁 Historial de Órdenes Saldadas & Presupuestos Rechazados ({ordenesSaldadasYRechazadas.length} órdenes)
                  </span>
                  <span>{showSaldadas ? '▲ Ocultar Historial' : '▼ Desplegar Historial'}</span>
                </button>

                {showSaldadas && (
                  <div className="mt-4">
                    {renderTablaOrdenes(ordenesSaldadasYRechazadas)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <ModalOrdenCompleta
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOrden(null);
        }}
        onSuccess={cargarTodo}
        editingOrden={editingOrden as any}
      />

      <OrdenDetalle 
        isOpen={!!ordenToView}
        orden={ordenToView}
        onClose={() => setOrdenToView(null)}
        onEditar={abrirEdicionOrden}
        onWhatsApp={enviarWhatsApp}
        onCambiarEstado={cambiarEstado}
        onEliminar={(ord) => setOrdenToDelete(ord)}
      />

      <ConfirmDialog
        isOpen={!!ordenToDelete}
        title="Eliminar Orden"
        message={`¿Estás seguro de eliminar la orden #${ordenToDelete?.numero}? Esta acción no se puede deshacer.`}
        onConfirm={eliminarOrden}
        onCancel={() => setOrdenToDelete(null)}
        confirmText="Eliminar"
        dangerMode={true}
      />
    </div>
  );
}
