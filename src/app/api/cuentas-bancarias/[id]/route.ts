import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    // Keep as string if Firestore uses string IDs, or use parseInt if it's numeric in your setup. 
    // Usually Firestore IDs are strings, so we can just pass idStr if it works for your data model.
    // If we parse to int, we'll do:
    const id = isNaN(parseInt(idStr)) ? idStr : parseInt(idStr);
    
    const body = await req.json();
    const { banco, tipoCuenta, numeroCuenta, cbu, alias, moneda, activa } = body;

    const data: any = {
      updatedAt: new Date().toISOString()
    };
    
    if (banco !== undefined) data.banco = banco;
    if (tipoCuenta !== undefined) data.tipoCuenta = tipoCuenta || 'Cuenta Corriente';
    if (numeroCuenta !== undefined) data.numeroCuenta = numeroCuenta || null;
    if (cbu !== undefined) data.cbu = cbu || null;
    if (alias !== undefined) data.alias = alias || null;
    if (moneda !== undefined) data.moneda = moneda || 'ARS';
    if (activa !== undefined) data.activa = activa ? true : false;

    const updated = await firestoreDb.update('cuentasBancarias', id, data);
    
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error PUT /api/cuentas-bancarias/[id]:', error);
    return NextResponse.json({ error: 'Error al actualizar cuenta bancaria' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = isNaN(parseInt(idStr)) ? idStr : parseInt(idStr);
    
    await firestoreDb.update('cuentasBancarias', id, { 
      activa: false, 
      updatedAt: new Date().toISOString() 
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error DELETE /api/cuentas-bancarias/[id]:', error);
    return NextResponse.json({ error: 'Error al desactivar cuenta bancaria' }, { status: 500 });
  }
}
