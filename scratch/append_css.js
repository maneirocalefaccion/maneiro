const fs = require('fs');
const cssToAppend = `
/* Utility and Dashboard Classes Added */
.dashboard-grid { display: grid; gap: var(--space-4); }
.auto-fit-220 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.stat-card { background: var(--color-surface); padding: var(--space-4); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--color-border); display: flex; flex-direction: column; gap: var(--space-2); }
.stat-card-header { display: flex; justify-content: space-between; align-items: center; }
.stat-title { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-secondary); }
.stat-value { font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-text); }
.stat-subtitle { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.stat-icon { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: var(--radius-full); }
.stat-icon svg { width: 20px; height: 20px; }
.icon-blue { background: var(--color-primary-light); color: var(--color-primary); }
.icon-orange { background: var(--color-warning-light); color: var(--color-warning); }
.icon-purple { background: #f3e8ff; color: #9333ea; }
.icon-info { background: var(--color-info-light); color: var(--color-info); }
.border-left-success { border-left: 4px solid var(--color-success); }
.border-left-info { border-left: 4px solid var(--color-info); }
.border-left-purple { border-left: 4px solid #9333ea; }
.border-left-cyan { border-left: 4px solid var(--color-info); }
.border-left-primary { border-left: 4px solid var(--color-primary); }
.text-success { color: var(--color-success) !important; }
.text-danger { color: var(--color-danger) !important; }
.text-info { color: var(--color-info) !important; }
.text-cyan { color: var(--color-info) !important; }
.text-purple { color: #9333ea !important; }
.text-primary { color: var(--color-primary) !important; }
.mb-0 { margin-bottom: 0 !important; }
.mb-2 { margin-bottom: var(--space-2) !important; }
.mb-4 { margin-bottom: var(--space-4) !important; }
.mb-6 { margin-bottom: var(--space-6) !important; }
.mb-8 { margin-bottom: var(--space-8) !important; }
.w-160 { width: 160px !important; }
.w-full { width: 100% !important; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.col-span-2 { grid-column: span 2; }
.space-between { display: flex; justify-content: space-between; }
.align-end { align-items: flex-end; }
.align-center { align-items: center; }
.gap-2 { gap: var(--space-2) !important; }
.gap-4 { gap: var(--space-4) !important; }
.text-sm { font-size: var(--font-size-sm) !important; }
.font-bold { font-weight: 700 !important; }
.mt-4 { margin-top: var(--space-4) !important; }

.empty-state { padding: var(--space-8); text-align: center; color: var(--color-text-muted); background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: var(--radius-md); }
.table-container { background: var(--color-surface); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); border: 1px solid var(--color-border); overflow: hidden; }
.table-header { padding: var(--space-4); border-bottom: 1px solid var(--color-border); background: var(--color-bg); }
.table-title { font-weight: 600; font-size: var(--font-size-lg); }
`;
fs.appendFileSync('c:/Users/HP/Dropbox/D+ARQ/HERRAMIENTAS FLIPPING/Maneiro clima/maneiro-clima2/src/app/globals.css', cssToAppend);
