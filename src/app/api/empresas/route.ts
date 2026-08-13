import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';

export async function GET(req: NextRequest) {
  try {
    const rawEmpresas = await firestoreDb.findMany('empresas', {
      where: { activa: true },
      orderBy: { razonSocial: 'asc' }
    });

    // Fetch bank accounts for each company
    const empresasConCuentas = await Promise.all(
      rawEmpresas.map(async (emp: any) => {
        const cuentas = await firestoreDb.findMany('cuentasBancarias', {
          where: { empresaId: emp.id, activa: true },
          orderBy: { id: 'asc' }
        });
        return { ...emp, cuentasBancarias: cuentas };
      })
    );

    // If no companies exist, seed default "Maneiro Climatización"
    if (empresasConCuentas.length === 0) {
      const nuevaEmpresa = await firestoreDb.create('empresas', {
        razonSocial: 'Maneiro Climatización',
        cuit: '30-71829384-9',
        condIva: 'Responsable Inscripto',
        activa: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const mainId = nuevaEmpresa.id;
      const nuevaCuenta = await firestoreDb.create('cuentasBancarias', {
        empresaId: mainId,
        banco: 'Banco Galicia',
        tipoCuenta: 'Cuenta Corriente',
        numeroCuenta: 'CC 1024-8 044-3',
        cbu: '0070044320000010248039',
        alias: 'MANEIRO.CLIMA.BSAS',
        moneda: 'ARS',
        activa: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      const newEmpresas = [{
        ...nuevaEmpresa,
        cuentasBancarias: [nuevaCuenta]
      }];

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

    const created = await firestoreDb.create('empresas', {
      razonSocial: razonSocial.trim(),
      cuit: cuit || null,
      condIva,
      direccion: direccion || null,
      telefono: telefono || null,
      email: email || null,
      activa: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ ...created, cuentasBancarias: [] }, { status: 201 });
  } catch (error: any) {
    console.error('Error POST /api/empresas:', error);
    return NextResponse.json({ error: 'Error al crear empresa', details: String(error) }, { status: 500 });
  }
}
