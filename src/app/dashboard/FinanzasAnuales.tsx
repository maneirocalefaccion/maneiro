import React from 'react';

type FinanzasAnualesProps = {
  resumenFinanzas: {
    anioActual: number;
    ingresosAnio: number;
    egresosAnio: number;
    balanceAnio: number;
    ingresosAnioUSD?: number;
    egresosAnioUSD?: number;
    balanceAnioUSD?: number;
    estadisticasMensuales: any[];
  };
  formatMoney: (cents: number) => string;
  onYearChange?: (year: number) => void;
};

export default function FinanzasAnuales({ resumenFinanzas, formatMoney, onYearChange }: FinanzasAnualesProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: Math.max(5, currentYear - 2023 + 1) }, (_, i) => currentYear - i);

  const maxIngresoEgreso = Math.max(
    ...resumenFinanzas.estadisticasMensuales.map((m: any) => Math.max(m.ingresos, m.egresos)),
    100000
  );

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div className="chart-title-section">
          <h2 className="chart-title">
            📊 Estadísticas Económicas ({resumenFinanzas.anioActual})
            {onYearChange && (
              <select 
                className="form-select ml-4 inline-block w-auto text-sm"
                value={resumenFinanzas.anioActual}
                onChange={(e) => onYearChange(parseInt(e.target.value))}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </h2>
          <p className="chart-subtitle">
            Evolución mensual de Ingresos, Egresos y Resultado Neto acumulado
          </p>
        </div>
        <div className="chart-summary">
          <div className="chart-summary-item">
            <span className="chart-summary-label">INGRESOS (ARS)</span>
            <strong className="chart-summary-value text-success">
              {formatMoney(resumenFinanzas.ingresosAnio)}
            </strong>
          </div>
          <div className="chart-summary-item">
            <span className="chart-summary-label">EGRESOS (ARS)</span>
            <strong className="chart-summary-value text-danger">
              {formatMoney(resumenFinanzas.egresosAnio)}
            </strong>
          </div>
          <div className="chart-summary-item border-none">
            <span className="chart-summary-label">BALANCE NETO (ARS)</span>
            <strong className={`chart-summary-value ${resumenFinanzas.balanceAnio >= 0 ? 'text-primary' : 'text-danger'}`}>
              {formatMoney(resumenFinanzas.balanceAnio)}
            </strong>
          </div>
          {((resumenFinanzas.ingresosAnioUSD || 0) > 0 || (resumenFinanzas.egresosAnioUSD || 0) > 0) && (
            <div className="chart-summary-item border-l border-border pl-4">
              <span className="chart-summary-label">BALANCE NETO (USD)</span>
              <strong className="chart-summary-value text-emerald font-bold">
                u$s {((resumenFinanzas.balanceAnioUSD || 0) / 100).toLocaleString('es-AR')} USD
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Barras Mensuales */}
      <div className="bar-chart">
        {resumenFinanzas.estadisticasMensuales.map((m: any) => {
          const pctIng = Math.min(100, Math.round((m.ingresos / maxIngresoEgreso) * 100));
          const pctEgr = Math.min(100, Math.round((m.egresos / maxIngresoEgreso) * 100));

          return (
            <div key={m.mes} className="bar-group">
              <div className="bars-wrapper">
                <div
                  title={`Ingresos ${m.mes}: ${formatMoney(m.ingresos)}`}
                  className="bar bar-success"
                  style={{ height: `${Math.max(4, pctIng)}%` }}
                />
                <div
                  title={`Egresos ${m.mes}: ${formatMoney(m.egresos)}`}
                  className="bar bar-danger"
                  style={{ height: `${Math.max(4, pctEgr)}%` }}
                />
              </div>
              <span className="bar-label">{m.mes}</span>
            </div>
          );
        })}
      </div>

      {/* Leyenda del gráfico */}
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color bg-success"></span>
          <span>Ingresos (Cobros)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color bg-danger"></span>
          <span>Egresos (Pagos / Compras)</span>
        </div>
      </div>
    </div>
  );
}
