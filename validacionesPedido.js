// Funciones de lógica de negocio de los pedidos (separadas de server.js para poder probarlas con Jest)

// Valida los datos de un pedido y devuelve la lista de errores (vacía si todo está bien).
function validarPedido(datos) {
  const errores = [];
  const { cliente, telefono, productos } = datos || {};

  if (!cliente) errores.push('El cliente es obligatorio');
  if (!telefono) errores.push('El teléfono es obligatorio');

  if (!Array.isArray(productos) || productos.length === 0) {
    errores.push('Debe incluir al menos un sabor');
  } else {
    productos.forEach((producto, i) => {
      const saborId = Number(producto.sabor_id);
      const cantidad = Number(producto.cantidad);
      if (!Number.isInteger(saborId) || saborId <= 0) {
        errores.push(`El sabor del producto ${i + 1} no es válido`);
      }
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        errores.push(`La cantidad del producto ${i + 1} debe ser mayor que cero`);
      }
    });
  }

  return errores;
}

// Calcula el total de un pedido: suma de precio por cantidad de cada producto.
function calcularTotal(items) {
  if (!Array.isArray(items)) throw new Error('Los items deben ser una lista');
  return items.reduce((total, item) => {
    const precio = Number(item.precio);
    const cantidad = Number(item.cantidad);
    if (Number.isNaN(precio) || Number.isNaN(cantidad)) {
      throw new Error('Precio o cantidad no válidos');
    }
    return total + precio * cantidad;
  }, 0);
}

module.exports = { validarPedido, calcularTotal };