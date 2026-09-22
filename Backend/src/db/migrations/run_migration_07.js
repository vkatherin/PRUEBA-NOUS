const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const fs = require('fs');
const pool = require('../connection');

async function runMigration() {
  const sqlFile = path.join(__dirname, '07_reportes_soporte.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  try {
    const connection = await pool.getConnection();
    
    const queries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);
    for (let query of queries) {
      await connection.query(query);
    }
    
    console.log('✅ Migración 07 (Reportes Soporte) ejecutada exitosamente.');
    connection.release();
  } catch (error) {
    console.error('❌ Error en migración 07:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigration().then(() => process.exit(0));
}

module.exports = runMigration;
