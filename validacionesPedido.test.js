const { validarPedido, calcularTotal } = require('./validacionesPedido');

describe('HU-03: cálculo del total del pedido', () => {
  test('suma precio por cantidad de varios productos', () => {
    const items = [
      { precio: 4000, cantidad: 3 },
      { precio: 4000, cantidad: 1 },
    ];
    expect(calcularTotal(items)).toBe(16000);
  });

  test('con un solo producto devuelve su subtotal', () => {
    expect(calcularTotal([{ precio: 4000, cantidad: 2 }])).toBe(8000);
  });

  test('con la lista vacía el total es 0', () => {
    expect(calcularTotal([])).toBe(0);
  });

  test('con una entrada que no es lista lanza un error', () => {
    expect(() => calcularTotal(null)).toThrow();
  });

  test('con un precio no numérico lanza un error', () => {
    expect(() => calcularTotal([{ precio: 'abc', cantidad: 1 }])).toThrow();
  });
});

describe('HU-04: validación de los datos del pedido', () => {
  const pedidoValido = {
    cliente: 'Nataly',
    telefono: '3001234567',
    productos: [{ sabor_id: 1, cantidad: 2 }],
  };

  test('un pedido válido no tiene errores', () => {
    expect(validarPedido(pedidoValido)).toEqual([]);
  });

  test('sin cliente devuelve "El cliente es obligatorio"', () => {
    const errores = validarPedido({ ...pedidoValido, cliente: '' });
    expect(errores).toContain('El cliente es obligatorio');
  });

  test('sin sabores devuelve un error', () => {
    const errores = validarPedido({ ...pedidoValido, productos: [] });
    expect(errores).toContain('Debe incluir al menos un sabor');
  });

  test('con cantidad cero devuelve un error', () => {
    const errores = validarPedido({
      ...pedidoValido,
      productos: [{ sabor_id: 1, cantidad: 0 }],
    });
    expect(errores).toHaveLength(1);
  });

  test('con cantidad negativa devuelve un error', () => {
    const errores = validarPedido({
      ...pedidoValido,
      productos: [{ sabor_id: 1, cantidad: -2 }],
    });
    expect(errores).toHaveLength(1);
  });

  test('con varios errores a la vez los devuelve todos juntos', () => {
    const errores = validarPedido({ cliente: '', telefono: '', productos: [] });
    expect(errores).toHaveLength(3);
  });

  test('sin datos no se cae y devuelve errores', () => {
    expect(validarPedido(undefined).length).toBeGreaterThan(0);
  });
});