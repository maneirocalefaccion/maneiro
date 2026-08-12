import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const pageSize = parseInt(req.nextUrl.searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [ordenes, pagos] = await prisma.$transaction(async (tx) => {
      const o = await tx.orden.findMany({
        where: { clienteId: id },
        skip, take: pageSize, orderBy: { createdAt: 'desc' }
      });
      const p = await tx.movimientoFinanciero.findMany({
        where: { clienteId: id },
        skip, take: pageSize, orderBy: { fecha: 'desc' }
      });
      return [o, p];
    });

    const saldo = pagos.reduce((acc, p) => acc + p.monto, 0) - ordenes.reduce((acc, o) => acc + o.totalFinal, 0);

    return NextResponse.json({ ordenes, pagos, saldo, page, pageSize });
  } catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaError = error;
    if (prismaError.code === 'P2025') return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    if (prismaError.code === 'P2002') return NextResponse.json({ error: 'Registro duplicado' }, { status: 409 });
    if (prismaError.code === 'P2003') return NextResponse.json({ error: 'No se puede eliminar: tiene registros relacionados' }, { status: 409 });
  }
  console.error('Error:', error);
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
