const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verifica la conexión al arrancar el servidor
pool.getConnection()
  .then((conn) => {
    console.log('✅ Conectado a nous_db');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Error al conectar a nous_db:', err.message);
  });

module.exports = pool;