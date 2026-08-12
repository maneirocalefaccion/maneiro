const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando importación masiva de movimientos desde Excel...");

  const jsonPath = path.join(__dirname, "movimientos_excel.json");
  const dataRaw = fs.readFileSync(jsonPath, "utf-8");
  const movimientos = JSON.parse(dataRaw);

  console.log(`Cargados ${movimientos.length} movimientos desde JSON.`);

  // Formatear fechas para Prisma
  const formatted = movimientos.map((m) => ({
    tipo: m.tipo,
    categoria: m.categoria,
    planCuenta: m.planCuenta,
    monto: m.monto,
    medioPago: m.medioPago,
    fecha: new Date(m.fecha),
    concepto: m.concepto,
  }));

  const BATCH_SIZE = 500;
  let insertados = 0;

  for (let i = 0; i < formatted.length; i += BATCH_SIZE) {
    const batch = formatted.slice(i, i + BATCH_SIZE);
    await prisma.movimientoFinanciero.createMany({
      data: batch,
    });
    insertados += batch.length;
    console.log(`Progreso: ${insertados} / ${formatted.length} movimientos importados.`);
  }

  console.log("✅ Importación masiva completada con éxito.");
}

main()
  .catch((e) => {
    console.error("Error en importación:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
