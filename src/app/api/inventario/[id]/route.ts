import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const item = await firestoreDb.findById('inventario', id);

    if (!item) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error GET /api/inventario/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();

    const existing = await firestoreDb.findById('inventario', id);
    if (!existing) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    const {
      nombre,
      tipo,
      numeroSerie,
      proveedor,
      proveedorId,
      precioCompra,
      precioVentaSugerido,
      stock,
      ubicacion,
      fechaInicioGarantia,
      fechaFinGarantia,
      facturaCompraUrl,
      facturaVentaUrl,
      remitoUrl
    } = body;

    const dataToUpdate: any = {};
    if (nombre !== undefined) dataToUpdate.nombre = nombre;
    if (tipo !== undefined) dataToUpdate.tipo = tipo;
    if (numeroSerie !== undefined) dataToUpdate.numeroSerie = numeroSerie || null;
    if (proveedor !== undefined) dataToUpdate.proveedor = proveedor || null;
    if (proveedorId !== undefined) dataToUpdate.proveedorId = proveedorId ? parseInt(proveedorId) : null;
    if (precioCompra !== undefined) dataToUpdate.precioCompra = parseFloat(precioCompra || 0);
    if (precioVentaSugerido !== undefined) dataToUpdate.precioVentaSugerido = precioVentaSugerido ? parseFloat(precioVentaSugerido) : null;
    if (stock !== undefined) dataToUpdate.stock = parseInt(stock || 0);
    if (ubicacion !== undefined) dataToUpdate.ubicacion = ubicacion;
    if (fechaInicioGarantia !== undefined) dataToUpdate.fechaInicioGarantia = fechaInicioGarantia ? new Date(fechaInicioGarantia) : null;
    if (fechaFinGarantia !== undefined) dataToUpdate.fechaFinGarantia = fechaFinGarantia ? new Date(fechaFinGarantia) : null;
    if (facturaCompraUrl !== undefined) dataToUpdate.facturaCompraUrl = facturaCompraUrl;
    if (facturaVentaUrl !== undefined) dataToUpdate.facturaVentaUrl = facturaVentaUrl;
    if (remitoUrl !== undefined) dataToUpdate.remitoUrl = remitoUrl;

    const item = await firestoreDb.update('inventario', id, dataToUpdate);

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error al actualizar item de inventario:', error);
    return NextResponse.json({ error: 'Error al actualizar item', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const existing = await firestoreDb.findById('inventario', id);
    if (!existing) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    await firestoreDb.delete('inventario', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error DELETE /api/inventario/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
