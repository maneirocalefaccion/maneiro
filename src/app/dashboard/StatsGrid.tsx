import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney } from '@/lib/utils';

type StatsGridProps = {
  ordenes: any[];
  cajas?: any[];
  cantClientes: number;
  cantStock: number;
  loading: boolean;
};

export default function StatsGrid({ ordenes, cajas, cantClientes, cantStock, loading }: StatsGridProps) {
  const router = useRouter();

  const {
    presupuestosCount,
    presupuestosMonto,
    enEjecucionCount,
    aCobrarCount,
    aCobrarMontoTotal
  } = useMemo(() => {
    const presupuestos = ordenes.filter((o) => o.estado === "presupuesto" || o.estado === "presupuestado");
    const enEjecucion = ordenes.filter((o) => o.estado === "en_ejecucion" || o.estado === "abierta" || o.estado === "solicitada");

    const aCobrar = ordenes.filter((o) => {
      const tot = o.totalFinal || 0;
      const cob = o.montoCobrado || 0;
      const est = o.estado;
      return (est === "completado" || est === "pagado_parcial" || est === "facturado" || est === "a_cobrar") && (tot - cob > 0);
    });

    const aCobrarMontoTotal = aCobrar.reduce((acc, o) => acc + Math.max(0, (o.totalFinal || 0) - (o.montoCobrado || 0)), 0);

    return {
      presupuestosCount: presupuestos.length,
      presupuestosMonto: presupuestos.reduce((acc, o) => acc + (o.totalFinal || 0), 0),
      enEjecucionCount: enEjecucion.length,
      aCobrarCount: aCobrar.length,
      aCobrarMontoTotal
    };
  }, [ordenes]);

  return (
    <div className="kpi-grid-4">
      {/* KPI 1: Órdenes a Cobrar */}
      <div
        className="stat-card stat-card-green shadow-sm cursor-pointer hover:shadow-md transition-all"
        onClick={() => router.push('/ordenes')}
        role="button"
        tabIndex={0}
      >
        <div className="stat-card-header">
          <span className="stat-title">💵 Por Cobrar</span>
          <div className="stat-icon icon-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
        </div>
        <div className="stat-value color-green">
          {loading ? "..." : formatMoney(aCobrarMontoTotal)}
        </div>
        <div className="stat-footer">
          <span>{aCobrarCount} orden(es) pendientes</span>
          <span className="stat-action-text color-green">Cobrar →</span>
        </div>
      </div>

      {/* KPI 2: Trabajos Activos */}
      <div
        className="stat-card stat-card-purple shadow-sm cursor-pointer hover:shadow-md transition-all"
        onClick={() => router.push('/ordenes')}
        role="button"
        tabIndex={0}
      >
        <div className="stat-card-header">
          <span className="stat-title">🔧 Trabajos Activos</span>
          <div className="stat-icon icon-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
        </div>
        <div className="stat-value color-purple">
          {loading ? "..." : enEjecucionCount} <span className="stat-unit">obras</span>
        </div>
        <div className="stat-footer">
          <span>En ejecución / servicio</span>
          <span className="stat-action-text color-purple">Ver Órdenes →</span>
        </div>
      </div>

      {/* KPI 3: Stock en Depósito */}
      <div
        className="stat-card shadow-sm cursor-pointer hover:shadow-md transition-all"
        onClick={() => router.push('/inventario')}
        role="button"
        tabIndex={0}
      >
        <div className="stat-card-header">
          <span className="stat-title">📦 Stock en Depósito</span>
          <div className="stat-icon icon-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          </div>
        </div>
        <div className="stat-value color-blue">
          {loading ? "..." : cantStock} <span className="stat-unit">ítems</span>
        </div>
        <div className="stat-footer">
          <span>Equipos y repuestos</span>
          <span className="stat-action-text color-blue">Inventario →</span>
        </div>
      </div>

      {/* KPI 4: Presupuestos Cotizados */}
      <div
        className="stat-card shadow-sm cursor-pointer hover:shadow-md transition-all"
        onClick={() => router.push('/ordenes')}
        role="button"
        tabIndex={0}
      >
        <div className="stat-card-header">
          <span className="stat-title">📄 Cotizaciones Emitidas</span>
          <div className="stat-icon icon-orange">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
        </div>
        <div className="stat-value color-orange">
          {loading ? "..." : formatMoney(presupuestosMonto)}
        </div>
        <div className="stat-footer">
          <span>{presupuestosCount} presupuestos activos</span>
          <span className="stat-action-text color-orange">Cotizaciones →</span>
        </div>
      </div>
    </div>
  );
}
