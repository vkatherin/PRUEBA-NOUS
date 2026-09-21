const express = require("express");
const router = express.Router();
const pool = require("../../db/connection");

const { verificarAutenticacion, verificarPermiso } = require('../auth/auth.middleware');

router.use(verificarAutenticacion);

// GET /api/evaluaciones
router.get("/", verificarPermiso('evaluaciones.leer'), async (req, res) => {
  try {
    const usuario = req.usuario;
    const [rolesResult] = await pool.query('SELECT r.nombre FROM roles r JOIN usuario_rol ur ON r.id = ur.rol_id WHERE ur.usuario_id = ?', [req.usuario.id]);
    const roles = rolesResult.map(r => r.nombre);
    const veTodos = ['administrador', 'directivos', 'director_investigacion', 'coordinador_investigacion'].some(r => roles.includes(r));
    
    let whereClause = "1=1";
    let queryParams = [];

    if (!veTodos) {
      if (roles.includes('evaluador')) {
        whereClause = "e.evaluador_id = ?";
        queryParams.push(usuario.id);
      } else {
        whereClause = "1=0";
      }
    }

    const [rows] = await pool.query(`
      SELECT
        e.id, e.proyecto_id, e.evaluador_id, e.tipo,
        e.fecha_asignacion, e.fecha_limite, e.estado,
        e.puntaje_total, e.observaciones,
        COALESCE(p.titulo, 'Proyecto sin título') AS proyecto,
        COALESCE(c.titulo, 'Convocatoria General') AS convocatoria,
        COALESCE(u.nombre_completo, 'Evaluador Asignado') AS evaluador_nombre
      FROM evaluaciones e
      LEFT JOIN proyectos p ON p.id = e.proyecto_id
      LEFT JOIN convocatorias c ON c.id = p.convocatoria_id
      LEFT JOIN usuarios u ON u.id = e.evaluador_id
      WHERE ${whereClause}
      ORDER BY e.fecha_asignacion DESC
    `, queryParams);

    // Anonymize evaluator name for applicants or non-admins if needed, though they don't see it yet
    const resultados = rows.map(r => ({
      ...r,
      evaluador_nombre: veTodos || r.evaluador_id === usuario.id ? r.evaluador_nombre : 'Par Evaluador Anónimo'
    }));

    res.json(resultados);
  } catch (err) {
    console.error("Error al listar evaluaciones:", err);
    res.status(500).json({ error: "Error al listar evaluaciones" });
  }
});

// GET /api/evaluaciones/:id
router.get("/:id", verificarPermiso('evaluaciones.leer'), async (req, res) => {
  try {
    const usuario = req.usuario;
    const [rolesResult] = await pool.query('SELECT r.nombre FROM roles r JOIN usuario_rol ur ON r.id = ur.rol_id WHERE ur.usuario_id = ?', [req.usuario.id]);
    const roles = rolesResult.map(r => r.nombre);
    const veTodos = ['administrador', 'directivos', 'director_investigacion', 'coordinador_investigacion'].some(r => roles.includes(r));
    
    let whereClause = "e.id = ?";
    let queryParams = [req.params.id];

    if (!veTodos) {
      if (roles.includes('evaluador')) {
        whereClause += " AND e.evaluador_id = ?";
        queryParams.push(usuario.id);
      } else {
        whereClause += " AND 1=0";
      }
    }

    const [[evaluacion]] = await pool.query(`
      SELECT
        e.*,
        p.titulo AS proyecto,
        c.titulo AS convocatoria,
        u.nombre_completo AS evaluador_nombre
      FROM evaluaciones e
      LEFT JOIN proyectos p ON p.id = e.proyecto_id
      LEFT JOIN convocatorias c ON c.id = p.convocatoria_id
      LEFT JOIN usuarios u ON u.id = e.evaluador_id
      WHERE ${whereClause}
    `, queryParams);

    if (!evaluacion) return res.status(404).json({ error: "Evaluación no encontrada" });

    const [criterios] = await pool.query(
      "SELECT * FROM evaluacion_criterios WHERE evaluacion_id = ?",
      [req.params.id]
    );

    const [[documento]] = await pool.query(
      "SELECT nombre, url FROM documentos WHERE proyecto_id = ? LIMIT 1",
      [evaluacion.proyecto_id]
    );

    res.json({ 
      ...evaluacion, 
      evaluador_nombre: veTodos || evaluacion.evaluador_id === usuario.id ? evaluacion.evaluador_nombre : 'Par Evaluador Anónimo',
      criterios,
      documento_url: documento ? documento.url : null,
      documento_nombre: documento ? documento.nombre : null
    });
  } catch (err) {
    console.error("Error al obtener evaluación:", err);
    res.status(500).json({ error: "Error al obtener evaluación" });
  }
});

