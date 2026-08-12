"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import FinanzasAnuales from "@/app/dashboard/FinanzasAnuales";

export default function EstadisticasPage() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(true);
  const [resumenFinanzas, setResumenFinanzas] = useState({
    totalIngresos: 0,
    totalEgresos: 0,
    saldoNeto: 0,
    totalIngresosARS: 0,
    totalEgresosARS: 0,
    saldoNetoARS: 0,
    totalIngresosUSD: 0,
    totalEgresosUSD: 0,
    saldoNetoUSD: 0,
    anioActual: new Date().getFullYear(),
    ingresosAnio: 0,
    egresosAnio: 0,
    balanceAnio: 0,
    ingresosAnioUSD: 0,
    egresosAnioUSD: 0,
    balanceAnioUSD: 0,
    estadisticasMensuales: [],
  });

  const cargarEstadisticas = async (year: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/finanzas?anio=${year}`);
      if (res.ok) {
        const data = await res.json();
        setResumenFinanzas(data.resumen);
      }
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    cargarEstadisticas(year);
  };

  useEffect(() => {
    cargarEstadisticas(selectedYear);
  }, []);

  return (
    <div className="page-container">
      <div className="page-header space-between align-end mb-6">
        <div>
          <h1 className="page-title">Estadísticas Económicas & Reportes</h1>
          <p className="page-subtitle mb-0">Evolución mensual de facturación, egresos y balance financiero del negocio</p>
        </div>

        <div className="page-actions flex gap-2">
          <Link href="/finanzas" className="btn btn-outline font-semibold">
            💵 Ver Caja & Tesorería
          </Link>
          <Link href="/asientos" className="btn btn-outline font-semibold">
            📑 Ver Libro Diario
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="empty-state p-8"><p className="text-muted">Cargando estadísticas económicas...</p></div>
      ) : (
        <div className="flex flex-col gap-6">
          <FinanzasAnuales resumenFinanzas={resumenFinanzas} formatMoney={formatMoney} onYearChange={handleYearChange} />
        </div>
      )}
    </div>
  );
}
