/**
 * Script de migración: crea las tablas auxiliares de autenticación.
 * Ejecutar: node src/db/migrations/run_auth_migration.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const pool = require('../connection');
const fs   = require('fs');

async function runMigration() {
  const sql = fs.readFileSync(path.join(__dirname, 'auth_tables.sql'), 'utf8');

  // Separar por ';' y filtrar líneas de comentarios y vacías
  const statements = sql
    .split(';')
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 10);

  console.log(`\n🔄 Ejecutando ${statements.length} sentencia(s) SQL...\n`);

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
      console.log(`  ✅ OK: ${preview}...`);
    } catch (err) {
      if (err.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log(`  ⏭️  SKIP (ya existe): ${stmt.slice(0, 50).replace(/\s+/g, ' ')}...`);
      } else {
        console.error(`  ❌ ERROR: ${err.message}`);
        console.error(`     SQL: ${stmt.slice(0, 100)}`);
      }
    }
  }

  console.log('\n✅ Migración completada.\n');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('❌ Migración fallida:', err.message);
  process.exit(1);
});
