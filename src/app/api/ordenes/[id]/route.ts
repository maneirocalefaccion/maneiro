import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ordenSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const orden = await prisma.orden.findUniqueOrThrow({
      where: { id },
      include: {
        cliente: true,
        direccion: true,
        lineasManoObra: true,
        lineasRepuesto: true,
        lineasOtroCosto: true,
        viatico: true,
        movimientosFinancieros: true,
      }
    });
    const sumIngresos = orden.movimientosFinancieros
      ? orden.movimientosFinancieros
          .filter((m: any) => m.tipo === 'ingreso')
          .reduce((acc: number, m: any) => acc + (m.monto || 0), 0)
      : 0;
    const montoCobradoReal = Math.max(orden.montoCobrado || 0, sumIngresos);

    return NextResponse.json({ ...orden, montoCobrado: montoCobradoReal });
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

    const {
      tipo,
      clienteId,
      direccionId,
      proveedorId,
      descripcion,
      estado,
      montoAnticipo,
      montoCobrado,
      totalSinIva,
      ivaMontoMonto,
      totalFinal,
      fechaInicioGarantia,
      fechaFinGarantia
    } = body;

    const dataToUpdate: any = {};
    if (tipo !== undefined) dataToUpdate.tipo = tipo;
    if (descripcion !== undefined) dataToUpdate.descripcion = descripcion;
    if (estado !== undefined) dataToUpdate.estado = estado;
    if (clienteId !== undefined) dataToUpdate.clienteId = clienteId ? parseInt(clienteId) : null;
    if (proveedorId !== undefined) dataToUpdate.proveedorId = proveedorId ? parseInt(proveedorId) : null;
    if (direccionId !== undefined) dataToUpdate.direccionId = direccionId ? parseInt(direccionId) : null;
    if (montoAnticipo !== undefined) dataToUpdate.montoAnticipo = parseFloat(montoAnticipo || 0);
    if (montoCobrado !== undefined) dataToUpdate.montoCobrado = parseFloat(montoCobrado || 0);
    if (totalSinIva !== undefined) dataToUpdate.totalSinIva = parseFloat(totalSinIva || 0);
    if (ivaMontoMonto !== undefined) dataToUpdate.ivaMontoMonto = parseFloat(ivaMontoMonto || 0);
    if (totalFinal !== undefined) dataToUpdate.totalFinal = parseFloat(totalFinal || 0);
    if (fechaInicioGarantia !== undefined) dataToUpdate.fechaInicioGarantia = fechaInicioGarantia ? new Date(fechaInicioGarantia) : null;
    if (fechaFinGarantia !== undefined) dataToUpdate.fechaFinGarantia = fechaFinGarantia ? new Date(fechaFinGarantia) : null;

    const orden = await prisma.orden.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json(orden);
  } catch (error: any) {
    console.error('Error al actualizar orden:', error);
    return NextResponse.json({ error: 'Error al actualizar orden', details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PUT(req, { params });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await prisma.$transaction(async (tx) => {
      await tx.orden.delete({ where: { id } });
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
