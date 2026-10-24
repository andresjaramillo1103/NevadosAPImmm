
const mysql = require('mysql2/promise');

const conexion = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nevados_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = conexion;
