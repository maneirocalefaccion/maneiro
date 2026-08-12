const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const proveedoresIniciales = [
  { nombre: "Carrier Fueguina S.A.", cuit: "30-58963214-9", rubro: "Equipos A/C & Climatización", condIva: "Responsable Inscripto", cbu: "0110254830002541852963", alias: "CARRIER.PAGO", banco: "Banco Nación" },
  { nombre: "Peisa Climatización", cuit: "30-61245893-2", rubro: "Calderas & Radiadores", condIva: "Responsable Inscripto", cbu: "0170045220000012345678", alias: "PEISA.OFICIAL", banco: "Banco BBVA" },
  { nombre: "Ansal Refrigeración S.A.", cuit: "30-51478963-5", rubro: "Repuestos, Gases & Caños", condIva: "Responsable Inscripto", cbu: "0720125820000035715963", alias: "ANSAL.REF", banco: "Banco Santander" },
  { nombre: "Ferretería Furland", cuit: "20-14258369-3", rubro: "Ferretería & Insumos", condIva: "Responsable Inscripto" },
  { nombre: "Ferretería Diale", cuit: "20-18547963-8", rubro: "Ferretería & Herramientas", condIva: "Responsable Inscripto" },
  { nombre: "Cooperativa San Martín", cuit: "30-54123987-1", rubro: "Materiales & Construcción", condIva: "Responsable Inscripto" },
  { nombre: "Seguros Nativa", cuit: "30-50001245-6", rubro: "Seguros Flota & ART", condIva: "Responsable Inscripto" },
  { nombre: "Edes S.A.", cuit: "30-68954123-0", rubro: "Servicios Públicos (Luz)", condIva: "Responsable Inscripto" },
  { nombre: "Camuzzi Gas del Sur", cuit: "30-65894125-7", rubro: "Servicios Públicos (Gas)", condIva: "Responsable Inscripto" },
  { nombre: "Movistar / Telefónica", cuit: "30-63945812-4", rubro: "Comunicaciones & Telefonía", condIva: "Responsable Inscripto" },
  { nombre: "AFIP - Administración Federal", cuit: "33-69345812-9", rubro: "Impuestos & Cargas Sociales", condIva: "Exento" },
  { nombre: "ARBA - Rentas Bs As", cuit: "30-99900001-2", rubro: "Ingresos Brutos", condIva: "Exento" },
];

async function main() {
  console.log("Seeding proveedores iniciales...");
  for (const prov of proveedoresIniciales) {
    const existe = await prisma.proveedor.findFirst({ where: { nombre: prov.nombre } });
    if (!existe) {
      await prisma.proveedor.create({ data: prov });
    }
  }
  console.log("Proveedores creados exitosamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
