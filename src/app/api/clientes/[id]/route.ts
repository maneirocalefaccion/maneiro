import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';
import { clienteSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const cliente = await firestoreDb.findById('clientes', id);

    if (!cliente || cliente.activo === false) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    return NextResponse.json(cliente);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error GET /api/clientes/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();
    const validated = clienteSchema.partial().parse(body);

    const existing = await firestoreDb.findById('clientes', id);
    if (!existing) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    const cliente = await firestoreDb.update('clientes', id, validated);
    return NextResponse.json(cliente);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error PUT /api/clientes/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const existing = await firestoreDb.findById('clientes', id);
    if (!existing) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    await firestoreDb.update('clientes', id, { activo: false });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error DELETE /api/clientes/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
