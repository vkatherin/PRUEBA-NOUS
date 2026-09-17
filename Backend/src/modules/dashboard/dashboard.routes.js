const express = require("express");
const router = express.Router();
const pool = require("../../db/connection");

router.get("/stats", async (req, res) => {
  try {
    const [[{ proyectos }]] = await pool.query("SELECT COUNT(*) as proyectos FROM proyectos");
    const [[{ convocatorias }]] = await pool.query("SELECT COUNT(*) as convocatorias FROM convocatorias");
    const [[{ semilleros }]] = await pool.query("SELECT COUNT(*) as semilleros FROM semilleros");
    const [[{ investigadores }]] = await pool.query("SELECT COUNT(*) as investigadores FROM usuarios WHERE activo = 1");
    const [[{ evaluaciones }]] = await pool.query("SELECT COUNT(*) as evaluaciones FROM evaluaciones");
    const [[{ convocatoriasActivas }]] = await pool.query("SELECT COUNT(*) as convocatoriasActivas FROM convocatorias WHERE estado IN ('activa', 'publicada')");
    const [porEstado] = await pool.query("SELECT estado, COUNT(*) as total FROM proyectos GROUP BY estado");

    // Convocatorias recientes reales desde la base de datos
    const [convocatoriasRecientes] = await pool.query(`
      SELECT id, titulo AS nombre, estado, fecha_cierre AS cierre
      FROM convocatorias
      WHERE estado IN ('activa', 'publicada', 'abierta')
      ORDER BY fecha_cierre ASC
      LIMIT 5
    `);

    // Proyectos reales desde la base de datos
    const [topProyectos] = await pool.query(`
      SELECT p.id, p.titulo AS nombre, p.estado,
             COALESCE(u.nombre_completo, 'Sin asignar') AS lider,
             COALESCE(prog.facultad, 'Institucional') AS facultad,
             COALESCE(l.nombre, 'General') AS grupo
      FROM proyectos p
      LEFT JOIN usuarios u ON u.id = p.investigador_principal_id
      LEFT JOIN programas_academicos prog ON prog.id = p.programa_id
      LEFT JOIN lineas_investigacion l ON l.id = p.linea_investigacion_id
      ORDER BY p.fecha_creacion DESC
      LIMIT 5
    `);

    // Actividad reciente real
    const [recentActivity] = await pool.query(`
      SELECT p.titulo AS project,
             COALESCE(u.nombre_completo, 'Usuario') AS user,
             'Proyecto registrado en el sistema' AS action,
             DATE_FORMAT(p.fecha_creacion, '%d %b %Y') AS time
      FROM proyectos p
      LEFT JOIN usuarios u ON u.id = p.investigador_principal_id
      ORDER BY p.fecha_creacion DESC
      LIMIT 5
    `);

    res.json({
      proyectos,
      convocatorias,
      semilleros,
      investigadores,
      evaluaciones,
      convocatoriasActivas,
      proyectosPorEstado: porEstado,
      convocatoriasRecientes,
      topProyectos,
      recentActivity
    });
  } catch (err) {
    console.error("Error en dashboard:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;
