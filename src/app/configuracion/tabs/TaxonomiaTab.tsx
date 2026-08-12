'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { configuracionService } from '@/services/configuracionService';
import type { CategoriaTaxonomia } from '@/types';

type TaxonomiaTabProps = {
  categorias: CategoriaTaxonomia[];
  onRefresh: () => void;
};

const GRUPOS_DISPONIBLES = [
  "1. INGRESOS OPERATIVOS",
  "2. COSTOS OPERATIVOS DIRECTOS",
  "3. GASTOS ESTRUCTURALES",
  "4. IMPUESTOS & SEGUROS",
  "5. TESORERÍA & CAPITAL"
];

export default function TaxonomiaTab({ categorias, onRefresh }: TaxonomiaTabProps) {
  const [modalCat, setModalCat] = useState<null | CategoriaTaxonomia | "nuevo">(null);
  const [formCat, setFormCat] = useState({ codigo: "", nombre: "", tipo: "egreso", grupo: "3. GASTOS ESTRUCTURALES" });
  const [savingCat, setSavingCat] = useState(false);
  const [catToDelete, setCatToDelete] = useState<CategoriaTaxonomia | null>(null);
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, boolean>>({});

  const { success, error, warning } = useToast();

  const abrirNuevaCategoria = () => {
    setFormCat({ codigo: "", nombre: "", tipo: "egreso", grupo: "3. GASTOS ESTRUCTURALES" });
    setModalCat("nuevo");
  };

  const abrirEdicionCategoria = (cat: CategoriaTaxonomia) => {
    setFormCat({
      codigo: cat.codigo || "",
      nombre: cat.nombre,
      tipo: cat.tipo,
      grupo: cat.grupo,
    });
    setModalCat(cat);
  };

  const guardarCategoria = async () => {
    if (!formCat.nombre.trim()) return warning("Ingresá el nombre.");
    setSavingCat(true);
    try {
      const isNew = modalCat === "nuevo";
      await configuracionService.guardarCategoria(formCat, isNew, isNew ? undefined : (modalCat as CategoriaTaxonomia).id);
      success("Categoría guardada");
      setModalCat(null);
      onRefresh();
    } catch {
      error("Error al guardar categoría");
    } finally {
      setSavingCat(false);
    }
  };

  const eliminarCategoria = async () => {
    if (!catToDelete) return;
    try {
      await configuracionService.eliminarCategoria(catToDelete.id);
      success("Categoría eliminada");
      onRefresh();
    } catch {
      error("Error al eliminar categoría");
    } finally {
      setCatToDelete(null);
    }
  };

  const toggleCatActiva = async (cat: CategoriaTaxonomia) => {
    try {
      await configuracionService.toggleCategoriaActiva(cat);
      onRefresh();
    } catch {
      error("Error al cambiar estado");
    }
  };

  const toggleGrupo = (grupo: string) => {
    setExpandedGrupos(prev => ({
      ...prev,
      [grupo]: prev[grupo] === undefined ? false : !prev[grupo]
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-surface p-4 rounded-md border border-border">
        <div>
          <h2 className="font-bold text-lg text-primary">Plan de Cuentas & Taxonomía Contable</h2>
          <p className="text-xs text-muted">Definición de cuentas contables agrupadas para clasificación de ingresos, gastos e impuestos</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevaCategoria}>
          + Nueva Cuenta Contable
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {GRUPOS_DISPONIBLES.map((grupo) => {
          const catsGrupo = categorias.filter(c => c.grupo === grupo);
          const isExpanded = expandedGrupos[grupo] !== false; // expanded by default

          return (
            <div key={grupo} className="card border border-border overflow-hidden">
              <div
                className="bg-surface-hover p-4 flex justify-between items-center cursor-pointer select-none"
                onClick={() => toggleGrupo(grupo)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold text-sm">{isExpanded ? '▼' : '►'}</span>
                  <h3 className="font-bold text-base text-primary">{grupo}</h3>
                  <span className="badge badge-info">{catsGrupo.length} cuentas</span>
                </div>
              </div>

              {isExpanded && (
                <div className="table-container border-t border-border">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre de Cuenta</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catsGrupo.map((cat) => (
                        <tr key={cat.id}>
                          <td className="font-mono text-xs text-muted">{cat.codigo || "—"}</td>
                          <td className="font-bold">{cat.nombre}</td>
                          <td>
                            <span className={`badge ${cat.tipo === "ingreso" ? "badge-success" : "badge-warning"}`}>
                              {cat.tipo.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`btn btn-xs ${cat.activa ? "btn-success" : "btn-outline"}`}
                              onClick={() => toggleCatActiva(cat)}
                            >
                              {cat.activa ? "Activa" : "Inactiva"}
                            </button>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button className="btn btn-outline btn-sm" onClick={() => abrirEdicionCategoria(cat)}>✎</button>
                              <button className="btn btn-outline btn-sm text-danger" onClick={() => setCatToDelete(cat)}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Categoria */}
      <Modal
        isOpen={!!modalCat}
        onClose={() => setModalCat(null)}
        title={modalCat === "nuevo" ? "Nueva Cuenta Contable" : "Editar Cuenta Contable"}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button className="btn btn-outline" onClick={() => setModalCat(null)} disabled={savingCat}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardarCategoria} disabled={savingCat}>
              {savingCat ? 'Guardando...' : 'Guardar Cuenta'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="form-group">
            <label className="form-label">Grupo Contable</label>
            <select className="form-select" value={formCat.grupo} onChange={e => setFormCat({ ...formCat, grupo: e.target.value })}>
              {GRUPOS_DISPONIBLES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Código (opcional)</label>
              <input type="text" className="form-input" placeholder="3.5" value={formCat.codigo} onChange={e => setFormCat({ ...formCat, codigo: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de Movimiento</label>
              <select className="form-select" value={formCat.tipo} onChange={e => setFormCat({ ...formCat, tipo: e.target.value })}>
                <option value="egreso">Egreso / Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Nombre de Cuenta *</label>
            <input type="text" className="form-input" placeholder="Ej: Herramientas, Ferretería & Librería" value={formCat.nombre} onChange={e => setFormCat({ ...formCat, nombre: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!catToDelete}
        title="Confirmar eliminación"
        message={`¿Eliminar la cuenta contable "${catToDelete?.nombre}"?`}
        onConfirm={eliminarCategoria}
        onCancel={() => setCatToDelete(null)}
        dangerMode={true}
      />
    </div>
  );
}
