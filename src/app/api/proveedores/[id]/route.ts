import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';
import { proveedorSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const proveedor = await firestoreDb.findById('proveedores', id);

    if (!proveedor || proveedor.activo === false) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    return NextResponse.json(proveedor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error GET /api/proveedores/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();
    const validated = proveedorSchema.partial().parse(body);

    const existing = await firestoreDb.findById('proveedores', id);
    if (!existing) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    const proveedor = await firestoreDb.update('proveedores', id, validated);
    return NextResponse.json(proveedor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error PUT /api/proveedores/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const existing = await firestoreDb.findById('proveedores', id);
    if (!existing) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    await firestoreDb.update('proveedores', id, { activo: false });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error DELETE /api/proveedores/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
