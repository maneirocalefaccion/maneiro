import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const cliente: any = await firestoreDb.findById('clientes', id);

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Fetch related data separately (NoSQL doesn't have joins)
    const [direcciones, equipoItems, ordenes, movimientos] = await Promise.all([
      firestoreDb.findMany('direcciones', { where: { clienteId: id } }),
      firestoreDb.findMany('inventario', { where: { clienteId: id } }),
      firestoreDb.findMany('ordenes', { where: { clienteId: id } }),
      firestoreDb.findMany('movimientos', { where: { clienteId: id } }),
    ]);

    // Attach movimientos to their respective ordenes
    const ordenesConDetalle = ordenes.map((ord: any) => ({
      ...ord,
      movimientosFinancieros: movimientos.filter((m: any) => m.ordenId === ord.id),
    }));

    cliente.direcciones = direcciones;
    cliente.equipoItems = equipoItems;
    cliente.ordenes = ordenesConDetalle;

    return NextResponse.json(cliente);
  } catch (error: any) {
    console.error('Error al obtener historial técnico de cliente:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
