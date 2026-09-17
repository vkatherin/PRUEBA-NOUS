<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const ctrl = require('./usuarios.controller');
const { verificarAutenticacion, verificarRol } = require('../auth/auth.middleware');

// Todas las rutas de usuarios requieren estar autenticado y ser administrador
router.use(verificarAutenticacion, verificarRol('administrador'));

// GET /api/usuarios
router.get('/', ctrl.getUsuarios);

// GET /api/usuarios/roles
router.get('/roles', ctrl.getRolesDisponibles);

// POST /api/usuarios/:id/roles
router.post('/:id/roles', ctrl.asignarRol);

// DELETE /api/usuarios/:id/roles/:role
router.delete('/:id/roles/:role', ctrl.removerRol);
=======
const express = require("express");
const router = express.Router();
const pool = require("../../db/connection");

// GET /api/usuarios
router.get("/usuarios", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id, u.nombre_completo, u.correo_institucional, u.cedula,
        u.activo, u.fecha_creacion,
        COALESCE(GROUP_CONCAT(r.nombre SEPARATOR ', '), 'Sin Rol') AS rol,
        COALESCE(GROUP_CONCAT(r.id), '') AS rol_ids
      FROM usuarios u
      LEFT JOIN usuario_rol ur ON ur.usuario_id = u.id
      LEFT JOIN roles r ON r.id = ur.rol_id
      GROUP BY u.id
      ORDER BY u.id ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error al listar usuarios:", err);
    res.status(500).json({ error: "Error al listar usuarios" });
  }
});

// POST /api/usuarios
router.post("/usuarios", async (req, res) => {
  try {
    const { nombre_completo, correo_institucional, cedula, rol_id, password } = req.body;
    if (!nombre_completo || !correo_institucional) {
      return res.status(400).json({ error: "Nombre y correo institucional son obligatorios" });
    }

    const genCedula = cedula || Date.now().toString().slice(-8);
    const passHash = password || "Admin123!";

    const [result] = await pool.query(`
      INSERT INTO usuarios
        (nombre_completo, correo_institucional, cedula, password_hash, mfa_habilitado, activo, fecha_creacion)
      VALUES (?, ?, ?, ?, 0, 1, NOW())
    `, [nombre_completo, correo_institucional, genCedula, passHash]);

    const newId = result.insertId;

    if (rol_id) {
      await pool.query(
        "INSERT INTO usuario_rol (usuario_id, rol_id) VALUES (?, ?)",
        [newId, rol_id]
      );
    }

    const [[usuario]] = await pool.query(`
      SELECT u.id, u.nombre_completo, u.correo_institucional, u.cedula, u.activo,
             COALESCE(GROUP_CONCAT(r.nombre SEPARATOR ', '), 'Sin Rol') AS rol
      FROM usuarios u
      LEFT JOIN usuario_rol ur ON ur.usuario_id = u.id
      LEFT JOIN roles r ON r.id = ur.rol_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [newId]);

    res.status(201).json({ ok: true, usuario });
  } catch (err) {
    console.error("Error al crear usuario:", err);
    res.status(500).json({ error: "Error al crear usuario: " + err.message });
  }
});

// PATCH /api/usuarios/:id/estado
router.patch("/usuarios/:id/estado", async (req, res) => {
  try {
    const { activo } = req.body;
    await pool.query("UPDATE usuarios SET activo = ? WHERE id = ?", [activo ? 1 : 0, req.params.id]);
    res.json({ ok: true, id: req.params.id, activo });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar estado de usuario" });
  }
});

// GET /api/roles
router.get("/roles", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        r.id, r.nombre, r.descripcion,
        (SELECT COUNT(*) FROM usuario_rol ur WHERE ur.rol_id = r.id) AS usuarios_count,
        COALESCE((SELECT COUNT(*) FROM rol_permiso rp WHERE rp.rol_id = r.id), 0) AS permisos_count
      FROM roles r
      ORDER BY r.id ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error al listar roles:", err);
    res.status(500).json({ error: "Error al listar roles" });
  }
});
>>>>>>> main

module.exports = router;
