export interface Empleado {
  id: number;
  nombre: string;
  sueldo: number;
  margenHora: number;
  margenDia: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigViatico {
  id: number;
  litrosPorKm: number;
  precioCombustible: number;
  costoFijoBase: number;
}

export interface ConfigImpuesto {
  id: number;
  ivaPorcentaje: number;
  cotizacionUSD: number | null;
  tipoFacturaDefault: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  cuit: string | null;
  condIva: string;
  telefono: string | null;
  email: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Direccion {
  id: number;
  clienteId: number;
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
  km: number;
  createdAt: Date;
}

export interface Orden {
  id: number;
  numero: string;
  tipo: string;
  descripcion: string | null;
  estado: string;
  clienteId: number | null;
  proveedorId: number | null;
  direccionId: number | null;
  montoAnticipo: number;
  anticipoCobrado: boolean;
  fechaInicioGarantia: Date | null;
  fechaFinGarantia: Date | null;
  totalSinIva: number;
  ivaMontoMonto: number;
  totalFinal: number;
  montoCobrado?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LineaManoObra {
  id: number;
  ordenId: number;
  empleadoId: number;
  empleadoNombre: string;
  modalidad: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface LineaRepuesto {
  id: number;
  ordenId: number;
  descripcion: string;
  costo: number;
}

export interface LineaOtroCosto {
  id: number;
  ordenId: number;
  descripcion: string;
  monto: number;
}

export interface OrdenViatico {
  id: number;
  ordenId: number;
  km: number;
  costoFijo: number;
  costoPorKm: number;
  viandas: number;
  total: number;
}

export interface Proveedor {
  id: number;
  nombre: string;
  cuit: string | null;
  condIva: string;
  rubro: string | null;
  telefono: string | null;
  email: string | null;
  cbu: string | null;
  alias: string | null;
  banco: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipoItem {
  id: number;
  nombre: string;
  tipo: string;
  numeroSerie: string | null;
  proveedor: string | null;
  proveedorId: number | null;
  clienteId?: number | null;
  precioCompra: number;
  precioVentaSugerido: number | null;
  stock: number;
  ubicacion: string | null;
  fechaInicioGarantia: Date | null;
  fechaFinGarantia: Date | null;
  facturaCompraUrl: string | null;
  facturaVentaUrl: string | null;
  remitoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Caja {
  id: number;
  nombre: string;
  tipo: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MovimientoFinanciero {
  id: number;
  tipo: string;
  categoria: string;
  planCuenta: string | null;
  moneda: string;
  monto: number;
  montoUSD: number | null;
  cotizacionUSD: number | null;
  medioPago: string;
  fecha: Date;
  concepto: string;
  comprobanteUrl: string | null;
  ordenId: number | null;
  clienteId: number | null;
  proveedorId: number | null;
  equipoItemId: number | null;
  cajaId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cheque {
  id: number;
  tipo: string;
  numero: string;
  banco: string;
  librador: string;
  cuitLibrador: string | null;
  entregadoPor?: string | null;
  monto: number;
  fechaEmision: Date;
  fechaVencimiento: Date;
  estado: string;
  destino: string | null;
  observaciones: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vencimiento {
  id: number;
  servicio: string;
  monto: number;
  fechaVencimiento: Date;
  pagado: boolean;
  fechaPago: Date | null;
  comprobanteUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoriaTaxonomia {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  grupo: string;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Responses
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

// Form Types (Omit id, createdAt, updatedAt for creation forms)
export type EmpleadoForm = Omit<Empleado, 'id' | 'createdAt' | 'updatedAt'>;
export type ClienteForm = Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>;
export type ProveedorForm = Omit<Proveedor, 'id' | 'createdAt' | 'updatedAt'>;
export type OrdenForm = Omit<Orden, 'id' | 'createdAt' | 'updatedAt'>;
export type MovimientoFinancieroForm = Omit<MovimientoFinanciero, 'id' | 'createdAt' | 'updatedAt'>;
export type ChequeForm = Omit<Cheque, 'id' | 'createdAt' | 'updatedAt'>;
export type EquipoItemForm = Omit<EquipoItem, 'id' | 'createdAt' | 'updatedAt'>;
export type VencimientoForm = Omit<Vencimiento, 'id' | 'createdAt' | 'updatedAt'>;
export type CajaForm = Omit<Caja, 'id' | 'createdAt' | 'updatedAt'>;
