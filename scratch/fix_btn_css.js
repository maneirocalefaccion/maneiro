const fs = require('fs');
let css = fs.readFileSync('c:/Users/HP/Dropbox/D+ARQ/HERRAMIENTAS FLIPPING/Maneiro clima/maneiro-clima2/src/app/globals.css', 'utf-8');

// Add padding to .btn
if (!css.includes('padding: var(--space-2) var(--space-4);') && css.includes('.btn {')) {
  css = css.replace('.btn {', '.btn {\n  padding: var(--space-2) var(--space-4);\n  font-size: var(--font-size-sm);');
}

fs.writeFileSync('c:/Users/HP/Dropbox/D+ARQ/HERRAMIENTAS FLIPPING/Maneiro clima/maneiro-clima2/src/app/globals.css', css);