// POST /api/evaluaciones/:id/calificar
router.post("/:id/calificar", verificarPermiso('evaluaciones.evaluar'), async (req, res) => {
  try {
    const usuario = req.usuario;
    const [rolesResult] = await pool.query('SELECT r.nombre FROM roles r JOIN usuario_rol ur ON r.id = ur.rol_id WHERE ur.usuario_id = ?', [req.usuario.id]);
    const roles = rolesResult.map(r => r.nombre);
    const veTodos = ['administrador', 'directivos', 'director_investigacion', 'coordinador_investigacion'].some(r => roles.includes(r));
    
    if (!veTodos) {
      if (roles.includes('evaluador')) {
        const [[evaluacionDb]] = await pool.query("SELECT evaluador_id FROM evaluaciones WHERE id = ?", [req.params.id]);
        if (!evaluacionDb) return res.status(404).json({ error: "Evaluación no encontrada" });
        if (evaluacionDb.evaluador_id !== usuario.id) {
          return res.status(403).json({ error: "No tienes permiso para calificar esta evaluación" });
        }
      } else {
        return res.status(403).json({ error: "No tienes permiso para calificar evaluaciones" });
      }
    }

    const { puntaje_total, observaciones, criterios } = req.body;

    await pool.query(
      "UPDATE evaluaciones SET puntaje_total = ?, observaciones = ?, estado = 'completada' WHERE id = ?",
      [puntaje_total || 0, observaciones || "", req.params.id]
    );

    if (Array.isArray(criterios)) {
      for (const c of criterios) {
        if (c.id) {
          await pool.query(
            "UPDATE evaluacion_criterios SET puntaje_obtenido = ? WHERE id = ? AND evaluacion_id = ?",
            [c.puntaje_obtenido, c.id, req.params.id]
          );
        } else if (c.criterio) {
          await pool.query(
            "INSERT INTO evaluacion_criterios (evaluacion_id, criterio, puntaje_maximo, puntaje_obtenido) VALUES (?, ?, ?, ?)",
            [req.params.id, c.criterio, c.puntaje_maximo || 100, c.puntaje_obtenido || 0]
          );
        }
      }
    }

    res.json({ ok: true, mensaje: "Evaluación calificada exitosamente" });
  } catch (err) {
    console.error("Error al calificar evaluación:", err);
    res.status(500).json({ error: "Error al calificar evaluación" });
  }
});

// GET /api/evaluaciones/data/evaluadores — lista de usuarios con rol evaluador
router.get("/data/evaluadores", verificarPermiso('evaluaciones.asignar'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.nombre_completo, u.correo_institucional
      FROM usuarios u
      JOIN usuario_rol ur ON ur.usuario_id = u.id
      JOIN roles r ON r.id = ur.rol_id
      WHERE r.nombre = 'evaluador' AND u.activo = 1
      ORDER BY u.nombre_completo
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al listar evaluadores" });
  }
});

// GET /api/evaluaciones/data/proyectos-sin-evaluador — proyectos evaluables aún sin asignar
router.get("/data/proyectos-sin-evaluador", verificarPermiso('evaluaciones.asignar'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.titulo, p.codigo_unico, p.estado
      FROM proyectos p
      WHERE p.id NOT IN (
        SELECT proyecto_id FROM evaluaciones WHERE estado = 'pendiente'
      )
      ORDER BY p.fecha_inicio DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al listar proyectos" });
  }
});

// POST /api/evaluaciones — asignar un evaluador a un proyecto
router.post("/", verificarPermiso('evaluaciones.asignar'), async (req, res) => {
  try {
    const { proyecto_id, evaluador_id, tipo, fecha_limite } = req.body;

    if (!proyecto_id || !evaluador_id || !tipo) {
      return res.status(400).json({ error: "proyecto_id, evaluador_id y tipo son obligatorios" });
    }

    const [[proyecto]] = await pool.query("SELECT id, titulo, investigador_principal_id FROM proyectos WHERE id = ?", [proyecto_id]);
    if (!proyecto) return res.status(404).json({ error: "Proyecto no encontrado" });

    const [[evaluadorUsuario]] = await pool.query(`
      SELECT u.id FROM usuarios u
      JOIN usuario_rol ur ON ur.usuario_id = u.id
      JOIN roles r ON r.id = ur.rol_id
      WHERE u.id = ? AND r.nombre = 'evaluador'
    `, [evaluador_id]);
    if (!evaluadorUsuario) return res.status(400).json({ error: "El usuario seleccionado no tiene rol de evaluador" });

    const [result] = await pool.query(`
      INSERT INTO evaluaciones (proyecto_id, evaluador_id, tipo, fecha_asignacion, fecha_limite, estado)
      VALUES (?, ?, ?, CURDATE(), ?, 'pendiente')
    `, [proyecto_id, evaluador_id, tipo, fecha_limite || null]);

    // Notificación al evaluador asignado
    try {
      const { enviarCorreo } = require('../../shared/mailer');
      const [[pref]] = await pool.query(
        `SELECT notif_evaluacion_asignada FROM preferencias_notificacion WHERE usuario_id = ?`,
        [evaluador_id]
      );
      const [[correoEvaluador]] = await pool.query(
        `SELECT correo_institucional FROM usuarios WHERE id = ?`, [evaluador_id]
      );
      if ((!pref || pref.notif_evaluacion_asignada) && correoEvaluador) {
        await enviarCorreo({
          destinatarios: [correoEvaluador.correo_institucional],
          asunto: `Nueva evaluación asignada: ${proyecto.titulo}`,
          cuerpo: `Se te ha asignado la evaluación del proyecto "${proyecto.titulo}" (tipo: ${tipo}). Fecha límite: ${fecha_limite || 'sin definir'}.`,
          tipo: 'evaluacion_asignada',
        });
      }
    } catch (mailErr) {
      console.warn('No se pudo enviar notificación de evaluación asignada:', mailErr.message);
    }

    res.status(201).json({ ok: true, id: result.insertId, mensaje: "Evaluador asignado correctamente" });
  } catch (err) {
    console.error("Error al asignar evaluador:", err);
    res.status(500).json({ error: "Error al asignar evaluador" });
  }
});

module.exports = router;
