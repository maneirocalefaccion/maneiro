import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { chequeSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.cheque.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.cheque.count()
    ]);

    return NextResponse.json({ data, total, page, pageSize });
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = chequeSchema.parse(body);

    const {
      tipo,
      numero,
      banco,
      librador,
      cuitLibrador,
      entregadoPor,
      monto,
      fechaEmision,
      fechaVencimiento,
      estado,
      destino,
      observaciones
    } = validated;

    const fechaEmisStr = new Date(fechaEmision).toISOString();
    const fechaVencStr = new Date(fechaVencimiento).toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO Cheque (tipo, numero, banco, librador, cuitLibrador, entregadoPor, monto, fechaEmision, fechaVencimiento, estado, destino, observaciones, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      tipo || 'recibido',
      numero,
      banco,
      librador,
      cuitLibrador || null,
      entregadoPor || null,
      monto,
      fechaEmisStr,
      fechaVencStr,
      estado || 'en_cartera',
      destino || null,
      observaciones || null
    );

    const created: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM Cheque ORDER BY id DESC LIMIT 1`
    );

    return NextResponse.json(created[0], { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error en POST /api/cheques:', error?.message || error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error?.message || String(error) }, { status: 500 });
  }
}
