const pool = require('../../db/connection');

// GET /api/dashboard/kpis
exports.getKpis = async (req, res) => {
  try {
    const [[proyectosActivos]]   = await pool.query(`SELECT COUNT(*) AS total FROM proyectos WHERE estado = 'activo'`);
    const [[proyectosTotal]]     = await pool.query(`SELECT COUNT(*) AS total FROM proyectos`);
    const [[convActivas]]        = await pool.query(`SELECT COUNT(*) AS total FROM convocatorias WHERE estado = 'activa'`);
    const [[postulaciones]]      = await pool.query(`SELECT COUNT(*) AS total FROM proyectos WHERE convocatoria_id IS NOT NULL`);
    const [[productos]]          = await pool.query(`SELECT COUNT(*) AS total FROM proyecto_productos`);

    // Artículos: tipologia_id que corresponde a 'Artículo' en tipologia_productos_minciencias
    const [[articulos]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM proyecto_productos pp
      JOIN tipologia_productos_minciencias t ON t.id = pp.tipologia_id
      WHERE t.tipologia LIKE '%Artículo%'
    `);

    const [[ponencias]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM proyecto_productos pp
      JOIN tipologia_productos_minciencias t ON t.id = pp.tipologia_id
      WHERE t.tipologia LIKE '%Ponencia%'
    `);

    // Ejecución presupuestal — presupuesto_areas no tiene proyecto_id
    const [[presupuesto]] = await pool.query(`
      SELECT
        SUM(monto_asignado)  AS aprobado,
        SUM(monto_ejecutado) AS ejecutado
      FROM presupuesto_areas
    `);

    const aprobado  = presupuesto.aprobado  || 0;
    const ejecutado = presupuesto.ejecutado || 0;
    const pct = aprobado > 0 ? Math.round((ejecutado / aprobado) * 100) : 0;

    res.json({
      proyectosActivos: proyectosActivos.total,
      proyectosTotal:   proyectosTotal.total,
      convocatoriasAbiertas: convActivas.total,
      postulacionesTotales:  postulaciones.total,
      productos:    productos.total,
      articulos:    articulos.total,
      ponencias:    ponencias.total,
      presupuestoAprobado:  aprobado,
      presupuestoEjecutado: ejecutado,
      ejecucionPct: pct,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/dashboard/evolucion-proyectos
exports.getEvolucionProyectos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        DATE_FORMAT(fecha_inicio, '%b') AS mes,
        MONTH(fecha_inicio) AS mes_num,
        YEAR(fecha_inicio)  AS anio,
        SUM(CASE WHEN estado IN ('activo','cerrado') THEN 1 ELSE 0 END) AS activos,
        SUM(CASE WHEN estado = 'cerrado'             THEN 1 ELSE 0 END) AS cerrados,
        COUNT(*) AS nuevos
      FROM proyectos
      WHERE fecha_inicio >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY anio, mes_num, mes
      ORDER BY anio, mes_num
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/dashboard/ejecucion-financiera
// presupuesto_areas tiene: area, monto_asignado, monto_ejecutado, periodo
exports.getEjecucionFinanciera = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        periodo                                          AS mes,
        ROUND(SUM(monto_asignado)  / 1000000, 0) AS aprobado,
        ROUND(SUM(monto_ejecutado) / 1000000, 0) AS ejecutado
      FROM presupuesto_areas
      GROUP BY periodo
      ORDER BY periodo
      LIMIT 6
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/dashboard/productos-tipo
exports.getProductosTipo = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.tipologia AS name, COUNT(*) AS value
      FROM proyecto_productos pp
      JOIN tipologia_productos_minciencias t ON t.id = pp.tipologia_id
      GROUP BY t.tipologia
      ORDER BY value DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/dashboard/actividad-reciente
// log_auditoria: id, usuario_id, accion, entidad_afectada, entidad_id, fecha_hora
exports.getActividadReciente = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.nombre_completo              AS user,
        la.accion                      AS accion,
        CONCAT(la.accion, ' en ', la.entidad_afectada, ' #', la.entidad_id) AS description,
        la.fecha_hora                  AS time
      FROM log_auditoria la
      JOIN usuarios u ON u.id = la.usuario_id
      ORDER BY la.fecha_hora DESC
      LIMIT 8
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/dashboard/top-proyectos
// proyecto_cronograma no tiene avance_porcentaje; usamos COUNT de actividades completadas vs total
exports.getTopProyectos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.titulo   AS nombre,
        u.nombre_completo AS lider,
        g.codigo   AS grupo,
        p.estado,
        0          AS avance
      FROM proyectos p
      JOIN usuarios u ON u.id = p.investigador_principal_id
      LEFT JOIN proyecto_grupo pg ON pg.proyecto_id = p.id
      LEFT JOIN grupos_investigacion g ON g.id = pg.grupo_id
      WHERE p.estado = 'activo'
      GROUP BY p.id, p.titulo, u.nombre_completo, g.codigo, p.estado
      ORDER BY p.fecha_creacion DESC
      LIMIT 4
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/dashboard/convocatorias-activas
exports.getConvocatoriasActivas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id,
        c.titulo AS nombre,
        c.estado,
        DATE_FORMAT(c.fecha_cierre, '%d %b %Y') AS cierre,
        (SELECT COUNT(*) FROM proyectos p WHERE p.convocatoria_id = c.id) AS inscritos
      FROM convocatorias c
      WHERE c.estado IN ('activa','evaluacion')
      ORDER BY c.fecha_cierre ASC
      LIMIT 4
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
