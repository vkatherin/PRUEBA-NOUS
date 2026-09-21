const express = require("express");
const router = express.Router();
const pool = require("../../db/connection");

const { verificarAutenticacion, verificarPermiso, verificarPropietario } = require('../auth/auth.middleware');

router.use(verificarAutenticacion);

const propSemillero = verificarPropietario('semilleros', 'lider_profesor_id', [
  'administrador', 'directivos', 'director_semilleros', 'coordinador_semilleros'
]);

// GET /api/semilleros
router.get("/", verificarPermiso('semilleros.leer'), async (req, res) => {
  try {
    const usuario = req.usuario;
    const roles = usuario.roles || [];
    const veTodos = ['administrador', 'directivos', 'director_semilleros'].some(r => roles.includes(r));
    
    let whereClause = "1=1";
    let queryParams = [];

    if (!veTodos) {
      if (roles.includes('lider_semilleros') || roles.includes('docente') || roles.includes('estudiante')) {
        whereClause = "(s.lider_profesor_id = ? OR s.id IN (SELECT semillero_id FROM semillero_integrantes WHERE usuario_id = ?))";
        queryParams.push(usuario.id, usuario.id);
      } else {
        whereClause = "1=0";
      }
    }

    const [rows] = await pool.query(`
      SELECT s.id, s.nombre, s.codigo, s.estado_arte,
             s.vobo_programa, s.vobo_vicerrectoria, s.fecha_creacion,
             s.lider_estudiante_nombre, s.horas_asignadas,
             s.mision, s.vision, s.tema_interes,
             u.nombre_completo as lider_profesor,
             p.nombre as programa,
             (SELECT COUNT(*) FROM semillero_integrantes si WHERE si.semillero_id = s.id) as integrantes
      FROM semilleros s
      LEFT JOIN usuarios u ON u.id = s.lider_profesor_id
      LEFT JOIN programas_academicos p ON p.id = s.programa_id
      WHERE ${whereClause}
      ORDER BY s.fecha_creacion DESC
    `, queryParams);
    res.json(rows);
  } catch (err) {
    console.error("Error en semilleros:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

// GET /api/semilleros/:id
router.get("/:id", verificarPermiso('semilleros.leer'), propSemillero, async (req, res) => {
  try {
    const usuario = req.usuario;
    const roles = usuario.roles || [];
    const veTodos = ['administrador', 'directivos', 'director_semilleros'].some(r => roles.includes(r));
    
    let whereClause = "s.id = ?";
    let queryParams = [req.params.id];

    if (!veTodos) {
      if (roles.includes('lider_semilleros') || roles.includes('docente') || roles.includes('estudiante')) {
        whereClause += " AND (s.lider_profesor_id = ? OR s.id IN (SELECT semillero_id FROM semillero_integrantes WHERE usuario_id = ?))";
        queryParams.push(usuario.id, usuario.id);
      } else {
        whereClause += " AND 1=0";
      }
    }

    const [rows] = await pool.query(`
      SELECT s.*, u.nombre_completo as lider_profesor, p.nombre as programa
      FROM semilleros s
      LEFT JOIN usuarios u ON u.id = s.lider_profesor_id
      LEFT JOIN programas_academicos p ON p.id = s.programa_id
      WHERE ${whereClause}
    `, queryParams);
    
    if (rows.length === 0) return res.status(403).json({ error: "No encontrado o sin permiso" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

// GET /api/semilleros/:id/integrantes
router.get("/:id/integrantes", verificarPermiso('semilleros.leer'), propSemillero, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT si.*, u.nombre_completo, u.correo_institucional
      FROM semillero_integrantes si
      LEFT JOIN usuarios u ON u.id = si.usuario_id
      WHERE si.semillero_id = ?
      ORDER BY si.fecha_ingreso DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

// POST /api/semilleros
router.post("/", verificarPermiso('semilleros.crear'), async (req, res) => {
  try {
    const {
      nombre, codigo, programa_id, lider_profesor_id,
      lider_estudiante_nombre, tema_interes, mision, vision
    } = req.body;

    if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

    const genCodigo = codigo || `SEM-${Date.now().toString().slice(-4)}`;
    const [result] = await pool.query(`
      INSERT INTO semilleros
        (nombre, codigo, programa_id, lider_profesor_id,
         lider_estudiante_nombre, tema_interes, mision, vision,
         vobo_programa, vobo_vicerrectoria, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW())
    `, [
      nombre, genCodigo, programa_id || 1, lider_profesor_id || 1,
      lider_estudiante_nombre || null, tema_interes || null,
      mision || null, vision || null
    ]);

    const [[nuevo]] = await pool.query(`
      SELECT s.id, s.nombre, s.codigo, s.fecha_creacion,
             u.nombre_completo as lider_profesor,
             p.nombre as programa,
             0 as integrantes
      FROM semilleros s
      LEFT JOIN usuarios u ON u.id = s.lider_profesor_id
      LEFT JOIN programas_academicos p ON p.id = s.programa_id
      WHERE s.id = ?
    `, [result.insertId]);

    res.status(201).json({ ok: true, semillero: nuevo });
  } catch (err) {
    console.error("Error al crear semillero:", err);
    res.status(500).json({ error: "Error al crear semillero" });
  }
});

module.exports = router;
