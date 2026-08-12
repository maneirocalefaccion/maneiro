const fs = require('fs');
let css = fs.readFileSync('c:/Users/HP/Dropbox/D+ARQ/HERRAMIENTAS FLIPPING/Maneiro clima/maneiro-clima2/src/app/globals.css', 'utf-8');

const missingCss = `
.dashboard-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
.stat-card-orange { border-left-color: var(--color-warning) !important; }
.stat-card-purple { border-left-color: #9333ea !important; }
.stat-card-green { border-left-color: var(--color-success) !important; }
.stat-card-teal { border-left-color: var(--color-info) !important; }

.stat-footer { display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: auto; padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
.stat-unit { font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text-muted); }
.stat-action-text { font-weight: 600; }
.color-blue { color: var(--color-primary); }
.color-orange { color: var(--color-warning); }
.color-purple { color: #9333ea; }
.color-green { color: var(--color-success); }
.color-teal { color: var(--color-info); }
.icon-green { background: var(--color-success-light); color: var(--color-success); }
.icon-teal { background: var(--color-info-light); color: var(--color-info); }
`;

if (!css.includes('.stat-card-orange')) {
  fs.appendFileSync('c:/Users/HP/Dropbox/D+ARQ/HERRAMIENTAS FLIPPING/Maneiro clima/maneiro-clima2/src/app/globals.css', missingCss);
}
