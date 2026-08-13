import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';

const vencimientoSchema = z.object({
  servicio: z.string().min(1, 'El nombre del servicio es requerido'),
  monto: z.number().int('El monto debe ser en centavos'),
  fechaVencimiento: z.union([z.string(), z.date()]).transform(v => new Date(v)),
  pagado: z.boolean().default(false),
  fechaPago: z.union([z.string(), z.date()]).nullable().optional().transform(v => v ? new Date(v) : null),
  comprobanteUrl: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado'); // 'pendientes' | 'pagados' | 'todos'

    let where: any = {};
    if (estado === 'pendientes') where.pagado = false;
    if (estado === 'pagados') where.pagado = true;

    const vencimientos = await firestoreDb.findMany('vencimientos', {
      where,
      orderBy: { pagado: 'asc', fechaVencimiento: 'asc' }
    });

    return NextResponse.json({ data: vencimientos });
  } catch (error) {
    console.error('Error GET /api/vencimientos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = vencimientoSchema.parse(body);

    const nuevo = await firestoreDb.create('vencimientos', validated);

    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error POST /api/vencimientos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
