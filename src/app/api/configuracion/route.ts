import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { configuracionSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const configViatico = await prisma.configViatico.findFirst();
    const rawImp: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM ConfigImpuesto LIMIT 1`);
    const configImpuesto = rawImp[0] || {};
    return NextResponse.json({ viatico: configViatico || {}, impuesto: configImpuesto });
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
      const existing = await prisma.configViatico.findFirst();
      if (existing) {
        await prisma.configViatico.update({ where: { id: existing.id }, data: validated.viatico });
      } else {
        await prisma.configViatico.create({ data: validated.viatico });
      }
    }

    if (validated.impuesto) {
      const existing = await prisma.configImpuesto.findFirst();
      const imp = validated.impuesto;
      if (existing) {
        await prisma.$executeRawUnsafe(
          `UPDATE ConfigImpuesto SET razonSocial=?, bancoNombre=?, bancoNumeroCuenta=?, bancoCbu=?, bancoAlias=?, bancoCuit=?, ivaPorcentaje=?, tipoFacturaDefault=? WHERE id=?`,
          imp.razonSocial || 'Maneiro Climatización',
          imp.bancoNombre || null,
          imp.bancoNumeroCuenta || null,
          imp.bancoCbu || null,
          imp.bancoAlias || null,
          imp.bancoCuit || null,
          imp.ivaPorcentaje || 21,
          imp.tipoFacturaDefault || 'B',
          existing.id
        );
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO ConfigImpuesto (id, ivaPorcentaje, tipoFacturaDefault, razonSocial, bancoNombre, bancoNumeroCuenta, bancoCbu, bancoAlias, bancoCuit) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
          imp.ivaPorcentaje || 21,
          imp.tipoFacturaDefault || 'B',
          imp.razonSocial || 'Maneiro Climatización',
          imp.bancoNombre || null,
          imp.bancoNumeroCuenta || null,
          imp.bancoCbu || null,
          imp.bancoAlias || null,
          imp.bancoCuit || null
        );
      }
    }

    const configViatico = await prisma.configViatico.findFirst();
    const rawImp: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM ConfigImpuesto LIMIT 1`);
    const configImpuesto = rawImp[0] || {};

    return NextResponse.json({ viatico: configViatico, impuesto: configImpuesto }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error en POST /api/configuracion:', error?.message || error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error?.message || String(error) }, { status: 500 });
  }
}

