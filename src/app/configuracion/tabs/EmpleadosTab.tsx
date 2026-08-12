'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { formatMoney, centsToPesos } from '@/lib/utils';
import { configuracionService } from '@/services/configuracionService';
import type { Empleado } from '@/types';

type EmpleadosTabProps = {
  empleados: Empleado[];
  onRefresh: () => void;
};

const DIAS_LABORABLES = 22;
const HORAS_DIA = 7;

function calcular(emp: Empleado) {
  const s = emp.sueldo || 0;
  const mh = emp.margenHora || 0;
  const md = emp.margenDia || 0;
  const costoPorHora = s / (DIAS_LABORABLES * HORAS_DIA);
  const costoPorDia = s / DIAS_LABORABLES;
  return {
    ventaHora: costoPorHora * (1 + mh / 100),
    ventaDia: costoPorDia * (1 + md / 100),
    costoPorHora,
    costoPorDia,
  };
}

export default function EmpleadosTab({ empleados, onRefresh }: EmpleadosTabProps) {
  const [modalEmp, setModalEmp] = useState<null | Empleado | "nuevo">(null);
  const [formEmp, setFormEmp] = useState({ nombre: "", sueldo: "", margenHora: "40", margenDia: "50" });
  const [savingEmp, setSavingEmp] = useState(false);
  const [empToDelete, setEmpToDelete] = useState<Empleado | null>(null);

  const { success, error, warning } = useToast();

  const abrirNuevoEmpleado = () => {
    setFormEmp({ nombre: "", sueldo: "", margenHora: "40", margenDia: "50" });
    setModalEmp("nuevo");
  };

  const abrirEdicionEmpleado = (emp: Empleado) => {
    setFormEmp({
      nombre: emp.nombre,
      sueldo: emp.sueldo ? centsToPesos(emp.sueldo).toString() : "0",
      margenHora: (emp.margenHora || 40).toString(),
      margenDia: (emp.margenDia || 50).toString(),
    });
    setModalEmp(emp);
  };

  const guardarEmpleado = async () => {
    if (!formEmp.nombre.trim() || !formEmp.sueldo) return warning("Completá todos los campos.");
    setSavingEmp(true);
    try {
      const payload = {
        nombre: formEmp.nombre,
        sueldo: Math.round(parseFloat(formEmp.sueldo) * 100),
        margenHora: parseFloat(formEmp.margenHora),
        margenDia: parseFloat(formEmp.margenDia)
      };

      const isNew = modalEmp === "nuevo";
      await configuracionService.guardarEmpleado(payload, isNew, isNew ? undefined : (modalEmp as Empleado).id);
      success("Empleado guardado");
      setModalEmp(null);
      onRefresh();
    } catch {
      error("Error al guardar empleado");
    } finally {
      setSavingEmp(false);
    }
  };

  const eliminarEmpleado = async () => {
    if (!empToDelete) return;
    try {
      await configuracionService.eliminarEmpleado(empToDelete.id);
      success("Empleado eliminado");
      onRefresh();
    } catch {
      error("Error al eliminar empleado.");
    } finally {
      setEmpToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-surface p-4 rounded-md border border-border">
        <div>
          <h2 className="font-bold text-lg text-primary">Nómina de Empleados & Márgenes de Venta</h2>
          <p className="text-xs text-muted">Configuración de sueldos base y tasas de venta de mano de obra por hora y por día</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevoEmpleado}>
          + Nuevo Empleado
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Sueldo Base ($)</th>
              <th>Costo Hora / Día</th>
              <th>Margen Hora (%)</th>
              <th>Venta Hora ($)</th>
              <th>Margen Día (%)</th>
              <th>Venta Día ($)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map((emp) => {
              const calc = calcular(emp);
              return (
                <tr key={emp.id}>
                  <td className="font-bold text-primary">{emp.nombre}</td>
                  <td className="font-semibold">{formatMoney(emp.sueldo || 0)}</td>
                  <td className="text-xs text-muted">
                    ${Math.round(calc.costoPorHora).toLocaleString("es-AR")} / hr
                    <br />
                    ${Math.round(calc.costoPorDia).toLocaleString("es-AR")} / día
                  </td>
                  <td>{emp.margenHora}%</td>
                  <td className="font-bold text-success">${Math.round(calc.ventaHora).toLocaleString("es-AR")}</td>
                  <td>{emp.margenDia}%</td>
                  <td className="font-bold text-success">${Math.round(calc.ventaDia).toLocaleString("es-AR")}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-outline btn-sm" onClick={() => abrirEdicionEmpleado(emp)}>✎</button>
                      <button className="btn btn-outline btn-sm text-danger" onClick={() => setEmpToDelete(emp)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Formulario Empleado */}
      <Modal
        isOpen={!!modalEmp}
        onClose={() => setModalEmp(null)}
        title={modalEmp === "nuevo" ? "Agregar Empleado" : "Editar Empleado"}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button className="btn btn-outline" onClick={() => setModalEmp(null)} disabled={savingEmp}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardarEmpleado} disabled={savingEmp}>
              {savingEmp ? 'Guardando...' : 'Guardar Empleado'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="form-group">
            <label className="form-label">Nombre Completo *</label>
            <input type="text" className="form-input" placeholder="Ej: Roberto Gómez" value={formEmp.nombre} onChange={e => setFormEmp({ ...formEmp, nombre: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Sueldo Mensual Base ($ Pesos) *</label>
            <input type="number" className="form-input" placeholder="Ej: 800000" value={formEmp.sueldo} onChange={e => setFormEmp({ ...formEmp, sueldo: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Margen por Hora (%)</label>
              <input type="number" className="form-input" placeholder="40" value={formEmp.margenHora} onChange={e => setFormEmp({ ...formEmp, margenHora: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Margen por Día (%)</label>
              <input type="number" className="form-input" placeholder="50" value={formEmp.margenDia} onChange={e => setFormEmp({ ...formEmp, margenDia: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!empToDelete}
        title="Confirmar eliminación"
        message={`¿Estás seguro de eliminar al empleado "${empToDelete?.nombre}"?`}
        onConfirm={eliminarEmpleado}
        onCancel={() => setEmpToDelete(null)}
        dangerMode={true}
      />
    </div>
  );
}
