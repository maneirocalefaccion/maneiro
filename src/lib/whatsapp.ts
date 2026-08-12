import { formatMoney } from "./utils";

export function enviarWhatsApp(ord: any) {
  const rawTel = ord.cliente?.telefono ? ord.cliente.telefono.replace(/\D/g, "") : "";
  let tel = "";
  if (rawTel) {
    if (rawTel.startsWith("54")) tel = rawTel;
    else if (rawTel.startsWith("0")) tel = `549${rawTel.substring(1)}`;
    else tel = `549${rawTel}`;
  }

  const totalMO = ord.lineasManoObra?.reduce((acc: number, l: any) => acc + (l.subtotal || 0), 0) || 0;

  let mensaje = `*MANEIRO CLIMATIZACIÓN* - Detalle de Servicio / Orden #${ord.numero}\n`;
  if (ord.cliente?.nombre) {
    mensaje += `Hola *${ord.cliente.nombre}*, le compartimos la información de su orden:\n\n`;
  }
  if (ord.descripcion) {
    mensaje += `🔧 *Trabajo:* ${ord.descripcion}\n`;
  }
  if (ord.direccion?.nombre) {
    mensaje += `📍 *Ubicación:* ${ord.direccion.nombre}\n`;
  }
  mensaje += `\n*Detalle de Conceptos:*`;

  if (totalMO > 0) {
    mensaje += `\n• Mano de Obra / Servicio Técnico: ${formatMoney(totalMO)}`;
  }
  if (ord.viatico) {
    mensaje += `\n• Viáticos & Traslado (${ord.viatico.km} km): ${formatMoney(ord.viatico.total)}`;
  }
  if (ord.lineasRepuesto?.length) {
    ord.lineasRepuesto.forEach((r: any) => {
      mensaje += `\n• Repuesto (${r.descripcion}): ${formatMoney(r.costo)}`;
    });
  }
  if (ord.lineasOtroCosto?.length) {
    ord.lineasOtroCosto.forEach((o: any) => {
      mensaje += `\n• ${o.descripcion}: ${formatMoney(o.monto)}`;
    });
  }

  const totalFinalCents = ord.totalFinal || 0;
  mensaje += `\n\n💰 *TOTAL FINAL (inc. IVA):* ${formatMoney(totalFinalCents)}`;

  // Detalle de cobros realizados e historial de pagos
  const cobradoCents = ord.montoCobrado || 0;
  const saldoPendienteCents = Math.max(0, totalFinalCents - cobradoCents);

  if (cobradoCents > 0 || (ord.movimientosFinancieros && ord.movimientosFinancieros.length > 0)) {
    mensaje += `\n\n📊 *ESTADO DE CUENTA & PAGOS:*`;
    
    if (ord.movimientosFinancieros && ord.movimientosFinancieros.length > 0) {
      const cobros = ord.movimientosFinancieros.filter((m: any) => m.tipo === 'ingreso');
      if (cobros.length > 0) {
        mensaje += `\n*Historial de Cobros Recibidos:*`;
        cobros.forEach((c: any) => {
          const fechaStr = c.fecha ? new Date(c.fecha).toLocaleDateString('es-AR') : '';
          const medio = c.medioPago ? ` (${c.medioPago})` : '';
          mensaje += `\n• ${fechaStr}: ${formatMoney(c.monto)}${medio}`;
        });
      }
    }

    mensaje += `\n\n✅ *Monto Total Pagado:* ${formatMoney(cobradoCents)}`;
    
    if (saldoPendienteCents > 0) {
      mensaje += `\n⚠️ *RESTANTE A PAGAR:* ${formatMoney(saldoPendienteCents)}`;
    } else {
      mensaje += `\n🎉 *ESTADO: TOTALMENTE SALDADO & PAGADO*`;
    }
  }

  mensaje += `\n\nQuedamos a su entera disposición. ¡Muchas gracias!`;

  const url = tel
    ? `https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(mensaje)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;

  window.open(url, "_blank");
}
