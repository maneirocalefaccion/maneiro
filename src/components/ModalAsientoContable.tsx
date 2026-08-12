'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { parseNum } from '@/lib/utils';

type ModalAsientoContableProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tipoInicial?: 'ingreso' | 'egreso';
  asientoAEditar?: any;
  onDelete?: (asiento: any) => void;
};

const GRUPOS_CONTABLES_INGRESO = [
  '1. INGRESOS OPERATIVOS',
  '5. TESORERÍA & CAPITAL',
];

const GRUPOS_CONTABLES_EGRESO = [
  '2. COSTOS OPERATIVOS DIRECTOS',
  '3. GASTOS ESTRUCTURALES',
  '4. IMPUESTOS & SEGUROS',
  '5. TESORERÍA & CAPITAL',
];

export default function ModalAsientoContable({
  isOpen,
  onClose,
  onSuccess,
  tipoInicial = 'egreso',
  asientoAEditar = null,
  onDelete,
}: ModalAsientoContableProps) {
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>(tipoInicial);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('3. GASTOS ESTRUCTURALES');
  const [planCuenta, setPlanCuenta] = useState('3.5 Herramientas, Ferretería & Librería');
  
  // Multimoneda
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS');
  const [monto, setMonto] = useState('');
  const [montoUSD, setMontoUSD] = useState('');
  const [cotizacionUSD, setCotizacionUSD] = useState('1250');

  const [medioPago, setMedioPago] = useState('Efectivo');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [concepto, setConcepto] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [saving, setSaving] = useState(false);

  // Campos para Cheque Diferido y Cartera (con regla de 30 días)
  const [chequeNumero, setChequeNumero] = useState('');
  const [chequeBanco, setChequeBanco] = useState('');
  const [chequeLibrador, setChequeLibrador] = useState('');
  const [chequeEntregadoPor, setChequeEntregadoPor] = useState('');
  const [chequeDestino, setChequeDestino] = useState('');
  const [chequeFechaEmision, setChequeFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [chequeFechaVencimiento, setChequeFechaVencimiento] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const [cajas, setCajas] = useState<any[]>([]);
  const [cajaId, setCajaId] = useState<string>('');
  const [ordenId, setOrdenId] = useState<string>('');
  const [ordenesPendientes, setOrdenesPendientes] = useState<any[]>([]);
  const [taxonomia, setTaxonomia] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empresaEmisoraId, setEmpresaEmisoraId] = useState<string>('');

  const { success, error, warning } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const cargarListas = async () => {
      try {
        const [resTax, resProv, resCli, resCaj, resOrd, resEmp] = await Promise.all([
          fetch('/api/taxonomia'),
          fetch('/api/proveedores'),
          fetch('/api/clientes'),
          fetch('/api/cajas'),
          fetch('/api/ordenes'),
          fetch('/api/empresas'),
        ]);
        if (resTax.ok) {
          const tax = await resTax.json();
          setTaxonomia(tax.data || tax || []);
        }
        if (resProv.ok) {
          const prov = await resProv.json();
          setProveedores(prov.data || prov || []);
        }
        if (resCli.ok) {
          const cli = await resCli.json();
          setClientes(cli.data || cli || []);
        }
        if (resCaj?.ok) {
          const caj = await resCaj.json();
          setCajas(caj.data || caj || []);
        }
        if (resEmp?.ok) {
          const emp = await resEmp.json();
          const empList = emp.data || emp || [];
          setEmpresas(empList);
          if (empList.length > 0) {
            setEmpresaEmisoraId(empList[0].id.toString());
            setChequeLibrador(empList[0].razonSocial);
            if (empList[0].cuentasBancarias && empList[0].cuentasBancarias.length > 0) {
              const c = empList[0].cuentasBancarias[0];
              setChequeBanco(`${c.banco} - ${c.tipoCuenta} (${c.numeroCuenta || c.alias || 'S/N'})`);
            }
          }
        }
        if (resOrd?.ok) {
          const ord = await resOrd.json();
          const list = ord.data || [];
          const pend = list.filter((o: any) => 
            o.estado === 'completado' || o.estado === 'pendiente_anticipo' || o.estado === 'pagado_parcial' || o.estado === 'en_ejecucion'
          );
          setOrdenesPendientes(pend);
        }
      } catch (err) {
        error('Error al cargar datos para modal de asiento');
      }
    };
    cargarListas();

    if (asientoAEditar) {
      setTipo(asientoAEditar.tipo);
      setPlanCuenta(asientoAEditar.planCuenta || '3.5 Herramientas, Ferretería & Librería');
      setMoneda(asientoAEditar.moneda === 'USD' ? 'USD' : 'ARS');
      setMonto(asientoAEditar.monto ? (asientoAEditar.monto / 100).toString() : '');
      setMontoUSD(asientoAEditar.montoUSD ? (asientoAEditar.montoUSD / 100).toString() : '');
      setCotizacionUSD(asientoAEditar.cotizacionUSD ? (asientoAEditar.cotizacionUSD / 100).toString() : '1250');
      setMedioPago(asientoAEditar.medioPago || (asientoAEditar.moneda === 'USD' ? 'Caja Efectivo USD' : 'Efectivo'));
      setCajaId(asientoAEditar.cajaId ? asientoAEditar.cajaId.toString() : '');
      setOrdenId(asientoAEditar.ordenId ? asientoAEditar.ordenId.toString() : '');
      setFecha(asientoAEditar.fecha ? asientoAEditar.fecha.split('T')[0] : new Date().toISOString().split('T')[0]);
      setConcepto(asientoAEditar.concepto);
      setProveedorId(asientoAEditar.proveedorId ? asientoAEditar.proveedorId.toString() : '');
      setClienteId(asientoAEditar.clienteId ? asientoAEditar.clienteId.toString() : '');
    } else {
      setTipo(tipoInicial);
      setGrupoSeleccionado(tipoInicial === 'ingreso' ? '1. INGRESOS OPERATIVOS' : '3. GASTOS ESTRUCTURALES');
      setPlanCuenta('3.5 Herramientas, Ferretería & Librería');
      setMoneda('ARS');
      setMonto('');
      setMontoUSD('');
      setCotizacionUSD('1250');
      setMedioPago('Efectivo');
      setFecha(new Date().toISOString().split('T')[0]);
      setConcepto('');
      setProveedorId('');
      setClienteId('');
    }
  }, [isOpen, asientoAEditar, tipoInicial, error]);

  useEffect(() => {
    if (!asientoAEditar) {
      if (tipo === 'ingreso') setGrupoSeleccionado('1. INGRESOS OPERATIVOS');
      else setGrupoSeleccionado('3. GASTOS ESTRUCTURALES');
    }
  }, [tipo, asientoAEditar]);

  useEffect(() => {
    if (moneda === 'USD' && medioPago === 'Efectivo') {
      setMedioPago('Caja Efectivo USD');
    } else if (moneda === 'ARS' && medioPago === 'Caja Efectivo USD') {
      setMedioPago('Efectivo');
    }
  }, [moneda]);

  const gruposDisponibles = tipo === 'ingreso' ? GRUPOS_CONTABLES_INGRESO : GRUPOS_CONTABLES_EGRESO;
  const categoriasDelGrupo = taxonomia.filter((t) => 
    t.grupo === grupoSeleccionado && (t.tipo === tipo || t.tipo === 'ambos' || !t.tipo || grupoSeleccionado.includes('TESORERÍA'))
  );

  useEffect(() => {
    if (categoriasDelGrupo.length > 0) {
      setPlanCuenta(`${categoriasDelGrupo[0].codigo} ${categoriasDelGrupo[0].nombre}`);
    }
  }, [grupoSeleccionado, taxonomia, tipo]);

  const numMontoUSD = parseFloat(montoUSD) || 0;
  const numCotiz = parseFloat(cotizacionUSD) || 0;
  const equivalenteARS = moneda === 'USD' ? numMontoUSD * numCotiz : parseFloat(monto) || 0;

  const guardarAsiento = async () => {
    if (!concepto.trim()) {
      warning('Ingresá la leyenda o concepto del asiento.');
      return;
    }
    if (moneda === 'USD' && (!montoUSD || numMontoUSD <= 0)) {
      warning('Ingresá un monto válido en USD.');
      return;
    }
    if (moneda === 'USD' && (!cotizacionUSD || numCotiz <= 0)) {
      warning('Ingresá un tipo de cambio válido.');
      return;
    }
    if (moneda === 'ARS' && (!monto || parseFloat(monto) <= 0)) {
      warning('Ingresá un monto válido en Pesos.');
      return;
    }

    setSaving(true);
    try {
      const cajaCorrespondiente = cajas.find(c => c.nombre === medioPago || (moneda === 'USD' && c.tipo === 'efectivo_usd'));

      const payload = {
        tipo,
        categoria: tipo === 'ingreso' ? 'cobro_orden' : 'gasto_varios',
        planCuenta,
        moneda,
        monto: Math.round(equivalenteARS * 100),
        montoUSD: moneda === 'USD' ? Math.round(numMontoUSD * 100) : null,
        cotizacionUSD: moneda === 'USD' ? Math.round(numCotiz * 100) : null,
        medioPago,
        cajaId: cajaCorrespondiente ? cajaCorrespondiente.id : (cajaId ? parseInt(cajaId) : null),
        ordenId: ordenId ? parseInt(ordenId) : null,
        fecha,
        concepto,
        proveedorId: proveedorId ? parseInt(proveedorId) : null,
        clienteId: clienteId ? parseInt(clienteId) : null,
      };

      const url = asientoAEditar ? `/api/finanzas/${asientoAEditar.id}` : '/api/finanzas';
      const method = asientoAEditar ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      // Si vinculó una orden, actualizar su cobro y estado
      if (tipo === 'ingreso' && ordenId) {
        const ordTarget = ordenesPendientes.find(o => o.id === parseInt(ordenId));
        if (ordTarget) {
          const cobroPrevio = ordTarget.montoCobrado || 0;
          const nuevoCobroTotal = cobroPrevio + (equivalenteARS * 100);
          const esTotalmenteCobrado = nuevoCobroTotal >= (ordTarget.totalFinal || 0);
          const nuevoEstado = esTotalmenteCobrado ? 'cobrado' : 'pagado_parcial';

          await fetch(`/api/ordenes/${ordenId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...ordTarget,
              montoCobrado: nuevoCobroTotal,
              estado: nuevoEstado,
            }),
          }).catch(() => null);
        }
      }

      // Si el medio de pago es Cheque, registrar automáticamente en el padrón de Cheques en Cartera / Emitidos
      const esCheque = medioPago === 'Cheques en Cartera' || medioPago.toLowerCase().includes('cheque');
      if (esCheque && !asientoAEditar) {
        const montoCentavos = Math.round(equivalenteARS * 100);
        const cliTarget = clientes.find(c => c.id === parseInt(clienteId));
        const provTarget = proveedores.find(p => p.id === parseInt(proveedorId));
        const libradorFinal = chequeLibrador || cliTarget?.nombre || (tipo === 'egreso' ? 'Maneiro Climatización' : provTarget?.nombre) || concepto || 'Librador General';
        
        const esEntregaProveedor = tipo === 'egreso' || medioPago === 'Cheque Propio Emitido' || medioPago === 'Cheque Endosado';
        const estadoFinalCheque = esEntregaProveedor ? 'entregado_proveedor' : 'en_cartera';
        const destinoFinal = esEntregaProveedor ? (chequeDestino || provTarget?.nombre || concepto || 'Proveedor') : null;

        const entregadoPorFinal = chequeEntregadoPor || cliTarget?.nombre || (tipo === 'ingreso' ? 'Cliente' : 'Maneiro Climatización');

        await fetch('/api/cheques', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: tipo === 'ingreso' ? 'recibido' : 'emitido',
            numero: chequeNumero || `CHK-${Date.now().toString().slice(-6)}`,
            banco: chequeBanco || (tipo === 'egreso' ? 'Banco Galicia (Cuenta Empresa)' : 'Banco Emisor'),
            librador: libradorFinal,
            cuitLibrador: cliTarget?.cuit || provTarget?.cuit || null,
            entregadoPor: entregadoPorFinal,
            monto: montoCentavos,
            fechaEmision: chequeFechaEmision || fecha,
            fechaVencimiento: chequeFechaVencimiento,
            estado: estadoFinalCheque,
            destino: destinoFinal,
            observaciones: `Asiento #${concepto || ''} ${esEntregaProveedor ? `(Entregado a ${destinoFinal})` : `(Entregado por ${entregadoPorFinal})`}`,
          }),
        }).catch((err) => console.error('Error al registrar cheque:', err));
      }

      success(
        asientoAEditar 
          ? 'Asiento actualizado exitosamente' 
          : esCheque 
            ? 'Asiento y Cheque registrado en Cartera exitosamente (Vencimiento a 30 días)' 
            : 'Asiento registrado exitosamente'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Error al guardar asiento: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={asientoAEditar ? `Editar Asiento Contable #${asientoAEditar.id}` : '⚡ Registrar Asiento Contable'}
      size="md"
      footer={
        <div className="flex justify-between items-center w-full">
          <div>
            {asientoAEditar && onDelete && (
              <button
                type="button"
                className="btn btn-outline text-danger border-danger"
                onClick={() => {
                  onClose();
                  onDelete(asientoAEditar);
                }}
              >
                🗑️ Eliminar Asiento
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardarAsiento} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Asiento Contable'}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Tipo de Asiento *</label>
          <select className="form-select" value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
            <option value="egreso">🔴 EGRESO / PAGO (Debe)</option>
            <option value="ingreso">🟢 INGRESO / COBRO (Haber)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Moneda de la Operación *</label>
          <select className="form-select" value={moneda} onChange={(e) => setMoneda(e.target.value as any)}>
            <option value="ARS">🇦🇷 Pesos Argentinos (ARS)</option>
            <option value="USD">🇺🇸 Dólares Estadounidenses (USD)</option>
          </select>
        </div>

        {moneda === 'ARS' ? (
          <div className="form-group col-span-2">
            <label className="form-label">Monto Total en Pesos ($ ARS) *</label>
            <input type="number" className="form-input" placeholder="0" value={monto} onChange={(e) => setMonto(e.target.value)} autoFocus />
          </div>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Monto en Dólares (u$s USD) *</label>
              <input type="number" className="form-input" placeholder="0.00" value={montoUSD} onChange={(e) => setMontoUSD(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de Cambio Manual ($ / USD) *</label>
              <input type="number" className="form-input" placeholder="1250" value={cotizacionUSD} onChange={(e) => setCotizacionUSD(e.target.value)} />
            </div>
            <div className="col-span-2 bg-success-light border border-success p-2 rounded-md flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-success">
                💵 Equivalente a Asentar en Pesos (TC ${numCotiz.toLocaleString('es-AR')}):
              </span>
              <span className="font-bold text-lg text-success">
                ${equivalenteARS.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ARS
              </span>
            </div>
          </>
        )}

        {/* CLASIFICACIÓN DE TAXONOMÍA CONTABLE */}
        <div className="col-span-2 bg-surface-hover p-4 rounded-md border border-border mb-4">
          <span className="text-xs font-bold text-primary uppercase block mb-2">
            🏷️ Imputación & Taxonomía Contable
          </span>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">1. Grupo Contable (Balance) *</label>
              <select className="form-select" value={grupoSeleccionado} onChange={(e) => setGrupoSeleccionado(e.target.value)}>
                {gruposDisponibles.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">2. Cuenta Contable *</label>
              <select className="form-select" value={planCuenta} onChange={(e) => setPlanCuenta(e.target.value)}>
                {categoriasDelGrupo.map((t) => (
                  <option key={t.id} value={`${t.codigo} ${t.nombre}`}>
                    {t.codigo} {t.nombre}
                  </option>
                ))}
                {categoriasDelGrupo.length === 0 && (
                  <option value="3.5 Herramientas, Ferretería & Librería">3.5 Herramientas, Ferretería & Librería</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Proveedor u Orden/Cliente */}
        {tipo === 'egreso' ? (
          <div className="form-group col-span-2">
            <label className="form-label">Proveedor Vinculado (Opcional)</label>
            <select className="form-select" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
              <option value="">— Ningún Proveedor —</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.rubro || 'General'})</option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div className="form-group col-span-2">
              <label className="form-label">📑 Vincular a Orden Pendiente de Cobro (Opcional)</label>
              <select 
                className="form-select border-primary font-bold" 
                value={ordenId} 
                onChange={(e) => {
                  setOrdenId(e.target.value);
                  const selectedOrd = ordenesPendientes.find(o => o.id === parseInt(e.target.value));
                  if (selectedOrd) {
                    if (selectedOrd.clienteId) setClienteId(selectedOrd.clienteId.toString());
                    const cobrado = (selectedOrd.montoCobrado || 0) / 100;
                    const total = (selectedOrd.totalFinal || 0) / 100;
                    const rest = total - cobrado;
                    if (rest > 0 && !monto) {
                      setMonto(rest.toString());
                    }
                    if (!concepto) {
                      setConcepto(`Cobro Orden #${selectedOrd.numero} - ${selectedOrd.cliente?.nombre || ''}`);
                    }
                  }
                }}
              >
                <option value="">— Ninguna Orden (Ingreso Directo) —</option>
                {ordenesPendientes.map((o) => {
                  const cobrado = (o.montoCobrado || 0) / 100;
                  const total = (o.totalFinal || 0) / 100;
                  const rest = total - cobrado;
                  return (
                    <option key={o.id} value={o.id}>
                      Orden #{o.numero} — {o.cliente?.nombre || 'Sin cliente'} (Total: ${total.toLocaleString('es-AR')} | Pendiente: ${rest.toLocaleString('es-AR')})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Cliente Vinculado (Opcional)</label>
              <select className="form-select" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">— Ningún Cliente —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label">Medio de Pago / Caja</label>
          <select className="form-select" value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
            {moneda === 'USD' ? (
              <>
                <option value="Caja Dólares">💵 Caja Dólares</option>
                <option value="Banco (CC / Transferencia)">🏦 Banco (CC / Transferencia USD)</option>
              </>
            ) : (
              <>
                <option value="Caja Principal (Pesos)">💵 Caja Principal (Pesos)</option>
                <option value="Caja Chica (Pesos)">💵 Caja Chica (Pesos)</option>
                <option value="Banco (CC / Transferencia)">🏦 Banco (CC / Transferencia)</option>
                <option value="Mercado Pago">📱 Mercado Pago</option>
                <option value="Cheques en Cartera">📑 Cheque Recibido (Entra a Cartera)</option>
                <option value="Cheque Propio Emitido">✍️ Cheque Propio Emitido (Debito a Banco)</option>
                <option value="Cheque Endosado">🔄 Cheque en Cartera Endosado (Entregado a Proveedor)</option>
              </>
            )}
          </select>
        </div>

        {/* SUBPANEL REGISTRO CHEQUES EN CARTERA / EMITIDOS */}
        {(medioPago === 'Cheques en Cartera' || medioPago.toLowerCase().includes('cheque')) && (
          <div className="col-span-2 bg-blue-50/60 p-4 rounded-md border border-blue-200 mt-2 mb-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-info">📋 REGISTRO DE CHEQUE</span>
              <span className="text-xs font-bold text-muted">
                {medioPago === 'Cheque Propio Emitido' 
                  ? '✍️ Cheque Propio (Emitido a Proveedor - Débito Banco)' 
                  : medioPago === 'Cheque Endosado' 
                    ? '🔄 Cheque en Cartera Endosado (Entregado a Tercero)' 
                    : '🟢 Cheque Recibido de Cliente (Entra a Cartera de Cheques)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group mb-0">
                <label className="form-label text-xs font-bold">N° de Cheque *</label>
                <input
                  type="text"
                  placeholder="Ej: 00482910"
                  className="form-input text-xs"
                  value={chequeNumero}
                  onChange={(e) => setChequeNumero(e.target.value)}
                />
              </div>



              {medioPago === 'Cheque Propio Emitido' || tipo === 'egreso' ? (
                <>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs font-bold text-primary">🏢 Empresa Emisora del Cheque *</label>
                    <select
                      className="form-select text-xs font-bold border-primary"
                      value={empresaEmisoraId}
                      onChange={(e) => {
                        const idStr = e.target.value;
                        setEmpresaEmisoraId(idStr);
                        const emp = empresas.find((x) => x.id === parseInt(idStr));
                        if (emp) {
                          setChequeLibrador(emp.razonSocial);
                          if (emp.cuentasBancarias && emp.cuentasBancarias.length > 0) {
                            const c = emp.cuentasBancarias[0];
                            setChequeBanco(`${c.banco} - ${c.tipoCuenta} (${c.numeroCuenta || c.alias || 'S/N'})`);
                          } else {
                            setChequeBanco('');
                          }
                        }
                      }}
                    >
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.razonSocial} (CUIT {emp.cuit || 'S/C'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group mb-0">
                    <label className="form-label text-xs font-bold text-primary">🏦 Banco / Cuenta Bancaria de la Empresa *</label>
                    <select
                      className="form-select text-xs font-bold border-primary"
                      value={chequeBanco}
                      onChange={(e) => setChequeBanco(e.target.value)}
                    >
                      {(() => {
                        const emp = empresas.find((x) => x.id === parseInt(empresaEmisoraId)) || empresas[0];
                        const cuentas = emp?.cuentasBancarias || [];
                        if (cuentas.length === 0) return <option value="">⚠️ Sin cuentas cargadas para esta empresa</option>;
                        return cuentas.map((c: any) => {
                          const val = `${c.banco} - ${c.tipoCuenta} (${c.numeroCuenta || c.alias || 'S/N'})`;
                          return <option key={c.id} value={val}>{val} [{c.moneda}]</option>;
                        });
                      })()}
                    </select>
                  </div>

                  <div className="form-group mb-0">
                    <label className="form-label text-xs font-bold">Librador / Firmante *</label>
                    <input
                      type="text"
                      className="form-input text-xs font-bold bg-slate-50"
                      value={chequeLibrador}
                      readOnly
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs font-bold">Banco Emisor del Cheque *</label>
                    <input
                      type="text"
                      placeholder="Ej: Banco Galicia / Banco Nación"
                      className="form-input text-xs"
                      value={chequeBanco}
                      onChange={(e) => setChequeBanco(e.target.value)}
                    />
                  </div>

                  <div className="form-group mb-0">
                    <label className="form-label text-xs font-bold">Librador / Titular Firmante *</label>
                    <input
                      type="text"
                      placeholder="Ej: Razón Social o Nombre del firmante"
                      className="form-input text-xs"
                      value={chequeLibrador}
                      onChange={(e) => setChequeLibrador(e.target.value)}
                    />
                  </div>
                </>
              )}

              {tipo === 'ingreso' ? (
                <div className="form-group mb-0">
                  <label className="form-label text-xs font-bold text-success">
                    👤 Entregado por (Cliente del Padrón) *
                  </label>
                  <select
                    className="form-select text-xs font-bold border-success"
                    value={chequeEntregadoPor}
                    onChange={(e) => setChequeEntregadoPor(e.target.value)}
                  >
                    <option value="">— Seleccionar Cliente del Padrón —</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.nombre}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group mb-0">
                  <label className="form-label text-xs font-bold text-warning-dark">
                    🤝 Entregado a / Destino (Proveedor del Padrón) *
                  </label>
                  <select
                    className="form-select text-xs font-bold border-warning"
                    value={chequeDestino}
                    onChange={(e) => setChequeDestino(e.target.value)}
                  >
                    <option value="">— Seleccionar Proveedor del Padrón —</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.nombre}>{p.nombre} ({p.rubro || 'General'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group mb-0">
                <label className="form-label text-xs font-bold">
                  {medioPago === 'Cheque Propio Emitido' || (tipo === 'egreso' && medioPago !== 'Cheque Endosado')
                    ? '📅 Fecha de Pago (Débito en Banco) *'
                    : '📅 Fecha del Cheque / Emisión *'}
                </label>
                <input
                  type="date"
                  className="form-input text-xs font-bold"
                  value={chequeFechaEmision}
                  onChange={(e) => {
                    const nuevaFechaEmision = e.target.value;
                    setChequeFechaEmision(nuevaFechaEmision);
                    if (nuevaFechaEmision) {
                      const esEmitidoPropio = medioPago === 'Cheque Propio Emitido' || (tipo === 'egreso' && medioPago !== 'Cheque Endosado');
                      if (esEmitidoPropio) {
                        // Cheques emitidos propios: la fecha del cheque ES la fecha de cobro/cobertura en banco (NO aplica +30 días)
                        setChequeFechaVencimiento(nuevaFechaEmision);
                      } else {
                        // Cheques recibidos en cartera: aplica regla de 30 días legales de vencimiento
                        const d = new Date(nuevaFechaEmision);
                        d.setDate(d.getDate() + 30);
                        setChequeFechaVencimiento(d.toISOString().split('T')[0]);
                      }
                    }
                  }}
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label text-xs font-bold text-primary">
                  {medioPago === 'Cheque Propio Emitido' || (tipo === 'egreso' && medioPago !== 'Cheque Endosado')
                    ? '⏰ Fecha Cobertura Banco *'
                    : '⏰ Vencimiento Cartera (+30 días) *'}
                </label>
                <input
                  type="date"
                  className="form-input text-xs font-bold text-primary"
                  value={chequeFechaVencimiento}
                  onChange={(e) => setChequeFechaVencimiento(e.target.value)}
                />
              </div>

              <div className="col-span-2 bg-white p-2.5 rounded border border-blue-200 text-xs">
                <p className="text-muted mb-0">
                  {medioPago === 'Cheque Propio Emitido' || (tipo === 'egreso' && medioPago !== 'Cheque Endosado')
                    ? '💡 Cheques Emitidos Propios: La fecha seleccionada en el cheque es el día exacto en que la empresa debe disponer del saldo en el banco para cubrirlo.'
                    : '💡 Cheques Recibidos en Cartera: Se aplica automáticamente la ventana de 30 días legales desde la fecha del cheque para depositarlo o cobrarlo.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Fecha del Asiento</label>
          <input type="date" className="form-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>

        <div className="form-group col-span-2">
          <label className="form-label">3. Concepto / Detalle de la Operación *</label>
          <input type="text" className="form-input" placeholder="Ej: Service camioneta Fiat Strada en Taller Central..." value={concepto} onChange={(e) => setConcepto(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
