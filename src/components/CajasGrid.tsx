"use client";

import React, { useMemo } from "react";
import { formatMoney } from "@/lib/utils";

type CajasGridProps = {
  cajas: any[];
  onTransferir?: () => void;
  onNuevoCheque?: () => void;
};

export default function CajasGrid({ cajas, onTransferir, onNuevoCheque }: CajasGridProps) {
  const { totalARS, totalUSD } = useMemo(() => {
    let ars = 0;
    let usd = 0;
    cajas.forEach((c) => {
      if (c.tipo === "efectivo_usd") {
        usd += c.saldo || 0;
      } else {
        ars += c.saldo || 0;
      }
    });
    return { totalARS: ars, totalUSD: usd };
  }, [cajas]);

  return (
    <div className="dashboard-grid auto-fit-220 mb-6">
      {/* TARJETA DESTACADA: LIQUIDEZ TOTAL (PESOS + DÓLARES) */}
      <div className="stat-card stat-card-green bg-primary-light/20 border-primary">
        <div className="stat-card-header">
          <span className="stat-title font-bold text-primary">💰 Total Liquidez Disponible</span>
          {onTransferir && (
            <button className="btn btn-ghost btn-sm" onClick={onTransferir} title="Pasaje de fondos">
              🔄
            </button>
          )}
        </div>
        <div className="stat-value color-green text-xl font-extrabold my-1">
          {formatMoney(totalARS)}
        </div>
        <div className="text-sm font-semibold color-blue">
          🇺🇸 u$s {(totalUSD / 100).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </div>
        <div className="stat-subtitle text-xs text-muted mt-2">
          Posición bruta (Pesos + Dólares)
        </div>
      </div>

      {/* TARJETAS INDIVIDUALES DE CAJA */}
      {cajas.map((c) => (
        <div key={c.id} className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title font-semibold">{c.nombre}</span>
          </div>
          <div className={`stat-value ${c.saldo >= 0 ? "text-success" : "text-danger"}`}>
            {c.tipo === "efectivo_usd"
              ? `u$s ${(c.saldo / 100).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
              : formatMoney(c.saldo)}
          </div>
          <div className="stat-subtitle text-xs text-muted mt-1">
            {c.tipo === "efectivo_usd"
              ? "Dólares en caja de seguridad"
              : c.tipo === "cheques_cartera"
              ? "Cheques físicos y echeqs"
              : "Saldo disponible"}
          </div>
        </div>
      ))}
    </div>
  );
}
