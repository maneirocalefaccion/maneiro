import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';
import { configuracionSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const configViatico = await firestoreDb.findById('configuracion', 'viatico');
    const configImpuesto = await firestoreDb.findById('configuracion', 'impuesto');
    return NextResponse.json({ viatico: configViatico || {}, impuesto: configImpuesto || {} });
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
    const validated = configuracionSchema.parse(body);

    if (validated.viatico) {
      const existing = await firestoreDb.findById('configuracion', 'viatico');
      if (existing) {
        await firestoreDb.update('configuracion', 'viatico', validated.viatico);
      } else {
        await firestoreDb.create('configuracion', { id: 'viatico', ...validated.viatico });
      }
    }

    if (validated.impuesto) {
      const imp = validated.impuesto;
      const impData = {
        razonSocial: imp.razonSocial || 'Maneiro Climatización',
        bancoNombre: imp.bancoNombre || null,
        bancoNumeroCuenta: imp.bancoNumeroCuenta || null,
        bancoCbu: imp.bancoCbu || null,
        bancoAlias: imp.bancoAlias || null,
        bancoCuit: imp.bancoCuit || null,
        ivaPorcentaje: imp.ivaPorcentaje || 21,
        tipoFacturaDefault: imp.tipoFacturaDefault || 'B'
      };

      const existing = await firestoreDb.findById('configuracion', 'impuesto');
      if (existing) {
        await firestoreDb.update('configuracion', 'impuesto', impData);
      } else {
        await firestoreDb.create('configuracion', { id: 'impuesto', ...impData });
      }
    }

    const configViatico = await firestoreDb.findById('configuracion', 'viatico');
    const configImpuesto = await firestoreDb.findById('configuracion', 'impuesto');

    return NextResponse.json({ viatico: configViatico || {}, impuesto: configImpuesto || {} }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error en POST /api/configuracion:', error?.message || error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error?.message || String(error) }, { status: 500 });
  }
}
