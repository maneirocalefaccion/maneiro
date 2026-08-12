"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { formatMoney, parseFecha } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown";
import ModalAsientoContable from "@/components/ModalAsientoContable";
import type { MovimientoFinanciero, CategoriaTaxonomia } from "@/types";

function obtenerGrupoContable(m: MovimientoFinanciero): string {
  if (m.categoria && m.categoria.startsWith('1.')) return '1. INGRESOS OPERATIVOS';
  if (m.categoria && m.categoria.startsWith('2.')) return '2. COSTOS OPERATIVOS DIRECTOS';
  if (m.categoria && m.categoria.startsWith('3.')) return '3. GASTOS ESTRUCTURALES';
  if (m.categoria && m.categoria.startsWith('4.')) return '4. IMPUESTOS & SEGUROS';
  if (m.categoria && m.categoria.startsWith('5.')) return '5. TESORERÍA & CAPITAL';
  
  const match = m.planCuenta?.match(/^(\d+)\./);
  if (match) {
    switch (match[1]) {
      case '1': return '1. INGRESOS OPERATIVOS';
      case '2': return '2. COSTOS OPERATIVOS DIRECTOS';
      case '3': return '3. GASTOS ESTRUCTURALES';
      case '4': return '4. IMPUESTOS & SEGUROS';
      case '5': return '5. TESORERÍA & CAPITAL';
    }
  }
  return m.tipo === 'ingreso' ? '1. INGRESOS OPERATIVOS' : '3. GASTOS ESTRUCTURALES';
}

