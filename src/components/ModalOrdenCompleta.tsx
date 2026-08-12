'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatMoney, parseNum, centsToPesos } from '@/lib/utils';

type EmpleadoDB = { id: number; nombre: string; sueldo: number; margenHora: number; margenDia: number };
type EmpleadoCalculado = { id: number; nombre: string; sueldo: number; ventaHora: number; ventaDia: number };
type DireccionDB = { id: number; nombre: string; direccion: string; ciudad: string; km: number };
type ClienteDB = { id: number; nombre: string; cuit: string; condIva: string; telefono?: string; email?: string; direcciones: DireccionDB[] };
type OrdenDB = {
  id: number; numero: string; tipo: string; descripcion: string; estado: string;
  clienteId?: number; direccionId?: number; proveedorId?: number;
  montoAnticipo?: number; anticipoCobrado?: boolean;
  totalSinIva: number; ivaMontoMonto: number; totalFinal: number; createdAt: string;
  fechaInicioGarantia?: string; fechaFinGarantia?: string;
  cliente?: ClienteDB; proveedor?: { id: number; nombre: string }; direccion?: DireccionDB;
  lineasManoObra: any[]; lineasRepuesto: any[]; lineasOtroCosto: any[]; viatico?: any;
};

type HoraEmpleado = { empleadoId: number; horas: string; modalidad: 'hora' | 'dia' };
type Repuesto = { equipoItemId?: string; descripcion: string; cantidad: string; costoUnitario: string; precioVentaUnitario: string };
type OtroCosto = { descripcion: string; monto: string };

type ModalOrdenCompletaProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingOrden?: OrdenDB | null;
};

const DIAS_LABORABLES = 22;
const HORAS_DIA = 7;

function LineaR({ label, v, muted }: { label: string; v: number; muted?: boolean }) {
  if (!v) return null;
  return (
    <div className={`flex justify-between ${muted ? 'text-muted' : ''}`}>
      <span>{label}</span>
      <span className="font-bold">{formatMoney(v * 100)}</span>
    </div>
  );
}

