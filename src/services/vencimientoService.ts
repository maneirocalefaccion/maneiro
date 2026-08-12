export const vencimientoService = {
  async getVencimientos(estado = 'todos') {
    const res = await fetch(`/api/vencimientos?estado=${estado}`);
    if (!res.ok) throw new Error('Error al cargar vencimientos');
    const payload = await res.json();
    return payload.data || [];
  },

  async crearVencimiento(payload: any) {
    const res = await fetch('/api/vencimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error al crear vencimiento');
    return await res.json();
  },

  async actualizarVencimiento(id: number, payload: any) {
    const res = await fetch(`/api/vencimientos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error al actualizar vencimiento');
    return await res.json();
  },

  async eliminarVencimiento(id: number) {
    const res = await fetch(`/api/vencimientos/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar vencimiento');
    return true;
  }
};
