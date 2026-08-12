import { Empleado, CategoriaTaxonomia } from "@/types";

export const configuracionService = {
  async getTodo() {
    const [resEmp, resConf, resTax, resEmpresas] = await Promise.all([
      fetch("/api/empleados"),
      fetch("/api/configuracion"),
      fetch("/api/taxonomia"),
      fetch("/api/empresas")
    ]);

    const empleados = resEmp.ok ? (await resEmp.json()).data || [] : [];
    const categorias = resTax.ok ? (await resTax.json()).data || [] : [];
    const empresas = resEmpresas.ok ? (await resEmpresas.json()).data || [] : [];
    const configGlobal = resConf.ok ? await resConf.json() : {};

    return { empleados, categorias, empresas, configGlobal };
  },

  async guardarEmpresa(formEmpresa: any, isNew: boolean, id?: number) {
    const url = isNew ? '/api/empresas' : `/api/empresas/${id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formEmpresa),
    });

    if (!res.ok) throw new Error("Error al guardar empresa");
    return await res.json();
  },

  async eliminarEmpresa(empId: number) {
    const res = await fetch(`/api/empresas/${empId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Error al desactivar empresa");
    return true;
  },

  async guardarCuentaBancaria(payload: any, isNew: boolean, id?: number) {
    const url = isNew ? '/api/cuentas-bancarias' : `/api/cuentas-bancarias/${id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Error al guardar cuenta bancaria");
    return await res.json();
  },

  async eliminarCuentaBancaria(cuentaId: number) {
    const res = await fetch(`/api/cuentas-bancarias/${cuentaId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Error al eliminar cuenta bancaria");
    return true;
  },

  async guardarConfiguracionGlobal(payload: any) {
    const res = await fetch("/api/configuracion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Error al guardar configuración global");
    return await res.json();
  },

  async guardarEmpleado(payload: any, isNew: boolean, id?: number) {
    const url = isNew ? "/api/empleados" : `/api/empleados/${id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Error al guardar empleado");
    return await res.json();
  },

  async eliminarEmpleado(id: number) {
    const res = await fetch(`/api/empleados/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar empleado");
    return true;
  },

  async guardarCategoria(payload: any, isNew: boolean, id?: number) {
    const url = isNew ? "/api/taxonomia" : `/api/taxonomia/${id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Error al guardar categoría");
    return await res.json();
  },

  async eliminarCategoria(id: number) {
    const res = await fetch(`/api/taxonomia/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar categoría");
    return true;
  },

  async toggleCategoriaActiva(cat: CategoriaTaxonomia) {
    const res = await fetch(`/api/taxonomia/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...cat, activa: !cat.activa }),
    });
    if (!res.ok) throw new Error("Error al cambiar estado de categoría");
    return await res.json();
  }
};
