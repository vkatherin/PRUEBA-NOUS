'use strict';
// Migración 03: Agrega columnas de aceptación de tratamiento de datos (Ley 1581 de 2012)
// a la tabla `usuarios`.
//
// El script verifica si la columna ya existe antes de ejecutar el ALTER para
// que sea idempotente (puede correrse varias veces sin error).
//
// Uso: node src/db/migrations/run_migration_03.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const pool = require('../connection');

/**
 * Verifica si una columna existe en la tabla indicada.
 */
async function columnaExiste(tabla, columna) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = ?
       AND COLUMN_NAME  = ?`,
    [tabla, columna]
  );
  return rows[0].total > 0;
}

async function main() {
  console.log('\n🌱  Migración 03 — Autorización de Tratamiento de Datos Personales (Ley 1581)\n');

  const yaAplicada = await columnaExiste('usuarios', 'acepto_tratamiento_datos');

  if (yaAplicada) {
    console.log('ℹ️  La columna "acepto_tratamiento_datos" ya existe en usuarios — nada que hacer.\n');
    await pool.end();
    return;
  }

  console.log('🔄  Agregando columnas a la tabla usuarios...\n');

  await pool.query(`
    ALTER TABLE usuarios
      ADD COLUMN acepto_tratamiento_datos   BOOLEAN     NOT NULL DEFAULT FALSE,
      ADD COLUMN fecha_aceptacion_datos     DATETIME    NULL,
      ADD COLUMN version_politica_aceptada  VARCHAR(20) NULL
  `);

  console.log('  ✅ acepto_tratamiento_datos   BOOLEAN NOT NULL DEFAULT FALSE');
  console.log('  ✅ fecha_aceptacion_datos     DATETIME NULL');
  console.log('  ✅ version_politica_aceptada  VARCHAR(20) NULL');
  console.log('\n✅  Migración 03 aplicada correctamente.');
  console.log('ℹ️  Los usuarios existentes quedan con acepto_tratamiento_datos = FALSE.');
  console.log('    Se les pedirá aceptar la política la próxima vez que inicien sesión.\n');

  await pool.end();
}

main().catch((err) => {
  console.error('\n❌  Error en la migración 03:', err.message);
  process.exit(1);
});
