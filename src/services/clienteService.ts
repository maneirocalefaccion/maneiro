export const clienteService = {
  async getClientes(page = 1, pageSize = 50, query = '') {
    const res = await fetch(`/api/clientes?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Error al cargar clientes");
    return await res.json();
  },

  async guardarCliente(payload: any, id?: number) {
    const url = id ? `/api/clientes/${id}` : '/api/clientes';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  async eliminarCliente(id: number) {
    const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Error al eliminar cliente");
    return true;
  },

  async getHistorialCliente(id: number) {
    const res = await fetch(`/api/clientes/${id}/historial`);
    if (!res.ok) throw new Error("Error al obtener historial del cliente");
    return await res.json();
  }
};
