import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const updated = await prisma.vencimiento.update({
      where: { id: numericId },
      data: validated,
    });

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

    await prisma.vencimiento.delete({
      where: { id: numericId },
    });

    return NextResponse.json({ message: 'Vencimiento eliminado' });
  } catch (error) {
    console.error('Error DELETE /api/vencimientos/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
