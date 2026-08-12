const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function convertToCents() {
  console.log('Converting all monetary values from pesos to centavos (x100)...\n');

  // MovimientoFinanciero: monto, montoUSD
  const movResult = await prisma.$executeRawUnsafe(`UPDATE MovimientoFinanciero SET monto = monto * 100`);
  console.log(`MovimientoFinanciero.monto: updated`);
  
  const movUSDResult = await prisma.$executeRawUnsafe(`UPDATE MovimientoFinanciero SET montoUSD = montoUSD * 100 WHERE montoUSD IS NOT NULL`);
  console.log(`MovimientoFinanciero.montoUSD: updated`);
  
  // Orden: montoAnticipo, totalSinIva, ivaMontoMonto, totalFinal
  await prisma.$executeRawUnsafe(`UPDATE Orden SET montoAnticipo = montoAnticipo * 100, totalSinIva = totalSinIva * 100, ivaMontoMonto = ivaMontoMonto * 100, totalFinal = totalFinal * 100`);
  console.log(`Orden monetary fields: updated`);
  
  // LineaManoObra: precioUnitario, subtotal
  await prisma.$executeRawUnsafe(`UPDATE LineaManoObra SET precioUnitario = precioUnitario * 100, subtotal = subtotal * 100`);
  console.log(`LineaManoObra: updated`);
  
  // LineaRepuesto: costo
  await prisma.$executeRawUnsafe(`UPDATE LineaRepuesto SET costo = costo * 100`);
  console.log(`LineaRepuesto: updated`);
  
  // LineaOtroCosto: monto
  await prisma.$executeRawUnsafe(`UPDATE LineaOtroCosto SET monto = monto * 100`);
  console.log(`LineaOtroCosto: updated`);
  
  // OrdenViatico: costoFijo, costoPorKm, viandas, total
  await prisma.$executeRawUnsafe(`UPDATE OrdenViatico SET costoFijo = costoFijo * 100, costoPorKm = costoPorKm * 100, viandas = viandas * 100, total = total * 100`);
  console.log(`OrdenViatico: updated`);
  
  // EquipoItem: precioCompra, precioVentaSugerido
  await prisma.$executeRawUnsafe(`UPDATE EquipoItem SET precioCompra = precioCompra * 100`);
  await prisma.$executeRawUnsafe(`UPDATE EquipoItem SET precioVentaSugerido = precioVentaSugerido * 100 WHERE precioVentaSugerido IS NOT NULL`);
  console.log(`EquipoItem: updated`);
  
  // Cheque: monto
  await prisma.$executeRawUnsafe(`UPDATE Cheque SET monto = monto * 100`);
  console.log(`Cheque: updated`);
  
  // Vencimiento: monto
  await prisma.$executeRawUnsafe(`UPDATE Vencimiento SET monto = monto * 100`);
  console.log(`Vencimiento: updated`);
  
  // Empleado: sueldo
  await prisma.$executeRawUnsafe(`UPDATE Empleado SET sueldo = sueldo * 100`);
  console.log(`Empleado.sueldo: updated`);
  
  // ConfigViatico: precioCombustible, costoFijoBase
  await prisma.$executeRawUnsafe(`UPDATE ConfigViatico SET precioCombustible = precioCombustible * 100, costoFijoBase = costoFijoBase * 100`);
  console.log(`ConfigViatico: updated`);
  
  // Seed default cajas
  const existingCajas = await prisma.caja.count();
  if (existingCajas === 0) {
    await prisma.caja.createMany({
      data: [
        { nombre: 'Caja Pesos Efectivo', tipo: 'efectivo_ars' },
        { nombre: 'Caja Dólares Efectivo', tipo: 'efectivo_usd' },
        { nombre: 'Banco Galicia', tipo: 'banco' },
        { nombre: 'Mercado Pago', tipo: 'mercadopago' },
      ]
    });
    console.log('\nCreated 4 default Cajas');
  }

  // Verify
  const sample = await prisma.movimientoFinanciero.findMany({ take: 5, orderBy: { id: 'desc' } });
  console.log('\nVerification (montos should be in centavos now):');
  sample.forEach(m => console.log(`  ID=${m.id} monto=${m.monto} (= $${(m.monto/100).toLocaleString('es-AR')})`));
  
  await prisma.$disconnect();
  console.log('\nDone!');
}

convertToCents().catch(e => { console.error(e); process.exit(1); });
