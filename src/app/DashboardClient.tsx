"use client";

import React, { useState, useEffect } from "react";
import StatsGrid from "./dashboard/StatsGrid";
import AgendaVencimientos from "./dashboard/AgendaVencimientos";
import ModalAsientoContable from "@/components/ModalAsientoContable";
import ModalOrdenCompleta from "@/components/ModalOrdenCompleta";
import { useToast } from "@/components/ui/Toast";
import ModalPasajeCajas from "@/components/ModalPasajeCajas";
import CajasGrid from "@/components/CajasGrid";
import { formatMoney } from "@/lib/utils";
import type { Cheque } from "@/types";

export default function DashboardClient() {
  const { success, error: showError } = useToast();
  
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [cantClientes, setCantClientes] = useState(0);
  const [cantStock, setCantStock] = useState(0);
  const [loading, setLoading] = useState(true);

  // Saldos de Cajas & Cheques para Dashboard
  const [cajas, setCajas] = useState<any[]>([]);
  const [cheques, setCheques] = useState<Cheque[]>([]);
  
  const [isModalTransferenciaOpen, setIsModalTransferenciaOpen] = useState(false);

  const [selectedOrden, setSelectedOrden] = useState<any | null>(null);
  const [isModalOrdenOpen, setIsModalOrdenOpen] = useState(false);
  const [isModalAsientoOpen, setIsModalAsientoOpen] = useState(false);
  const [tipoAsientoInicial, setTipoAsientoInicial] = useState<"ingreso" | "egreso">("ingreso");

  const cargarDatosDashboard = async () => {
    try {
      setLoading(true);
      const [resOrd, resCli, resInv, resCaj, resCheq] = await Promise.all([
        fetch("/api/ordenes").catch(() => null),
        fetch("/api/clientes").catch(() => null),
        fetch("/api/inventario").catch(() => null),
        fetch("/api/cajas").catch(() => null),
        fetch("/api/cheques?pageSize=1000").catch(() => null),
      ]);

      if (resOrd && resOrd.ok) {
        const ordData = await resOrd.json();
        setOrdenes(ordData.data || []);
      }

      if (resCli && resCli.ok) {
        const cliData = await resCli.json();
        setCantClientes(cliData.total || cliData.data?.length || 0);
      }

      if (resInv && resInv.ok) {
        const invData = await resInv.json();
        setCantStock(invData.data?.length || 0);
      }

      if (resCaj && resCaj.ok) {
        const cajasData = await resCaj.json();
        setCajas(cajasData.data || []);
      }

      if (resCheq && resCheq.ok) {
        const dataCheq = await resCheq.json();
        setCheques(dataCheq.data || []);
      }
    } catch (err) {
      console.error(err);
      showError("Error al cargar datos del Dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstadoCheque = async (id: number, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/cheques/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error();
      await cargarDatosDashboard();
      success("Estado del cheque actualizado");
    } catch {
      showError("Error al actualizar el estado del cheque.");
    }
  };

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  return (
    <>
      {/* HEADER DE LA TORRE DE CONTROL */}
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Torre de Control</h1>
          <p className="page-subtitle mb-0">Panorama operativo, tesorería y comandancia en tiempo real</p>
        </div>

        <div className="page-actions flex gap-2">
          <button
            className="btn btn-outline font-semibold"
            onClick={() => setIsModalTransferenciaOpen(true)}
          >
            🔄 Pasaje Cajas / Canje
          </button>
          <button
            className="btn btn-primary font-bold"
            onClick={() => {
              setSelectedOrden(null);
              setIsModalOrdenOpen(true);
            }}
          >
            ⚡ Nueva Orden
          </button>
          <button
            className="btn btn-success font-bold"
            onClick={() => {
              setTipoAsientoInicial("egreso");
              setIsModalAsientoOpen(true);
            }}
          >
            ⚡ Nuevo Asiento
          </button>
        </div>
      </div>

      {/* TARJETAS DE INDICADORES PRINCIPALES (KPIS) */}
      <div className="mb-6">
        <StatsGrid 
          ordenes={ordenes} 
          cajas={cajas}
          cantClientes={cantClientes} 
          cantStock={cantStock} 
          loading={loading} 
        />
      </div>

      {/* CUERPO PRINCIPAL DEL DASHBOARD (LAYOUT EN 2 COLUMNAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: AGENDA DE VENCIMIENTOS E IMPUESTOS (7 de 12 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <AgendaVencimientos />
        </div>

        {/* COLUMNA DERECHA: SALDOS DE CAJAS & CHEQUES (5 de 12 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* POSICIÓN DE CAJAS & TESORERÍA */}
          <div className="card p-5 border border-border flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                💰 Saldos de Cajas & Tesorería
              </h3>
              <button className="btn btn-outline btn-xs font-semibold" onClick={() => setIsModalTransferenciaOpen(true)}>
                Pasaje Cajas
              </button>
            </div>
            <CajasGrid cajas={cajas} onTransferir={() => setIsModalTransferenciaOpen(true)} />
          </div>

          {/* CARTERA DE CHEQUES PENDIENTES */}
          <div className="card p-5 border border-border flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base text-primary flex items-center gap-2">
                📑 Cheques en Cartera ({cheques.filter(c => c.estado === 'en_cartera').length})
              </h3>
            </div>

            {cheques.filter(c => c.estado === 'en_cartera').length === 0 ? (
              <p className="text-xs text-muted py-2">No hay cheques pendientes en cartera actualmente.</p>
            ) : (
              <div className="table-container">
                <table className="table w-full text-xs">
                  <thead>
                    <tr>
                      <th>N° / Banco</th>
                      <th>Librador</th>
                      <th>Vencimiento</th>
                      <th>Monto ($)</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cheques.filter(c => c.estado === 'en_cartera').map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong className="font-mono text-primary">#{c.numero}</strong>
                          <div className="text-muted text-xs">{c.banco}</div>
                        </td>
                        <td>{c.librador}</td>
                        <td className="font-semibold">{new Date(c.fechaVencimiento).toLocaleDateString('es-AR')}</td>
                        <td className="font-bold text-primary">{formatMoney(c.monto)}</td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn btn-outline btn-xs" onClick={() => cambiarEstadoCheque(c.id, "depositado")} title="Depositar en banco">🏦</button>
                            <button className="btn btn-outline btn-xs text-success" onClick={() => cambiarEstadoCheque(c.id, "cobrado")} title="Cobrar por ventanilla">✅</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALES REUTILIZABLES DE LA TORRE DE CONTROL */}
      <ModalOrdenCompleta
        isOpen={isModalOrdenOpen}
        editingOrden={selectedOrden}
        onClose={() => {
          setIsModalOrdenOpen(false);
          setSelectedOrden(null);
        }}
        onSuccess={cargarDatosDashboard}
      />

      <ModalAsientoContable
        isOpen={isModalAsientoOpen}
        tipoInicial={tipoAsientoInicial}
        onClose={() => setIsModalAsientoOpen(false)}
        onSuccess={cargarDatosDashboard}
      />

      <ModalPasajeCajas
        isOpen={isModalTransferenciaOpen}
        cajas={cajas}
        onClose={() => setIsModalTransferenciaOpen(false)}
        onSuccess={cargarDatosDashboard}
      />
    </>
  );
}
