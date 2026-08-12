'use client';

import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Proveedor } from '@/types';

type ProveedorDB = Proveedor & {
  comprasTotales?: number;
  pagosTotales?: number;
  saldoCuentaCorriente?: number;
  movimientosFinancieros?: any[];
  equipoItems?: any[];
};

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<ProveedorDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRubro, setFiltroRubro] = useState('todos');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<ProveedorDB | null>(null);
  const [verCuentaCorriente, setVerCuentaCorriente] = useState<ProveedorDB | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; nombre: string } | null>(null);

  // Campos Formulario
  const [nombre, setNombre] = useState('');
  const [cuit, setCuit] = useState('');
  const [condIva, setCondIva] = useState('Responsable Inscripto');
  const [rubro, setRubro] = useState('Equipos A/C & Climatización');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [cbu, setCbu] = useState('');
  const [alias, setAlias] = useState('');
  const [banco, setBanco] = useState('');
  const [saving, setSaving] = useState(false);

  const { success, error, warning } = useToast();

  const cargarProveedores = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/proveedores');
      if (res.ok) {
        const data = await res.json();
        setProveedores(data.data || []);
      } else {
        error('Error al cargar proveedores');
      }
    } catch (err) {
      error('Error de red al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const abrirNuevo = () => {
    setEditingProveedor(null);
    setNombre(''); setCuit(''); setCondIva('Responsable Inscripto');
    setRubro('Equipos A/C & Climatización'); setTelefono(''); setEmail('');
    setCbu(''); setAlias(''); setBanco('');
    setIsModalOpen(true);
  };

  const abrirEdicion = (p: ProveedorDB) => {
    setEditingProveedor(p);
    setNombre(p.nombre);
    setCuit(p.cuit || '');
    setCondIva(p.condIva || 'Responsable Inscripto');
    setRubro(p.rubro || 'Equipos A/C & Climatización');
    setTelefono(p.telefono || '');
    setEmail(p.email || '');
    setCbu(p.cbu || '');
    setAlias(p.alias || '');
    setBanco(p.banco || '');
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingProveedor(null);
  };

  const guardarProveedor = async () => {
    if (!nombre.trim()) {
      warning('Ingresá la razón social o nombre del proveedor.');
      return;
    }

    setSaving(true);
    try {
      const payload = { nombre, cuit, condIva, rubro, telefono, email, cbu, alias, banco };
      const url = editingProveedor ? `/api/proveedores/${editingProveedor.id}` : '/api/proveedores';
      const method = editingProveedor ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      success(editingProveedor ? 'Proveedor actualizado' : 'Proveedor registrado');
      await cargarProveedores();
      handleClose();
    } catch (err: any) {
      error('Error al guardar proveedor: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/proveedores/${deleteConfirm.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      success('Proveedor eliminado');
      await cargarProveedores();
    } catch (err) {
      error('Error al eliminar proveedor');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const proveedoresFiltrados = useMemo(() => {
    return proveedores.filter((p) => {
      const coincideTexto =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.cuit && p.cuit.includes(busqueda)) ||
        (p.rubro && p.rubro.toLowerCase().includes(busqueda.toLowerCase()));
      const coincideRubro = filtroRubro === 'todos' || p.rubro === filtroRubro;
      return coincideTexto && coincideRubro;
    });
  }, [proveedores, busqueda, filtroRubro]);

  const totalCompradoGral = proveedores.reduce((a, b) => a + (b.comprasTotales || 0), 0);
  const totalPagadoGral = proveedores.reduce((a, b) => a + (b.pagosTotales || 0), 0);
  const saldoPendienteGral = totalCompradoGral - totalPagadoGral;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Directorio de Proveedores</h1>
          <p className="page-subtitle">
            Padrón de proveedores, datos bancarios (CBU/Alias) y cuentas corrientes por pagar
          </p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo} aria-label="Nuevo Proveedor">
          Nuevo Proveedor
        </button>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="flex justify-between items-center mb-2">
            <span className="stat-card-label">Compras Totales Acumuladas</span>
            <div className="text-primary text-xl">🛍️</div>
          </div>
          <div className="stat-card-value text-primary">
            {loading ? '...' : `$${totalCompradoGral.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          </div>
          <div className="text-xs text-muted mt-2">Total de insumos y equipos adquiridos</div>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-center mb-2">
            <span className="stat-card-label">Pagos Realizados</span>
            <div className="text-success text-xl">💸</div>
          </div>
          <div className="stat-card-value text-success">
            {loading ? '...' : `$${totalPagadoGral.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          </div>
          <div className="text-xs text-muted mt-2">Monto abonado por tesorería</div>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-center mb-2">
            <span className="stat-card-label">Saldo Pendiente a Pagar</span>
            <div className="text-danger text-xl">📉</div>
          </div>
          <div className={`stat-card-value ${saldoPendienteGral > 0 ? 'text-danger' : 'text-success'}`}>
            {loading ? '...' : `$${saldoPendienteGral.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          </div>
          <div className="text-xs text-muted mt-2">Deuda comercial en cuenta corriente</div>
        </div>
      </div>

      <div className="table-container">
        <div className="card-header flex justify-between items-center">
          <span className="font-bold">Nómina de Proveedores</span>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por razón social, CUIT, rubro..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar proveedores"
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <p className="text-muted">Cargando proveedores...</p>
          </div>
        ) : proveedoresFiltrados.length === 0 ? (
          <div className="empty-state">
            <p className="text-muted">
              {busqueda ? 'No se encontraron proveedores que coincidan con la búsqueda.' : 'No hay proveedores registrados aún. Hacé clic en "Nuevo Proveedor".'}
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Proveedor / CUIT</th>
                <th>Rubro</th>
                <th>Datos Bancarios (CBU / Alias)</th>
                <th>Compras / Pagos</th>
                <th>Estado Cuenta Corriente</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedoresFiltrados.map((p) => {
                const saldo = p.saldoCuentaCorriente || 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <strong className="font-bold">{p.nombre}</strong>
                      <br />
                      <span className="text-xs text-muted">
                        {p.cuit ? `CUIT: ${p.cuit}` : p.condIva}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info">{p.rubro || 'General'}</span>
                    </td>
                    <td>
                      {p.alias || p.cbu ? (
                        <div>
                          {p.alias && <div className="text-sm font-bold text-primary">Alias: {p.alias}</div>}
                          {p.cbu && <div className="text-xs text-muted">CBU: {p.cbu}</div>}
                          {p.banco && <div className="text-xs text-muted">{p.banco}</div>}
                        </div>
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="text-sm">
                        Purchased: <strong className="font-bold">${(p.comprasTotales || 0).toLocaleString('es-AR')}</strong>
                      </div>
                      <div className="text-xs text-success">
                        Paid: ${(p.pagosTotales || 0).toLocaleString('es-AR')}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${saldo > 0 ? 'badge-danger' : 'badge-success'}`}>
                        {saldo > 0 ? `Deuda: $${saldo.toLocaleString('es-AR')}` : 'Al día'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-outline btn-sm text-primary" onClick={() => setVerCuentaCorriente(p)} aria-label="Cuenta Corriente">📋 Cta Cte</button>
                        <button className="btn btn-outline btn-sm" onClick={() => abrirEdicion(p)} aria-label="Editar">✎ Editar</button>
                        <button className="btn btn-outline btn-sm text-danger border-danger" onClick={() => setDeleteConfirm({ id: p.id, nombre: p.nombre })} aria-label="Eliminar">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingProveedor ? `Editar Proveedor: ${editingProveedor.nombre}` : 'Nuevo Proveedor'}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button className="btn btn-outline" onClick={handleClose} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardarProveedor} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Proveedor'}
            </button>
          </div>
        }
      >
        <div className="flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="form-label">Razón Social / Nombre Comercial *</label>
              <input type="text" className="form-input" placeholder="Ej: Carrier Fueguina S.A., Peisa Climatización, Ansal" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label">CUIT / DNI</label>
              <input type="text" className="form-input" placeholder="30-12345678-9" value={cuit} onChange={(e) => setCuit(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Condición IVA</label>
              <select className="form-select" value={condIva} onChange={(e) => setCondIva(e.target.value)}>
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Exento">Exento</option>
                <option value="Consumidor Final">Consumidor Final</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Rubro Principal</label>
              <input type="text" className="form-input" placeholder="Ej: A/C, Calderas, Insumos, Repuestos, Servicios" value={rubro} onChange={(e) => setRubro(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono de Contacto</label>
              <input type="text" className="form-input" placeholder="2926-401234" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Email / Correo Electrónico</label>
              <input type="email" className="form-input" placeholder="ventas@proveedor.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <hr className="col-span-2 border-t border-border my-2" />

            <h3 className="col-span-2 font-bold text-primary">💳 Datos Bancarios para Pagos y Transferencias</h3>

            <div className="form-group">
              <label className="form-label">Alias CBU</label>
              <input type="text" className="form-input" placeholder="EJEMPLO.PAGO.ALIAS" value={alias} onChange={(e) => setAlias(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Banco</label>
              <input type="text" className="form-input" placeholder="Banco Nación / Provincia / BBVA..." value={banco} onChange={(e) => setBanco(e.target.value)} />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">CBU / CVU (22 dígitos)</label>
              <input type="text" className="form-input" placeholder="0110254830002541852963" value={cbu} onChange={(e) => setCbu(e.target.value)} />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!verCuentaCorriente}
        onClose={() => setVerCuentaCorriente(null)}
        title={`Ficha de Proveedor: ${verCuentaCorriente?.nombre}`}
        size="lg"
        footer={<button className="btn btn-primary" onClick={() => setVerCuentaCorriente(null)}>Cerrar</button>}
      >
        {verCuentaCorriente && (
          <div className="flex-col gap-4">
            <p className="text-sm text-muted mb-4">
              {verCuentaCorriente.cuit ? `CUIT: ${verCuentaCorriente.cuit} — ` : ''}{verCuentaCorriente.rubro}
            </p>

            {(verCuentaCorriente.alias || verCuentaCorriente.cbu) && (
              <div className="bg-info-light p-4 rounded-md mb-4 border border-info">
                <span className="text-xs font-bold text-info uppercase">DATOS BANCARIOS PARA TRANSFERENCIAS</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {verCuentaCorriente.alias && <div><strong className="font-bold">Alias:</strong> {verCuentaCorriente.alias}</div>}
                  {verCuentaCorriente.banco && <div><strong className="font-bold">Banco:</strong> {verCuentaCorriente.banco}</div>}
                  {verCuentaCorriente.cbu && <div className="col-span-2"><strong className="font-bold">CBU:</strong> {verCuentaCorriente.cbu}</div>}
                </div>
              </div>
            )}

            <div className="stats-grid bg-surface-hover p-4 rounded-md mb-4">
              <div>
                <span className="text-xs text-muted font-bold">COMPRAS TOTALES</span>
                <div className="text-xl font-bold text-primary">
                  ${(verCuentaCorriente.comprasTotales || 0).toLocaleString('es-AR')}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted font-bold">PAGOS ABONADOS</span>
                <div className="text-xl font-bold text-success">
                  ${(verCuentaCorriente.pagosTotales || 0).toLocaleString('es-AR')}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted font-bold">SALDO PENDIENTE</span>
                <div className={`text-xl font-bold ${(verCuentaCorriente.saldoCuentaCorriente || 0) > 0 ? 'text-danger' : 'text-success'}`}>
                  ${(verCuentaCorriente.saldoCuentaCorriente || 0).toLocaleString('es-AR')}
                </div>
              </div>
            </div>

            <h3 className="font-bold text-primary mb-2">💳 Historial de Pagos Realizados por Tesorería</h3>
            
            {!verCuentaCorriente.movimientosFinancieros || verCuentaCorriente.movimientosFinancieros.length === 0 ? (
              <p className="text-center text-muted p-4">Sin pagos registrados aún.</p>
            ) : (
              <div className="table-container mb-4">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Concepto</th>
                      <th>Medio de Pago</th>
                      <th>Monto ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verCuentaCorriente.movimientosFinancieros.map((m: any) => (
                      <tr key={m.id}>
                        <td className="text-sm">{new Date(m.fecha).toLocaleDateString('es-AR')}</td>
                        <td>{m.concepto}</td>
                        <td>{m.medioPago}</td>
                        <td className="font-bold text-success">${m.monto.toLocaleString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Confirmar eliminación"
        message={`¿Estás seguro de eliminar al proveedor "${deleteConfirm?.nombre}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        dangerMode={true}
      />
    </>
  );
}
