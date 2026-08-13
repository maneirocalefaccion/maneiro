import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';
import { taxonomiaSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      firestoreDb.findMany('taxonomia', { skip, take: pageSize, orderBy: { nombre: 'asc' } }),
      firestoreDb.count('taxonomia', )
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
    const validated = taxonomiaSchema.parse(body);

    const item = await firestoreDb.create('taxonomia', {
      data: validated
    });

    return NextResponse.json(item, { status: 201 });
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