export default function AsientosPage() {
  const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxonomias, setTaxonomias] = useState<string[]>([]);
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [resumen, setResumen] = useState({ totalIngresos: 0, totalEgresos: 0, saldoNeto: 0 });

  const [filtrosColumnas, setFiltrosColumnas] = useState<{
    fecha: string;
    grupo: string;
    planCuenta: string[];
    concepto: string;
    medioPago: string[];
    moneda: string;
    tipo: string;
  }>({
    fecha: "",
    grupo: "todos",
    planCuenta: [],
    concepto: "",
    medioPago: [],
    moneda: "todas",
    tipo: "todos",
  });
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsiento, setEditingAsiento] = useState<MovimientoFinanciero | null>(null);
  const [tipoInicial, setTipoInicial] = useState<"ingreso" | "egreso">("egreso");

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [asientoAEliminar, setAsientoAEliminar] = useState<{id: number, concepto: string} | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      if (filtroTipo !== "todos") params.set("tipo", filtroTipo);
      if (filtrosColumnas.fecha) params.set("f_fecha", filtrosColumnas.fecha);
      if (filtrosColumnas.grupo && filtrosColumnas.grupo !== "todos") params.set("f_grupo", filtrosColumnas.grupo);
      if (filtrosColumnas.planCuenta && filtrosColumnas.planCuenta.length > 0) params.set("f_planCuenta", filtrosColumnas.planCuenta.join(','));
      if (filtrosColumnas.concepto) params.set("f_concepto", filtrosColumnas.concepto);
      if (filtrosColumnas.medioPago && filtrosColumnas.medioPago.length > 0) params.set("f_medioPago", filtrosColumnas.medioPago.join(','));
      if (filtrosColumnas.moneda && filtrosColumnas.moneda !== "todas") params.set("f_moneda", filtrosColumnas.moneda);

      const resFin = await fetch(`/api/finanzas?${params.toString()}`);

      if (resFin.ok) {
        const dataFin = await resFin.json();
        setMovimientos(dataFin.data || []);
        if (dataFin.paginacion) {
          setTotalPages(dataFin.paginacion.totalPages || 1);
          setTotalCount(dataFin.paginacion.total || 0);
        }
        if (dataFin.resumen) {
          setResumen(dataFin.resumen);
        }
      } else {
        toast.error("Error al cargar movimientos");
      }
    } catch (err) {
      console.error("Error al cargar asientos:", err);
      toast.error("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      cargarDatos();
    }, 300);
    return () => clearTimeout(handler);
  }, [page, limit, filtroTipo, filtrosColumnas]);

  const hayFiltrosActivos = Boolean(
    filtroTipo !== "todos" ||
    filtrosColumnas.fecha ||
    (filtrosColumnas.grupo && filtrosColumnas.grupo !== "todos") ||
    filtrosColumnas.planCuenta.length > 0 ||
    filtrosColumnas.concepto ||
    filtrosColumnas.medioPago.length > 0 ||
    (filtrosColumnas.moneda && filtrosColumnas.moneda !== "todas")
  );

  const limpiarFiltros = () => {
    setFiltroTipo("todos");
    setFiltrosColumnas({
      fecha: "",
      grupo: "todos",
      planCuenta: [],
      concepto: "",
      medioPago: [],
      moneda: "todas",
      tipo: "todos",
    });
    setPage(1);
  };

  const optionsTaxonomia = useMemo(() => {
    const set = new Set<string>();
    taxonomias.forEach(t => {
      const str = typeof t === 'string' ? t : (t as any)?.nombre || '';
      const clean = str.replace(/^[\d\.]+\s*/, '').trim();
      if (clean) set.add(clean);
    });
    movimientos.forEach(m => {
      if (typeof m.planCuenta === 'string') {
        const clean = m.planCuenta.replace(/^[\d\.]+\s*/, '').trim();
        if (clean) set.add(clean);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [taxonomias, movimientos]);

  useEffect(() => {
    fetch('/api/taxonomia')
      .then(r => r.json())
      .then(res => {
        const d = res.data || res || [];
        setTaxonomias(d.map((t: any) => typeof t === 'string' ? t : t.nombre || ''));
      })
      .catch(() => {});
  }, []);

  const abrirNuevo = (tipo: "ingreso" | "egreso" = "egreso") => {
    setEditingAsiento(null);
    setTipoInicial(tipo);
    setIsModalOpen(true);
  };

  const abrirEdicion = (m: MovimientoFinanciero) => {
    setEditingAsiento(m);
    setTipoInicial(m.tipo as "ingreso" | "egreso");
    setIsModalOpen(true);
  };

  const confirmarEliminacion = (id: number, conceptoStr: string) => {
    setAsientoAEliminar({ id, concepto: conceptoStr });
    setIsConfirmOpen(true);
  };

  const eliminarAsiento = async () => {
    if (!asientoAEliminar) return;

    try {
      const res = await fetch(`/api/finanzas/${asientoAEliminar.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Asiento eliminado correctamente");
      await cargarDatos();
    } catch {
      toast.error("Error al eliminar el asiento");
    } finally {
      setIsConfirmOpen(false);
      setAsientoAEliminar(null);
    }
  };

  const renderPageButtons = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          className={`btn btn-sm px-3 ${i === page ? "btn-primary font-bold" : "btn-outline"}`}
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Libro Diario & Asientos Contables</h1>
          <p className="page-subtitle">
            Visor paginado y registro histórico de los {totalCount.toLocaleString("es-AR")} asientos de la empresa
          </p>
        </div>
        <div className="flex gap-2">
          {hayFiltrosActivos && (
            <button className="btn btn-outline text-danger border-danger font-bold" onClick={limpiarFiltros}>
              🧹 Limpiar Filtros
            </button>
          )}
          <button className="btn btn-primary font-bold" onClick={() => abrirNuevo("egreso")}>
            ⚡ Nuevo Asiento
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="empty-state">
            Cargando asientos paginados...
          </div>
        ) : movimientos.length === 0 ? (
          <div className="empty-state">
            <p className="text-muted mb-2">No se encontraron asientos contables que coincidan con los filtros.</p>
            {hayFiltrosActivos && (
              <button className="btn btn-outline btn-sm text-primary font-bold" onClick={limpiarFiltros}>
                🧹 Quitar Filtros y Ver Todos
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="w-14 align-top pt-3">N°</th>
                    <th className="w-32">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs">Fecha</span>
                        <input
                          type="date"
                          className="form-input text-xs h-7 p-1 font-normal bg-surface border-border rounded"
                          value={filtrosColumnas.fecha}
                          onChange={e => {
                            setFiltrosColumnas(p => ({ ...p, fecha: e.target.value }));
                            setPage(1);
                          }}
                        />
                      </div>
                    </th>
                    <th className="w-48">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs">Grupo</span>
                        <select
                          className="form-select text-xs h-7 p-1 font-normal bg-surface border-border rounded"
                          value={filtrosColumnas.grupo}
                          onChange={e => {
                            setFiltrosColumnas(p => ({ ...p, grupo: e.target.value }));
                            setPage(1);
                          }}
                        >
                          <option value="todos">Todos los Grupos</option>
                          <option value="1. INGRESOS OPERATIVOS">1. INGRESOS OPERATIVOS</option>
                          <option value="2. COSTOS OPERATIVOS DIRECTOS">2. COSTOS OPERATIVOS DIRECTOS</option>
                          <option value="3. GASTOS ESTRUCTURALES">3. GASTOS ESTRUCTURALES</option>
                          <option value="4. IMPUESTOS & SEGUROS">4. IMPUESTOS & SEGUROS</option>
                          <option value="5. TESORERÍA & CAPITAL">5. TESORERÍA & CAPITAL</option>
                        </select>
                      </div>
                    </th>
                    <th>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs">Cuenta</span>
                        <MultiSelectDropdown
                          options={optionsTaxonomia}
                          selected={filtrosColumnas.planCuenta}
                          onChange={(selected) => {
                            setFiltrosColumnas(p => ({ ...p, planCuenta: selected }));
                            setPage(1);
                          }}
                          placeholder="Todas"
                        />
                      </div>
                    </th>
                    <th>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs">Concepto</span>
                        <input
                          type="text"
                          placeholder="🔍 Buscar..."
                          className="form-input text-xs h-7 p-1 font-normal bg-surface border-border rounded"
                          value={filtrosColumnas.concepto}
                          onChange={e => {
                            setFiltrosColumnas(p => ({ ...p, concepto: e.target.value }));
                            setPage(1);
                          }}
                        />
                      </div>
                    </th>
                    <th className="w-40">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs">Caja</span>
                        <MultiSelectDropdown
                          options={["Efectivo", "Transferencia Bancaria", "Cheque", "MercadoPago", "Tarjeta", "Otro"]}
                          selected={filtrosColumnas.medioPago}
                          onChange={(selected) => {
                            setFiltrosColumnas(p => ({ ...p, medioPago: selected }));
                            setPage(1);
                          }}
                          placeholder="Todas"
                        />
                      </div>
                    </th>
                    <th className="w-24">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs">Moneda</span>
                        <select
                          className="form-select text-xs h-7 p-1 font-normal bg-surface border-border rounded"
                          value={filtrosColumnas.moneda}
                          onChange={e => {
                            setFiltrosColumnas(p => ({ ...p, moneda: e.target.value }));
                            setPage(1);
                          }}
                        >
                          <option value="todas">Todas</option>
                          <option value="ARS">ARS ($)</option>
                          <option value="USD">USD (u$s)</option>
                        </select>
                      </div>
                    </th>
                    <th className="w-28">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs">Egreso</span>
                        <select
                          className="form-select text-xs h-7 p-1 font-normal bg-surface border-border rounded"
                          value={filtrosColumnas.tipo}
                          onChange={e => {
                            setFiltrosColumnas(p => ({ ...p, tipo: e.target.value }));
                            setPage(1);
                          }}
                        >
                          <option value="todos">Todos</option>
                          <option value="egreso">Solo Egresos</option>
                        </select>
                      </div>
                    </th>
                    <th className="w-28">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs">Ingreso</span>
                        <select
                          className="form-select text-xs h-7 p-1 font-normal bg-surface border-border rounded"
                          value={filtrosColumnas.tipo}
                          onChange={e => {
                            setFiltrosColumnas(p => ({ ...p, tipo: e.target.value }));
                            setPage(1);
                          }}
                        >
                          <option value="todos">Todos</option>
                          <option value="ingreso">Solo Ingresos</option>
                        </select>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m) => {
                    return (
                      <tr
                        key={m.id}
                        onClick={() => abrirEdicion(m)}
                        className="cursor-pointer hover:bg-surface-hover transition-colors"
                      >
                        <td>
                          <strong className="text-primary">#{m.id}</strong>
                        </td>
                        <td className="whitespace-nowrap table-cell-date">
                          {new Date(m.fecha).toLocaleDateString("es-AR")}
                        </td>
                        <td className="whitespace-nowrap">
                          <span className="text-xs text-muted font-semibold">
                            {obtenerGrupoContable(m)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap">
                          <span className="table-cell-muted font-semibold" title={m.planCuenta || "General"}>
                            {m.planCuenta ? m.planCuenta.replace(/^[\d\.]+\s*/, '') : "General"}
                          </span>
                        </td>
                        <td className="table-cell-truncate">
                          <strong title={m.concepto}>{m.concepto}</strong>
                        </td>
                        <td className="whitespace-nowrap">
                          <span className="badge badge-info">{m.medioPago || "Efectivo"}</span>
                        </td>
                        <td className="whitespace-nowrap">
                          {m.moneda === "USD" || m.montoUSD ? (
                            <div className="badge-usd-container">
                              <span className="badge-usd-text">🇺🇸 {formatMoney(m.montoUSD || 0, "USD")}</span>
                              <div className="badge-usd-tc">TC {formatMoney(m.cotizacionUSD || 0)}</div>
                            </div>
                          ) : (
                            <span className="badge-ars-text">🇦🇷 ARS</span>
                          )}
                        </td>
                        <td className="text-danger font-bold whitespace-nowrap">
                          {m.tipo === "egreso" ? <MoneyDisplay cents={m.monto} currency="ARS" /> : "—"}
                        </td>
                        <td className="text-success font-bold whitespace-nowrap">
                          {m.tipo === "ingreso" ? <MoneyDisplay cents={m.monto} currency="ARS" /> : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pagination-container flex flex-wrap justify-between items-center gap-3 p-4">
              <div className="pagination-info text-sm">
                Mostrando página <strong>{page}</strong> de <strong>{totalPages}</strong> — Total: <strong>{totalCount.toLocaleString("es-AR")}</strong> asientos
              </div>

              <div className="pagination-controls flex items-center gap-1 flex-wrap">
                <select
                  className="select pagination-select text-xs py-1"
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={25}>25 por pág.</option>
                  <option value={50}>50 por pág.</option>
                  <option value={100}>100 por pág.</option>
                  <option value={200}>200 por pág.</option>
                </select>

                <select
                  className="select text-xs py-1 font-semibold border-primary text-primary"
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                  title="Ir directamente a la página..."
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                    <option key={pNum} value={pNum}>
                      Pág. {pNum} / {totalPages}
                    </option>
                  ))}
                </select>

                <button
                  className="btn btn-outline btn-sm px-2"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  title="Primera página"
                >
                  ««
                </button>

                <button
                  className="btn btn-outline btn-sm px-2"
                  disabled={page <= 5}
                  onClick={() => setPage((p) => Math.max(1, p - 5))}
                  title="Retroceder 5 páginas"
                >
                  -5
                </button>

                <button
                  className="btn btn-outline btn-sm px-2"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹ Ant.
                </button>

                {renderPageButtons()}

                <button
                  className="btn btn-outline btn-sm px-2"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Sig. ›
                </button>

                <button
                  className="btn btn-outline btn-sm px-2"
                  disabled={page + 5 > totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 5))}
                  title="Avanzar 5 páginas"
                >
                  +5
                </button>

                <button
                  className="btn btn-outline btn-sm px-2"
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                  title="Última página"
                >
                  »»
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <ModalAsientoContable
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={cargarDatos}
          tipoInicial={tipoInicial}
          asientoAEditar={editingAsiento as any}
          onDelete={(m) => confirmarEliminacion(m.id, m.concepto)}
        />
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Eliminar Asiento"
        message={`¿Estás seguro de anular/eliminar el asiento #${asientoAEliminar?.id} ("${asientoAEliminar?.concepto}")?`}
        onConfirm={eliminarAsiento}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText="Eliminar"
        dangerMode={true}
      />
    </div>
  );
}
