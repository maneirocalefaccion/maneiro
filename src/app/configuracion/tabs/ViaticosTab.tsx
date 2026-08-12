'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/lib/utils';
import { configuracionService } from '@/services/configuracionService';

type ViaticosTabProps = {
  configGlobal: any;
  onRefresh: () => void;
};

export default function ViaticosTab({ configGlobal, onRefresh }: ViaticosTabProps) {
  const [litros, setLitros] = useState(configGlobal.viatico?.litrosPorKm?.toString() || "0.50");
  const [precioCombustible, setPrecioCombustible] = useState(
    configGlobal.viatico?.precioCombustible ? (configGlobal.viatico.precioCombustible / 100).toString() : "1200"
  );
  const [costoFijoViatico, setCostoFijoViatico] = useState(
    configGlobal.viatico?.costoFijoBase ? (configGlobal.viatico.costoFijoBase / 100).toString() : "5000"
  );

  const [iva, setIva] = useState(configGlobal.impuesto?.ivaPorcentaje?.toString() || "21");
  const [tipoFactura, setTipoFactura] = useState(configGlobal.impuesto?.tipoFacturaDefault || "B");

  // Cuentas de la factura/recibo por defecto
  const [razonSocial, setRazonSocial] = useState(configGlobal.impuesto?.razonSocial || "Maneiro Climatización");
  const [bancoNombre, setBancoNombre] = useState(configGlobal.impuesto?.bancoNombre || "Banco Galicia");
  const [bancoNumeroCuenta, setBancoNumeroCuenta] = useState(configGlobal.impuesto?.bancoNumeroCuenta || "CC 1024-8 044-3");
  const [bancoCbu, setBancoCbu] = useState(configGlobal.impuesto?.bancoCbu || "0070044320000010248039");
  const [bancoAlias, setBancoAlias] = useState(configGlobal.impuesto?.bancoAlias || "MANEIRO.CLIMA.BSAS");
  const [bancoCuit, setBancoCuit] = useState(configGlobal.impuesto?.bancoCuit || "30-71829384-9");

  const [savingGlobal, setSavingGlobal] = useState(false);
  const { success, error } = useToast();

  const viaticoPorKm = parseFloat(litros || "0") * parseFloat(precioCombustible || "0");

  const guardarConfiguracionGlobal = async () => {
    setSavingGlobal(true);
    try {
      const payload = {
        viatico: {
          costoFijoBase: Math.round(parseFloat(costoFijoViatico || "0") * 100),
          litrosPorKm: parseFloat(litros || "0"),
          precioCombustible: Math.round(parseFloat(precioCombustible || "0") * 100)
        },
        impuesto: {
          ivaPorcentaje: parseFloat(iva || "21"),
          tipoFacturaDefault: tipoFactura,
          razonSocial,
          bancoNombre,
          bancoNumeroCuenta,
          bancoCbu,
          bancoAlias,
          bancoCuit
        }
      };

      await configuracionService.guardarConfiguracionGlobal(payload);
      success("Configuración guardada correctamente");
      onRefresh();
    } catch {
      error("Error al guardar la configuración.");
    } finally {
      setSavingGlobal(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6 border border-border flex flex-col gap-6">
        <div>
          <h2 className="font-bold text-lg text-primary mb-1">🚚 Cálculo Automático de Viáticos & Movilidad</h2>
          <p className="text-xs text-muted">Parámetros para la generación automática de viáticos según distancia en kilómetros desde Coronel Suárez</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Consumo (Litros / km)</label>
            <input type="number" step="0.01" className="form-input" value={litros} onChange={e => setLitros(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Precio del Litro de Combustible ($)</label>
            <input type="number" className="form-input" value={precioCombustible} onChange={e => setPrecioCombustible(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Costo Fijo de Salida ($)</label>
            <input type="number" className="form-input" value={costoFijoViatico} onChange={e => setCostoFijoViatico(e.target.value)} />
          </div>
        </div>

        <div className="bg-surface-hover p-4 rounded-md border border-border flex justify-between items-center">
          <span className="text-sm font-semibold text-primary">Costo Calculado de Movilidad por Kilómetro:</span>
          <span className="text-xl font-bold text-success">${viaticoPorKm.toFixed(2)} / km</span>
        </div>
      </div>

      <div className="card p-6 border border-border flex flex-col gap-6">
        <div>
          <h2 className="font-bold text-lg text-primary mb-1">📑 Parámetros Impositivos & Facturación</h2>
          <p className="text-xs text-muted">Ajustes por defecto para el cálculo de IVA y factura sugerida</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Alícuota de IVA por defecto (%)</label>
            <input type="number" className="form-input" value={iva} onChange={e => setIva(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Factura por Defecto</label>
            <select className="form-select" value={tipoFactura} onChange={e => setTipoFactura(e.target.value)}>
              <option value="A">Factura A (Con Discriminación IVA)</option>
              <option value="B">Factura B (Consumidor Final)</option>
              <option value="C">Factura C (Monotributo)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <button className="btn btn-primary btn-lg" onClick={guardarConfiguracionGlobal} disabled={savingGlobal}>
          {savingGlobal ? "Guardando..." : "💾 Guardar Todos los Cambios"}
        </button>
      </div>
    </div>
  );
}
