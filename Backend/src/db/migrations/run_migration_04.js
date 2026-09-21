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
  console.log('\n🌱  Migración 04 — Preferencias y Notificaciones Simuladas\n');

  const yaAplicada = await tablaExiste('preferencias_notificacion');

  if (yaAplicada) {
    console.log('ℹ️  La tabla "preferencias_notificacion" ya existe — nada que hacer.\n');
    await pool.end();
    return;
  }

  console.log('🔄  Creando tablas de preferencias y notificaciones_simuladas...\n');

  const sqlPath = path.resolve(__dirname, '04_preferencias_notificacion.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // El pool mysql2 no soporta múltiples sentencias por defecto a menos que se configure,
  // así que separamos por ';' y ejecutamos una por una.
  const statements = sqlContent.split(';').map(s => s.trim()).filter(s => s.length > 0);

  for (const stmt of statements) {
    await pool.query(stmt);
  }

  console.log('  ✅ Tabla preferencias_notificacion creada');
  console.log('  ✅ Tabla notificaciones_simuladas creada');
  console.log('\n✅  Migración 04 aplicada correctamente.\n');

  await pool.end();
}

main().catch((err) => {
  console.error('\n❌  Error en la migración 04:', err.message);
  process.exit(1);
});
