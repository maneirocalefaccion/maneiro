'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { configuracionService } from '@/services/configuracionService';

type EmpresasTabProps = {
  empresas: any[];
  onRefresh: () => void;
};

export default function EmpresasTab({ empresas, onRefresh }: EmpresasTabProps) {
  const [modalEmpresa, setModalEmpresa] = useState<null | any | 'nueva'>(null);
  const [formEmpresa, setFormEmpresa] = useState({ razonSocial: '', cuit: '', condIva: 'Responsable Inscripto', direccion: '', telefono: '', email: '' });
  const [savingEmpresa, setSavingEmpresa] = useState(false);

  const [modalCuenta, setModalCuenta] = useState<null | { empresaId: number; cuenta?: any }>(null);
  const [formCuenta, setFormCuenta] = useState({ banco: 'Banco Galicia', tipoCuenta: 'Cuenta Corriente', numeroCuenta: '', cbu: '', alias: '', moneda: 'ARS' });
  const [savingCuenta, setSavingCuenta] = useState(false);

  const { success, error, warning } = useToast();

  const abrirNuevaEmpresa = () => {
    setFormEmpresa({ razonSocial: '', cuit: '', condIva: 'Responsable Inscripto', direccion: '', telefono: '', email: '' });
    setModalEmpresa('nueva');
  };

  const abrirEdicionEmpresa = (emp: any) => {
    setFormEmpresa({
      razonSocial: emp.razonSocial || '',
      cuit: emp.cuit || '',
      condIva: emp.condIva || 'Responsable Inscripto',
      direccion: emp.direccion || '',
      telefono: emp.telefono || '',
      email: emp.email || '',
    });
    setModalEmpresa(emp);
  };

  const guardarEmpresa = async () => {
    if (!formEmpresa.razonSocial.trim()) return warning("Ingresá la razón social.");
    setSavingEmpresa(true);
    try {
      const isNew = modalEmpresa === 'nueva';
      await configuracionService.guardarEmpresa(formEmpresa, isNew, isNew ? undefined : modalEmpresa.id);
      success(isNew ? 'Empresa agregada exitosamente' : 'Empresa actualizada');
      setModalEmpresa(null);
      onRefresh();
    } catch {
      error('Error al guardar la empresa');
    } finally {
      setSavingEmpresa(false);
    }
  };

  const eliminarEmpresa = async (empId: number) => {
    if (!confirm('¿Seguro que deseás desactivar esta empresa?')) return;
    try {
      await configuracionService.eliminarEmpresa(empId);
      success('Empresa desactivada');
      onRefresh();
    } catch {
      error('Error al desactivar empresa');
    }
  };

  const abrirNuevaCuenta = (empresaId: number) => {
    setFormCuenta({ banco: 'Banco Galicia', tipoCuenta: 'Cuenta Corriente', numeroCuenta: '', cbu: '', alias: '', moneda: 'ARS' });
    setModalCuenta({ empresaId });
  };

  const abrirEdicionCuenta = (empresaId: number, cuenta: any) => {
    setFormCuenta({
      banco: cuenta.banco || '',
      tipoCuenta: cuenta.tipoCuenta || 'Cuenta Corriente',
      numeroCuenta: cuenta.numeroCuenta || '',
      cbu: cuenta.cbu || '',
      alias: cuenta.alias || '',
      moneda: cuenta.moneda || 'ARS',
    });
    setModalCuenta({ empresaId, cuenta });
  };

  const guardarCuentaBancaria = async () => {
    if (!modalCuenta || !formCuenta.banco.trim()) return warning("Ingresá el nombre del banco.");
    setSavingCuenta(true);
    try {
      const isNew = !modalCuenta.cuenta;
      const payload = {
        ...formCuenta,
        empresaId: modalCuenta.empresaId,
      };
      await configuracionService.guardarCuentaBancaria(payload, isNew, isNew ? undefined : modalCuenta.cuenta.id);
      success(isNew ? 'Cuenta bancaria agregada' : 'Cuenta bancaria actualizada');
      setModalCuenta(null);
      onRefresh();
    } catch {
      error('Error al guardar la cuenta bancaria');
    } finally {
      setSavingCuenta(false);
    }
  };

  const eliminarCuentaBancaria = async (cuentaId: number) => {
    if (!confirm('¿Eliminar esta cuenta bancaria?')) return;
    try {
      await configuracionService.eliminarCuentaBancaria(cuentaId);
      success('Cuenta bancaria eliminada');
      onRefresh();
    } catch {
      error('Error al eliminar cuenta bancaria');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-surface p-4 rounded-md border border-border">
        <div>
          <h2 className="font-bold text-lg text-primary">Empresas del Grupo & Cuentas Bancarias</h2>
          <p className="text-xs text-muted">Configurá las razones sociales que operan en el negocio y sus cuentas de banco para la emisión y recepción de cheques</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevaEmpresa}>
          + Agregar Empresa
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {empresas.map((emp) => (
          <div key={emp.id} className="card p-5 border border-border flex flex-col gap-4">
            <div className="flex justify-between items-start border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-primary">{emp.razonSocial}</h3>
                <span className="text-xs text-muted">
                  {emp.cuit ? `CUIT: ${emp.cuit} — ` : ''}{emp.condIva}
                </span>
                {emp.direccion && <div className="text-xs text-muted mt-1">📍 {emp.direccion}</div>}
              </div>
              <div className="flex gap-2">
                <button className="btn btn-outline btn-sm" onClick={() => abrirEdicionEmpresa(emp)}>✎ Editar Empresa</button>
                <button className="btn btn-outline btn-sm text-danger" onClick={() => eliminarEmpresa(emp.id)}>🗑️</button>
              </div>
            </div>

            {/* Cuentas Bancarias de esta Empresa */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-sm text-primary">🏦 Cuentas Bancarias Registradas ({emp.cuentasBancarias?.length || 0})</span>
                <button className="btn btn-outline btn-sm" onClick={() => abrirNuevaCuenta(emp.id)}>+ Agregar Cuenta Bancaria</button>
              </div>

              {(!emp.cuentasBancarias || emp.cuentasBancarias.length === 0) ? (
                <div className="p-3 bg-surface-hover rounded text-xs text-muted">No hay cuentas bancarias cargadas para esta empresa.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {emp.cuentasBancarias.map((cuenta: any) => (
                    <div key={cuenta.id} className="p-3 border border-border rounded-md bg-surface flex flex-col gap-1 relative">
                      <div className="flex justify-between items-start">
                        <strong className="font-bold text-sm text-primary">{cuenta.banco} ({cuenta.moneda})</strong>
                        <div className="flex gap-1">
                          <button className="btn btn-ghost btn-sm text-xs p-1" onClick={() => abrirEdicionCuenta(emp.id, cuenta)}>✎</button>
                          <button className="btn btn-ghost btn-sm text-xs text-danger p-1" onClick={() => eliminarCuentaBancaria(cuenta.id)}>×</button>
                        </div>
                      </div>
                      <div className="text-xs font-semibold">{cuenta.tipoCuenta}: {cuenta.numeroCuenta || 'N/A'}</div>
                      {cuenta.cbu && <div className="text-xs font-mono text-muted">CBU: {cuenta.cbu}</div>}
                      {cuenta.alias && <div className="text-xs font-bold text-info">ALIAS: {cuenta.alias}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Empresa */}
      <Modal
        isOpen={!!modalEmpresa}
        onClose={() => setModalEmpresa(null)}
        title={modalEmpresa === 'nueva' ? 'Registrar Nueva Empresa' : 'Editar Empresa'}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button className="btn btn-outline" onClick={() => setModalEmpresa(null)} disabled={savingEmpresa}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardarEmpresa} disabled={savingEmpresa}>
              {savingEmpresa ? 'Guardando...' : 'Guardar Empresa'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="form-group">
            <label className="form-label">Razón Social *</label>
            <input type="text" className="form-input" placeholder="Ej: Maneiro Climatización S.R.L." value={formEmpresa.razonSocial} onChange={e => setFormEmpresa({ ...formEmpresa, razonSocial: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">CUIT</label>
              <input type="text" className="form-input" placeholder="30-..." value={formEmpresa.cuit} onChange={e => setFormEmpresa({ ...formEmpresa, cuit: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Condición IVA</label>
              <select className="form-select" value={formEmpresa.condIva} onChange={e => setFormEmpresa({ ...formEmpresa, condIva: e.target.value })}>
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Exento">Exento</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Dirección Fiscal</label>
            <input type="text" className="form-input" placeholder="Av. Casey 123, Coronel Suárez" value={formEmpresa.direccion} onChange={e => setFormEmpresa({ ...formEmpresa, direccion: e.target.value })} />
          </div>
        </div>
      </Modal>

      {/* Modal Cuenta Bancaria */}
      <Modal
        isOpen={!!modalCuenta}
        onClose={() => setModalCuenta(null)}
        title={modalCuenta?.cuenta ? 'Editar Cuenta Bancaria' : 'Agregar Cuenta Bancaria'}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button className="btn btn-outline" onClick={() => setModalCuenta(null)} disabled={savingCuenta}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardarCuentaBancaria} disabled={savingCuenta}>
              {savingCuenta ? 'Guardando...' : 'Guardar Cuenta'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Banco *</label>
              <input type="text" className="form-input" placeholder="Ej: Banco Galicia" value={formCuenta.banco} onChange={e => setFormCuenta({ ...formCuenta, banco: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Moneda</label>
              <select className="form-select" value={formCuenta.moneda} onChange={e => setFormCuenta({ ...formCuenta, moneda: e.target.value })}>
                <option value="ARS">Pesos (ARS)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Tipo de Cuenta</label>
              <input type="text" className="form-input" placeholder="Cuenta Corriente / Caja de Ahorro" value={formCuenta.tipoCuenta} onChange={e => setFormCuenta({ ...formCuenta, tipoCuenta: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Número de Cuenta</label>
              <input type="text" className="form-input" placeholder="CC 1024-8 044-3" value={formCuenta.numeroCuenta} onChange={e => setFormCuenta({ ...formCuenta, numeroCuenta: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">CBU (22 dígitos)</label>
            <input type="text" className="form-input" placeholder="0070044320000..." value={formCuenta.cbu} onChange={e => setFormCuenta({ ...formCuenta, cbu: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Alias CBU</label>
            <input type="text" className="form-input" placeholder="MANEIRO.CLIMA.BSAS" value={formCuenta.alias} onChange={e => setFormCuenta({ ...formCuenta, alias: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
