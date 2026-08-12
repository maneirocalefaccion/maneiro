import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const empresaId = searchParams.get('empresaId');

    let cuentas: any[];
    if (empresaId) {
      cuentas = await prisma.$queryRawUnsafe(
        `SELECT * FROM CuentaBancaria WHERE empresaId = ? AND activa = 1 ORDER BY id ASC`,
        parseInt(empresaId)
      );
    } else {
      cuentas = await prisma.$queryRawUnsafe(`SELECT * FROM CuentaBancaria WHERE activa = 1 ORDER BY id ASC`);
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

    await prisma.$executeRawUnsafe(
      `INSERT INTO CuentaBancaria (empresaId, banco, tipoCuenta, numeroCuenta, cbu, alias, moneda, activa, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      parseInt(empresaId),
      banco.trim(),
      tipoCuenta,
      numeroCuenta || null,
      cbu || null,
      alias || null,
      moneda
    );

    const created: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM CuentaBancaria WHERE empresaId = ? AND banco = ? ORDER BY id DESC LIMIT 1`,
      parseInt(empresaId),
      banco.trim()
    );

    return NextResponse.json(created[0], { status: 201 });
  } catch (error: any) {
    console.error('Error POST /api/cuentas-bancarias:', error);
    return NextResponse.json({ error: 'Error al crear cuenta bancaria' }, { status: 500 });
  }
}
