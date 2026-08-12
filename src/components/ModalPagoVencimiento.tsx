'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/lib/utils';
import { vencimientoService } from '@/services/vencimientoService';

type ModalPagoVencimientoProps = {
  vencimiento: any | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ModalPagoVencimiento({ vencimiento, onClose, onSuccess }: ModalPagoVencimientoProps) {
  const [cajas, setCajas] = useState<any[]>([]);
  const [cajaId, setCajaId] = useState<string>('');
  const [generarAsiento, setGenerarAsiento] = useState<boolean>(true);
  const [planCuenta, setPlanCuenta] = useState<string>('3.3 Servicios & Alquileres');
  const [saving, setSaving] = useState<boolean>(false);

  const { success, error, warning } = useToast();

  useEffect(() => {
    if (!vencimiento) return;
    const fetchCajas = async () => {
      try {
        const res = await fetch('/api/cajas');
        if (res.ok) {
          const list = await res.json();
          const arr = Array.isArray(list) ? list : (list.data || list.cajas || []);
          setCajas(arr);
          if (arr.length > 0) setCajaId(arr[0].id.toString());
        }
      } catch {
        // ignore
      }
    };
    fetchCajas();

    // Auto select plan de cuenta segun el nombre del servicio
    const servUpper = (vencimiento.servicio || '').toUpperCase();
    if (servUpper.includes('AFIP') || servUpper.includes('ARBA') || servUpper.includes('IMPUESTO') || servUpper.includes('TASA')) {
      setPlanCuenta('4.1 Impuestos Nacionales & Provinciales (AFIP/ARBA)');
    } else {
      setPlanCuenta('3.3 Servicios & Alquileres');
    }
  }, [vencimiento]);

  if (!vencimiento) return null;

  const handlePagar = async () => {
    setSaving(true);
    try {
      // 1. Marcar vencimiento como pagado
      await vencimientoService.actualizarVencimiento(vencimiento.id, {
        pagado: true,
        fechaPago: new Date(),
      });

      // 2. Si generamos asiento, llamar a /api/finanzas
      if (generarAsiento) {
        const payloadAsiento = {
          tipo: 'egreso',
          grupo: planCuenta.startsWith('4') ? '4. IMPUESTOS & SEGUROS' : '3. GASTOS ESTRUCTURALES',
          planCuenta,
          moneda: 'ARS',
          monto: vencimiento.monto,
          medioPago: 'Efectivo',
          fecha: new Date().toISOString().split('T')[0],
          concepto: `Pago de Servicio / Vencimiento: ${vencimiento.servicio}`,
          cajaId: cajaId ? parseInt(cajaId) : undefined,
        };

        await fetch('/api/finanzas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadAsiento),
        });
      }

      success('Vencimiento pagado y registrado exitosamente');
      onSuccess();
      onClose();
    } catch {
      error('Error al registrar el pago del vencimiento');
    } finally {
      setSaving(false);
    }
  };

  const listaCajas = Array.isArray(cajas) ? cajas : [];

  return (
    <Modal
      isOpen={!!vencimiento}
      onClose={onClose}
      title={`✓ Confirmar Pago de: ${vencimiento.servicio}`}
      size="md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-success" onClick={handlePagar} disabled={saving}>
            {saving ? 'Registrando...' : '✓ Confirmar Pago'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="bg-surface-hover p-4 rounded-md border border-border flex justify-between items-center">
          <div>
            <span className="text-xs text-muted block font-bold">MONTO A PAGAR</span>
            <span className="text-2xl font-bold text-danger">{formatMoney(vencimiento.monto)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted block font-bold">FECHA LÍMITE</span>
            <span className="text-sm font-bold text-primary">
              {new Date(vencimiento.fechaVencimiento).toLocaleDateString('es-AR')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="chkAsiento"
            checked={generarAsiento}
            onChange={(e) => setGenerarAsiento(e.target.checked)}
            className="w-4 h-4 text-primary rounded border-border"
          />
          <label htmlFor="chkAsiento" className="text-sm font-semibold text-primary cursor-pointer select-none">
            Generar automáticamente el Asiento Contable de Egreso
          </label>
        </div>

        {generarAsiento && (
          <div className="bg-surface p-4 border border-border rounded-md flex flex-col gap-3">
            <div className="form-group">
              <label className="form-label">Caja Pagadora (Salida de fondos)</label>
              <select className="form-select" value={cajaId} onChange={(e) => setCajaId(e.target.value)}>
                {listaCajas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cuenta Contable Imputada</label>
              <select className="form-select" value={planCuenta} onChange={(e) => setPlanCuenta(e.target.value)}>
                <option value="3.3 Servicios & Alquileres">3.3 Servicios & Alquileres (Edes, Camuzzi, Teléfono, etc.)</option>
                <option value="4.1 Impuestos Nacionales & Provinciales (AFIP/ARBA)">4.1 Impuestos Nacionales & Provinciales (AFIP / ARBA)</option>
                <option value="3.4 Seguros & Tasas Municipales">3.4 Seguros & Tasas Municipales</option>
                <option value="3.5 Herramientas, Ferretería & Librería">3.5 Herramientas, Ferretería & Librería</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
