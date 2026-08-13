import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';
import { chequeSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const cheque = await firestoreDb.findById('cheques', idStr);
    return NextResponse.json(cheque);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
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

    const chequePrevio = await firestoreDb.findById('cheques', idStr);
    if (!chequePrevio) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

    const updateData: any = {};
    if (body.estado !== undefined) updateData.estado = body.estado;
    if (body.destino !== undefined) updateData.destino = body.destino;
    if (body.entregadoPor !== undefined) updateData.entregadoPor = body.entregadoPor;
    if (body.banco !== undefined) updateData.banco = body.banco;
    if (body.numero !== undefined) updateData.numero = body.numero;
    if (body.librador !== undefined) updateData.librador = body.librador;
    if (body.monto !== undefined) updateData.monto = body.monto;
    updateData.updatedAt = new Date().toISOString();

    const updated = await firestoreDb.update('cheques', idStr, updateData);

    if (body.estado && body.estado !== chequePrevio.estado) {
      if (body.estado === 'depositado') {
        await firestoreDb.create('movimientos', {
          tipo: 'ingreso',
          categoria: 'movimiento_cajas',
          planCuenta: '5.2 Movimientos entre Cajas / Cuentas',
          moneda: 'ARS',
          monto: updated.monto,
          medioPago: 'Banco Santander / CC',
          fecha: new Date(),
          concepto: `[Depósito Cheque N° ${updated.numero}] - Banco ${updated.banco} (Librador: ${updated.librador})`
        });
      } else if (body.estado === 'cobrado') {
        await firestoreDb.create('movimientos', {
          tipo: 'ingreso',
          categoria: 'movimiento_cajas',
          planCuenta: '5.2 Movimientos entre Cajas / Cuentas',
          moneda: 'ARS',
          monto: updated.monto,
          medioPago: 'Efectivo',
          fecha: new Date(),
          concepto: `[Cobro Cheque N° ${updated.numero}] - Banco ${updated.banco} (Librador: ${updated.librador})`
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await firestoreDb.delete('cheques', idStr);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
