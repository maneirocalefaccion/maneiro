import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { inventarioSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.equipoItem.findMany({ 
        skip, 
        take: pageSize, 
        orderBy: { createdAt: 'desc' },
        include: { cliente: true, direccion: true, proveedorRel: true }
      }),
      prisma.equipoItem.count()
    ]);

    return NextResponse.json({ data, total, page, pageSize });
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

    const item = await prisma.equipoItem.create({
      data: {
        nombre,
        tipo,
        numeroSerie: numeroSerie || null,
        proveedor: proveedor || null,
        proveedorId: proveedorId ? parseInt(proveedorId) : undefined,
        precioCompra: parseFloat(precioCompra || 0),
        precioVentaSugerido: precioVentaSugerido ? parseFloat(precioVentaSugerido) : null,
        stock: parseInt(stock || 1),
        ubicacion: ubicacion || 'Depósito',
        fechaInicioGarantia: fechaInicioGarantia ? new Date(fechaInicioGarantia) : null,
        fechaFinGarantia: fechaFinGarantia ? new Date(fechaFinGarantia) : null,
        facturaCompraUrl: facturaCompraUrl || null,
        facturaVentaUrl: facturaVentaUrl || null,
        remitoUrl: remitoUrl || null,
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear item de inventario:', error);
    return NextResponse.json({ error: 'Error al crear item', details: error.message }, { status: 500 });
  }
}
