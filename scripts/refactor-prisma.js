const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Replace import
  content = content.replace(/import \{ prisma \} from '(@\/lib\/prisma|\.\.\/lib\/prisma|\.\.\/\.\.\/lib\/prisma|\.\.\/\.\.\/\.\.\/lib\/prisma)';/g, "import { firestoreDb } from '@/lib/firestoreDb';");
  
  // 2. Replace basic CRUD calls
  const entityMap = {
    'cliente': 'clientes',
    'proveedor': 'proveedores',
    'empleado': 'empleados',
    'taxonomia': 'taxonomia', 
    'inventario': 'inventario',
    'orden': 'ordenes',
    'vencimiento': 'vencimientos',
    'caja': 'cajas',
    'movimientoFinanciero': 'movimientos'
  };

  for (const [singular, plural] of Object.entries(entityMap)) {
    content = content.replace(new RegExp(`prisma\\.${singular}\\.findMany\\(`, 'g'), `firestoreDb.findMany('${plural}', `);
    content = content.replace(new RegExp(`prisma\\.${singular}\\.count\\(`, 'g'), `firestoreDb.count('${plural}', `);
    content = content.replace(new RegExp(`prisma\\.${singular}\\.create\\(`, 'g'), `firestoreDb.create('${plural}', `);
    content = content.replace(new RegExp(`prisma\\.${singular}\\.update\\(`, 'g'), `firestoreDb.update('${plural}', `);
    content = content.replace(new RegExp(`prisma\\.${singular}\\.delete\\(`, 'g'), `firestoreDb.delete('${plural}', `);
    content = content.replace(new RegExp(`prisma\\.${singular}\\.findUnique\\(`, 'g'), `firestoreDb.findById('${plural}', `);
    content = content.replace(new RegExp(`prisma\\.${singular}\\.findUniqueOrThrow\\(`, 'g'), `firestoreDb.findById('${plural}', `);
    content = content.replace(new RegExp(`prisma\\.${singular}\\.findFirst\\(`, 'g'), `firestoreDb.findMany('${plural}', `);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

walk(path.join(__dirname, '../src/app/api'), processFile);
console.log("Done");
