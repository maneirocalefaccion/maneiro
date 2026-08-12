"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatMoney } from "@/lib/utils";

type ModalPasajeCajasProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cajas: any[];
};

export default function ModalPasajeCajas({ isOpen, onClose, onSuccess, cajas }: ModalPasajeCajasProps) {
  const { success, error: showError } = useToast();

  const [cajaOrigen, setCajaOrigen] = useState<string>("");
  const [cajaDestino, setCajaDestino] = useState<string>("");
  const [montoUSD, setMontoUSD] = useState("");
  const [tipoCambio, setTipoCambio] = useState("1500");
  const [montoARS, setMontoARS] = useState("");
  const [montoNominalCheque, setMontoNominalCheque] = useState("");
  const [concepto, setConcepto] = useState("");
  const [saving, setSaving] = useState(false);

  // Lista ampliada de cajas incluyendo Cartera de Cheques
  const listaCajasCompleta = useMemo(() => {
    const nombres = cajas.map(c => c.nombre);
    if (!nombres.includes("Cartera de Cheques")) {
      return [...cajas, { id: 999, nombre: "Cartera de Cheques", tipo: "cheques" }];
    }
    return cajas;
  }, [cajas]);

  useEffect(() => {
    if (listaCajasCompleta.length > 0) {
      if (!cajaOrigen) setCajaOrigen(listaCajasCompleta[0].nombre);
      if (!cajaDestino) setCajaDestino(listaCajasCompleta.length > 1 ? listaCajasCompleta[1].nombre : listaCajasCompleta[0].nombre);
    }
  }, [listaCajasCompleta, cajaOrigen, cajaDestino]);

  // Detectar si una caja es en USD
  const esUSDOrigen = useMemo(() => {
    const c = listaCajasCompleta.find((x) => x.nombre === cajaOrigen);
    return c?.tipo === "efectivo_usd" || cajaOrigen.toLowerCase().includes("dólar") || cajaOrigen.toLowerCase().includes("dolar") || cajaOrigen.toLowerCase().includes("usd");
  }, [listaCajasCompleta, cajaOrigen]);

  const esUSDDestino = useMemo(() => {
    const c = listaCajasCompleta.find((x) => x.nombre === cajaDestino);
    return c?.tipo === "efectivo_usd" || cajaDestino.toLowerCase().includes("dólar") || cajaDestino.toLowerCase().includes("dolar") || cajaDestino.toLowerCase().includes("usd");
  }, [listaCajasCompleta, cajaDestino]);

  const esCambioDivisa = esUSDOrigen !== esUSDDestino;

  const esCanjeCheque = useMemo(() => {
    return cajaOrigen.toLowerCase().includes("cheque") || cajaDestino.toLowerCase().includes("cheque");
  }, [cajaOrigen, cajaDestino]);

  // Recalcular montos automáticamente si es cambio de divisa
  useEffect(() => {
    if (esCambioDivisa) {
      const tc = parseFloat(tipoCambio) || 0;
      if (esUSDOrigen && !esUSDDestino) {
        const usdVal = parseFloat(montoUSD) || 0;
        if (usdVal > 0 && tc > 0) {
          setMontoARS((usdVal * tc).toString());
        }
      } else if (!esUSDOrigen && esUSDDestino) {
        const usdVal = parseFloat(montoUSD) || 0;
        if (usdVal > 0 && tc > 0) {
          setMontoARS((usdVal * tc).toString());
        }
      }
    }
  }, [esCambioDivisa, esUSDOrigen, esUSDDestino, montoUSD, tipoCambio]);

  const handleSubmit = async () => {
    if (cajaOrigen === cajaDestino) {
      return showError("La caja de origen y destino deben ser distintas.");
    }

    setSaving(true);
    try {
      if (esCambioDivisa) {
        // --- TRANSACCIÓN CON CAMBIO DE DIVISA ---
        const usdNum = parseFloat(montoUSD);
        const tcNum = parseFloat(tipoCambio);
        const arsNum = parseFloat(montoARS);

        if (!usdNum || usdNum <= 0) return showError("Ingresá un monto válido en dólares.");
        if (!tcNum || tcNum <= 0) return showError("Ingresá un tipo de cambio válido.");
        if (!arsNum || arsNum <= 0) return showError("Ingresá un monto válido en pesos.");

        const centavosUSD = Math.round(usdNum * 100);
        const centavosARS = Math.round(arsNum * 100);

        const fechaHoy = new Date().toISOString().split("T")[0];
        const leyendaSalida = concepto || `[Cambio Divisas] Salida de ${cajaOrigen} (${esUSDOrigen ? `u$s ${usdNum}` : `$ ${arsNum}`}) a TC $${tcNum}`;
        const leyendaEntrada = concepto || `[Cambio Divisas] Entrada a ${cajaDestino} (${esUSDDestino ? `u$s ${usdNum}` : `$ ${arsNum}`}) a TC $${tcNum}`;

        await fetch("/api/finanzas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "egreso",
            categoria: "movimiento_cajas",
            planCuenta: "5.2 Movimientos entre Cajas / Cuentas",
            moneda: esUSDOrigen ? "USD" : "ARS",
            monto: centavosARS,
            montoUSD: centavosUSD,
            cotizacionUSD: tcNum,
            medioPago: cajaOrigen,
            fecha: fechaHoy,
            concepto: leyendaSalida,
          }),
        });

        await fetch("/api/finanzas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "ingreso",
            categoria: "movimiento_cajas",
            planCuenta: "5.2 Movimientos entre Cajas / Cuentas",
            moneda: esUSDDestino ? "USD" : "ARS",
            monto: centavosARS,
            montoUSD: centavosUSD,
            cotizacionUSD: tcNum,
            medioPago: cajaDestino,
            fecha: fechaHoy,
            concepto: leyendaEntrada,
          }),
        });

        success(`Cambio de divisas registrado: u$s ${usdNum.toLocaleString("es-AR")} ➔ $ ${arsNum.toLocaleString("es-AR")} (TC $${tcNum})`);
      } else {
        // --- PASAJE / CANJE ENTRE CAJAS (INCLUYENDO CHEQUES CON TASA DE DESCUENTO) ---
        const valEfectivo = parseFloat(montoARS) || 0;
        const valNominal = montoNominalCheque ? parseFloat(montoNominalCheque) : valEfectivo;

        if (valEfectivo <= 0 && valNominal <= 0) {
          return showError("Ingresá un monto válido.");
        }

        const centavosEfectivo = Math.round(valEfectivo * 100);
        const centavosNominal = Math.round(valNominal * 100);
        const diferenciaDescuento = valNominal - valEfectivo;
        const fechaHoy = new Date().toISOString().split("T")[0];

        const leyendaBase = concepto || `Pasaje entre Cajas: ${cajaOrigen} ➔ ${cajaDestino}`;

        // 1. Salida de Origen
        await fetch("/api/finanzas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "egreso",
            categoria: "movimiento_cajas",
            planCuenta: "5.2 Movimientos entre Cajas / Cuentas",
            monto: cajaOrigen.toLowerCase().includes("cheque") ? centavosNominal : centavosEfectivo,
            moneda: esUSDOrigen ? "USD" : "ARS",
            medioPago: cajaOrigen,
            fecha: fechaHoy,
            concepto: `[Salida] ${leyendaBase} ${diferenciaDescuento !== 0 ? `(Valor: $${(cajaOrigen.toLowerCase().includes("cheque") ? valNominal : valEfectivo).toLocaleString("es-AR")})` : ""}`,
          }),
        });

        // 2. Entrada a Destino
        await fetch("/api/finanzas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "ingreso",
            categoria: "movimiento_cajas",
            planCuenta: "5.2 Movimientos entre Cajas / Cuentas",
            monto: cajaDestino.toLowerCase().includes("cheque") ? centavosNominal : centavosEfectivo,
            moneda: esUSDDestino ? "USD" : "ARS",
            medioPago: cajaDestino,
            fecha: fechaHoy,
            concepto: `[Entrada] ${leyendaBase} ${diferenciaDescuento !== 0 ? `(Valor: $${(cajaDestino.toLowerCase().includes("cheque") ? valNominal : valEfectivo).toLocaleString("es-AR")})` : ""}`,
          }),
        });

        // 3. Si difiere por Tasa de Descuento de Cheques / Intereses, registrar el asiento financiero diferencial
        if (Math.abs(diferenciaDescuento) >= 0.01) {
          const esGastoDesc = diferenciaDescuento > 0;
          await fetch("/api/finanzas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipo: esGastoDesc ? "egreso" : "ingreso",
              categoria: "gasto_varios",
              planCuenta: esGastoDesc ? "3.2 Gastos Financieros / Descuento de Cheques" : "1.3 Intereses & Descuentos Ganados",
              moneda: "ARS",
              monto: Math.round(Math.abs(diferenciaDescuento) * 100),
              medioPago: cajaOrigen,
              fecha: fechaHoy,
              concepto: `[Tasa Descuento / Diferencia Canje de Cheques] Cheque Nominal: $${valNominal.toLocaleString("es-AR")} vs Efectivo: $${valEfectivo.toLocaleString("es-AR")}`,
            }),
          });
        }

        success(
          Math.abs(diferenciaDescuento) >= 0.01
            ? `Pasaje con Descuento de Cheques registrado: Efectivo $${valEfectivo.toLocaleString("es-AR")} / Nominal $${valNominal.toLocaleString("es-AR")} (Tasa: $${Math.abs(diferenciaDescuento).toLocaleString("es-AR")})`
            : "Pasaje entre cajas realizado correctamente."
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showError("Error al procesar transferencia: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔄 Pasaje & Cambio de Divisas entre Cajas"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn btn-primary font-bold" onClick={handleSubmit} disabled={saving}>
            {saving ? "Procesando..." : esCambioDivisa ? "🔱 Confirmar Cambio Divisas" : "Realizar Pasaje"}
          </button>
        </>
      }
    >
      <div className="grid-2 gap-4 mb-4">
        <div>
          <label className="label-sm font-semibold">Caja Origen (Sale)</label>
          <select className="select w-full" value={cajaOrigen} onChange={(e) => setCajaOrigen(e.target.value)}>
            {listaCajasCompleta.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-sm font-semibold">Caja Destino (Entra)</label>
          <select className="select w-full" value={cajaDestino} onChange={(e) => setCajaDestino(e.target.value)}>
            {listaCajasCompleta.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {esCambioDivisa ? (
          <div className="col-span-2 bg-blue-50/50 p-3 rounded-md border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-info">🔱 CAMBIO DE DIVISA ACTIVADO</span>
              <span className="text-xs text-muted">
                {esUSDOrigen ? "Venta de Dólares (USD ➔ ARS)" : "Compra de Dólares (ARS ➔ USD)"}
              </span>
            </div>

            <div className="grid-3 gap-3">
              <div>
                <label className="label-sm font-bold text-primary">Monto en USD (u$s) *</label>
                <input
                  type="number"
                  placeholder="1000"
                  className="input w-full font-bold"
                  value={montoUSD}
                  onChange={(e) => setMontoUSD(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="label-sm font-bold text-primary">Tipo de Cambio (TC) *</label>
                <input
                  type="number"
                  placeholder="1500"
                  className="input w-full font-bold"
                  value={tipoCambio}
                  onChange={(e) => setTipoCambio(e.target.value)}
                />
              </div>

              <div>
                <label className="label-sm font-bold text-success">Total Calculado (ARS $) *</label>
                <input
                  type="number"
                  placeholder="1500000"
                  className="input w-full font-extrabold text-success"
                  value={montoARS}
                  onChange={(e) => setMontoARS(e.target.value)}
                />
              </div>
            </div>

            {parseFloat(montoUSD) > 0 && parseFloat(tipoCambio) > 0 && (
              <p className="text-xs text-primary font-semibold mt-2 mb-0">
                💡 Resumen: Moviendo <strong>u$s {parseFloat(montoUSD).toLocaleString("es-AR")}</strong> de {cajaOrigen} ➔ convertidos a <strong>$ {(parseFloat(montoUSD) * parseFloat(tipoCambio)).toLocaleString("es-AR")} ARS</strong> en {cajaDestino} (TC: ${tipoCambio})
              </p>
            )}
          </div>
        ) : esCanjeCheque ? (
          <div className="col-span-2 bg-amber-50/70 p-4 rounded-md border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-warning">📑 CANJE DE CHEQUE & TASA DE DESCUENTO</span>
              <span className="text-xs text-muted">
                Diferencia entre Efectivo y Valor Nominal por tasa de descuento
              </span>
            </div>

            <div className="grid-2 gap-3">
              <div>
                <label className="label-sm font-bold text-primary">Monto Neto en Efectivo ($) *</label>
                <input
                  type="number"
                  placeholder="Ej: 10000"
                  className="input w-full font-bold border-primary"
                  value={montoARS}
                  onChange={(e) => setMontoARS(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="label-sm font-bold text-amber-700">Valor Nominal del Cheque ($) *</label>
                <input
                  type="number"
                  placeholder={`Ej: ${montoARS || '11000'}`}
                  className="input w-full font-bold border-amber-500"
                  value={montoNominalCheque}
                  onChange={(e) => setMontoNominalCheque(e.target.value)}
                />
              </div>
            </div>

            {(() => {
              const ef = parseFloat(montoARS) || 0;
              const nom = montoNominalCheque ? parseFloat(montoNominalCheque) : ef;
              const dif = nom - ef;
              if (Math.abs(dif) >= 0.01) {
                return (
                  <div className="mt-3 p-2 bg-white rounded border border-amber-300 text-xs font-bold text-amber-900 flex justify-between items-center">
                    <span>💡 Tasa de Descuento / Comisión:</span>
                    <span className="text-sm font-extrabold text-danger">$ {Math.abs(dif).toLocaleString('es-AR')}</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        ) : (
          <div className="col-span-2">
            <label className="label-sm font-bold">Monto a Transferir ($) *</label>
            <input
              type="number"
              placeholder="0"
              className="input w-full"
              value={montoARS}
              onChange={(e) => setMontoARS(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div className="col-span-2">
          <label className="label-sm">Concepto / Motivo Libre</label>
          <input
            type="text"
            placeholder={esCambioDivisa ? "Ej: Venta de u$s 1000 en cueva/banco..." : esCanjeCheque ? "Ej: Canje de cheque de 11.000 por 10.000 efectivo..." : "Ej: Depósito de efectivo en banco..."}
            className="input w-full"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
