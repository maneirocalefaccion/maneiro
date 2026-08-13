import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';
import { taxonomiaSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const item = await firestoreDb.findById('taxonomia', id);

    if (!item) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error GET /api/taxonomia/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();
    const validated = taxonomiaSchema.partial().parse(body);

    const existing = await firestoreDb.findById('taxonomia', id);
    if (!existing) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    const item = await firestoreDb.update('taxonomia', id, validated);
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error PUT /api/taxonomia/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const existing = await firestoreDb.findById('taxonomia', id);
    if (!existing) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    await firestoreDb.delete('taxonomia', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error DELETE /api/taxonomia/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
