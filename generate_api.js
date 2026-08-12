const fs = require('fs');
const path = require('path');

const errorHandling = `  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaError = error;
    if (prismaError.code === 'P2025') return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    if (prismaError.code === 'P2002') return NextResponse.json({ error: 'Registro duplicado' }, { status: 409 });
    if (prismaError.code === 'P2003') return NextResponse.json({ error: 'No se puede eliminar: tiene registros relacionados' }, { status: 409 });
  }
  console.error('Error:', error);
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });`;

function writeFile(relativePath, content) {
  const fullPath = path.join(__dirname, 'src', 'app', 'api', relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
}

// CLIENTES
writeFile('clientes/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { clienteSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.cliente.findMany({
        where: { activo: true },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.cliente.count({ where: { activo: true } })
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
${errorHandling}
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = clienteSchema.parse(body);

    const cliente = await prisma.cliente.create({
      data: {
        ...validated,
        activo: true
      }
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
${errorHandling}
  }
}`);

writeFile('clientes/[id]/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { clienteSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cliente = await prisma.cliente.findUniqueOrThrow({
      where: { id, activo: true }
    });
    return NextResponse.json(cliente);
  } catch (error) {
${errorHandling}
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = clienteSchema.partial().parse(body);

    const cliente = await prisma.cliente.update({
      where: { id },
      data: validated
    });
    return NextResponse.json(cliente);
  } catch (error) {
${errorHandling}
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.cliente.update({
      where: { id },
      data: { activo: false }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
${errorHandling}
  }
}`);

writeFile('clientes/[id]/cuenta-corriente/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const pageSize = parseInt(req.nextUrl.searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [ordenes, pagos] = await prisma.$transaction(async (tx) => {
      const o = await tx.orden.findMany({
        where: { clienteId: id },
        skip, take: pageSize, orderBy: { createdAt: 'desc' }
      });
      const p = await tx.movimientoFinanciero.findMany({
        where: { entidadId: id, entidadTipo: 'CLIENTE' },
        skip, take: pageSize, orderBy: { fecha: 'desc' }
      });
      return [o, p];
    });

    const saldo = pagos.reduce((acc, p) => acc + p.monto, 0) - ordenes.reduce((acc, o) => acc + o.total, 0);

    return NextResponse.json({ ordenes, pagos, saldo, page, pageSize });
  } catch (error) {
${errorHandling}
  }
}`);

// PROVEEDORES
writeFile('proveedores/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { proveedorSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.proveedor.findMany({
        where: { activo: true },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.proveedor.count({ where: { activo: true } })
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
${errorHandling}
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = proveedorSchema.parse(body);

    const proveedor = await prisma.proveedor.create({
      data: {
        ...validated,
        activo: true
      }
    });

    return NextResponse.json(proveedor, { status: 201 });
  } catch (error) {
${errorHandling}
  }
}`);

writeFile('proveedores/[id]/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { proveedorSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proveedor = await prisma.proveedor.findUniqueOrThrow({
      where: { id, activo: true }
    });
    return NextResponse.json(proveedor);
  } catch (error) {
${errorHandling}
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = proveedorSchema.partial().parse(body);

    const proveedor = await prisma.proveedor.update({
      where: { id },
      data: validated
    });
    return NextResponse.json(proveedor);
  } catch (error) {
${errorHandling}
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.proveedor.update({
      where: { id },
      data: { activo: false }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
${errorHandling}
  }
}`);

// FINANZAS
writeFile('finanzas/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { movimientoFinancieroSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.movimientoFinanciero.findMany({
        skip,
        take: pageSize,
        orderBy: { fecha: 'desc' }
      }),
      prisma.movimientoFinanciero.count()
    ]);
    
    const totales = await prisma.movimientoFinanciero.groupBy({
      by: ['tipo'],
      _sum: { monto: true }
    });

    return NextResponse.json({ data, total, page, pageSize, totales });
  } catch (error) {
${errorHandling}
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = movimientoFinancieroSchema.parse(body);

    const movimiento = await prisma.movimientoFinanciero.create({
      data: validated
    });

    return NextResponse.json(movimiento, { status: 201 });
  } catch (error) {
${errorHandling}
  }
}`);

writeFile('finanzas/[id]/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { movimientoFinancieroSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const mov = await prisma.movimientoFinanciero.findUniqueOrThrow({
      where: { id }
    });
    return NextResponse.json(mov);
  } catch (error) {
${errorHandling}
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = movimientoFinancieroSchema.partial().parse(body);

    const mov = await prisma.movimientoFinanciero.update({
      where: { id },
      data: validated
    });
    return NextResponse.json(mov);
  } catch (error) {
${errorHandling}
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.movimientoFinanciero.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
${errorHandling}
  }
}`);

// CAJAS
writeFile('cajas/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;
    
    const [data, total] = await Promise.all([
      prisma.caja.findMany({ skip, take: pageSize, orderBy: { nombre: 'asc' } }),
      prisma.caja.count()
    ]);

    const saldos = await prisma.movimientoFinanciero.groupBy({
      by: ['cajaId'],
      _sum: { monto: true },
      where: {
        cajaId: { in: data.map(c => c.id) }
      }
    });

    const dataConSaldos = data.map(caja => {
      const saldo = saldos.find(s => s.cajaId === caja.id)?._sum.monto || 0;
      return { ...caja, saldo };
    });

    return NextResponse.json({ data: dataConSaldos, total, page, pageSize });
  } catch (error) {
${errorHandling}
  }
}`);

