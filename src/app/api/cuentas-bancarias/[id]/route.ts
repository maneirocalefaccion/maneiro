import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();
    const { banco, tipoCuenta, numeroCuenta, cbu, alias, moneda, activa } = body;

    await prisma.$executeRawUnsafe(
      `UPDATE CuentaBancaria SET banco=?, tipoCuenta=?, numeroCuenta=?, cbu=?, alias=?, moneda=?, activa=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
      banco,
      tipoCuenta || 'Cuenta Corriente',
      numeroCuenta || null,
      cbu || null,
      alias || null,
      moneda || 'ARS',
      activa !== undefined ? (activa ? 1 : 0) : 1,
      id
    );

    const updated: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM CuentaBancaria WHERE id=?`, id);
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error('Error PUT /api/cuentas-bancarias/[id]:', error);
    return NextResponse.json({ error: 'Error al actualizar cuenta bancaria' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await prisma.$executeRawUnsafe(`UPDATE CuentaBancaria SET activa=0 WHERE id=?`, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error DELETE /api/cuentas-bancarias/[id]:', error);
    return NextResponse.json({ error: 'Error al desactivar cuenta bancaria' }, { status: 500 });
  }
}
