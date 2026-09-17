/**
 * seed_admin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Crea (o actualiza) el usuario administrador inicial en nous_db.
 *
 * Uso:
 *   node src/db/migrations/seed_admin.js
 *
 * Variables configurables (editar antes de ejecutar):
 *   ADMIN_NOMBRE, ADMIN_CORREO, ADMIN_CEDULA, ADMIN_PASSWORD
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

require('dotenv').config(); // carga el .env del Backend

const bcrypt = require('bcryptjs');
const pool   = require('../connection');

// ── 1. Datos del administrador ────────────────────────────────────────────────
const ADMIN_NOMBRE   = 'Administrador NOUS';
const ADMIN_CORREO   = 'admin@unicatolicadelsur.edu.co'; // ajusta si es necesario
const ADMIN_CEDULA   = '0000000001';
const ADMIN_PASSWORD = 'Admin2025!';   // ← CAMBIA ESTA CONTRASEÑA después del primer login
const ADMIN_ROL      = 'administrador';
// ─────────────────────────────────────────────────────────────────────────────

async function seedAdmin() {
  console.log('\n🌱  NOUS — Seed de usuario administrador');
  console.log('─'.repeat(50));

  try {
    // ── Paso 1: Asegurarse de que la columna 'rol' existe ─────────────────────
    const [columns] = await pool.query(`SHOW COLUMNS FROM usuarios LIKE 'rol'`);
    if (columns.length === 0) {
      console.log("⚙️  Columna 'rol' no encontrada. Agregándola a la tabla usuarios...");
      await pool.query(`
        ALTER TABLE usuarios
          ADD COLUMN rol ENUM('administrador','directivos','docente','estudiante','invitado')
          NOT NULL DEFAULT 'estudiante'
          AFTER password_hash
      `);
      console.log("✅  Columna 'rol' agregada exitosamente.");
    } else {
      console.log("✅  Columna 'rol' ya existe.");
    }

    // ── Paso 2: Verificar si ya existe el correo ──────────────────────────────
    const [[existente]] = await pool.query(
      `SELECT id, nombre_completo, rol FROM usuarios WHERE correo_institucional = ?`,
      [ADMIN_CORREO]
    );

    if (existente) {
      console.log(`⚠️  Ya existe un usuario con ese correo:`);
      console.log(`   ID:     ${existente.id}`);
      console.log(`   Nombre: ${existente.nombre_completo}`);
      console.log(`   Rol:    ${existente.rol}`);

      // Si existe pero no es admin, actualizar el rol
      if (existente.rol !== ADMIN_ROL) {
        await pool.query(
          `UPDATE usuarios SET rol = ?, activo = TRUE WHERE id = ?`,
          [ADMIN_ROL, existente.id]
        );
        console.log(`✅  Rol actualizado a '${ADMIN_ROL}'.`);
      } else {
        console.log(`ℹ️  Ya tiene rol '${ADMIN_ROL}'. No se realizaron cambios.`);
      }

      await pool.end();
      return;
    }

    // ── Paso 3: Hashear contraseña e insertar admin ───────────────────────────
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const [result] = await pool.query(
      `INSERT INTO usuarios
         (nombre_completo, correo_institucional, cedula, password_hash, rol, activo)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [ADMIN_NOMBRE, ADMIN_CORREO, ADMIN_CEDULA, passwordHash, ADMIN_ROL]
    );

    console.log(`\n✅  Usuario administrador creado exitosamente.`);
    console.log(`   ID:         ${result.insertId}`);
    console.log(`   Nombre:     ${ADMIN_NOMBRE}`);
    console.log(`   Correo:     ${ADMIN_CORREO}`);
    console.log(`   Cédula:     ${ADMIN_CEDULA}`);
    console.log(`   Rol:        ${ADMIN_ROL}`);
    console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
    console.log('\n⚠️  Cambia la contraseña después del primer inicio de sesión.\n');

  } catch (err) {
    console.error('\n❌  Error al crear el administrador:', err.message);
    if (err.code === 'ER_NO_SUCH_TABLE') {
      console.error('   La tabla "usuarios" no existe. Asegúrate de haber corrido las migraciones de la BD primero.');
    }
    process.exit(1);
  } finally {
    try { await pool.end(); } catch (_) {}
  }
}

seedAdmin();
