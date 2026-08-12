export const inventarioService = {
  async getInventario() {
    const res = await fetch('/api/inventario');
    if (!res.ok) throw new Error("Error al cargar inventario");
    const data = await res.json();
    return data.data || [];
  },

  async guardarItem(payload: any, id?: number) {
    const url = id ? `/api/inventario/${id}` : '/api/inventario';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Error al guardar item de inventario");
    return await res.json();
  },

  async eliminarItem(id: number) {
    const res = await fetch(`/api/inventario/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Error al eliminar item del inventario");
    return true;
  }
};
