"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { configuracionService } from "@/services/configuracionService";
import type { Empleado, CategoriaTaxonomia } from "@/types";
import EmpresasTab from "./tabs/EmpresasTab";
import EmpleadosTab from "./tabs/EmpleadosTab";
import TaxonomiaTab from "./tabs/TaxonomiaTab";
import ViaticosTab from "./tabs/ViaticosTab";

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("empresas");
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [categorias, setCategorias] = useState<CategoriaTaxonomia[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [configGlobal, setConfigGlobal] = useState<any>({});

  const cargarTodo = async () => {
    try {
      setLoading(true);
      const res = await configuracionService.getTodo();
      setEmpleados(res.empleados);
      setCategorias(res.categorias);
      setEmpresas(res.empresas);
      setConfigGlobal(res.configGlobal);
    } catch {
      toast.error("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header space-between align-end mb-6">
        <div>
          <h1 className="page-title">Configuración del Sistema</h1>
          <p className="page-subtitle mb-0">Ajustes de empresas del grupo, cuentas bancarias, nómina y parámetros de facturación</p>
        </div>
      </div>

      <div className="tabs mb-6 flex gap-2 border-b border-border">
        <button
          className={`tab-item pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'empresas' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
          onClick={() => setActiveTab('empresas')}
        >
          🏢 Empresas & Cuentas Bancarias
        </button>
        <button
          className={`tab-item pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'empleados' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
          onClick={() => setActiveTab('empleados')}
        >
          👷 Empleados & Márgenes
        </button>
        <button
          className={`tab-item pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'taxonomia' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
          onClick={() => setActiveTab('taxonomia')}
        >
          📊 Plan de Cuentas Contables
        </button>
        <button
          className={`tab-item pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'viaticos' ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
          onClick={() => setActiveTab('viaticos')}
        >
          🚚 Viáticos & Facturación
        </button>
      </div>

      {loading ? (
        <div className="empty-state p-8"><p className="text-muted">Cargando módulos de configuración...</p></div>
      ) : (
        <div className="tab-content">
          {activeTab === 'empresas' && <EmpresasTab empresas={empresas} onRefresh={cargarTodo} />}
          {activeTab === 'empleados' && <EmpleadosTab empleados={empleados} onRefresh={cargarTodo} />}
          {activeTab === 'taxonomia' && <TaxonomiaTab categorias={categorias} onRefresh={cargarTodo} />}
          {activeTab === 'viaticos' && <ViaticosTab configGlobal={configGlobal} onRefresh={cargarTodo} />}
        </div>
      )}
    </div>
  );
}
