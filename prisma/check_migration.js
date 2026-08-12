const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Check sample movimientos
  const sample = await prisma.movimientoFinanciero.findMany({ take: 5, orderBy: { id: 'desc' } });
  console.log('Sample movimientos (monto should be integers/centavos):');
  sample.forEach(m => console.log(`  ID=${m.id} monto=${m.monto} tipo=${m.tipo} concepto=${m.concepto?.substring(0,30)}`));
  
  // Check totals
  const totals = await prisma.movimientoFinanciero.aggregate({
    _sum: { monto: true },
    _count: true,
  });
  console.log(`\nTotal registros: ${totals._count}`);
  console.log(`Suma total montos: ${totals._sum.monto}`);
  
  // Check if Caja table exists and is empty
  const cajas = await prisma.caja.findMany();
  console.log(`\nCajas creadas: ${cajas.length}`);
  
  // Check clientes have activo field
  const clientesSample = await prisma.cliente.findMany({ take: 3 });
  console.log(`\nClientes sample (activo field):`)
  clientesSample.forEach(c => console.log(`  ${c.nombre} activo=${c.activo}`));

  await prisma.$disconnect();
}
check().catch(e => { console.error(e); process.exit(1); });
