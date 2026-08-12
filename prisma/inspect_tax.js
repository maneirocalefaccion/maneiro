const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.categoriaTaxonomia.findMany();
  console.log(`=== TAXONOMIA EN BASE DE DATOS (${cats.length} registros) ===`);
  cats.forEach(c => console.log(`ID ${c.id}: [${c.codigo}] "${c.nombre}" (Grupo: ${c.grupo})`));

  const planCounts = await prisma.movimientoFinanciero.groupBy({
    by: ['planCuenta'],
    _count: { id: true }
  });

  console.log(`\n=== PLAN DE CUENTAS EN ASIENTOS CONTABLES (${planCounts.length} distintos) ===`);
  planCounts.forEach(p => console.log(`"${p.planCuenta}": ${p._count.id} asientos`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
