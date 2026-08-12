'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EquipoItem } from '@/types';
import { formatMoney } from '@/lib/utils';
import { inventarioService } from '@/services/inventarioService';
import ModalItemInventario from './modales/ModalItemInventario';
import ModalDetalleItem from './modales/ModalDetalleItem';

type EquipoItemDB = EquipoItem & {
  tipo: 'equipo' | 'material' | 'insumo';
  cliente?: { id: number; nombre: string };
  direccion?: { id: number; nombre: string; direccion?: string; ciudad?: string };
};

export default function InventarioPage() {
  const [items, setItems] = useState<EquipoItemDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipoItemDB | null>(null);
  const [itemToView, setItemToView] = useState<EquipoItemDB | null>(null);
  const [showInstalados, setShowInstalados] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; nombre: string } | null>(null);

  const { success, error } = useToast();

  const cargarInventario = async () => {
    try {
      setLoading(true);
      const data = await inventarioService.getInventario();
      setItems(data);
    } catch {
      error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  const itemsFiltrados = useMemo(() => {
    return items.filter(item => {
      const coincideBusqueda =
        item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.numeroSerie && item.numeroSerie.toLowerCase().includes(busqueda.toLowerCase())) ||
        (item.proveedor && item.proveedor.toLowerCase().includes(busqueda.toLowerCase())) ||
        (item.cliente && item.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()));

      const coincideTipo = filtroTipo === 'todos' || item.tipo === filtroTipo;

      const coincideInstalado = showInstalados ? item.clienteId !== null : item.clienteId === null;

      return coincideBusqueda && coincideTipo && coincideInstalado;
    });
  }, [items, busqueda, filtroTipo, showInstalados]);

  const abrirNuevo = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const abrirEdicion = (item: EquipoItemDB) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await inventarioService.eliminarItem(deleteConfirm.id);
      success('Item eliminado correctamente');
      await cargarInventario();
    } catch {
      error('Error al eliminar item.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Padrón de Inventario & Equipos</h1>
          <p className="page-subtitle">Control de stock en depósito y parque de equipos instalados en clientes</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo} aria-label="Ingresar Item al Depósito">
          + Ingresar al Depósito
        </button>
      </div>

      {/* Solapas Depósito vs Instalados */}
      <div className="tabs mb-6 flex gap-2 border-b border-border">
        <button
          className={`tab-item pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${!showInstalados ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
          onClick={() => setShowInstalados(false)}
        >
          📦 En Depósito / Stock ({items.filter(i => !i.clienteId).length})
        </button>
        <button
          className={`tab-item pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${showInstalados ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
          onClick={() => setShowInstalados(true)}
        >
          🏠 Equipos Instalados en Clientes ({items.filter(i => i.clienteId).length})
        </button>
      </div>

      <div className="table-container">
        <div className="card-header flex justify-between items-center flex-wrap gap-3">
          <div className="flex gap-2 items-center">
            <span className="font-bold">Filtros:</span>
            <select className="form-select text-xs" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="todos">Todos los tipos</option>
              <option value="equipo">Equipos (Unidades)</option>
              <option value="material">Materiales / Repuestos</option>
              <option value="insumo">Insumos Consumibles</option>
            </select>
          </div>
          <input
            type="text"
            className="form-input text-sm"
            placeholder="Buscar por nombre, S/N o cliente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            aria-label="Buscar inventario"
          />
        </div>

        {loading ? (
          <div className="empty-state p-8"><p className="text-muted">Cargando datos de inventario...</p></div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="empty-state p-8">
            <p className="text-muted">No hay items registrados en esta sección.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Producto / Equipo</th>
                <th>S/N Serie</th>
                <th>Tipo</th>
                {showInstalados ? <th>Cliente & Ubicación</th> : <th>Ubicación Fís.</th>}
                {!showInstalados && <th>Stock</th>}
                <th>Costo Compra</th>
                <th>Precio Venta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong className="font-bold text-primary">{item.nombre}</strong>
                    {item.proveedor && <div className="text-xs text-muted">Prov: {item.proveedor}</div>}
                  </td>
                  <td className="font-mono text-xs">{item.numeroSerie || '—'}</td>
                  <td><span className="badge badge-info">{item.tipo.toUpperCase()}</span></td>
                  {showInstalados ? (
                    <td>
                      <span className="font-bold text-primary">{item.cliente?.nombre || 'Cliente'}</span>
                      <br />
                      <span className="text-xs text-muted">📍 {item.direccion?.nombre ? `${item.direccion.nombre} — ` : ''}{item.ubicacion}</span>
                    </td>
                  ) : (
                    <td className="text-xs">{item.ubicacion || 'Depósito Principal'}</td>
                  )}
                  {!showInstalados && <td><span className="badge badge-success font-bold">{item.stock || 1} u.</span></td>}
                  <td className="font-semibold">{formatMoney(item.precioCompra || 0)}</td>
                  <td className="font-bold text-success">{formatMoney(item.precioVentaSugerido || 0)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-outline btn-sm font-semibold text-primary" onClick={() => setItemToView(item)} title="Ver Ficha Técnica">📋 Ficha</button>
                      <button className="btn btn-outline btn-sm" onClick={() => abrirEdicion(item)}>✎</button>
                      <button className="btn btn-outline btn-sm text-danger" onClick={() => setDeleteConfirm({ id: item.id, nombre: item.nombre })}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modales Modularizados */}
      <ModalItemInventario
        isOpen={isModalOpen}
        editingItem={editingItem}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSuccess={cargarInventario}
      />

      <ModalDetalleItem
        item={itemToView}
        onClose={() => setItemToView(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Confirmar eliminación"
        message={`¿Estás seguro de eliminar "${deleteConfirm?.nombre}" del sistema?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        dangerMode={true}
      />
    </>
  );
}
