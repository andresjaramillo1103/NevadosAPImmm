
const pedidos = [];

let siguienteId = 1;

function crearPedido(datos) {
  const pedido = {
    id: siguienteId++,
    ...datos,
    fecha: new Date().toISOString()
  };

  pedidos.push(pedido);
  return pedido;
}

function obtenerPedidos() {
  return pedidos;
}

function obtenerPedidoPorId(id) {
  return pedidos.find((pedido) => pedido.id === id);
}

module.exports = {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId
};
