const express = require("express");
const router = express.Router();
const pool = require("../../db/connection");

// GET /api/evaluaciones
router.get("/", async (req, res) => {
  try {
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
      ORDER BY e.fecha_asignacion DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error al listar evaluaciones:", err);
    res.status(500).json({ error: "Error al listar evaluaciones" });
  }
});

// GET /api/evaluaciones/:id
router.get("/:id", async (req, res) => {
  try {
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
      WHERE e.id = ?
    `, [req.params.id]);

    if (!evaluacion) return res.status(404).json({ error: "Evaluación no encontrada" });

    const [criterios] = await pool.query(
      "SELECT * FROM evaluacion_criterios WHERE evaluacion_id = ?",
      [req.params.id]
    );

    res.json({ ...evaluacion, criterios });
  } catch (err) {
    console.error("Error al obtener evaluación:", err);
    res.status(500).json({ error: "Error al obtener evaluación" });
  }
});

// POST /api/evaluaciones/:id/calificar
router.post("/:id/calificar", async (req, res) => {
  try {
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

module.exports = router;
