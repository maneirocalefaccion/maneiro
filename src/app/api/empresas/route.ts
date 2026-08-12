import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const rawEmpresas: any[] = await prisma.$queryRawUnsafe(`
      SELECT * FROM Empresa WHERE activa = 1 ORDER BY razonSocial ASC
    `);

    // Fetch bank accounts for each company
    const empresasConCuentas = await Promise.all(
      rawEmpresas.map(async (emp) => {
        const cuentas: any[] = await prisma.$queryRawUnsafe(
          `SELECT * FROM CuentaBancaria WHERE empresaId = ? AND activa = 1 ORDER BY id ASC`,
          emp.id
        );
        return { ...emp, cuentasBancarias: cuentas };
      })
    );

    // If no companies exist, seed default "Maneiro Climatización"
    if (empresasConCuentas.length === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO Empresa (razonSocial, cuit, condIva, activa, createdAt, updatedAt) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        'Maneiro Climatización',
        '30-71829384-9',
        'Responsable Inscripto'
      );
      const newEmpresas: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM Empresa WHERE razonSocial = 'Maneiro Climatización' LIMIT 1`);
      if (newEmpresas.length > 0) {
        const mainId = newEmpresas[0].id;
        await prisma.$executeRawUnsafe(
          `INSERT INTO CuentaBancaria (empresaId, banco, tipoCuenta, numeroCuenta, cbu, alias, moneda, activa, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          mainId,
          'Banco Galicia',
          'Cuenta Corriente',
          'CC 1024-8 044-3',
          '0070044320000010248039',
          'MANEIRO.CLIMA.BSAS',
          'ARS'
        );
        newEmpresas[0].cuentasBancarias = await prisma.$queryRawUnsafe(`SELECT * FROM CuentaBancaria WHERE empresaId = ?`, mainId);
      }
      return NextResponse.json({ data: newEmpresas, total: newEmpresas.length });
    }

    return NextResponse.json({ data: empresasConCuentas, total: empresasConCuentas.length });
  } catch (error: any) {
    console.error('Error GET /api/empresas:', error);
    return NextResponse.json({ error: 'Error al obtener empresas', details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razonSocial, cuit, condIva = 'Responsable Inscripto', direccion, telefono, email } = body;

    if (!razonSocial || !razonSocial.trim()) {
      return NextResponse.json({ error: 'La razón social es requerida' }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO Empresa (razonSocial, cuit, condIva, direccion, telefono, email, activa, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      razonSocial.trim(),
      cuit || null,
      condIva,
      direccion || null,
      telefono || null,
      email || null
    );

    const created: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM Empresa WHERE razonSocial = ? ORDER BY id DESC LIMIT 1`,
      razonSocial.trim()
    );

    return NextResponse.json({ ...created[0], cuentasBancarias: [] }, { status: 201 });
  } catch (error: any) {
    console.error('Error POST /api/empresas:', error);
    return NextResponse.json({ error: 'Error al crear empresa', details: String(error) }, { status: 500 });
  }
}
