import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';
import { chequeSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      firestoreDb.findMany('cheques', { skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      firestoreDb.count('cheques', )
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
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

    const created = await firestoreDb.create('cheques', {
      tipo: tipo || 'recibido',
      numero,
      banco,
      librador,
      cuitLibrador: cuitLibrador || null,
      entregadoPor: entregadoPor || null,
      monto,
      fechaEmision: fechaEmisStr,
      fechaVencimiento: fechaVencStr,
      estado: estado || 'en_cartera',
      destino: destino || null,
      observaciones: observaciones || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error en POST /api/cheques:', error?.message || error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error?.message || String(error) }, { status: 500 });
  }
}
