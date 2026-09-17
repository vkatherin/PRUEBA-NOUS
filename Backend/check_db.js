const pool = require('./src/db/connection');
async function run() {
  const [rows] = await pool.query('SELECT * FROM proyectos');
  console.log('Proyectos count:', rows.length);
  if (rows.length > 0) console.log('First:', rows[0]);
  process.exit(0);
}
run();
