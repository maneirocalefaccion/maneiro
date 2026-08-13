import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;
    
    let data = await firestoreDb.findMany('cajas', { skip, take: pageSize, orderBy: { id: 'asc' } });
    let total = await firestoreDb.count('cajas', );

    if (total === 0) {
      await Promise.all([
          { nombre: '💵 Caja Principal (Pesos)', tipo: 'efectivo_ars' },
          { nombre: '💵 Caja Chica (Pesos)', tipo: 'caja_chica' },
          { nombre: '💵 Caja Dólares', tipo: 'efectivo_usd' },
          { nombre: '🏦 Banco (CC / Transferencia)', tipo: 'banco' },
          { nombre: '📱 Mercado Pago', tipo: 'mercadopago' },
          { nombre: '📑 Cheques en Cartera', tipo: 'cheques_cartera' },
        ].map((d: any) => firestoreDb.create('cajas', d)));
      data = await firestoreDb.findMany('cajas', { skip, take: pageSize, orderBy: { id: 'asc' } });
      total = data.length;
    }

    const movs = await firestoreDb.findMany('movimientos');

    const chequesEnCartera = await firestoreDb.findMany('cheques', {
      where: { estado: 'en_cartera' }
    });
    const totalChequesMonto = chequesEnCartera.reduce((a, b) => a + (b.monto || 0), 0);

    const dataConSaldos = data.map(caja => {
      if (caja.tipo === 'cheques_cartera') {
        return { ...caja, saldo: totalChequesMonto };
      }

      let saldo = 0;
      const cTipo = caja.tipo;
      
      movs.forEach(m => {
        const mpNorm = (m.medioPago || '').toLowerCase();
        const matchesCaja = m.cajaId === caja.id || (
          !m.cajaId && (
            (cTipo === 'efectivo_ars' && (mpNorm.includes('efectivo') || mpNorm.includes('principal')) && !mpNorm.includes('chica') && !mpNorm.includes('usd') && !mpNorm.includes('dolares')) ||
            (cTipo === 'caja_chica' && mpNorm.includes('chica')) ||
            (cTipo === 'efectivo_usd' && (mpNorm.includes('usd') || mpNorm.includes('dolares') || mpNorm.includes('dólares'))) ||
            (cTipo === 'banco' && (mpNorm.includes('transferencia') || mpNorm.includes('banco') || mpNorm.includes('cc'))) ||
            (cTipo === 'mercadopago' && (mpNorm.includes('mercado') || mpNorm.includes('mp')))
          )
        );

        if (matchesCaja) {
          const esUSD = cTipo === 'efectivo_usd';
          const val = esUSD ? (m.montoUSD || m.monto || 0) : (m.monto || 0);
          const delta = m.tipo === 'ingreso' ? val : -val;
          saldo += delta;
        }
      });

      return { ...caja, saldo };
    });

    return NextResponse.json({ data: dataConSaldos, total, page, pageSize });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
