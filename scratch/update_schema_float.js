const fs = require('fs');
const file = 'c:/Users/HP/Dropbox/D+ARQ/HERRAMIENTAS FLIPPING/Maneiro clima/maneiro-clima2/prisma/schema.prisma';
let code = fs.readFileSync(file, 'utf8');

const fieldsToFloat = [
  'sueldo', 'precioCombustible', 'costoFijoBase', 
  'montoAnticipo', 'totalSinIva', 'ivaMontoMonto', 'totalFinal',
  'precioUnitario', 'subtotal', 'costo', 'monto', 'montoUSD',
  'costoFijo', 'costoPorKm', 'viandas', 'total',
  'precioCompra', 'precioVentaSugerido'
];

fieldsToFloat.forEach(field => {
  // Replace: "  field Int" with "  field Float"
  // Make sure it doesn't match fieldId or something else.
  const regex = new RegExp(`(\\s+${field}\\s+)Int(\\s|$)`, 'g');
  code = code.replace(regex, `$1Float$2`);
  
  // Also handle Int? -> Float?
  const regexOpt = new RegExp(`(\\s+${field}\\s+)Int\\?(\\s|$)`, 'g');
  code = code.replace(regexOpt, `$1Float?$2`);
});

fs.writeFileSync(file, code);
console.log('Schema updated successfully');
