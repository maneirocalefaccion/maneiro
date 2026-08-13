import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';
import { inventarioSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      firestoreDb.findMany('inventario', { 
        skip, 
        take: pageSize, 
        orderBy: { createdAt: 'desc' }
      }),
      firestoreDb.count('inventario', )
    ]);

    return NextResponse.json({ data, total, page, pageSize });
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
    const {
      nombre,
      tipo = 'equipo',
      numeroSerie,
      proveedor,
      proveedorId,
      precioCompra = 0,
      precioVentaSugerido,
      stock = 1,
      ubicacion = 'Depósito',
      fechaInicioGarantia,
      fechaFinGarantia,
      facturaCompraUrl,
      facturaVentaUrl,
      remitoUrl
    } = body;

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const item = await firestoreDb.create('inventario', {
      nombre,
      tipo,
      numeroSerie: numeroSerie || null,
      proveedor: proveedor || null,
      proveedorId: proveedorId ? parseInt(proveedorId) : undefined,
      precioCompra: parseFloat(precioCompra || 0),
      precioVentaSugerido: precioVentaSugerido ? parseFloat(precioVentaSugerido) : null,
      stock: parseInt(stock || 1),
      ubicacion: ubicacion || 'Depósito',
      fechaInicioGarantia: fechaInicioGarantia ? new Date(fechaInicioGarantia).toISOString() : null,
      fechaFinGarantia: fechaFinGarantia ? new Date(fechaFinGarantia).toISOString() : null,
      facturaCompraUrl: facturaCompraUrl || null,
      facturaVentaUrl: facturaVentaUrl || null,
      remitoUrl: remitoUrl || null,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear item de inventario:', error);
    return NextResponse.json({ error: 'Error al crear item', details: error.message }, { status: 500 });
  }
}
