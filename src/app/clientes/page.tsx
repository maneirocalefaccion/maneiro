'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Cliente } from '@/types';
import { clienteService } from '@/services/clienteService';
import ModalHistorialCliente from './modales/ModalHistorialCliente';
import ModalFormCliente from './modales/ModalFormCliente';

type ClienteDB = Cliente & {
  direcciones: { id: number; nombre: string; direccion?: string; ciudad?: string; km: number }[];
  ordenes?: any[];
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteDB | null>(null);
  const [historialClienteId, setHistorialClienteId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; nombre: string } | null>(null);

  const { success, error } = useToast();

  const cargarClientes = async (currentPage = 1, query = '') => {
    try {
      setLoading(true);
      const payload = await clienteService.getClientes(currentPage, pageSize, query);
      setClientes(payload.data || []);
      setTotal(payload.total || payload.data?.length || 0);
    } catch {
      error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      cargarClientes(1, busqueda);
    }, 500);
    return () => clearTimeout(handler);
  }, [busqueda]);

  useEffect(() => {
    cargarClientes(page, busqueda);
  }, [page]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const hId = params.get('historialId') || params.get('clienteId');
      if (hId) {
        setHistorialClienteId(parseInt(hId));
      }
    }
  }, []);

  const statsClientes = useMemo(() => {
    const map = new Map<number, { cantOrdenes: number; totalFacturado: number; gananciaNeta: number; margenPct: number }>();

    clientes.forEach(c => {
      const ords = c.ordenes || [];
      const cantOrdenes = ords.length;
      let totalFacturado = 0;
      let totalCosto = 0;

      ords.forEach((ord: any) => {
        totalFacturado += ord.totalSinIva || 0;
        const costoRep = ord.lineasRepuesto?.reduce((acc: number, r: any) => acc + (r.costo || 0), 0) || 0;
        const costoOtro = ord.lineasOtroCosto?.reduce((acc: number, o: any) => acc + (o.monto || 0), 0) || 0;
        const costoViat = ord.viatico?.total || 0;
        const costoMO   = (ord.lineasManoObra?.reduce((acc: number, l: any) => acc + (l.subtotal || 0), 0) || 0) * 0.6;
        totalCosto += (costoRep + costoOtro + costoViat + costoMO);
      });

      const gananciaNeta = totalFacturado - totalCosto;
      const margenPct = totalFacturado > 0 ? (gananciaNeta / totalFacturado) * 100 : 0;
      map.set(c.id, { cantOrdenes, totalFacturado, gananciaNeta, margenPct });
    });
    return map;
  }, [clientes]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  const abrirNuevo = () => {
    setEditingCliente(null);
    setIsModalOpen(true);
  };

  const abrirEdicion = (c: ClienteDB) => {
    setEditingCliente(c);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await clienteService.eliminarCliente(deleteConfirm.id);
      success('Cliente eliminado correctamente');
      await cargarClientes(page, busqueda);
    } catch {
      error('Error al eliminar cliente.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Directorio de Clientes</h1>
          <p className="page-subtitle">Gestión de contactos, ubicaciones y cuentas corrientes</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo} aria-label="Nuevo Cliente">
          Nuevo Cliente
        </button>
      </div>

      <div className="table-container">
        <div className="card-header flex justify-between items-center">
          <span className="font-bold">Listado de Clientes</span>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por nombre o CUIT..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            aria-label="Buscar clientes"
          />
        </div>

        {loading ? (
          <div className="empty-state">
            <p className="text-muted">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="empty-state">
            <p className="text-muted">
              {busqueda ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes registrados aún. Hacé clic en "Nuevo Cliente".'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Trabajos</th>
                  <th>Facturación Histórica</th>
                  <th>Rentabilidad Acumulada</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => {
                  const stats = statsClientes.get(c.id) || { cantOrdenes: 0, totalFacturado: 0, gananciaNeta: 0, margenPct: 0 };
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setHistorialClienteId(c.id)}
                      className="cursor-pointer hover:bg-surface-hover transition-colors"
                    >
                      <td>
                        <strong className="font-bold text-primary">{c.nombre}</strong>
                        <br />
                        <span className="text-muted text-xs">
                          {c.cuit ? `CUIT: ${c.cuit}` : c.condIva}
                        </span>
                      </td>
                      <td>
                        {c.telefono && <div className="text-sm">📞 {c.telefono}</div>}
                        {c.email && <div className="text-xs text-muted">✉️ {c.email}</div>}
                        {!c.telefono && !c.email && <span className="text-sm text-muted">—</span>}
                      </td>
                      <td>
                        <span className="badge badge-info">{stats.cantOrdenes} orden(es)</span>
                      </td>
                      <td className="font-bold text-primary">
                        ${stats.totalFacturado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </td>
                      <td>
                        <span className={`badge ${stats.gananciaNeta >= 0 ? 'badge-success' : 'badge-danger'}`}>
                          {stats.gananciaNeta >= 0 ? '+' : ''}${Math.round(stats.gananciaNeta).toLocaleString('es-AR')} ({Math.round(stats.margenPct)}%)
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <button className="btn btn-outline btn-sm font-semibold text-primary" onClick={() => setHistorialClienteId(c.id)} title="Ver Historial & Equipos">📋 Historial</button>
                          <button className="btn btn-outline btn-sm" onClick={() => abrirEdicion(c)} aria-label="Editar">✎</button>
                          <button className="btn btn-outline btn-sm text-danger" onClick={() => setDeleteConfirm({ id: c.id, nombre: c.nombre })} aria-label="Eliminar">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales Modularizados */}
      <ModalHistorialCliente
        clienteId={historialClienteId}
        onClose={() => setHistorialClienteId(null)}
      />

      <ModalFormCliente
        isOpen={isModalOpen}
        editingCliente={editingCliente}
        onClose={() => { setIsModalOpen(false); setEditingCliente(null); }}
        onSuccess={() => cargarClientes(page, busqueda)}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Confirmar eliminación"
        message={`¿Estás seguro de eliminar a "${deleteConfirm?.nombre}" y sus ubicaciones?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        dangerMode={true}
      />
    </>
  );
}
