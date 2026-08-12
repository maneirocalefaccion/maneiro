const fs = require('fs');
let css = fs.readFileSync('c:/Users/HP/Dropbox/D+ARQ/HERRAMIENTAS FLIPPING/Maneiro clima/maneiro-clima2/src/app/globals.css', 'utf-8');

const missingCss = `
.chart-container { background: var(--color-surface); padding: var(--space-6); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--color-border); display: flex; flex-direction: column; gap: var(--space-6); }
.chart-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-4); }
.chart-title-section { flex: 1; min-width: 250px; }
.chart-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-text); margin-bottom: var(--space-1); }
.chart-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.chart-summary { display: flex; gap: var(--space-6); background: var(--color-bg); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--color-border); }
.chart-summary-item { display: flex; flex-direction: column; gap: var(--space-1); border-right: 1px solid var(--color-border); padding-right: var(--space-6); }
.chart-summary-item.border-none { border-right: none; padding-right: 0; }
.chart-summary-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); }
.chart-summary-value { font-size: var(--font-size-xl); font-weight: 800; }
.bar-chart { display: flex; justify-content: space-between; align-items: flex-end; height: 250px; padding: var(--space-4) 0; border-bottom: 1px solid var(--color-border); gap: var(--space-2); }
.bar-group { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); flex: 1; height: 100%; justify-content: flex-end; }
.bars-wrapper { display: flex; gap: 4px; align-items: flex-end; width: 100%; height: 100%; justify-content: center; }
.bar { width: 12px; border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.5s ease; cursor: pointer; }
.bar:hover { filter: brightness(1.1); }
.bar-success { background-color: var(--color-success); }
.bar-danger { background-color: var(--color-danger); }
.bar-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 500; }
.chart-legend { display: flex; gap: var(--space-6); justify-content: center; padding-top: var(--space-2); font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.legend-item { display: flex; align-items: center; gap: var(--space-2); }
.legend-color { width: 12px; height: 12px; border-radius: 3px; }
.bg-success { background-color: var(--color-success) !important; }
.bg-danger { background-color: var(--color-danger) !important; }
`;

if (!css.includes('.chart-container {')) {
  fs.appendFileSync('c:/Users/HP/Dropbox/D+ARQ/HERRAMIENTAS FLIPPING/Maneiro clima/maneiro-clima2/src/app/globals.css', missingCss);
}
