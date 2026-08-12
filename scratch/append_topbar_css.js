const fs = require('fs');
let css = fs.readFileSync('c:/Users/HP/Dropbox/D+ARQ/HERRAMIENTAS FLIPPING/Maneiro clima/maneiro-clima2/src/app/globals.css', 'utf-8');

const missingCss = `
.topbar { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) 0; border-bottom: 1px solid var(--color-border); margin-bottom: var(--space-6); }
.topbar-text { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.page-container { padding-bottom: var(--space-8); }
`;

if (!css.includes('.topbar {')) {
  fs.appendFileSync('c:/Users/HP/Dropbox/D+ARQ/HERRAMIENTAS FLIPPING/Maneiro clima/maneiro-clima2/src/app/globals.css', missingCss);
}
