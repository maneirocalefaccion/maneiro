import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { chequeSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const cheque = await prisma.cheque.findUniqueOrThrow({
      where: { id }
    });
    return NextResponse.json(cheque);
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();
    const validated = chequeSchema.partial().parse(body);

    const rawPrevious: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM Cheque WHERE id = ?`, id);
    const chequePrevio = rawPrevious[0];
    if (!chequePrevio) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (body.estado !== undefined) { fieldsToUpdate.push('estado = ?'); values.push(body.estado); }
    if (body.destino !== undefined) { fieldsToUpdate.push('destino = ?'); values.push(body.destino); }
    if (body.entregadoPor !== undefined) { fieldsToUpdate.push('entregadoPor = ?'); values.push(body.entregadoPor); }
    if (body.banco !== undefined) { fieldsToUpdate.push('banco = ?'); values.push(body.banco); }
    if (body.numero !== undefined) { fieldsToUpdate.push('numero = ?'); values.push(body.numero); }
    if (body.librador !== undefined) { fieldsToUpdate.push('librador = ?'); values.push(body.librador); }
    if (body.monto !== undefined) { fieldsToUpdate.push('monto = ?'); values.push(body.monto); }
    fieldsToUpdate.push('updatedAt = CURRENT_TIMESTAMP');

    if (fieldsToUpdate.length > 0) {
      values.push(id);
      await prisma.$executeRawUnsafe(
        `UPDATE Cheque SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
        ...values
      );
    }

    const rawUpdated: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM Cheque WHERE id = ?`, id);
    const updated = rawUpdated[0];

    if (body.estado && body.estado !== chequePrevio.estado) {
      if (body.estado === 'depositado') {
        await prisma.movimientoFinanciero.create({
          data: {
            tipo: 'ingreso',
            categoria: 'movimiento_cajas',
            planCuenta: '5.2 Movimientos entre Cajas / Cuentas',
            moneda: 'ARS',
            monto: updated.monto,
            medioPago: 'Banco Santander / CC',
            fecha: new Date(),
            concepto: `[Depósito Cheque N° ${updated.numero}] - Banco ${updated.banco} (Librador: ${updated.librador})`
          }
        });
      } else if (body.estado === 'cobrado') {
        await prisma.movimientoFinanciero.create({
          data: {
            tipo: 'ingreso',
            categoria: 'movimiento_cajas',
            planCuenta: '5.2 Movimientos entre Cajas / Cuentas',
            moneda: 'ARS',
            monto: updated.monto,
            medioPago: 'Efectivo',
            fecha: new Date(),
            concepto: `[Cobro Cheque N° ${updated.numero}] - Banco ${updated.banco} (Librador: ${updated.librador})`
          }
        });
      }
    }

    return NextResponse.json(updated);
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await prisma.cheque.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
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
