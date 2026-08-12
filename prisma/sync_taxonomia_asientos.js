const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const taxonomia = await prisma.categoriaTaxonomia.findMany();
  console.log(`=== SINCRO DE TAXONOMÍA EN ASIENTOS CONTABLES (${taxonomia.length} cuentas) ===\n`);

  let totalActualizados = 0;

  for (const cat of taxonomia) {
    const cod = cat.codigo.trim();
    const nom = cat.nombre.trim();
    const planCuentaFull = `${cod} ${nom}`;

    const res = await prisma.movimientoFinanciero.updateMany({
      where: {
        OR: [
          { planCuenta: { startsWith: `${cod} ` } },
          { planCuenta: { startsWith: `${cod}.` } },
          { planCuenta: { contains: nom } },
        ],
      },
      data: {
        planCuenta: planCuentaFull,
      },
    });

    if (res.count > 0) {
      console.log(`✓ Cuenta [${cod}] -> "${planCuentaFull}": ${res.count} asientos actualizados.`);
      totalActualizados += res.count;
    }
  }

  console.log(`\n🎉 ¡Sincronización completada! ${totalActualizados} asientos contables actualizados.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
