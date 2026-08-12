const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("Procesando asignación de Clientes y Proveedores desde Excel...");

  const jsonPath = path.join(__dirname, "movimientos_excel.json");
  const dataRaw = fs.readFileSync(jsonPath, "utf-8");
  const movimientos = JSON.parse(dataRaw);

  // Extraer nombres únicos de clientes (ingresos)
  const nombresClientes = new Set();
  movimientos.forEach((m) => {
    if (m.tipo === "ingreso" && m.concepto) {
      // Limpiar leyenda para obtener nombre principal
      const nombreLimpio = m.concepto.split(" - Obs:")[0].trim();
      if (nombreLimpio) nombresClientes.add(nombreLimpio);
    }
  });

  console.log(`Encontrados ${nombresClientes.size} nombres de clientes únicos.`);

  // Crear Clientes en lote si no existen
  const mapaClientes = new Map();
  const clientesExistentes = await prisma.cliente.findMany({ select: { id: true, nombre: true } });
  clientesExistentes.forEach((c) => mapaClientes.set(c.nombre.toLowerCase(), c.id));

  for (const nombre of nombresClientes) {
    const key = nombre.toLowerCase();
    if (!mapaClientes.has(key)) {
      const nuevo = await prisma.cliente.create({
        data: {
          nombre: nombre,
          condIva: "Consumidor Final",
        },
      });
      mapaClientes.set(key, nuevo.id);
    }
  }

  // Mapa de Proveedores existentes
  const mapaProveedores = new Map();
  const proveedoresExistentes = await prisma.proveedor.findMany({ select: { id: true, nombre: true } });
  proveedoresExistentes.forEach((p) => {
    mapaProveedores.set(p.nombre.toLowerCase(), p.id);
  });

  console.log("Vinculando clienteId y proveedorId a los asientos en la base de datos...");

  // Actualizar MovimientoFinanciero
  const todosMovs = await prisma.movimientoFinanciero.findMany({
    select: { id: true, tipo: true, concepto: true, clienteId: true, proveedorId: true },
  });

  let actualizadosClientes = 0;
  let actualizadosProveedores = 0;

  for (const m of todosMovs) {
    const nombreLimpio = m.concepto.split(" - Obs:")[0].trim().toLowerCase();

    if (m.tipo === "ingreso" && !m.clienteId) {
      const cliId = mapaClientes.get(nombreLimpio);
      if (cliId) {
        await prisma.movimientoFinanciero.update({
          where: { id: m.id },
          data: { clienteId: cliId },
        });
        actualizadosClientes++;
      }
    } else if (m.tipo === "egreso" && !m.proveedorId) {
      // Buscar coincidencia parcial con proveedores
      for (const [provNombreKey, provId] of mapaProveedores.entries()) {
        if (nombreLimpio.includes(provNombreKey) || provNombreKey.includes(nombreLimpio)) {
          await prisma.movimientoFinanciero.update({
            where: { id: m.id },
            data: { proveedorId: provId },
          });
          actualizadosProveedores++;
          break;
        }
      }
    }
  }

  console.log(`✅ Vinculación completada: ${actualizadosClientes} asientos vinculados a Clientes, ${actualizadosProveedores} a Proveedores.`);
}

main()
  .catch((e) => {
    console.error("Error al procesar clientes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
