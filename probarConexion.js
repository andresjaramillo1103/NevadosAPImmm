
const conexion = require('./db');

async function probarConexion() {
    try {
        const [resultado] = await conexion.query('SELECT 1 AS prueba');

        console.log('Conexion a MySQL exitosa');
        console.log(resultado);

    } catch (error) {
        console.error('Error al conectar con MySQL:', error.message);

    } finally {
        await conexion.end();
    }
}

probarConexion();
