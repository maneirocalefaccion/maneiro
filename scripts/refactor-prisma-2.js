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

  const entityMap = {
    'caja': 'cajas',
    'cheque': 'cheques',
    'equipoItem': 'inventario',
    'categoriaTaxonomia': 'taxonomia',
    'configViatico': 'configuracion',
    'configImpuesto': 'configuracion'
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

  // Also try to replace createMany naively with just create, or Promise.all
  // For cajas:
  content = content.replace(/await prisma\.caja\.createMany\(\{\s*data\s*:\s*([^]+?)\s*\}\);/g, "await Promise.all($1.map((d: any) => firestoreDb.create('cajas', d)));");

  // Replace transactions with Promise.all
  content = content.replace(/await prisma\.\$transaction\(async\s*\(tx\)\s*=>\s*\{/g, "await (async () => { const tx = firestoreDb;");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

walk(path.join(__dirname, '../src/app/api'), processFile);
console.log("Done");
