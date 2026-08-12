import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();
    const { razonSocial, cuit, condIva, direccion, telefono, email, activa } = body;

    await prisma.$executeRawUnsafe(
      `UPDATE Empresa SET razonSocial=?, cuit=?, condIva=?, direccion=?, telefono=?, email=?, activa=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
      razonSocial,
      cuit || null,
      condIva || 'Responsable Inscripto',
      direccion || null,
      telefono || null,
      email || null,
      activa !== undefined ? (activa ? 1 : 0) : 1,
      id
    );

    const updated: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM Empresa WHERE id=?`, id);
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error('Error PUT /api/empresas/[id]:', error);
    return NextResponse.json({ error: 'Error al actualizar empresa' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await prisma.$executeRawUnsafe(`UPDATE Empresa SET activa=0 WHERE id=?`, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error DELETE /api/empresas/[id]:', error);
    return NextResponse.json({ error: 'Error al desactivar empresa' }, { status: 500 });
  }
}
