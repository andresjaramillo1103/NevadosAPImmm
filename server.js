const express = require('express');
const conexion = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());

// Respuesta inicial de la API
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API de Nevados funcionando correctamente',
    data: null,
    error: null
  });
});


 // Endpoint 1: consultar todos los sabores desde MySQL
app.get('/api/v1/sabores', async (req, res) => {
  try {
    const [sabores] = await conexion.query(
      'SELECT id, nombre, precio FROM sabores'
    );

    return res.status(200).json({
      success: true,
      message: 'Sabores consultados correctamente',
      data: sabores,
      error: null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al consultar los sabores',
      data: null,
      error: {
        code: 'ERROR_BASE_DATOS'
      }
    });
  }
});



 // Endpoint 2: consultar un sabor por su ID

 // Endpoint 2: consultar un sabor por su ID desde MySQL
app.get('/api/v1/sabores/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El ID del sabor no es válido',
        data: null,
        error: {
          code: 'ID_INVALIDO'
        }
      });
    }

    const [sabores] = await conexion.query(
      'SELECT id, nombre, precio FROM sabores WHERE id = ?',
      [id]
    );

    if (sabores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el sabor solicitado',
        data: null,
        error: {
          code: 'SABOR_NO_ENCONTRADO'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Sabor consultado correctamente',
      data: sabores[0],
      error: null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al consultar el sabor',
      data: null,
      error: {
        code: 'ERROR_BASE_DATOS'
      }
    });
  }
});


 // Endpoint 3: registrar un pedido

 // Endpoint 3: registrar un pedido en MySQL
app.post('/api/v1/pedidos', async (req, res) => {
  const { cliente, telefono, productos } = req.body;

  if (
    !cliente ||
    !telefono ||
    !Array.isArray(productos) ||
    productos.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'Debe enviar cliente, teléfono y al menos un producto',
      data: null,
      error: {
        code: 'DATOS_INVALIDOS'
      }
    });
  }

  const conexionPedido = await conexion.getConnection();

  try {
    await conexionPedido.beginTransaction();

    const [resultadoPedido] = await conexionPedido.query(
      'INSERT INTO pedidos (cliente, telefono) VALUES (?, ?)',
      [cliente, telefono]
    );

    const pedidoId = resultadoPedido.insertId;
    const productosGuardados = [];
    let total = 0;

    for (const producto of productos) {
      const saborId = Number(producto.sabor_id);
      const cantidad = Number(producto.cantidad);

      if (
        !Number.isInteger(saborId) ||
        saborId <= 0 ||
        !Number.isInteger(cantidad) ||
        cantidad <= 0
      ) {
        throw new Error('PRODUCTOS_INVALIDOS');
      }

      const [saboresEncontrados] = await conexionPedido.query(
        'SELECT id, nombre, precio FROM sabores WHERE id = ?',
        [saborId]
      );

      if (saboresEncontrados.length === 0) {
        throw new Error('SABOR_NO_ENCONTRADO');
      }

      const sabor = saboresEncontrados[0];
      const precio = Number(sabor.precio);
      const subtotal = precio * cantidad;

      await conexionPedido.query(
        `INSERT INTO pedido_productos
         (pedido_id, sabor_id, cantidad, precio_unitario)
         VALUES (?, ?, ?, ?)`,
        [pedidoId, saborId, cantidad, precio]
      );

      productosGuardados.push({
        sabor_id: sabor.id,
        nombre: sabor.nombre,
        cantidad,
        precio_unitario: precio,
        subtotal
      });

      total += subtotal;
    }

    await conexionPedido.commit();

    return res.status(201).json({
      success: true,
      message: 'Pedido creado correctamente',
      data: {
        id: pedidoId,
        cliente,
        telefono,
        productos: productosGuardados,
        total
      },
      error: null
    });
  } catch (error) {
    await conexionPedido.rollback();

    if (error.message === 'PRODUCTOS_INVALIDOS') {
      return res.status(400).json({
        success: false,
        message: 'Cada producto debe tener un ID de sabor y una cantidad válida',
        data: null,
        error: { code: 'PRODUCTOS_INVALIDOS' }
      });
    }

    if (error.message === 'SABOR_NO_ENCONTRADO') {
      return res.status(400).json({
        success: false,
        message: 'Uno de los sabores solicitados no existe',
        data: null,
        error: { code: 'SABOR_NO_ENCONTRADO' }
      });
    }

    console.error('Error al registrar pedido:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Error al registrar el pedido',
      data: null,
      error: { code: 'ERROR_BASE_DATOS' }
    });
  } finally {
    conexionPedido.release();
  }
});



 // Endpoint 4: consultar un pedido por su ID

 // Endpoint 4: consultar un pedido por su ID desde MySQL
app.get('/api/v1/pedidos/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'El ID del pedido no es válido',
      data: null,
      error: { code: 'ID_INVALIDO' }
    });
  }

  try {
    const [pedidos] = await conexion.query(
      'SELECT id, cliente, telefono, fecha FROM pedidos WHERE id = ?',
      [id]
    );

    if (pedidos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el pedido solicitado',
        data: null,
        error: { code: 'PEDIDO_NO_ENCONTRADO' }
      });
    }

    const [productos] = await conexion.query(
      `SELECT pp.sabor_id, s.nombre, pp.cantidad, pp.precio_unitario
       FROM pedido_productos pp
       INNER JOIN sabores s ON pp.sabor_id = s.id
       WHERE pp.pedido_id = ?`,
      [id]
    );

    const productosConSubtotal = productos.map((producto) => ({
      ...producto,
      precio_unitario: Number(producto.precio_unitario),
      subtotal: Number(producto.precio_unitario) * producto.cantidad
    }));

    const total = productosConSubtotal.reduce(
      (suma, producto) => suma + producto.subtotal,
      0
    );

    return res.status(200).json({
      success: true,
      message: 'Pedido consultado correctamente',
      data: {
        ...pedidos[0],
        productos: productosConSubtotal,
        total
      },
      error: null
    });
  } catch (error) {
    console.error('Error al consultar pedido:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Error al consultar el pedido',
      data: null,
      error: { code: 'ERROR_BASE_DATOS' }
    });
  }
});



 // Endpoint 5: consultar todos los pedidos

 // Endpoint 5: consultar todos los pedidos desde MySQL
app.get('/api/v1/pedidos', async (req, res) => {
  try {
    const [pedidos] = await conexion.query(
      'SELECT id, cliente, telefono, fecha FROM pedidos ORDER BY id DESC'
    );

    for (const pedido of pedidos) {
      const [productos] = await conexion.query(
        `SELECT pp.sabor_id, s.nombre, pp.cantidad, pp.precio_unitario
         FROM pedido_productos pp
         INNER JOIN sabores s ON pp.sabor_id = s.id
         WHERE pp.pedido_id = ?`,
        [pedido.id]
      );

      pedido.productos = productos.map((producto) => ({
        ...producto,
        precio_unitario: Number(producto.precio_unitario),
        subtotal: Number(producto.precio_unitario) * producto.cantidad
      }));

      pedido.total = pedido.productos.reduce(
        (suma, producto) => suma + producto.subtotal,
        0
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Pedidos consultados correctamente',
      data: pedidos,
      error: null
    });
  } catch (error) {
    console.error('Error al consultar pedidos:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Error al consultar los pedidos',
      data: null,
      error: { code: 'ERROR_BASE_DATOS' }
    });
  }
});


app.listen(PORT, () => {
  console.log(`API de Nevados disponible en http://localhost:${PORT}`);
});
