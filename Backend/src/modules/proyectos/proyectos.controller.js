const pool = require('../../db/connection');

// GET /api/proyectos
exports.getProyectos = async (req, res) => {
  try {
    const { estado, grupo, q } = req.query;

    let sql = `
      SELECT
        p.id,
        p.codigo_unico  AS id_display,
        p.titulo        AS nombre,
        p.tipo_proyecto AS tipo,
        p.estado,
        DATE_FORMAT(p.fecha_inicio, '%b %Y') AS inicio,
        DATE_FORMAT(DATE_ADD(p.fecha_inicio, INTERVAL p.duracion_meses MONTH), '%b %Y') AS fin,
        CONCAT('$', FORMAT(p.valor_total / 1000000, 1), 'M') AS presupuesto,
        u.nombre_completo  AS lider,
        g.codigo           AS grupo,
        pr.nombre          AS facultad,
        0                  AS avance
      FROM proyectos p
      JOIN usuarios u             ON u.id  = p.investigador_principal_id
      LEFT JOIN proyecto_grupo pg ON pg.proyecto_id = p.id
      LEFT JOIN grupos_investigacion g ON g.id = pg.grupo_id
      LEFT JOIN programas_academicos pr ON pr.id = p.programa_id
      WHERE 1=1
    `;

    const params = [];

    if (estado) {
      sql += ' AND p.estado = ?';
      params.push(estado);
    }
    if (grupo) {
      sql += ' AND g.codigo = ?';
      params.push(grupo);
    }
    if (q) {
      sql += ' AND (p.titulo LIKE ? OR p.codigo_unico LIKE ? OR u.nombre_completo LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    sql += ' GROUP BY p.id, u.nombre_completo, g.codigo, pr.nombre ORDER BY p.fecha_inicio DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/proyectos/:id
exports.getProyectoById = async (req, res) => {
  try {
    const { id } = req.params;

    // Info general
    const [[proyecto]] = await pool.query(`
      SELECT
        p.id,
        p.codigo_unico  AS id_display,
        p.titulo        AS nombre,
        p.tipo_proyecto AS tipo,
        p.estado,
        DATE_FORMAT(p.fecha_inicio, '%b %Y') AS inicio,
        DATE_FORMAT(DATE_ADD(p.fecha_inicio, INTERVAL p.duracion_meses MONTH), '%b %Y') AS fin,
        p.duracion_meses,
        p.lugar_ejecucion,
        CONCAT('$', FORMAT(p.valor_total / 1000000, 1), 'M') AS presupuesto,
        u.nombre_completo AS lider,
        g.nombre     AS grupo_nombre,
        g.codigo     AS grupo,
        pr.nombre    AS facultad,
        pd.resumen_ejecutivo AS resumen,
        pd.objetivo_general  AS objetivos
      FROM proyectos p
      JOIN usuarios u ON u.id = p.investigador_principal_id
      LEFT JOIN proyecto_grupo pg ON pg.proyecto_id = p.id
      LEFT JOIN grupos_investigacion g ON g.id = pg.grupo_id
      LEFT JOIN programas_academicos pr ON pr.id = p.programa_id
      LEFT JOIN proyecto_descripcion pd ON pd.proyecto_id = p.id
      WHERE p.id = ?
    `, [id]);

    if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });

    // Equipo — proyecto_equipo: proyecto_id, usuario_id, rol_en_proyecto, entidad
    const [equipo] = await pool.query(`
      SELECT
        u.nombre_completo  AS nombre,
        pe.rol_en_proyecto AS rol,
        0                  AS dedicacion,
        pe.entidad         AS vinculacion
      FROM proyecto_equipo pe
      JOIN usuarios u ON u.id = pe.usuario_id
      WHERE pe.proyecto_id = ?
    `, [id]);

    // Cronograma — proyecto_cronograma: proyecto_id, actividad, fecha_inicio, fecha_fin, responsable_id
    const [cronograma] = await pool.query(`
      SELECT
        pc.actividad    AS nombre,
        u.nombre_completo AS responsable,
        DATE_FORMAT(pc.fecha_inicio, '%b %Y') AS inicio,
        DATE_FORMAT(pc.fecha_fin,    '%b %Y') AS fin,
        0               AS avance,
        CASE
          WHEN pc.fecha_fin < CURDATE() THEN 'closed'
          WHEN pc.fecha_inicio <= CURDATE() THEN 'active'
          ELSE 'pending'
        END AS estado
      FROM proyecto_cronograma pc
      LEFT JOIN usuarios u ON u.id = pc.responsable_id
      WHERE pc.proyecto_id = ?
      ORDER BY pc.fecha_inicio
    `, [id]);

    // Productos — proyecto_productos: tipologia_id, descripcion, fecha_entrega, estado
    const [productos] = await pool.query(`
      SELECT
        t.tipologia               AS tipo,
        pp.descripcion            AS titulo,
        pp.estado,
        DATE_FORMAT(pp.fecha_entrega, '%b %Y') AS fecha
      FROM proyecto_productos pp
      JOIN tipologia_productos_minciencias t ON t.id = pp.tipologia_id
      WHERE pp.proyecto_id = ?
    `, [id]);

    // Presupuesto — presupuesto_areas: area, monto_asignado, monto_ejecutado (no tiene proyecto_id)
    // Devolvemos vacío ya que no hay FK directa
    const rubros = [];

    // Riesgos — proyecto_riesgos: nombre_riesgo, causa, efecto, manejo_previsto
    const [riesgos] = await pool.query(`
      SELECT
        nombre_riesgo  AS descripcion,
        'media'        AS probabilidad,
        'medio'        AS impacto,
        manejo_previsto AS mitigacion
      FROM proyecto_riesgos
      WHERE proyecto_id = ?
    `, [id]);

    res.json({
      ...proyecto,
      avance: 0,
      equipo,
      cronograma,
      productos,
      rubros,
      riesgos,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
