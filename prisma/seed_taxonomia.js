const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const categoriasSeed = [
  // 1. INGRESOS OPERATIVOS
  { codigo: "1.1", nombre: "Services & Mantenimiento Preventivo/Correctivo", tipo: "ingreso", grupo: "1. INGRESOS OPERATIVOS" },
  { codigo: "1.2", nombre: "Instalaciones de Calefacción & Aire Acondicionado", tipo: "ingreso", grupo: "1. INGRESOS OPERATIVOS" },
  { codigo: "1.3", nombre: "Venta Directa de Equipos & Materiales", tipo: "ingreso", grupo: "1. INGRESOS OPERATIVOS" },
  { codigo: "1.4", nombre: "Cobros Varios / Otros Ingresos", tipo: "ingreso", grupo: "1. INGRESOS OPERATIVOS" },

  // 2. COSTOS DIRECTOS
  { codigo: "2.1", nombre: "Compras a Proveedores (Equipos, Repuestos, Gas, Caños)", tipo: "egreso", grupo: "2. COSTOS OPERATIVOS DIRECTOS" },
  { codigo: "2.2", nombre: "Subcontratación & Terciarización de Trabajos", tipo: "egreso", grupo: "2. COSTOS OPERATIVOS DIRECTOS" },
  { codigo: "2.3", nombre: "Combustibles, Peajes & Viáticos de Obras", tipo: "egreso", grupo: "2. COSTOS OPERATIVOS DIRECTOS" },
  { codigo: "2.4", nombre: "Mano de Obra Operativa (Sueldos Semanales / Jornales)", tipo: "egreso", grupo: "2. COSTOS OPERATIVOS DIRECTOS" },

  // 3. GASTOS ESTRUCTURALES Y ADMINISTRATIVOS
  { codigo: "3.1", nombre: "Sueldos Administrativos & Honorarios Contador", tipo: "egreso", grupo: "3. GASTOS ESTRUCTURALES" },
  { codigo: "3.2", nombre: "Alquileres & Gastos Edilicios (Villegas 61/65)", tipo: "egreso", grupo: "3. GASTOS ESTRUCTURALES" },
  { codigo: "3.3", nombre: "Mantenimiento de Vehículos (Strada, Fiorino, Captur)", tipo: "egreso", grupo: "3. GASTOS ESTRUCTURALES" },
  { codigo: "3.4", nombre: "Servicios Públicos (Edes, Camuzzi, Telefónica, Movistar)", tipo: "egreso", grupo: "3. GASTOS ESTRUCTURALES" },
  { codigo: "3.5", nombre: "Herramientas, Ferretería & Librería", tipo: "egreso", grupo: "3. GASTOS ESTRUCTURALES" },

  // 4. IMPUESTOS, TASAS Y SEGUROS
  { codigo: "4.1", nombre: "AFIP (F.931, IVA, Monotributo, Planes)", tipo: "egreso", grupo: "4. IMPUESTOS & SEGUROS" },
  { codigo: "4.2", nombre: "ARBA / Ingresos Brutos", tipo: "egreso", grupo: "4. IMPUESTOS & SEGUROS" },
  { codigo: "4.3", nombre: "Impuestos Municipales & Seguridad e Higiene", tipo: "egreso", grupo: "4. IMPUESTOS & SEGUROS" },
  { codigo: "4.4", nombre: "Seguros (Nativa, Vehículos, ART)", tipo: "egreso", grupo: "4. IMPUESTOS & SEGUROS" },

  // 5. TESORERÍA Y CAPITAL
  { codigo: "5.1", nombre: "Retiros / Aportes de Socios (JMM, VJMM, MM)", tipo: "egreso", grupo: "5. TESORERÍA & CAPITAL" },
  { codigo: "5.2", nombre: "Movimientos entre Cajas / Plazos Fijos / Dólares", tipo: "egreso", grupo: "5. TESORERÍA & CAPITAL" },
  { codigo: "5.3", nombre: "Gastos & Comisiones Bancarias / Intereses", tipo: "egreso", grupo: "5. TESORERÍA & CAPITAL" },
];

async function main() {
  console.log("Seeding categorías de taxonomía iniciales...");
  for (const cat of categoriasSeed) {
    const existe = await prisma.categoriaTaxonomia.findFirst({
      where: { codigo: cat.codigo, nombre: cat.nombre },
    });
    if (!existe) {
      await prisma.categoriaTaxonomia.create({ data: cat });
    }
  }
  console.log("Taxonomía creada exitosamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