// ORDENES
writeFile('ordenes/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ordenSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.orden.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.orden.count()
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
${errorHandling}
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = ordenSchema.parse(body);

    const orden = await prisma.$transaction(async (tx) => {
      return await tx.orden.create({
        data: validated
      });
    });

    return NextResponse.json(orden, { status: 201 });
  } catch (error) {
${errorHandling}
  }
}`);

writeFile('ordenes/[id]/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ordenSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orden = await prisma.orden.findUniqueOrThrow({
      where: { id }
    });
    return NextResponse.json(orden);
  } catch (error) {
${errorHandling}
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = ordenSchema.partial().parse(body);

    const orden = await prisma.$transaction(async (tx) => {
      return await tx.orden.update({
        where: { id },
        data: validated
      });
    });

    return NextResponse.json(orden);
  } catch (error) {
${errorHandling}
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.$transaction(async (tx) => {
      await tx.orden.delete({ where: { id } });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
${errorHandling}
  }
}`);

// INVENTARIO
writeFile('inventario/route.ts', `import { NextResponse, NextRequest } from 'next/server';
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
      prisma.inventario.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.inventario.count()
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
${errorHandling}
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = inventarioSchema.parse(body);

    const item = await prisma.inventario.create({
      data: validated
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
${errorHandling}
  }
}`);

writeFile('inventario/[id]/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { inventarioSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await prisma.inventario.findUniqueOrThrow({
      where: { id }
    });
    return NextResponse.json(item);
  } catch (error) {
${errorHandling}
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = inventarioSchema.partial().parse(body);

    const item = await prisma.inventario.update({
      where: { id },
      data: validated
    });
    return NextResponse.json(item);
  } catch (error) {
${errorHandling}
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.inventario.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
${errorHandling}
  }
}`);

// TAXONOMIA
writeFile('taxonomia/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { taxonomiaSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.taxonomia.findMany({ skip, take: pageSize, orderBy: { nombre: 'asc' } }),
      prisma.taxonomia.count()
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
${errorHandling}
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = taxonomiaSchema.parse(body);

    const item = await prisma.taxonomia.create({
      data: validated
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
${errorHandling}
  }
}`);

writeFile('taxonomia/[id]/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { taxonomiaSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await prisma.taxonomia.findUniqueOrThrow({
      where: { id }
    });
    return NextResponse.json(item);
  } catch (error) {
${errorHandling}
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = taxonomiaSchema.partial().parse(body);

    const item = await prisma.taxonomia.update({
      where: { id },
      data: validated
    });
    return NextResponse.json(item);
  } catch (error) {
${errorHandling}
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.taxonomia.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
${errorHandling}
  }
}`);

// EMPLEADOS
writeFile('empleados/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { empleadoSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.empleado.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.empleado.count()
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
${errorHandling}
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = empleadoSchema.parse(body);

    const empleado = await prisma.empleado.create({
      data: validated
    });

    return NextResponse.json(empleado, { status: 201 });
  } catch (error) {
${errorHandling}
  }
}`);

writeFile('empleados/[id]/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { empleadoSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const empleado = await prisma.empleado.findUniqueOrThrow({
      where: { id }
    });
    return NextResponse.json(empleado);
  } catch (error) {
${errorHandling}
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = empleadoSchema.partial().parse(body);

    const empleado = await prisma.empleado.update({
      where: { id },
      data: validated
    });
    return NextResponse.json(empleado);
  } catch (error) {
${errorHandling}
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.empleado.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
${errorHandling}
  }
}`);

// CHEQUES
writeFile('cheques/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { chequeSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.cheque.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.cheque.count()
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
${errorHandling}
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = chequeSchema.parse(body);

    const cheque = await prisma.cheque.create({
      data: validated
    });

    return NextResponse.json(cheque, { status: 201 });
  } catch (error) {
${errorHandling}
  }
}`);

writeFile('cheques/[id]/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { chequeSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cheque = await prisma.cheque.findUniqueOrThrow({
      where: { id }
    });
    return NextResponse.json(cheque);
  } catch (error) {
${errorHandling}
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = chequeSchema.partial().parse(body);

    const cheque = await prisma.cheque.update({
      where: { id },
      data: validated
    });
    return NextResponse.json(cheque);
  } catch (error) {
${errorHandling}
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.cheque.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
${errorHandling}
  }
}`);

// CONFIGURACION
writeFile('configuracion/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { configuracionSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const configuracion = await prisma.configuracion.findFirst();
    return NextResponse.json(configuracion || {});
  } catch (error) {
${errorHandling}
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = configuracionSchema.parse(body);

    const existing = await prisma.configuracion.findFirst();
    let config;
    if (existing) {
      config = await prisma.configuracion.update({
        where: { id: existing.id },
        data: validated
      });
    } else {
      config = await prisma.configuracion.create({
        data: validated
      });
    }

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
${errorHandling}
  }
}`);

// UPLOAD
writeFile('upload/route.ts', `import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const fileUrl = '/uploads/' + file.name;
    return NextResponse.json({ url: fileUrl }, { status: 201 });
  } catch (error) {
${errorHandling}
  }
}`);

console.log('DONE');
