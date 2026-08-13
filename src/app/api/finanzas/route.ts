import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';
import { movimientoSchema as movimientoFinancieroSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '50');
    const skip = (page - 1) * pageSize;
    const tipo = searchParams.get('tipo');
    const f_concepto = searchParams.get('f_concepto');
    const f_planCuenta = searchParams.get('f_planCuenta');
    const f_medioPago = searchParams.get('f_medioPago');
    const f_moneda = searchParams.get('f_moneda');
    const f_fecha = searchParams.get('f_fecha');
    const f_grupo = searchParams.get('f_grupo');

    const where: any = {};
    if (tipo && tipo !== 'todos') where.tipo = tipo;
    if (f_moneda && f_moneda !== 'todas') where.moneda = f_moneda;
    if (f_grupo && f_grupo !== 'todos') {
      const prefix = f_grupo.split('.')[0];
      where.planCuenta = { startsWith: `${prefix}.` };
    }
    if (f_concepto && f_concepto.trim() !== '') {
      where.concepto = { contains: f_concepto.trim() };
    }
    if (f_planCuenta && f_planCuenta.trim() !== '') {
      const cuentas = f_planCuenta.split(',').filter(Boolean);
      if (cuentas.length > 0) {
        where.OR = cuentas.map(c => ({
          planCuenta: { contains: c.replace(/^[\d\.]+\s*/, '').trim() }
        }));
      }
    }
    if (f_medioPago && f_medioPago.trim() !== '') {
      const medios = f_medioPago.split(',').filter(Boolean);
      if (medios.length > 0) where.medioPago = { in: medios };
    }
    if (f_fecha && f_fecha.trim() !== '') {
      where.fecha = {
        gte: new Date(`${f_fecha.trim()}T00:00:00.000Z`),
        lte: new Date(`${f_fecha.trim()}T23:59:59.999Z`)
      };
    }

    const [data, total] = await Promise.all([
      firestoreDb.findMany('movimientos', {
        where,
        skip,
        take: pageSize,
        orderBy: { fecha: 'desc' }
      }),
      firestoreDb.count('movimientos', { where })
    ]);
    
    const allMovs = await firestoreDb.findMany('movimientos', { where });
    const totalesGroup: any[] = [];
    allMovs.forEach(m => {
       const mTipo = m.tipo || 'ingreso';
       const mMoneda = m.moneda || 'ARS';
       let group = totalesGroup.find(g => g.tipo === mTipo && g.moneda === mMoneda);
       if (!group) {
          group = { tipo: mTipo, moneda: mMoneda, _sum: { monto: 0, montoUSD: 0 } };
          totalesGroup.push(group);
       }
       group._sum.monto += (m.monto || 0);
       group._sum.montoUSD += (m.montoUSD || 0);
    });
    
    const ingARS = totalesGroup.filter(t => t.tipo === 'ingreso' && (t.moneda === 'ARS' || !t.moneda));
    const egrARS = totalesGroup.filter(t => t.tipo === 'egreso' && (t.moneda === 'ARS' || !t.moneda));
    const totalIngresosARS = ingARS.reduce((acc, curr) => acc + (curr._sum.monto || 0), 0);
    const totalEgresosARS = egrARS.reduce((acc, curr) => acc + (curr._sum.monto || 0), 0);
    const saldoNetoARS = totalIngresosARS - totalEgresosARS;

    const ingUSD = totalesGroup.filter(t => t.tipo === 'ingreso' && t.moneda === 'USD');
    const egrUSD = totalesGroup.filter(t => t.tipo === 'egreso' && t.moneda === 'USD');
    const totalIngresosUSD = ingUSD.reduce((acc, curr) => acc + (curr._sum.montoUSD || curr._sum.monto || 0), 0);
    const totalEgresosUSD = egrUSD.reduce((acc, curr) => acc + (curr._sum.montoUSD || curr._sum.monto || 0), 0);
    const saldoNetoUSD = totalIngresosUSD - totalEgresosUSD;

    const anioParam = searchParams.get('anio');
    const targetYear = anioParam ? parseInt(anioParam) : new Date().getFullYear();
    
    const movimientosAnio = await firestoreDb.findMany('movimientos', {
      where: {
        fecha: {
          gte: new Date(`${targetYear}-01-01T00:00:00.000Z`),
          lte: new Date(`${targetYear}-12-31T23:59:59.999Z`)
        }
      }
    });

    const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const estadisticasMensuales = mesesNombres.map((mes, index) => {
      const delMes = movimientosAnio.filter((m) => new Date(m.fecha).getMonth() === index);
      
      const delMesARS = delMes.filter((m) => m.moneda === 'ARS' || !m.moneda);
      const ingARS = delMesARS.filter((m) => m.tipo === "ingreso").reduce((a, b) => a + b.monto, 0);
      const egrARS = delMesARS.filter((m) => m.tipo === "egreso").reduce((a, b) => a + b.monto, 0);

      const delMesUSD = delMes.filter((m) => m.moneda === 'USD');
      const ingUSD = delMesUSD.filter((m) => m.tipo === "ingreso").reduce((a, b) => a + (b.montoUSD || b.monto || 0), 0);
      const egrUSD = delMesUSD.filter((m) => m.tipo === "egreso").reduce((a, b) => a + (b.montoUSD || b.monto || 0), 0);

      return {
        mesIndex: index,
        mes,
        ingresos: ingARS,
        egresos: egrARS,
        balance: ingARS - egrARS,
        ingresosUSD: ingUSD,
        egresosUSD: egrUSD,
        balanceUSD: ingUSD - egrUSD,
      };
    });

    const ingresosAnio = estadisticasMensuales.reduce((acc, m) => acc + m.ingresos, 0);
    const egresosAnio = estadisticasMensuales.reduce((acc, m) => acc + m.egresos, 0);
    const balanceAnio = ingresosAnio - egresosAnio;

    const ingresosAnioUSD = estadisticasMensuales.reduce((acc, m) => acc + m.ingresosUSD, 0);
    const egresosAnioUSD = estadisticasMensuales.reduce((acc, m) => acc + m.egresosUSD, 0);
    const balanceAnioUSD = ingresosAnioUSD - egresosAnioUSD;

    const resumen = {
      totalIngresos: totalIngresosARS,
      totalEgresos: totalEgresosARS,
      saldoNeto: saldoNetoARS,
      totalIngresosARS,
      totalEgresosARS,
      saldoNetoARS,
      totalIngresosUSD,
      totalEgresosUSD,
      saldoNetoUSD,
      anioActual: targetYear,
      ingresosAnio,
      egresosAnio,
      balanceAnio,
      ingresosAnioUSD,
      egresosAnioUSD,
      balanceAnioUSD,
      estadisticasMensuales
    };

    return NextResponse.json({ 
      data, 
      paginacion: { total, page, limit: pageSize, totalPages: Math.ceil(total / pageSize) }, 
      totales: totalesGroup, 
      resumen 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error in finanzas:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: (error as Error).message, stack: (error as Error).stack }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tipo,
      categoria,
      planCuenta,
      moneda = 'ARS',
      monto = 0,
      montoUSD,
      cotizacionUSD,
      medioPago,
      cajaId,
      ordenId,
      clienteId,
      proveedorId,
      equipoItemId,
      fecha,
      concepto,
      comprobanteUrl
    } = body;

    if (!tipo || !medioPago || !concepto) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (tipo, medioPago, concepto)' }, { status: 400 });
    }

    const movimiento = await firestoreDb.create('movimientos', {
      tipo,
      categoria: categoria || (tipo === 'ingreso' ? 'cobro_general' : 'gasto_general'),
      planCuenta: planCuenta || null,
      moneda: moneda || 'ARS',
      monto: Math.round(parseFloat(monto || 0)),
      montoUSD: montoUSD ? Math.round(parseFloat(montoUSD)) : null,
      cotizacionUSD: cotizacionUSD ? parseFloat(cotizacionUSD) : null,
      medioPago,
      cajaId: cajaId ? parseInt(cajaId) : undefined,
      ordenId: ordenId ? parseInt(ordenId) : undefined,
      clienteId: clienteId ? parseInt(clienteId) : undefined,
      proveedorId: proveedorId ? parseInt(proveedorId) : undefined,
      equipoItemId: equipoItemId ? parseInt(equipoItemId) : undefined,
      fecha: fecha ? new Date(fecha).toISOString() : new Date().toISOString(),
      concepto,
      comprobanteUrl: comprobanteUrl || null
    });

    return NextResponse.json(movimiento, { status: 201 });
  } catch (error: any) {
    console.error('Error en POST finanzas:', error);
    return NextResponse.json({ error: 'Error al registrar movimiento', details: error.message }, { status: 500 });
  }
}
