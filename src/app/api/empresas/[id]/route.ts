import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = isNaN(parseInt(idStr)) ? idStr : parseInt(idStr);
    const body = await req.json();
    const { razonSocial, cuit, condIva, direccion, telefono, email, activa } = body;

    const data: any = {
      updatedAt: new Date().toISOString()
    };
    
    if (razonSocial !== undefined) data.razonSocial = razonSocial;
    if (cuit !== undefined) data.cuit = cuit || null;
    if (condIva !== undefined) data.condIva = condIva || 'Responsable Inscripto';
    if (direccion !== undefined) data.direccion = direccion || null;
    if (telefono !== undefined) data.telefono = telefono || null;
    if (email !== undefined) data.email = email || null;
    if (activa !== undefined) data.activa = activa ? true : false;

    const updated = await firestoreDb.update('empresas', id, data);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error PUT /api/empresas/[id]:', error);
    return NextResponse.json({ error: 'Error al actualizar empresa' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = isNaN(parseInt(idStr)) ? idStr : parseInt(idStr);
    
    await firestoreDb.update('empresas', id, { 
      activa: false,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error DELETE /api/empresas/[id]:', error);
    return NextResponse.json({ error: 'Error al desactivar empresa' }, { status: 500 });
  }
}
