import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const empresaId = searchParams.get('empresaId');

    let cuentas: any[];
    if (empresaId) {
      cuentas = await firestoreDb.findMany('cuentasBancarias', {
        where: { empresaId: parseInt(empresaId), activa: true },
        orderBy: { id: 'asc' }
      });
    } else {
      cuentas = await firestoreDb.findMany('cuentasBancarias', {
        where: { activa: true },
        orderBy: { id: 'asc' }
      });
    }

    return NextResponse.json({ data: cuentas, total: cuentas.length });
  } catch (error: any) {
    console.error('Error GET /api/cuentas-bancarias:', error);
    return NextResponse.json({ error: 'Error al obtener cuentas bancarias' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, banco, tipoCuenta = 'Cuenta Corriente', numeroCuenta, cbu, alias, moneda = 'ARS' } = body;

    if (!empresaId || !banco) {
      return NextResponse.json({ error: 'Empresa y Banco son requeridos' }, { status: 400 });
    }

    const created = await firestoreDb.create('cuentasBancarias', {
      empresaId: parseInt(empresaId),
      banco: banco.trim(),
      tipoCuenta,
      numeroCuenta: numeroCuenta || null,
      cbu: cbu || null,
      alias: alias || null,
      moneda,
      activa: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error POST /api/cuentas-bancarias:', error);
    return NextResponse.json({ error: 'Error al crear cuenta bancaria' }, { status: 500 });
  }
}
