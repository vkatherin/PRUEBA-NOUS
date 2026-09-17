'use strict';
require('dotenv').config();

const bcrypt = require('bcryptjs');
const pool = require('../connection');

const ADMIN_NOMBRE = 'Administrador NOUS';
const ADMIN_CORREO = 'admin@unicatolicadelsur.edu.co';
const ADMIN_CEDULA = '0000000001';
const ADMIN_PASSWORD = 'Admin2025!'; // ← cámbiala tras el primer login
const ADMIN_ROL = 'administrador';

async function seedAdmin() {
  console.log('\n🌱  NOUS — Seed de usuario administrador');
  try {
    const [[rol]] = await pool.query(`SELECT id FROM roles WHERE nombre = ?`, [ADMIN_ROL]);
    if (!rol) throw new Error(`El rol '${ADMIN_ROL}' no existe en la tabla roles`);

    const [[existente]] = await pool.query(
      `SELECT id FROM usuarios WHERE correo_institucional = ?`, [ADMIN_CORREO]
    );

    let usuarioId;
    if (existente) {
      usuarioId = existente.id;
      await pool.query(`UPDATE usuarios SET activo = TRUE WHERE id = ?`, [usuarioId]);
      console.log(`ℹ️  Usuario ya existía (ID ${usuarioId}), asegurando rol...`);
    } else {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      const [result] = await pool.query(
        `INSERT INTO usuarios (nombre_completo, correo_institucional, cedula, password_hash, activo)
         VALUES (?, ?, ?, ?, TRUE)`,
        [ADMIN_NOMBRE, ADMIN_CORREO, ADMIN_CEDULA, passwordHash]
      );
      usuarioId = result.insertId;
      console.log(`✅  Usuario administrador creado (ID ${usuarioId})`);
    }

    // Asigna el rol vía usuario_rol, no una columna nueva
    await pool.query(
      `INSERT IGNORE INTO usuario_rol (usuario_id, rol_id) VALUES (?, ?)`,
      [usuarioId, rol.id]
    );
    console.log(`✅  Rol '${ADMIN_ROL}' asignado vía usuario_rol.`);
    console.log(`\n   Correo:     ${ADMIN_CORREO}`);
    console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
    console.log('\n⚠️  Cambia la contraseña después del primer inicio de sesión.\n');
  } catch (err) {
    console.error('\n❌  Error al crear el administrador:', err.message);
    process.exit(1);
  } finally {
    try { await pool.end(); } catch (_) { }
  }
}

seedAdmin();