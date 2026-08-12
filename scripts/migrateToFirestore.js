const { PrismaClient } = require('@prisma/client');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Firebase Admin
function initFirebaseAdmin() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '..', 'firebase-service-account.json');
  let app;
  
  if (fs.existsSync(serviceAccountPath)) {
    console.log(`🔑 Usando clave de cuenta de servicio desde: ${serviceAccountPath}`);
    const serviceAccount = require(serviceAccountPath);
    app = initializeApp({
      credential: cert(serviceAccount)
    });
  } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('🔑 Usando credenciales de Firebase desde variables de entorno.');
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
    });
  } else {
    console.error('❌ ERROR: No se encontraron credenciales de Firebase.');
    console.error('Por favor coloca el archivo `firebase-service-account.json` en la raíz del proyecto');
    console.error('o configura las variables de entorno FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.');
    process.exit(1);
  }

  return getFirestore(app);
}

async function batchUploadCollection(db, collectionName, items, idKey = 'id') {
  if (!items || items.length === 0) {
    console.log(`ℹ️ Colección ${collectionName}: 0 registros.`);
    return;
  }

  const BATCH_SIZE = 400;
  let totalUploaded = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = items.slice(i, i + BATCH_SIZE);

    chunk.forEach((item) => {
      const docId = String(item[idKey]);
      const docRef = db.collection(collectionName).doc(docId);
      
      // Convert Date objects to ISO strings for Firestore compatibility
      const cleanData = JSON.parse(JSON.stringify(item));
      batch.set(docRef, cleanData, { merge: true });
    });

    await batch.commit();
    totalUploaded += chunk.length;
    console.log(`  └─ Colección ${collectionName}: subidos ${totalUploaded}/${items.length} documentos`);
  }
}

async function migrate() {
  console.log('🚀 Iniciando migración de SQLite (dev.db) -> Cloud Firestore...\n');
  const db = initFirebaseAdmin();

  try {
    // 1. Empleados
    const empleados = await prisma.empleado.findMany();
    await batchUploadCollection(db, 'empleados', empleados);

    // 2. Clientes con direcciones
    const clientes = await prisma.cliente.findMany({ include: { direcciones: true } });
    await batchUploadCollection(db, 'clientes', clientes);

    // 3. Proveedores
    const proveedores = await prisma.proveedor.findMany();
    await batchUploadCollection(db, 'proveedores', proveedores);

    // 4. Ordenes con líneas de detalle y viático
    const ordenes = await prisma.orden.findMany({
      include: {
        lineasManoObra: true,
        lineasRepuesto: true,
        lineasOtroCosto: true,
        viatico: true,
      }
    });
    await batchUploadCollection(db, 'ordenes', ordenes);

    // 5. Inventario (EquipoItem)
    const equipoItems = await prisma.equipoItem.findMany();
    await batchUploadCollection(db, 'inventario', equipoItems);

    // 6. Cajas
    const cajas = await prisma.caja.findMany();
    await batchUploadCollection(db, 'cajas', cajas);

    // 7. Movimientos Financieros
    const movimientos = await prisma.movimientoFinanciero.findMany();
    await batchUploadCollection(db, 'movimientosFinancieros', movimientos);

    // 8. Cheques
    const cheques = await prisma.cheque.findMany();
    await batchUploadCollection(db, 'cheques', cheques);

    // 9. Vencimientos
    const vencimientos = await prisma.vencimiento.findMany();
    await batchUploadCollection(db, 'vencimientos', vencimientos);

    // 10. Taxonomia
    const taxonomias = await prisma.categoriaTaxonomia.findMany();
    await batchUploadCollection(db, 'taxonomias', taxonomias);

    // 11. Empresas & Cuentas Bancarias
    const empresas = await prisma.empresa.findMany({ include: { cuentasBancarias: true } });
    await batchUploadCollection(db, 'empresas', empresas);

    // 12. Configuración
    const configViatico = await prisma.configViatico.findFirst();
    const configImpuesto = await prisma.configImpuesto.findFirst();
    if (configViatico) await db.collection('configuracion').doc('viatico').set(JSON.parse(JSON.stringify(configViatico)));
    if (configImpuesto) await db.collection('configuracion').doc('impuesto').set(JSON.parse(JSON.stringify(configImpuesto)));

    console.log('\n✅ ¡Migración completada exitosamente en Firebase Firestore!');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
