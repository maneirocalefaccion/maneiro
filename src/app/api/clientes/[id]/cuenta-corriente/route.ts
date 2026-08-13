import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const pageSize = parseInt(req.nextUrl.searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const ordenes = await firestoreDb.findMany('ordenes', {
      where: { clienteId: id },
      skip, take: pageSize, orderBy: { createdAt: 'desc' }
    });
    const pagos = await firestoreDb.findMany('movimientos', {
      where: { clienteId: id },
      skip, take: pageSize, orderBy: { fecha: 'desc' }
    });

    const saldo = pagos.reduce((acc, p) => acc + p.monto, 0) - ordenes.reduce((acc, o) => acc + o.totalFinal, 0);

    return NextResponse.json({ ordenes, pagos, saldo, page, pageSize });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