export default function ModalOrdenCompleta({
  isOpen,
  onClose,
  onSuccess,
  editingOrden = null,
}: ModalOrdenCompletaProps) {
  const [clientes, setClientes] = useState<ClienteDB[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoCalculado[]>([]);

  // Valores de configuración están en centavos en la base de datos, así que los convertimos a pesos para la UI
  const [viaticoFijo, setViaticoFijo] = useState(5000);
  const [viaticoPorKm, setViaticoPorKm] = useState(600);
  const [ivaPorcentaje, setIvaPorcentaje] = useState(21);

  const [tipoOrden, setTipoOrden] = useState<'service' | 'instalacion' | 'venta' | 'puesta_en_marcha'>('service');
  const [clienteId, setClienteId] = useState('');
  const [direccionId, setDireccionId] = useState('');
  const [km, setKm] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicioGarantia, setFechaInicioGarantia] = useState('');
  const [fechaFinGarantia, setFechaFinGarantia] = useState('');
  const [inventarioItems, setInventarioItems] = useState<any[]>([]);
  const [horasEmpleados, setHorasEmpleados] = useState<HoraEmpleado[]>([]);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([{ equipoItemId: '', descripcion: '', cantidad: '1', costoUnitario: '', precioVentaUnitario: '' }]);
  const [otrosCostos, setOtrosCostos] = useState<OtroCosto[]>([]);
  const [viandas, setViandas] = useState('');
  const [montoAnticipo, setMontoAnticipo] = useState('');
  const [saving, setSaving] = useState(false);

  const { success, error, warning } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const cargarAuxiliares = async () => {
      try {
        const [resCli, resEmp, resCfg, resInv] = await Promise.all([
          fetch('/api/clientes'),
          fetch('/api/empleados'),
          fetch('/api/configuracion'),
          fetch('/api/inventario'),
        ]);
        if (resInv.ok) {
          const inv = await resInv.json();
          setInventarioItems(inv.data || inv || []);
        }
        if (resCli.ok) {
          const cli = await resCli.json();
          setClientes(cli.data || cli || []);
        }
        if (resEmp.ok) {
          const empRes = await resEmp.json();
          const empDB: EmpleadoDB[] = empRes.data || empRes || [];
          const empCalc: EmpleadoCalculado[] = empDB.map((e) => {
            const sueldoPesos = centsToPesos(e.sueldo);
            const costoHora = sueldoPesos / (DIAS_LABORABLES * HORAS_DIA);
            const costoDia = sueldoPesos / DIAS_LABORABLES;
            return {
              id: e.id,
              nombre: e.nombre,
              sueldo: e.sueldo,
              ventaHora: Math.round(costoHora * (1 + (e.margenHora || 0) / 100)),
              ventaDia: Math.round(costoDia * (1 + (e.margenDia || 0) / 100)),
            };
          });
          setEmpleados(empCalc);
        }
        if (resCfg.ok) {
          const cfg = await resCfg.json();
          if (cfg.viatico) {
            setViaticoFijo(centsToPesos(cfg.viatico.costoFijoBase || 5000));
            setViaticoPorKm(centsToPesos((cfg.viatico.precioCombustible || 1200) * (cfg.viatico.litrosPorKm || 0.5)));
          }
          if (cfg.impuesto) {
            setIvaPorcentaje(cfg.impuesto.ivaPorcentaje || 21);
          }
        }
      } catch (err) {
        error('Error al cargar datos auxiliares para orden');
      }
    };

    cargarAuxiliares();

    if (editingOrden) {
      setTipoOrden(editingOrden.tipo as any || 'service');
      const cid = editingOrden.clienteId || editingOrden.cliente?.id;
      setClienteId(cid ? cid.toString() : '');
      const did = editingOrden.direccionId || editingOrden.direccion?.id;
      setDireccionId(did ? did.toString() : '');
      setDescripcion(editingOrden.descripcion || '');
      setFechaInicioGarantia(editingOrden.fechaInicioGarantia ? new Date(editingOrden.fechaInicioGarantia).toISOString().split('T')[0] : '');
      setFechaFinGarantia(editingOrden.fechaFinGarantia ? new Date(editingOrden.fechaFinGarantia).toISOString().split('T')[0] : '');
      setMontoAnticipo(editingOrden.montoAnticipo ? centsToPesos(editingOrden.montoAnticipo).toString() : '');

      if (editingOrden.viatico) {
        setKm(editingOrden.viatico.km ? editingOrden.viatico.km.toString() : '');
        setViandas(editingOrden.viatico.viandas ? centsToPesos(editingOrden.viatico.viandas).toString() : '');
      } else {
        setKm('');
        setViandas('');
      }

      if (editingOrden.lineasManoObra && editingOrden.lineasManoObra.length > 0) {
        setHorasEmpleados(
          editingOrden.lineasManoObra.map((l: any) => ({
            empleadoId: l.empleadoId,
            horas: (l.horas || l.dias || l.cantidad || 0).toString(),
            modalidad: l.modalidad || 'hora',
          }))
        );
      } else {
        setHorasEmpleados([]);
      }

      if (editingOrden.lineasRepuesto && editingOrden.lineasRepuesto.length > 0) {
        setRepuestos(editingOrden.lineasRepuesto.map((r: any) => ({
          equipoItemId: r.equipoItemId ? r.equipoItemId.toString() : '',
          descripcion: r.descripcion,
          cantidad: (r.cantidad || 1).toString(),
          costoUnitario: centsToPesos(r.costoUnitario || r.costo || 0).toString(),
          precioVentaUnitario: centsToPesos(r.precioVentaUnitario || r.subtotal || r.costo || 0).toString(),
        })));
      } else {
        setRepuestos([{ equipoItemId: '', descripcion: '', cantidad: '1', costoUnitario: '', precioVentaUnitario: '' }]);
      }

      if (editingOrden.lineasOtroCosto && editingOrden.lineasOtroCosto.length > 0) {
        setOtrosCostos(editingOrden.lineasOtroCosto.map((o: any) => ({ descripcion: o.descripcion, monto: centsToPesos(o.monto).toString() })));
      } else {
        setOtrosCostos([]);
      }
    } else {
      setTipoOrden('service');
      setClienteId('');
      setDireccionId('');
      setKm('');
      setDescripcion('');
      setFechaInicioGarantia('');
      setFechaFinGarantia('');
      setHorasEmpleados([]);
      setRepuestos([{ equipoItemId: '', descripcion: '', cantidad: '1', costoUnitario: '', precioVentaUnitario: '' }]);
      setOtrosCostos([]);
      setViandas('');
      setMontoAnticipo('');
    }
  }, [isOpen, editingOrden, error]);

  const clienteSeleccionado = clientes.find((c) => c.id === parseInt(clienteId));

  const handleSelectCliente = (id: string) => {
    setClienteId(id);
    const cli = clientes.find((c) => c.id === parseInt(id));
    if (cli && cli.direcciones && cli.direcciones.length > 0) {
      setDireccionId(cli.direcciones[0].id.toString());
      setKm(cli.direcciones[0].km ? cli.direcciones[0].km.toString() : '');
    } else {
      setDireccionId('');
      setKm('');
    }
  };

  const addHoraEmpleado = () => {
    const primerId = empleados.length > 0 ? empleados[0].id : 0;
    setHorasEmpleados((prev) => [...prev, { empleadoId: primerId, horas: '1', modalidad: 'hora' }]);
  };

  const updateHoraEmpleado = (index: number, field: keyof HoraEmpleado, value: any) => {
    setHorasEmpleados((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: field === 'empleadoId' ? parseInt(value) || 0 : value } : h))
    );
  };

  const removeHoraEmpleado = (index: number) => {
    setHorasEmpleados((prev) => prev.filter((_, i) => i !== index));
  };

  const addRepuesto = () => {
    setRepuestos([...repuestos, { equipoItemId: '', descripcion: '', cantidad: '1', costoUnitario: '', precioVentaUnitario: '' }]);
  };

  const updateRepuesto = (i: number, key: keyof Repuesto, val: string) => {
    const copy = [...repuestos];
    copy[i][key] = val as any;
    setRepuestos(copy);
  };

  const seleccionarMaterialStock = (i: number, itemIdStr: string) => {
    const copy = [...repuestos];
    if (!itemIdStr) {
      copy[i] = { equipoItemId: '', descripcion: '', cantidad: '1', costoUnitario: '', precioVentaUnitario: '' };
    } else {
      const item = inventarioItems.find(x => x.id === parseInt(itemIdStr));
      if (item) {
        copy[i] = {
          equipoItemId: item.id.toString(),
          descripcion: item.nombre,
          cantidad: copy[i].cantidad || '1',
          costoUnitario: (centsToPesos(item.precioCompra)).toString(),
          precioVentaUnitario: (centsToPesos(item.precioVentaSugerido || item.precioCompra)).toString(),
        };
      }
    }
    setRepuestos(copy);
  };

  const removeRepuesto = (i: number) => {
    setRepuestos(repuestos.filter((_, index) => index !== i));
  };

  const addOtroCosto = () => setOtrosCostos((prev) => [...prev, { descripcion: '', monto: '' }]);
  const updateOtroCosto = (index: number, field: keyof OtroCosto, value: string) => {
    setOtrosCostos((prev) => prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)));
  };
  const removeOtroCosto = (index: number) => setOtrosCostos((prev) => prev.filter((_, i) => i !== index));

  // Totales (calculados en pesos)
  const costoManoObra = tipoOrden === 'venta' ? 0 : horasEmpleados.reduce((acc, h) => {
    const emp = empleados.find((e) => e.id === h.empleadoId);
    if (!emp) return acc;
    const precio = h.modalidad === 'hora' ? emp.ventaHora : emp.ventaDia;
    return acc + precio * (parseFloat(h.horas) || 0);
  }, 0);

  const numKm = parseFloat(km) || 0;
  const costoViatico = tipoOrden === 'venta' || numKm === 0 ? 0 : viaticoFijo + numKm * viaticoPorKm;
  const costoViandas = parseFloat(viandas) || 0;

  const costoRepuestos = repuestos.reduce((acc, r) => {
    const cant = parseFloat(r.cantidad || '1') || 1;
    const precioVenta = parseFloat(r.precioVentaUnitario || '0') || 0;
    return acc + (precioVenta * cant);
  }, 0);
  const costoOtros = otrosCostos.reduce((acc, o) => acc + (parseFloat(o.monto) || 0), 0);

  const totalSinIva = costoManoObra + costoViatico + costoViandas + costoRepuestos + costoOtros;
  const iva = Math.round(totalSinIva * (ivaPorcentaje / 100));
  const totalFinal = totalSinIva + iva;

  const guardarOrden = async (estadoDestino: string) => {
    if (!clienteId) {
      warning('Seleccioná un cliente.');
      return;
    }
    if (!descripcion.trim()) {
      warning('La descripción es obligatoria.');
      return;
    }

    setSaving(true);
    try {
      // Todo se convierte a centavos para la BD
      const payload = {
        tipo: tipoOrden,
        clienteId: parseInt(clienteId),
        direccionId: direccionId ? parseInt(direccionId) : null,
        descripcion,
        estado: estadoDestino,
        montoAnticipo: montoAnticipo ? parseNum(montoAnticipo) : null,
        fechaInicioGarantia: fechaInicioGarantia || null,
        fechaFinGarantia: fechaFinGarantia || null,
        totalSinIva: parseNum(totalSinIva),
        ivaMontoMonto: parseNum(iva),
        totalFinal: parseNum(totalFinal),
        viatico: tipoOrden !== 'venta' && numKm > 0 ? { 
          km: numKm, 
          viandas: parseNum(costoViandas), 
          total: parseNum(costoViatico + costoViandas),
          costoFijo: parseNum(viaticoFijo),
          costoPorKm: parseNum(viaticoPorKm)
        } : null,
        horasEmpleados: tipoOrden !== 'venta' ? horasEmpleados.filter((h) => parseFloat(h.horas) > 0).map(h => {
           const emp = empleados.find(e => e.id === h.empleadoId);
           const pUnit = h.modalidad === 'hora' ? emp?.ventaHora || 0 : emp?.ventaDia || 0;
           const cant = parseFloat(h.horas);
           
           // Costo real interno basado en sueldo
           const sueldoRealPesos = emp ? centsToPesos(emp.sueldo) : 0;
           const costoRealHora = sueldoRealPesos / (DIAS_LABORABLES * HORAS_DIA);
           const costoRealDia = sueldoRealPesos / DIAS_LABORABLES;
           const costoUnitReal = h.modalidad === 'hora' ? costoRealHora : costoRealDia;

           return {
             empleadoId: h.empleadoId,
             empleadoNombre: emp?.nombre || 'Empleado',
             modalidad: h.modalidad,
             cantidad: cant,
             costoUnitario: parseNum(costoUnitReal),
             precioUnitario: parseNum(pUnit),
             costoTotal: Math.round(parseNum(costoUnitReal) * cant),
             subtotal: Math.round(parseNum(pUnit) * cant)
           };
        }) : [],
        repuestos: repuestos.filter((r) => r.descripcion.trim()).map(r => {
          const cant = parseFloat(r.cantidad || '1');
          const costUnit = parseNum(r.costoUnitario || '0');
          const pVentaUnit = parseNum(r.precioVentaUnitario || '0');

          return {
            equipoItemId: r.equipoItemId ? parseInt(r.equipoItemId) : null,
            descripcion: r.descripcion,
            cantidad: cant,
            costoUnitario: costUnit,
            precioVentaUnitario: pVentaUnit,
            costo: Math.round(costUnit * cant),
            subtotal: Math.round(pVentaUnit * cant)
          };
        }),
        otrosCostos: otrosCostos.filter((o) => o.descripcion.trim() && parseFloat(o.monto) > 0).map(o => ({
          descripcion: o.descripcion,
          monto: parseNum(o.monto)
        })),
      };

      const url = editingOrden ? `/api/ordenes/${editingOrden.id}` : '/api/ordenes';
      const method = editingOrden ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      success(editingOrden ? 'Orden actualizada exitosamente' : 'Orden creada exitosamente');
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Error al guardar orden: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-2 w-full flex-wrap">
      <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>

      {editingOrden ? (
        <>
          {editingOrden.estado === 'presupuesto' && (
            <button
              className="btn btn-outline text-warning border-warning"
              onClick={() => guardarOrden('pendiente_anticipo')}
              disabled={saving}
            >⏳ {saving ? '...' : 'Solicitar Anticipo / Seña'}</button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => guardarOrden(editingOrden.estado || 'en_ejecucion')}
            disabled={saving}
          >💾 {saving ? 'Guardando...' : 'Guardar Cambios'}</button>
        </>
      ) : (
        <>
          <button
            className="btn btn-outline text-primary border-primary"
            onClick={() => guardarOrden('presupuesto')}
            disabled={saving}
          >📋 {saving ? '...' : 'Guardar Presupuesto'}</button>
          <button
            className="btn btn-outline text-warning border-warning"
            onClick={() => guardarOrden('pendiente_anticipo')}
            disabled={saving}
          >⏳ {saving ? '...' : 'Solicitar Anticipo / Seña'}</button>
          <button
            className="btn btn-primary"
            onClick={() => guardarOrden('en_ejecucion')}
            disabled={saving}
          >🚀 {saving ? 'Guardando...' : 'Crear e Iniciar Servicio'}</button>
        </>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingOrden ? `Editar Orden #${editingOrden.numero}` : '⚡ Nueva Orden / Presupuesto'}
      size="lg"
      footer={footer}
    >
      <div className="flex-col gap-4">
        {/* Tipo */}
        <div className="flex gap-2 mb-4">
          {(['service', 'instalacion', 'venta', 'puesta_en_marcha'] as const).map((val) => (
            <button key={val} type="button" onClick={() => setTipoOrden(val)} className={`flex-1 p-2 rounded-md font-bold text-sm border-2 transition-colors ${tipoOrden === val ? 'border-primary bg-primary-light text-primary' : 'border-border bg-transparent text-muted'}`}>
              {val === 'service' ? '🔧 Service' : val === 'instalacion' ? '🏗️ Instalación' : val === 'venta' ? '📦 Venta' : '⚡ Puesta en Marcha'}
            </button>
          ))}
        </div>

        {/* Cliente + Dirección */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="form-group">
            <label className="form-label">Cliente *</label>
            <select className="form-select" value={clienteId} onChange={(e) => handleSelectCliente(e.target.value)}>
              <option value="">— Seleccionar Cliente —</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Dirección / Propiedad</label>
            <select className="form-select" value={direccionId} onChange={(e) => setDireccionId(e.target.value)} disabled={!clienteId}>
              <option value="">— Seleccionar —</option>
              {clienteSeleccionado?.direcciones?.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre} ({d.km} km)</option>
              ))}
            </select>
          </div>

          <div className="form-group col-span-2">
            <label className="form-label">Descripción del Trabajo / Servicio *</label>
            <textarea className="form-textarea" rows={2} placeholder="Ej: Reparación caldera por falta de encendido..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">💰 Monto Anticipo / Seña ($)</label>
            <input type="number" className="form-input" placeholder="Ej: 50000" value={montoAnticipo} onChange={(e) => setMontoAnticipo(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">🛡️ Fin de Cobertura Garantía</label>
            <input type="date" className="form-input" value={fechaFinGarantia} onChange={(e) => setFechaFinGarantia(e.target.value)} />
          </div>
        </div>

        <hr className="border-t border-border my-4" />

        {/* Mano de Obra */}
        {tipoOrden !== 'venta' && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="font-bold text-primary text-sm">🧑‍🔧 Mano de Obra (Asignación Interna)</label>
              <button type="button" className="btn btn-outline btn-sm" onClick={addHoraEmpleado}>+ Empleado</button>
            </div>
            <div className="flex flex-col gap-2">
              {horasEmpleados.map((h, i) => {
                const emp = empleados.find((e) => e.id === h.empleadoId);
                const sub = emp ? (h.modalidad === 'hora' ? emp.ventaHora : emp.ventaDia) * (parseFloat(h.horas) || 0) : 0;
                return (
                  <div key={i} className="grid grid-cols-4 gap-2 items-center">
                    <select className="form-select" value={h.empleadoId} onChange={(e) => updateHoraEmpleado(i, 'empleadoId', e.target.value)}>
                      {empleados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                    <select className="form-select" value={h.modalidad} onChange={(e) => updateHoraEmpleado(i, 'modalidad', e.target.value)}>
                      <option value="hora">Por Hora</option>
                      <option value="dia">Por Día</option>
                    </select>
                    <div className="relative">
                      <input type="number" min="0" step="0.5" placeholder={h.modalidad === 'hora' ? 'Hs' : 'Días'} className="form-input" value={h.horas} onChange={(e) => updateHoraEmpleado(i, 'horas', e.target.value)} />
                      {sub > 0 && <span className="absolute -bottom-4 left-0 text-xs text-primary whitespace-nowrap">${sub.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>}
                    </div>
                    <button type="button" onClick={() => removeHoraEmpleado(i)} className="btn btn-ghost text-danger text-lg p-0 h-auto self-start mt-1">×</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Viáticos */}
        {tipoOrden !== 'venta' && (
          <div className="mb-4">
            <label className="font-bold text-primary text-sm block mb-2">🚐 Viáticos & Traslado</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Kilómetros de ida</label>
                <input type="number" className="form-input" placeholder="Ej: 45" value={km} onChange={(e) => setKm(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Viandas / Comidas ($)</label>
                <input type="number" className="form-input" placeholder="0" value={viandas} onChange={(e) => setViandas(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <hr className="border-t border-border my-4" />

        {/* Materiales & Repuestos */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="font-bold text-primary text-sm">🔩 Materiales & Repuestos</label>
            <button type="button" className="btn btn-outline btn-sm" onClick={addRepuesto}>+ Ítem</button>
          </div>
          <div className="flex flex-col gap-3">
            {repuestos.map((r, i) => (
              <div key={i} className="bg-surface-hover p-3 rounded-md border border-border flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <select 
                    className="form-select flex-1 font-bold text-sm"
                    value={r.equipoItemId || ''}
                    onChange={(e) => seleccionarMaterialStock(i, e.target.value)}
                  >
                    <option value="">— Material fuera de stock / Entrada manual —</option>
                    {inventarioItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        📦 {item.nombre} (Stock: {item.stock}) — Costo: ${centsToPesos(item.precioCompra).toLocaleString('es-AR')} | Venta: ${centsToPesos(item.precioVentaSugerido || item.precioCompra).toLocaleString('es-AR')}
                      </option>
                    ))}
                  </select>
                  {repuestos.length > 1 && (
                    <button type="button" onClick={() => removeRepuesto(i)} className="btn btn-ghost text-danger text-lg p-1">×</button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted block mb-1">Descripción</label>
                    <input type="text" placeholder="Descripción del material" className="form-input" value={r.descripcion} onChange={(e) => updateRepuesto(i, 'descripcion', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-1">Cant. Consumida</label>
                    <input type="number" min="0.5" step="0.5" placeholder="1" className="form-input" value={r.cantidad} onChange={(e) => updateRepuesto(i, 'cantidad', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-1">$ Precio Venta Unit. (Cliente)</label>
                    <input type="number" placeholder="$ Venta Unitario" className="form-input" value={r.precioVentaUnitario} onChange={(e) => updateRepuesto(i, 'precioVentaUnitario', e.target.value)} />
                  </div>
                </div>
                <div className="text-xs text-muted flex justify-between px-1">
                  <span>Costo Compra Unit: <strong>${parseFloat(r.costoUnitario || '0').toLocaleString('es-AR')}</strong></span>
                  <span className="text-primary font-bold">Subtotal Venta: ${((parseFloat(r.precioVentaUnitario || '0') || 0) * (parseFloat(r.cantidad || '1') || 1)).toLocaleString('es-AR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Otros Costos */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="font-bold text-primary text-sm">📋 Otros Costos</label>
            <button type="button" className="btn btn-outline btn-sm" onClick={addOtroCosto}>+ Agregar</button>
          </div>
          <div className="flex flex-col gap-2">
            {otrosCostos.map((o, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" placeholder="Ej: Grúa, tercerización..." className="form-input flex-1" value={o.descripcion} onChange={(e) => updateOtroCosto(i, 'descripcion', e.target.value)} />
                <input type="number" placeholder="$ Monto" className="form-input w-24" value={o.monto} onChange={(e) => updateOtroCosto(i, 'monto', e.target.value)} />
                <button type="button" onClick={() => removeOtroCosto(i)} className="btn btn-ghost text-danger text-lg p-1">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen */}
        <div className="bg-surface-hover rounded-md p-4 border border-border">
          <p className="font-bold text-sm text-primary mb-2">📊 Resumen del Presupuesto</p>
          <div className="flex flex-col gap-2 text-sm">
            {tipoOrden !== 'venta' && <LineaR label="Mano de obra" v={costoManoObra} />}
            {tipoOrden !== 'venta' && numKm > 0 && <LineaR label={`Viáticos (${numKm} km)`} v={costoViatico} />}
            {costoViandas > 0 && <LineaR label="Viandas" v={costoViandas} />}
            {costoRepuestos > 0 && <LineaR label="Materiales & Repuestos" v={costoRepuestos} />}
            {costoOtros > 0 && <LineaR label="Otros costos" v={costoOtros} />}
            <hr className="border-t border-dashed border-muted my-1" />
            <LineaR label="Subtotal (sin IVA)" v={totalSinIva} />
            <LineaR label={`IVA ${ivaPorcentaje}%`} v={iva} muted />
            <div className="flex justify-between mt-2">
              <span className="font-bold text-base text-primary">TOTAL</span>
              <span className="font-bold text-lg text-primary">
                {formatMoney(totalFinal * 100)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
