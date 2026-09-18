'use strict';
// Corre esto una sola vez contra tu base local si aún no tiene las
// columnas de código de convocatorias (codigo, tipo_investigacion,
// dirigida_a, descripcion, observaciones_comite) ni la tabla
// consecutivos_convocatorias.
//
// Uso:  node src/db/migrations/run_migration_02.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../connection');

async function columnaExiste(tabla, columna) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tabla, columna]
  );
  return rows[0].total > 0;
}

async function main() {
  console.log('\n🌱  Migración 02 — código automático de convocatorias\n');

  const yaAplicada = await columnaExiste('convocatorias', 'codigo');
  if (yaAplicada) {
    console.log('ℹ️  Ya existe la columna "codigo" en convocatorias — nada que hacer.\n');
    await pool.end();
    return;
  }

  const sqlPath = path.resolve(__dirname, '../../../../02_convocatorias_codigo.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Quita el USE nous_db; (el pool ya está conectado a la BD correcta)
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.toUpperCase().startsWith('USE '));

  for (const stmt of statements) {
    await pool.query(stmt);
    console.log('✅  Ejecutado:', stmt.slice(0, 60).replace(/\s+/g, ' ') + '...');
  }

  console.log('\n✅  Migración 02 aplicada correctamente.\n');
  await pool.end();
}

main().catch((err) => {
  console.error('\n❌  Error en la migración 02:', err.message);
  process.exit(1);
});
