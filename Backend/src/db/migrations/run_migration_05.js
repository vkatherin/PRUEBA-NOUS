'use strict';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const fs = require('fs');
const pool = require('../connection');

async function tablaExiste(tabla) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = ?`,
    [tabla]
  );
  return rows[0].total > 0;
}

async function main() {
  console.log('\n🌱  Migración 05 — Formatos Institucionales\n');

  const yaAplicada = await tablaExiste('formatos_institucionales');

  if (yaAplicada) {
    console.log('ℹ️  La tabla "formatos_institucionales" ya existe — nada que hacer.\n');
    await pool.end();
    return;
  }

  console.log('🔄  Creando tabla formatos_institucionales...\n');

  const sqlPath = path.resolve(__dirname, '05_formatos_institucionales.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Separar por ';' y ejecutar una por una.
  const statements = sqlContent.split(';').map(s => s.trim()).filter(s => s.length > 0);

  for (const stmt of statements) {
    await pool.query(stmt);
  }

  console.log('  ✅ Tabla formatos_institucionales creada');
  console.log('\n✅  Migración 05 aplicada correctamente.\n');

  await pool.end();
}

main().catch((err) => {
  console.error('\n❌  Error en la migración 05:', err.message);
  process.exit(1);
});
