import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';

const vencimientoUpdateSchema = z.object({
  servicio: z.string().optional(),
  monto: z.number().int().optional(),
  fechaVencimiento: z.union([z.string(), z.date()]).optional().transform(v => v ? new Date(v) : undefined),
  pagado: z.boolean().optional(),
  fechaPago: z.union([z.string(), z.date()]).nullable().optional().transform(v => v ? new Date(v) : null),
  comprobanteUrl: z.string().nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id);
    const body = await req.json();
    const validated = vencimientoUpdateSchema.parse(body);

    const existing = await firestoreDb.findById('vencimientos', numericId);
    if (!existing) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    const updated = await firestoreDb.update('vencimientos', numericId, validated);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error PUT /api/vencimientos/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id);

    const existing = await firestoreDb.findById('vencimientos', numericId);
    if (!existing) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    await firestoreDb.delete('vencimientos', numericId);

    return NextResponse.json({ message: 'Vencimiento eliminado' });
  } catch (error) {
    console.error('Error DELETE /api/vencimientos/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
