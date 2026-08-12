import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        direcciones: true,
        equipoItems: {
          include: { direccion: true }
        },
        ordenes: {
          orderBy: { createdAt: 'desc' },
          include: {
            direccion: true,
            lineasManoObra: true,
            lineasRepuesto: true,
            lineasOtroCosto: true,
            viatico: true,
            movimientosFinancieros: true
          }
        }
      }
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json(cliente);
  } catch (error: any) {
    console.error('Error al obtener historial técnico de cliente:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
