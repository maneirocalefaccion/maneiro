import { z } from "zod";

export const clienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  cuit: z.string().nullable().optional(),
  condIva: z.string().min(1, "La condición de IVA es requerida"),
  telefono: z.string().nullable().optional(),
  email: z.string().email("Email inválido").nullable().optional().or(z.literal("")),
  activo: z.boolean().default(true),
});

export const proveedorSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  cuit: z.string().nullable().optional(),
  condIva: z.string().min(1, "La condición de IVA es requerida"),
  rubro: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  email: z.string().email("Email inválido").nullable().optional().or(z.literal("")),
  cbu: z.string().nullable().optional(),
  alias: z.string().nullable().optional(),
  banco: z.string().nullable().optional(),
  activo: z.boolean().default(true),
});

export const empleadoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  sueldo: z.number().int("El sueldo debe ser en centavos"),
  margenHora: z.number(),
  margenDia: z.number(),
  activo: z.boolean().default(true),
});

export const inventarioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  tipo: z.string().min(1, "El tipo es requerido"),
  numeroSerie: z.string().nullable().optional(),
  proveedor: z.string().nullable().optional(),
  proveedorId: z.number().nullable().optional(),
  precioCompra: z.number().int("El precio de compra debe ser en centavos"),
  precioVentaSugerido: z.number().int("El precio sugerido debe ser en centavos").nullable().optional(),
  stock: z.number().int(),
  ubicacion: z.string().nullable().optional(),
  fechaInicioGarantia: z.date().nullable().optional(),
  fechaFinGarantia: z.date().nullable().optional(),
  facturaCompraUrl: z.string().nullable().optional(),
  facturaVentaUrl: z.string().nullable().optional(),
  remitoUrl: z.string().nullable().optional(),
});

export const lineaManoObraSchema = z.object({
  empleadoId: z.number().int(),
  empleadoNombre: z.string().min(1),
  modalidad: z.string().min(1),
  cantidad: z.number(),
  precioUnitario: z.number().int(),
  subtotal: z.number().int(),
});

export const lineaRepuestoSchema = z.object({
  descripcion: z.string().min(1),
  costo: z.number().int(),
});

export const lineaOtroCostoSchema = z.object({
  descripcion: z.string().min(1),
  monto: z.number().int(),
});

export const ordenViaticoSchema = z.object({
  km: z.number(),
  costoFijo: z.number().int(),
  costoPorKm: z.number().int(),
  viandas: z.number().int(),
  total: z.number().int(),
});

export const ordenSchema = z.object({
  numero: z.string().min(1, "El número es requerido"),
  tipo: z.string().min(1, "El tipo es requerido"),
  descripcion: z.string().nullable().optional(),
  estado: z.string().min(1, "El estado es requerido"),
  clienteId: z.number().int().nullable().optional(),
  proveedorId: z.number().int().nullable().optional(),
  direccionId: z.number().int().nullable().optional(),
  montoAnticipo: z.number().int(),
  anticipoCobrado: z.boolean().default(false),
  fechaInicioGarantia: z.date().nullable().optional(),
  fechaFinGarantia: z.date().nullable().optional(),
  totalSinIva: z.number().int(),
  ivaMontoMonto: z.number().int(),
  totalFinal: z.number().int(),
  
  // Nested lines
  lineasManoObra: z.array(lineaManoObraSchema).optional(),
  lineasRepuesto: z.array(lineaRepuestoSchema).optional(),
  lineasOtroCosto: z.array(lineaOtroCostoSchema).optional(),
  viatico: ordenViaticoSchema.nullable().optional(),
});

export const movimientoSchema = z.object({
  tipo: z.string().min(1, "El tipo es requerido"),
  categoria: z.string().nullable().optional(),
  planCuenta: z.string().nullable().optional(),
  moneda: z.string().min(1, "La moneda es requerida"),
  monto: z.coerce.number().int("El monto debe ser en centavos"),
  montoUSD: z.coerce.number().int().nullable().optional(),
  cotizacionUSD: z.coerce.number().nullable().optional(),
  medioPago: z.string().min(1, "El medio de pago es requerido"),
  fecha: z.union([z.string(), z.date(), z.number()]).transform((val) => new Date(val)),
  concepto: z.string().min(1, "El concepto es requerido"),
  comprobanteUrl: z.string().nullable().optional(),
  ordenId: z.coerce.number().int().nullable().optional(),
  clienteId: z.coerce.number().int().nullable().optional(),
  proveedorId: z.coerce.number().int().nullable().optional(),
  equipoItemId: z.coerce.number().int().nullable().optional(),
  cajaId: z.coerce.number().int().nullable().optional(),
});

export const chequeSchema = z.object({
  tipo: z.string().min(1, "El tipo es requerido"),
  numero: z.string().min(1, "El número es requerido"),
  banco: z.string().min(1, "El banco es requerido"),
  librador: z.string().min(1, "El librador es requerido"),
  cuitLibrador: z.string().nullable().optional(),
  entregadoPor: z.string().nullable().optional(),
  monto: z.coerce.number().int("El monto debe ser en centavos"),
  fechaEmision: z.union([z.string(), z.date(), z.number()]).transform((val) => new Date(val)).optional().default(() => new Date()),
  fechaVencimiento: z.union([z.string(), z.date(), z.number()]).transform((val) => new Date(val)),
  estado: z.string().min(1, "El estado es requerido"),
  destino: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
});

export const configViaticoSchema = z.object({
  litrosPorKm: z.number(),
  precioCombustible: z.number().int("Debe ser en centavos"),
  costoFijoBase: z.number().int("Debe ser en centavos"),
});

export const configImpuestoSchema = z.object({
  ivaPorcentaje: z.number().optional(),
  cotizacionUSD: z.number().nullable().optional(),
  tipoFacturaDefault: z.string().optional(),
  razonSocial: z.string().optional(),
  bancoNombre: z.string().nullable().optional(),
  bancoNumeroCuenta: z.string().nullable().optional(),
  bancoCbu: z.string().nullable().optional(),
  bancoAlias: z.string().nullable().optional(),
  bancoCuit: z.string().nullable().optional(),
});

export const configuracionSchema = z.object({
  viatico: configViaticoSchema.optional(),
  impuesto: configImpuestoSchema.optional(),
});

export const taxonomiaSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  tipo: z.string().min(1),
  grupo: z.string().min(1),
  activa: z.boolean().optional().default(true),
});
