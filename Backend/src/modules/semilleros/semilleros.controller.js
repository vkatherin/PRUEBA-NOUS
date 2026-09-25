const pool = require('../../db/connection');
const isPostgres = (process.env.DB_CLIENT || 'mysql').toLowerCase() === 'postgres';
const mesSemillero = isPostgres
  ? "TO_CHAR(s.fecha_creacion, 'YYYY-MM')"
  : "DATE_FORMAT(s.fecha_creacion, '%Y-%m')";
const mesIntegrante = isPostgres
  ? "TO_CHAR(si.fecha_ingreso, 'YYYY-MM')"
  : "DATE_FORMAT(si.fecha_ingreso, '%Y-%m')";

// GET /api/semilleros
exports.getSemilleros = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        s.id,
        s.codigo,
        s.nombre,
        s.tema_interes    AS descripcion,
        u.nombre_completo AS lider,
        g.codigo          AS grupo,
        CASE
          WHEN s.vobo_programa = 1 AND s.vobo_vicerrectoria = 1 THEN 'activo'
          WHEN s.vobo_programa = 1                              THEN 'evaluacion'
          ELSE 'inactivo'
        END AS estado,
        (SELECT COUNT(*) FROM semillero_integrantes si WHERE si.semillero_id = s.id AND si.estado = 'activo') AS integrantes,
        (SELECT COUNT(*) FROM proyecto_semillero ps WHERE ps.semillero_id = s.id)                             AS proyectos
      FROM semilleros s
      JOIN usuarios u ON u.id = s.lider_profesor_id
      LEFT JOIN proyecto_semillero ps2 ON ps2.semillero_id = s.id
      LEFT JOIN proyectos pr ON pr.id = ps2.proyecto_id
      LEFT JOIN proyecto_grupo pg ON pg.proyecto_id = pr.id
      LEFT JOIN grupos_investigacion g ON g.id = pg.grupo_id
      GROUP BY s.id, u.nombre_completo, g.codigo
      ORDER BY s.fecha_creacion DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/semilleros/:id
exports.getSemilleroById = async (req, res) => {
  try {
    const { id } = req.params;

    const [[semillero]] = await pool.query(`
      SELECT
        s.id,
        s.codigo,
        s.nombre,
        s.tema_interes    AS descripcion,
        s.vision,
        s.mision,
        s.estado_arte,
        s.horas_asignadas,
        u.nombre_completo AS lider,
        s.lider_estudiante_nombre AS lider_estudiante,
        s.cvlac_url,
        s.vobo_programa,
        s.vobo_vicerrectoria,
        ${mesSemillero} AS ingreso,
        CASE
          WHEN s.vobo_programa = 1 AND s.vobo_vicerrectoria = 1 THEN 'activo'
          WHEN s.vobo_programa = 1                              THEN 'evaluacion'
          ELSE 'inactivo'
        END AS estado
      FROM semilleros s
      JOIN usuarios u ON u.id = s.lider_profesor_id
      WHERE s.id = ?
    `, [id]);

    if (!semillero) return res.status(404).json({ error: 'Semillero no encontrado' });

    // Integrantes activos — semillero_integrantes: usuario_id, semestre, estado, fecha_ingreso
    const [integrantes_lista] = await pool.query(`
      SELECT
        u.nombre_completo AS nombre,
        CONCAT('Semestre ', si.semestre) AS programa,
        ${mesIntegrante} AS ingreso
      FROM semillero_integrantes si
      JOIN usuarios u ON u.id = si.usuario_id
      WHERE si.semillero_id = ? AND si.estado = 'activo'
      ORDER BY si.fecha_ingreso DESC
    `, [id]);

    // Proyectos asociados
    const [proyectos_lista] = await pool.query(`
      SELECT p.codigo_unico AS codigo, p.titulo, p.estado
      FROM proyecto_semillero ps
      JOIN proyectos p ON p.id = ps.proyecto_id
      WHERE ps.semillero_id = ?
    `, [id]);

    // Count scalars
    const [[counts]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM semillero_integrantes si WHERE si.semillero_id = ? AND si.estado = 'activo') AS integrantes,
        (SELECT COUNT(*) FROM proyecto_semillero   ps WHERE ps.semillero_id = ?)                           AS proyectos
    `, [id, id]);

    res.json({
      ...semillero,
      integrantes:       counts.integrantes,
      proyectos:         counts.proyectos,
      integrantes_lista,
      proyectos_lista,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
