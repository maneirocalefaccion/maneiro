"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import ModalPasajeCajas from "@/components/ModalPasajeCajas";
import CajasGrid from "@/components/CajasGrid";
import FinanzasAnuales from "@/app/dashboard/FinanzasAnuales";
import type { Cheque } from "@/types";

export default function TesoreriaPage() {
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [cajas, setCajas] = useState<any[]>([]);
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [filtroChequeEstado, setFiltroChequeEstado] = useState("todos");

  const [isModalTransferenciaOpen, setIsModalTransferenciaOpen] = useState(false);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);

  const [modalEntregarCheque, setModalEntregarCheque] = useState<any | null>(null);
  const [proveedorEntregaId, setProveedorEntregaId] = useState<string>('');

  // Estadísticas Económicas & Financieras
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [resumenFinanzas, setResumenFinanzas] = useState({
    totalIngresos: 0,
    totalEgresos: 0,
    saldoNeto: 0,
    totalIngresosARS: 0,
    totalEgresosARS: 0,
    saldoNetoARS: 0,
    totalIngresosUSD: 0,
    totalEgresosUSD: 0,
    saldoNetoUSD: 0,
    anioActual: new Date().getFullYear(),
    ingresosAnio: 0,
    egresosAnio: 0,
    balanceAnio: 0,
    ingresosAnioUSD: 0,
    egresosAnioUSD: 0,
    balanceAnioUSD: 0,
    estadisticasMensuales: [],
  });

  const cargarFinanzasStats = async (year: number) => {
    try {
      const res = await fetch(`/api/finanzas?anio=${year}`);
      if (res.ok) {
        const data = await res.json();
        setResumenFinanzas(data.resumen);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    cargarFinanzasStats(year);
  };

  const cargarTesoreria = async () => {
    try {
      setLoading(true);
      const [resCaj, resCheq, resProv, resCli, resEmp] = await Promise.all([
        fetch("/api/cajas"),
        fetch("/api/cheques?pageSize=1000"),
        fetch("/api/proveedores"),
        fetch("/api/clientes"),
        fetch("/api/empresas"),
      ]);

      if (resCaj.ok) {
        const cajasData = await resCaj.json();
        setCajas(cajasData.data || []);
      }

      if (resCheq.ok) {
        const dataCheq = await resCheq.json();
        setCheques(dataCheq.data || []);
      }
      if (resProv.ok) {
        const pData = await resProv.json();
        setProveedores(pData.data || pData || []);
      }
      if (resCli.ok) {
        const cData = await resCli.json();
        setClientes(cData.data || cData || []);
      }
      if (resEmp.ok) {
        const eData = await resEmp.json();
        setEmpresas(eData.data || eData || []);
      }

      await cargarFinanzasStats(selectedYear);
    } catch (err) {
      console.error("Error cargando tesorería:", err);
      toast.error("Error al cargar datos de tesorería");
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstadoCheque = async (id: number, nuevoEstado: string, destino?: string) => {
    try {
      const res = await fetch(`/api/cheques/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado, destino: destino || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Estado del cheque actualizado");
      await cargarTesoreria();
    } catch {
      toast.error("Error al actualizar el estado del cheque");
    }
  };

  const confirmarEntregaAProveedor = async () => {
    if (!modalEntregarCheque || !proveedorEntregaId) {
      return toast.warning("Seleccioná un proveedor destinatario.");
    }
    const prov = proveedores.find((p) => p.id === parseInt(proveedorEntregaId));
    const nombreDestino = prov ? prov.nombre : `Proveedor ID ${proveedorEntregaId}`;

    await cambiarEstadoCheque(modalEntregarCheque.id, "entregado_proveedor", nombreDestino);
    setModalEntregarCheque(null);
    setProveedorEntregaId("");
  };

  useEffect(() => {
    cargarTesoreria();
  }, []);

  const chequesFiltrados = cheques.filter((c) => {
    if (filtroChequeEstado === "todos") return true;
    return c.estado === filtroChequeEstado;
  });

  return (
    <div className="page-container">
      <div className="page-header space-between align-end mb-6">
        <div>
          <h1 className="page-title">Contabilidad, Tesorería & Estadísticas</h1>
          <p className="page-subtitle mb-0">Gestión de saldos de cajas, cheques en cartera y reportes económicos del negocio</p>
        </div>

        <div className="page-actions flex gap-2">
          <button
            className="btn btn-primary font-bold"
            onClick={() => setIsModalTransferenciaOpen(true)}
          >
            🔄 Pasaje entre Cajas & Canje Cheques
          </button>
          <Link href="/asientos" className="btn btn-outline font-semibold">
            📑 Ver Libro Diario
          </Link>
        </div>
      </div>

      {/* 1. SECCIÓN: POSICIÓN DE CAJAS & SALDOS */}
      <div className="mb-8">
        <CajasGrid cajas={cajas} onTransferir={() => setIsModalTransferenciaOpen(true)} />
      </div>

      {/* 2. SECCIÓN: ESTADÍSTICAS ECONÓMICAS & REPORTES FINANCIEROS (TRASLADADAS DESDE EL DASHBOARD) */}
      <div className="mb-8">
        <div className="card p-5 border border-border mb-4 bg-surface">
          <h2 className="font-bold text-lg text-primary mb-1">📊 Estadísticas Económicas & Reportes Anuales</h2>
          <p className="text-xs text-muted">Evolución mensual de ingresos, egresos y balance económico consolidado</p>
        </div>
        <FinanzasAnuales resumenFinanzas={resumenFinanzas} formatMoney={formatMoney} onYearChange={handleYearChange} />
      </div>

      {/* 3. SECCIÓN: GESTIÓN DE CARTERA DE CHEQUES */}
      <div className="card p-5 border border-border">
        <div className="flex justify-between items-center flex-wrap gap-3 border-b border-border pb-4 mb-4">
          <div>
            <h2 className="font-bold text-lg text-primary">📑 Cartera & Registro de Cheques</h2>
            <p className="text-xs text-muted">Cheques recibidos de clientes y emitidos a proveedores</p>
          </div>

          <div className="flex gap-2">
            <select
              className="form-select text-xs font-semibold"
              value={filtroChequeEstado}
              onChange={(e) => setFiltroChequeEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="en_cartera">En Cartera (Pendientes)</option>
              <option value="depositado">Depositados</option>
              <option value="entregado_proveedor">Entregados a Proveedor</option>
              <option value="cobrado">Cobrados</option>
              <option value="rechazado">Rechazados</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state p-8"><p className="text-muted">Cargando tesorería...</p></div>
        ) : chequesFiltrados.length === 0 ? (
          <div className="empty-state p-8">
            <p className="text-muted">No hay cheques registrados que coincidan con el filtro.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>N° Cheque</th>
                  <th>Tipo</th>
                  <th>Banco</th>
                  <th>Librador / Cliente</th>
                  <th>Emisión / Vencimiento</th>
                  <th>Monto ($)</th>
                  <th>Estado</th>
                  <th>Destino / Obs.</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {chequesFiltrados.map((c) => (
                  <tr key={c.id}>
                    <td><strong className="font-mono">#{c.numero}</strong></td>
                    <td>
                      <span className={`badge ${c.tipo === "recibido" ? "badge-success" : "badge-warning"}`}>
                        {c.tipo === "recibido" ? "Recibido" : "Emitido"}
                      </span>
                    </td>
                    <td className="font-semibold">{c.banco}</td>
                    <td>
                      <strong className="text-primary">{c.librador}</strong>
                      {c.entregadoPor && <div className="text-xs text-muted">Recibido de: {c.entregadoPor}</div>}
                    </td>
                    <td className="text-xs">
                      Emisión: {new Date(c.fechaEmision).toLocaleDateString('es-AR')}
                      <br />
                      <strong>Venc: {new Date(c.fechaVencimiento).toLocaleDateString('es-AR')}</strong>
                    </td>
                    <td className="font-bold text-primary">{formatMoney(c.monto)}</td>
                    <td>
                      <span className={`badge ${
                        c.estado === "en_cartera" ? "badge-info" :
                        c.estado === "depositado" ? "badge-primary" :
                        c.estado === "cobrado" ? "badge-success" :
                        c.estado === "entregado_proveedor" ? "badge-warning" : "badge-danger"
                      }`}>
                        {c.estado.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="text-xs">{c.destino || c.observaciones || "—"}</td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {c.estado === "en_cartera" && (
                          <>
                            <button className="btn btn-outline btn-xs" onClick={() => cambiarEstadoCheque(c.id, "depositado")}>🏦 Depositar</button>
                            <button className="btn btn-outline btn-xs text-warning" onClick={() => { setModalEntregarCheque(c); setProveedorEntregaId(''); }}>🚚 Entregar Prov.</button>
                            <button className="btn btn-outline btn-xs text-success" onClick={() => cambiarEstadoCheque(c.id, "cobrado")}>✅ Cobrar</button>
                          </>
                        )}
                        {c.estado !== "rechazado" && (
                          <button className="btn btn-outline btn-xs text-danger" onClick={() => cambiarEstadoCheque(c.id, "rechazado")}>❌ Rechazar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Pasaje entre Cajas & Canje de Cheques */}
      <ModalPasajeCajas
        isOpen={isModalTransferenciaOpen}
        cajas={cajas}
        onClose={() => setIsModalTransferenciaOpen(false)}
        onSuccess={cargarTesoreria}
      />

      {/* Modal Entregar Cheque a Proveedor */}
      <Modal
        isOpen={!!modalEntregarCheque}
        onClose={() => setModalEntregarCheque(null)}
        title={`🚚 Entregar Cheque #${modalEntregarCheque?.numero} a Proveedor`}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button className="btn btn-outline" onClick={() => setModalEntregarCheque(null)}>Cancelar</button>
            <button className="btn btn-warning font-bold" onClick={confirmarEntregaAProveedor}>
              Confirmar Entrega
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm">Seleccioná el proveedor al que le entregás este cheque de cartera por valor de <strong>{formatMoney(modalEntregarCheque?.monto || 0)}</strong>:</p>
          <div className="form-group">
            <label className="form-label">Proveedor Destinatario *</label>
            <select className="form-select" value={proveedorEntregaId} onChange={(e) => setProveedorEntregaId(e.target.value)}>
              <option value="">-- Seleccionar Proveedor --</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.cuit ? `(CUIT: ${p.cuit})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
