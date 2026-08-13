import { NextResponse, NextRequest } from 'next/server';
import { firestoreDb } from '@/lib/firestoreDb';
import { z } from 'zod';
import { ordenSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      firestoreDb.findMany('ordenes', { 
        skip, 
        take: pageSize, 
      }),
      firestoreDb.count('ordenes', )
    ]);

    const dataConCobroReal = await Promise.all(data.map(async (ord) => {
      const movimientosFinancieros = await firestoreDb.findMany('movimientos', { where: { ordenId: ord.id } });
      const sumIngresos = movimientosFinancieros
        .filter((m: any) => m.tipo === 'ingreso')
        .reduce((acc: number, m: any) => acc + (m.monto || 0), 0);
      const montoCobradoReal = Math.max(ord.montoCobrado || 0, sumIngresos);
      
      let cliente = null;
      if (ord.clienteId) cliente = await firestoreDb.findById('clientes', ord.clienteId);
      let direccion = null;
      if (ord.direccionId) direccion = await firestoreDb.findById('direcciones', ord.direccionId);
      
      return {
        ...ord,
        cliente,
        direccion,
        movimientosFinancieros,
        montoCobrado: montoCobradoReal
      };
    }));

    return NextResponse.json({ data: dataConCobroReal, total, page, pageSize });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = await firestoreDb.count('ordenes', );
    const numero = body.numero || `1${String(count + 1).padStart(4, '0')}`;

    const {
      tipo,
      clienteId,
      direccionId,
      proveedorId,
      descripcion,
      estado = 'presupuesto',
      montoAnticipo = 0,
      montoCobrado = 0,
      totalSinIva = 0,
      ivaMontoMonto = 0,
      totalFinal = 0,
      fechaInicioGarantia,
      fechaFinGarantia,
      viatico,
      horasEmpleados = [],
      lineasManoObra = [],
      repuestos = [],
      lineasRepuesto = [],
      otrosCostos = [],
      lineasOtroCosto = []
    } = body;

    const finalManoObra = (horasEmpleados.length > 0 ? horasEmpleados : lineasManoObra).map((l: any) => ({
      empleadoId: l.empleadoId || 1,
      empleadoNombre: l.empleadoNombre || 'Empleado',
      modalidad: l.modalidad || 'hora',
      cantidad: parseFloat(l.horas || l.cantidad || 1),
      costoUnitario: parseFloat(l.costoUnitario || 0),
      precioUnitario: parseFloat(l.precioUnitario || 0),
      costoTotal: parseFloat(l.costoTotal || 0),
      subtotal: parseFloat(l.subtotal || 0)
    }));

    const finalRepuestos = (repuestos.length > 0 ? repuestos : lineasRepuesto).map((r: any) => ({
      equipoItemId: r.equipoItemId ? parseInt(r.equipoItemId) : undefined,
      descripcion: r.descripcion,
      cantidad: parseFloat(r.cantidad || 1),
      costoUnitario: parseFloat(r.costoUnitario || 0),
      precioVentaUnitario: parseFloat(r.precioVentaUnitario || 0),
      costo: parseFloat(r.costo || 0),
      subtotal: parseFloat(r.subtotal || 0)
    }));

    const finalOtrosCostos = (otrosCostos.length > 0 ? otrosCostos : lineasOtroCosto).map((o: any) => ({
      descripcion: o.descripcion,
      monto: parseFloat(o.monto || 0)
    }));

    let clienteNombre = '';
    let direccionInfo = '';
    if (clienteId) {
      const cliObj: any = await firestoreDb.findById('clientes', parseInt(clienteId));
      if (cliObj) clienteNombre = cliObj.nombre;
    }
    if (direccionId) {
      const dirObj: any = await firestoreDb.findById('direcciones', parseInt(direccionId));
      if (dirObj) direccionInfo = `${dirObj.nombre}${dirObj.direccion ? ` (${dirObj.direccion})` : ''}`;
    }

    const orden = await firestoreDb.create('ordenes', {
      numero,
      tipo: tipo || 'service',
      descripcion: descripcion || '',
      estado,
      clienteId: clienteId ? parseInt(clienteId) : undefined,
      proveedorId: proveedorId ? parseInt(proveedorId) : undefined,
      direccionId: direccionId ? parseInt(direccionId) : undefined,
      montoAnticipo: parseFloat(montoAnticipo || 0),
      montoCobrado: parseFloat(montoCobrado || 0),
      totalSinIva: parseFloat(totalSinIva || 0),
      ivaMontoMonto: parseFloat(ivaMontoMonto || 0),
      totalFinal: parseFloat(totalFinal || 0),
      fechaInicioGarantia: fechaInicioGarantia ? new Date(fechaInicioGarantia).toISOString() : undefined,
      fechaFinGarantia: fechaFinGarantia ? new Date(fechaFinGarantia).toISOString() : undefined,
      viatico: viatico ? {
        km: parseFloat(viatico.km || 0),
        costoFijo: parseFloat(viatico.costoFijo || 0),
        costoPorKm: parseFloat(viatico.costoPorKm || 0),
        viandas: parseFloat(viatico.viandas || 0),
        total: parseFloat(viatico.total || 0)
      } : undefined,
      lineasManoObra: finalManoObra.length > 0 ? finalManoObra : undefined,
      lineasRepuesto: finalRepuestos.length > 0 ? finalRepuestos : undefined,
      lineasOtroCosto: finalOtrosCostos.length > 0 ? finalOtrosCostos : undefined,
    });

    // Descontar stock y registrar ubicación del equipo colocado en la dirección del cliente
    for (const rep of finalRepuestos) {
      if (rep.equipoItemId) {
        const cantInt = Math.ceil(rep.cantidad);
        
        let nuevaUbicacion = 'Instalado / Colocado';
        if (clienteNombre) {
          nuevaUbicacion = `📍 Cliente: ${clienteNombre}`;
          if (direccionInfo) {
            nuevaUbicacion += ` — ${direccionInfo}`;
          }
        }

        const updateData: any = {
          ubicacion: nuevaUbicacion,
          clienteId: clienteId ? parseInt(clienteId) : undefined,
          direccionId: direccionId ? parseInt(direccionId) : undefined,
        };

        if (fechaInicioGarantia) updateData.fechaInicioGarantia = new Date(fechaInicioGarantia).toISOString();
        if (fechaFinGarantia) updateData.fechaFinGarantia = new Date(fechaFinGarantia).toISOString();

        const stockInfo: any = await firestoreDb.findById('inventario', rep.equipoItemId);
        if (stockInfo) {
          const nuevoStock = Math.max(0, (stockInfo.stock || 0) - cantInt);
          updateData.stock = nuevoStock;
          await firestoreDb.update('inventario', rep.equipoItemId, updateData).catch(() => null);
        }
      }
    }

    return NextResponse.json(orden, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear orden:', error);
    return NextResponse.json({ error: 'Error interno al crear la orden', details: error.message }, { status: 500 });
  }
}
